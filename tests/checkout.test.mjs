import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { products, quoteCart, resolveLine } from '../lib/catalog.mjs'
import { isAuthorized, confirmPayment, webpayConfig } from '../lib/webpay.mjs'
import { saveOrder, readOrder, withOrderLock, secretHash, matchesSecret, receipt } from '../lib/order-store.mjs'

test('catalog contains every category and all 90 products with unique IDs',()=>{
  assert.equal(products.length,90);assert.equal(new Set(products.map(p=>p.id)).size,90)
  assert.deepEqual(Object.fromEntries([...new Set(products.map(p=>p.category))].map(c=>[c,products.filter(p=>p.category===c).length])),{'Cafés e infusiones':13,Pastelería:15,Sándwiches:30,'Cafés fríos':17,Fajitas:12,Ensaladas:3})
})
test('server ignores forged prices and calculates sizes and bread surcharges',()=>{
  const quote=quoteCart([{id:'latte',quantity:2,price:1,amount:1,options:{size:'large'}},{id:'italiano',quantity:1,options:{bread:'integral'}}])
  assert.equal(quote.amount,10500);assert.equal(quote.lines[0].unitPrice,2700)
})
test('only sandwiches accept bread and only coffee sizes accept size',()=>{
  assert.throws(()=>resolveLine({id:'brownie',quantity:1,options:{bread:'integral'}}))
  assert.throws(()=>resolveLine({id:'latte',quantity:1,options:{size:'free'}}))
})
test('unpriced products, unknown IDs and invalid quantities cannot be paid',()=>{
  for(const id of ['fajita','caramel-latte','not-a-product'])assert.throws(()=>quoteCart([{id,quantity:1}]))
  for(const quantity of [0,-1,1.5,21,'1',NaN])assert.throws(()=>quoteCart([{id:'latte',quantity}]))
  assert.throws(()=>quoteCart([]));assert.throws(()=>quoteCart(Array(51).fill({id:'latte',quantity:1})))
})
test('salad requires exact distinct vegetables and reprices premium proteins',()=>{
  const options={protein:'atun',vegetables:['Tomate','Cebolla','Choclo','Apio']}
  assert.equal(resolveLine({id:'ensalada-grande',quantity:1,options}).unitPrice,5200)
  for(const vegetables of [[],['Apio'],['Apio','Apio','Tomate','Choclo'],['Apio','Tomate','Choclo','INVALID']])assert.throws(()=>resolveLine({id:'ensalada-grande',quantity:1,options:{...options,vegetables}}))
  assert.equal(resolveLine({id:'ensalada-pequena',quantity:1,options:{vegetables:['Apio','Tomate','Choclo']}}).unitPrice,2300)
})
test('equivalent configurations share a key and distinct variants remain separate',()=>{
  const first=resolveLine({id:'latte',quantity:1}),second=resolveLine({id:'latte',quantity:1,options:{size:'medium'}})
  assert.equal(first.key,second.key);assert.notEqual(first.key,resolveLine({id:'latte',quantity:1,options:{size:'large'}}).key)
  assert.throws(()=>quoteCart([{id:'latte',quantity:15},{id:'latte',quantity:15}]))
})
const order={id:randomUUID(),amount:2200,buyOrder:'BG-123',sessionId:'session',status:'pending',token:'a'.repeat(64)}
const approved={status:'AUTHORIZED',response_code:0,amount:2200,buy_order:'BG-123',session_id:'session',authorization_code:'1213',transaction_date:'2026-10-29T18:00:00.000Z',card_detail:{card_number:'6623'},payment_type_code:'VD'}
test('approval requires provider authorization, response zero, amount, order and session',()=>{
  assert.equal(isAuthorized(approved,order),true)
  for(const patch of [{status:'INITIALIZED'},{response_code:-1},{response_code:'0'},{amount:1},{buy_order:'other'},{session_id:'other'}])assert.equal(isAuthorized({...approved,...patch},order),false)
})
test('commit confirms payment and masks card number; repeated confirmation is idempotent',async()=>{
  const previous=global.fetch;let calls=0
  try{global.fetch=async()=>{calls++;return {ok:true,json:async()=>approved}}
    const paid=await confirmPayment(order);assert.equal(paid.status,'paid');assert.equal(paid.cardLast4,'6623');assert.equal(calls,1)
    assert.equal(await confirmPayment(paid),paid);assert.equal(calls,1)
  }finally{global.fetch=previous}
})
test('uncertain commit is reconciled through provider status',async()=>{
  const previous=global.fetch;const methods=[]
  try{global.fetch=async(url,options)=>{methods.push(options.method);if(options.method==='PUT')throw new Error('timeout');return {ok:true,json:async()=>approved}}
    assert.equal((await confirmPayment(order)).status,'paid');assert.deepEqual(methods,['PUT','GET'])
  }finally{global.fetch=previous}
})
test('mismatched provider amount is never accepted',async()=>{
  const previous=global.fetch
  try{global.fetch=async()=>({ok:true,json:async()=>({...approved,amount:1})});await assert.rejects(confirmPayment(order),/no corresponde/)}finally{global.fetch=previous}
})
test('rejected and pending provider results stay distinct',async()=>{
  const previous=global.fetch
  try{global.fetch=async()=>({ok:true,json:async()=>({...approved,status:'FAILED',response_code:-1})});assert.equal((await confirmPayment(order)).status,'rejected')
    global.fetch=async()=>({ok:true,json:async()=>({...approved,status:'INITIALIZED',response_code:undefined})});assert.equal((await confirmPayment(order)).status,'pending')
  }finally{global.fetch=previous}
})
test('receipt secrets reject incorrect or missing access and hide gateway token',()=>{
  assert.equal(matchesSecret('secret',secretHash('secret')),true);assert.equal(matchesSecret('wrong',secretHash('secret')),false);assert.equal(matchesSecret(null,secretHash('secret')),false)
  assert.equal(receipt({...order,receiptHash:'sensitive',fingerprint:'private'}).token,undefined)
})
test('production refuses incomplete setup',()=>{
  const original=process.env.WEBPAY_ENV,originalKey=process.env.WEBPAY_API_KEY
  try{process.env.WEBPAY_ENV='production';delete process.env.WEBPAY_API_KEY;assert.throws(()=>webpayConfig(),/Falta configurar/)}finally{if(original===undefined)delete process.env.WEBPAY_ENV;else process.env.WEBPAY_ENV=original;if(originalKey!==undefined)process.env.WEBPAY_API_KEY=originalKey}
})
test('order storage survives reload and serializes concurrent updates',async()=>{
  const temporary=await mkdtemp(path.join(os.tmpdir(),'bigger-tests-')),original=process.env.ORDER_DATA_DIR
  process.env.ORDER_DATA_DIR=temporary
  try{await saveOrder({...order,count:0});await Promise.all(Array.from({length:5},()=>withOrderLock(order.id,async()=>{const current=await readOrder(order.id);await saveOrder({...current,count:current.count+1})})));assert.equal((await readOrder(order.id)).count,5);assert.equal(await readOrder('../outside'),null)}finally{if(original===undefined)delete process.env.ORDER_DATA_DIR;else process.env.ORDER_DATA_DIR=original;await rm(temporary,{recursive:true,force:true})}
})
