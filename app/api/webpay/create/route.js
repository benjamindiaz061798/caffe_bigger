import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { quoteCart } from '../../../../lib/catalog.mjs'
import { appOrigin, requestWebpay, webpayConfig } from '../../../../lib/webpay.mjs'
import { newSecret, secretHash, validOrderId, readOrder, saveOrder, withOrderLock } from '../../../../lib/order-store.mjs'
export const runtime = 'nodejs'
export async function POST(request) {
  try {
    const origin = appOrigin(request.url)
    if(request.headers.get('origin') !== origin) return NextResponse.json({error:'Origen de solicitud inválido.'},{status:403})
    if(Number(request.headers.get('content-length') || 0)>30000) return NextResponse.json({error:'Pedido demasiado grande.'},{status:413})
    const input = await request.json()
    if(!validOrderId(input.checkoutId)) return NextResponse.json({error:'Identificador de compra inválido.'},{status:400})
    let quote
    try { quote = quoteCart(input.cart) } catch(error) { return NextResponse.json({error:error.message},{status:400}) }
    const config = webpayConfig()
    const response = await withOrderLock(input.checkoutId,async () => {
      const fingerprint = secretHash(JSON.stringify(quote))
      const existing = await readOrder(input.checkoutId)
      if(existing) {
        if(existing.fingerprint !== fingerprint) throw new Error('El carrito cambió. Inicia un nuevo intento de pago.')
        if(existing.status==='pending' && Date.now()-new Date(existing.createdAt).getTime()<4*60*1000) return {url:existing.gatewayUrl,token:existing.token,environment:existing.environment}
        throw new Error('Este intento ya fue utilizado o expiró. Inicia otro pago.')
      }
      const receiptKey = newSecret(), id = input.checkoutId
      const order = { id,buyOrder:`BG-${randomUUID().replaceAll('-','').slice(0,20)}`,sessionId:randomUUID(),...quote,fingerprint,receiptHash:secretHash(receiptKey),status:'creating',environment:config.environment,createdAt:new Date().toISOString() }
      await saveOrder(order)
      const returnUrl = new URL('/api/webpay/return',origin);returnUrl.searchParams.set('order',id);returnUrl.searchParams.set('key',receiptKey)
      const result = await requestWebpay('POST',null,{buy_order:order.buyOrder,session_id:order.sessionId,amount:order.amount,return_url:returnUrl.href})
      if(!/^[a-f0-9]{64}$/i.test(result.token) || new URL(result.url).origin !== config.host) throw new Error('Webpay entregó una respuesta inesperada.')
      await saveOrder({...order,status:'pending',token:result.token,gatewayUrl:result.url})
      return {url:result.url,token:result.token,environment:config.environment}
    })
    return NextResponse.json(response,{headers:{'Cache-Control':'no-store'}})
  } catch(error) {
    // No gateway tokens, API keys or raw provider payloads are exposed in error messages.
    return NextResponse.json({error:error.message.includes('Webpay') || error.message.includes('carrito') || error.message.includes('intento') || error.message.includes('configurar') ? error.message : 'No se pudo conectar con el servicio de pago. No hay un pago confirmado; intenta nuevamente.',...(process.env.NODE_ENV==='development'?{code:error.code||error.cause?.code||error.name}:{})},{status:502})
  }
}
