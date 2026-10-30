'use client'
import { useEffect, useState } from 'react'
import { Brand,money } from '../../../components/ui'
export default function PaymentResult() {
  const [order,setOrder] = useState(null),[error,setError] = useState(''),[loading,setLoading]=useState(true)
  async function load() {
    setLoading(true);setError('')
    const id = new URLSearchParams(window.location.search).get('pedido')
    if(!id){setError('No encontramos un pago para consultar.');setLoading(false);return}
    try {
      const response=await fetch(`/api/orders/${encodeURIComponent(id)}`,{cache:'no-store'})
      const result=await response.json();if(!response.ok)throw new Error(result.error)
      setOrder(result)
      if(result.status==='paid') {
        try {
          const snapshot=sessionStorage.getItem(`bigger-checkout-${id}`)
          if(snapshot&&localStorage.getItem('bigger-cart')===snapshot)localStorage.setItem('bigger-cart','[]')
          sessionStorage.removeItem(`bigger-checkout-${id}`)
        }catch{}
      }
    }catch(error){setError(error.message||'No se pudo consultar el pago.')}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[])
  const titles={paid:'Tu pago fue aprobado.',rejected:'El pago no fue aprobado.',cancelled:'Cancelaste el pago.',expired:'El intento de pago expiró.',pending:'Estamos verificando tu pago.',creating:'Estamos verificando tu pago.'}
  return <main className="receipt-page"><a href="/" aria-label="Volver a Caffe Bigger"><Brand/></a><section className="receipt-card"><span className="eyebrow">TU PEDIDO / BIGGER</span><h1>{loading&&!order?'Consultando tu pago…':error?'No pudimos consultar el pago.':titles[order?.status]||'Consulta tu pago.'}</h1>{error?<p role="alert">{error}</p>:order&&<>
    {order.environment==='integration'&&<div className="integration-banner">PAGO DE PRUEBA · Sin cobros reales ni preparación en tienda.</div>}
    <p className="receipt-reference">Pedido <b>{order.buyOrder}</b></p><ul>{order.lines.map(line=><li key={line.key}><div><strong>{line.quantity} × {line.name}</strong><small>{line.labels.join(' · ')}</small></div><span>{money(line.amount)}</span></li>)}</ul><div className="cart-total"><span>Total</span><strong>{money(order.amount)}</strong></div>
    {order.status==='paid'?<dl className="receipt-meta"><div><dt>Autorización</dt><dd>{order.authorizationCode}</dd></div><div><dt>Fecha</dt><dd>{order.paidAt?new Date(order.paidAt).toLocaleString('es-CL',{timeZone:'America/Santiago'}):'—'}</dd></div><div><dt>Tarjeta</dt><dd>•••• {order.cardLast4||'—'}</dd></div><div><dt>Tipo de pago</dt><dd>{order.paymentType}</dd></div></dl>:order.status==='pending'?<p>La confirmación todavía no está disponible. Actualiza el estado antes de iniciar otro pago para evitar duplicados.</p>:<p>Tu selección sigue en el carrito. Puedes volver y reintentar.</p>}
  </>}{(error||order?.status==='pending')&&<button className="button primary" disabled={loading} onClick={load}>{loading?'Consultando…':'Actualizar estado'}</button>}<a className="button cream" href="/#carta">Volver a la carta →</a></section></main>
}
