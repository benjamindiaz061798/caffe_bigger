import { NextResponse } from 'next/server'
import { readOrder, saveOrder, matchesSecret, withOrderLock } from '../../../../lib/order-store.mjs'
import { appOrigin, confirmPayment, requestWebpay, webpayConfig } from '../../../../lib/webpay.mjs'
export const runtime = 'nodejs'
async function handle(request) {
  const url = new URL(request.url), id = url.searchParams.get('order'), key = url.searchParams.get('key')
  const origin = appOrigin(request.url)
  let order = await readOrder(id)
  if(!order || !matchesSecret(key,order.receiptHash)) return NextResponse.redirect(new URL('/pago/resultado?error=invalid',origin),303)
  const params = request.method === 'POST' ? await request.formData() : url.searchParams
  const token = params.get('token_ws'), aborted = params.get('TBK_TOKEN')
  try {
    order = await withOrderLock(id,async () => {
      let current = await readOrder(id)
      if(current.environment !== webpayConfig().environment) throw new Error('El ambiente de pago cambió.')
      if(current.status === 'paid') return current
      if(token && token === current.token) current = await confirmPayment(current)
      else if(aborted && aborted === current.token) {
        // Reconcile first so a repeated cancellation cannot overwrite an authorization.
        current = await confirmPayment(current)
        if(current.status !== 'paid') current = {...current,status:'cancelled'}
      } else if(!token && !aborted) {
        current = await confirmPayment(current)
        if(current.status === 'pending') current = {...current,status:'expired'}
      } else throw new Error('El token no corresponde al pedido.')
      await saveOrder(current)
      return current
    })
  } catch { /* Keep the order pending: an uncertain payment must never be labelled paid. */ }
  const target = new URL('/pago/resultado',origin); target.searchParams.set('pedido',id)
  const response = NextResponse.redirect(target,303)
  response.cookies.set('bigger_receipt',`${id}.${key}`,{httpOnly:true,secure:webpayConfig().production,sameSite:'lax',path:'/',maxAge:86400})
  response.headers.set('Cache-Control','no-store');response.headers.set('Referrer-Policy','no-referrer')
  return response
}
export const GET = handle
export const POST = handle
