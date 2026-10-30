import { paymentDispatcher } from './network.mjs'
export function webpayConfig() {
  const environment = process.env.WEBPAY_ENV || 'integration'
  if (!['integration','production'].includes(environment)) throw new Error('WEBPAY_ENV debe ser integration o production.')
  const production = environment === 'production'
  if (production && (!process.env.WEBPAY_COMMERCE_CODE || !process.env.WEBPAY_API_KEY || !process.env.APP_URL?.startsWith('https://') || !process.env.ORDER_DATA_DIR)) throw new Error('Falta configurar el comercio, la clave, la URL HTTPS o el almacenamiento persistente de producción.')
  return { environment, production, host:production ? 'https://webpay3g.transbank.cl' : 'https://webpay3gint.transbank.cl', commerce:production ? process.env.WEBPAY_COMMERCE_CODE : '597055555532', apiKey:production ? process.env.WEBPAY_API_KEY : '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C' }
}
export function appOrigin(requestUrl) {
  const config = webpayConfig(), url = new URL(process.env.APP_URL || requestUrl)
  if(config.production && url.protocol !== 'https:') throw new Error('La URL pública debe usar HTTPS.')
  if(!process.env.APP_URL && !['localhost','127.0.0.1','[::1]'].includes(url.hostname)) throw new Error('Configura APP_URL antes de usar pagos fuera de localhost.')
  return url.origin
}
export async function requestWebpay(method, token, body) {
  const config = webpayConfig()
  if(token && !/^[a-f0-9]{64}$/i.test(token)) throw new Error('Token de pago inválido.')
  const response = await fetch(`${config.host}/rswebpaytransaction/api/webpay/v1.2/transactions${token ? `/${token}` : ''}`,{
    method, headers:{'Tbk-Api-Key-Id':config.commerce,'Tbk-Api-Key-Secret':config.apiKey,'Content-Type':'application/json'},
    ...(body ? {body:JSON.stringify(body)} : {}), cache:'no-store', signal:AbortSignal.timeout(20000), dispatcher:await paymentDispatcher()
  })
  if(!response.ok) throw new Error(`Webpay no pudo completar la operación (${response.status}).`)
  return response.json()
}
export function isAuthorized(result, order) {
  return result?.status === 'AUTHORIZED' && result.response_code === 0 && result.amount === order.amount && result.buy_order === order.buyOrder && result.session_id === order.sessionId
}
export async function confirmPayment(order) {
  if (order.status === 'paid') return order
  let result
  try { result = await requestWebpay('PUT',order.token) }
  catch { result = await requestWebpay('GET',order.token) }
  // Check provider data against the server-side order, never against a client total.
  if(result.buy_order !== order.buyOrder || result.session_id !== order.sessionId || result.amount !== order.amount) throw new Error('La respuesta de Webpay no corresponde a este pedido.')
  if(isAuthorized(result,order)) return {...order,status:'paid',paidAt:result.transaction_date,authorizationCode:result.authorization_code,paymentType:result.payment_type_code,cardLast4:result.card_detail?.card_number?.slice(-4)}
  const status = ['FAILED','REVERSED','NULLIFIED'].includes(result.status) || (Number.isInteger(result.response_code) && result.response_code !== 0) ? 'rejected' : 'pending'
  return {...order,status}
}
