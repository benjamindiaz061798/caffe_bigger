import { NextResponse } from 'next/server'
import { readOrder, matchesSecret, receipt, withOrderLock, saveOrder } from '../../../../lib/order-store.mjs'
import { confirmPayment } from '../../../../lib/webpay.mjs'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request,{params}) {
  let order = await readOrder(params.id)
  const access = request.cookies.get('bigger_receipt')?.value
  if(!order || !access?.startsWith(`${order.id}.`) || !matchesSecret(access.slice(order.id.length+1),order.receiptHash)) return NextResponse.json({error:'No se encontró un comprobante accesible.'},{status:404})
  if(order.status === 'pending') {
    try { order = await withOrderLock(order.id,async()=> { const current = await readOrder(order.id); if(current.status!=='pending') return current; const updated = await confirmPayment(current);await saveOrder(updated);return updated }) } catch {}
  }
  return NextResponse.json(receipt(order),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})
}
