'use client'
import { useEffect, useState } from 'react'
import { products, resolveLine } from './products'
import ProductImage from './ProductImage'
import { setCartQuantity } from '../lib/cart.mjs'
import { Modal, money, Arrow, Bag } from './ui'
export default function Cart({ open, onClose, cart, setCart }) {
  const [paying, setPaying] = useState(false), [error,setError] = useState('')
  const [paymentConfig,setPaymentConfig] = useState(null)
  useEffect(()=>{if(open)fetch('/api/webpay/config').then(response=>response.json()).then(setPaymentConfig).catch(()=>setPaymentConfig({ready:false}))},[open])
  const items = cart.flatMap(item => {try{return [{...products.find(p=>p.id===item.id),...resolveLine(item)}]}catch{return []}})
  const total = items.reduce((n,item)=>n+item.amount,0)
  const estimate = items.length ? Math.max(...items.map(item=>item.time))+Math.max(0,items.reduce((n,item)=>n+item.quantity,0)-1)*2 : 0
  function update(key,delta) { setError(''); setCart(current=>setCartQuantity(current,key,Math.min(20,(current.find(item=>item.key===key)?.quantity||0)+delta))) }
  async function checkout() {
    if(paying||!paymentConfig?.ready) return
    setPaying(true);setError('')
    const snapshot = JSON.stringify(cart), checkoutId = crypto.randomUUID()
    try {
      const response = await fetch('/api/webpay/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checkoutId,cart:cart.map(({id,quantity,options})=>({id,quantity,options}))})})
      const payment = await response.json()
      if(!response.ok) throw new Error(payment.error || 'No se pudo conectar con Webpay.')
      try {sessionStorage.setItem(`bigger-checkout-${checkoutId}`,snapshot)} catch {}
      // Webpay receives the token directly; card details never pass through Bigger.
      const target = new URL(payment.url)
      if(!['https://webpay3gint.transbank.cl','https://webpay3g.transbank.cl'].includes(target.origin)) throw new Error('Destino de pago inválido.')
      target.searchParams.set('token_ws',payment.token)
      window.location.assign(target.href)
    } catch(error) {setError(error.message);setPaying(false)}
  }
  return <Modal open={open} onClose={()=>{if(!paying)onClose()}} title="Carrito" className="cart-modal"><span className="eyebrow">TU MOMENTO BIGGER</span><h2>Tu carrito<span className="cart-title-count">{items.reduce((n,i)=>n+i.quantity,0)}</span></h2>{items.length ? <>
    <div className="cart-items">{items.map(item=><article className="cart-item" key={item.key}><div className="cart-art"><ProductImage product={item}/></div><div><h3>{item.name}</h3><p>{money(item.unitPrice)} c/u · <strong>{money(item.amount)}</strong></p><small className="cart-options">{item.labels.join(' · ')}</small><div className="quantity"><button disabled={paying} onClick={()=>update(item.key,-1)} aria-label={`Quitar una unidad de ${item.name}`}>−</button><span>{item.quantity}</span><button disabled={paying||item.quantity>=20} onClick={()=>update(item.key,1)} aria-label={`Agregar una unidad de ${item.name}`}>+</button></div></div><button disabled={paying} className="remove-item" aria-label={`Eliminar ${item.name}`} onClick={()=>setCart(current=>current.filter(i=>i.key!==item.key))}>Eliminar</button></article>)}</div>
    <div className="prep-time"><span>◷</span><div><strong>{estimate}–{estimate+5} min aprox.</strong><p>Estimación orientativa; el local debe confirmar el retiro.</p></div></div><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><div className="payment-provider"><b>webpay<span>plus</span></b><span>Crédito · Débito · Prepago</span></div><p className="demo-note">{paymentConfig?.environment === 'production' ? 'Serás dirigido a Webpay para pagar de forma segura. Conserva el comprobante y confirma el retiro con el local.' : 'Ambiente de integración: prueba el flujo con tarjetas de prueba, sin cobros reales. El pedido de prueba no se envía a cocina.'}</p><button disabled={paying||!paymentConfig?.ready} className="button primary full-width" onClick={checkout}>{paying?'Conectando con Webpay…':!paymentConfig?'Preparando pago…':!paymentConfig.ready?'Pago no configurado':'Continuar a Webpay'}<Arrow/></button>{error&&<div className="checkout-error" role="alert">{error}</div>}
  </> : <div className="cart-empty"><Bag/><h3>Una pausa por armar.</h3><p>Elige algo rico de nuestra carta y lo encontrarás aquí.</p><button className="button primary" onClick={()=>{onClose();document.getElementById('carta')?.scrollIntoView({behavior:'smooth'})}}>Explorar la carta <Arrow/></button></div>}</Modal>
}

