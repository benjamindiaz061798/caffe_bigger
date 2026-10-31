'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Menu from '../components/Menu'
import Cart from '../components/Cart'
import { Bag, Arrow, Brand, money } from '../components/ui'
import { resolveLine } from '../components/products'
import { addCartItem } from '../lib/cart.mjs'
const Hero = dynamic(() => import('../components/Hero'), { ssr: false, loading: () => <div className="scene-loading">Preparando tu pausa…</div> })
const Tart = dynamic(() => import('../components/Tart'), { ssr: false })

export default function Page() {
  const [cart, setCart] = useState([])
  const [ready, setReady] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bigger-cart') || '[]')
      if (Array.isArray(saved)) setCart(saved.flatMap(item => { try { const line = resolveLine(item); return [{id:line.id,key:line.key,options:line.options,quantity:line.quantity}] } catch { return [] } }))
    } catch {}
    setReady(true)
  }, [])
  useEffect(() => { if (ready) { try { localStorage.setItem('bigger-cart', JSON.stringify(cart)) } catch {} } }, [cart, ready])
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 2800); return () => clearTimeout(timer) }, [notice])
  const count = cart.reduce((n, item) => n + item.quantity, 0)
  const total = cart.reduce((sum,item) => sum + resolveLine(item).amount,0)
  function add(product, options = {}, quantity = 1) {
    try {
      setCart(addCartItem(cart,{id:product.id,options,quantity}))
      setNotice(`${quantity} × ${product.name} agregado al carrito`)
      return true
    } catch(error) { setNotice(error.message); return false }
  }
  return <>
    <a className="skip-link" href="#carta">Saltar a la carta</a>
    <div className="announcement">Una buena pausa empieza con un buen café. <span>Conoce Caffe Bigger <Arrow /></span></div>
    <header className="header">
      <a href="#inicio" aria-label="Caffe Bigger, inicio"><Brand /></a>
      <nav aria-label="Navegación principal"><a href="#carta">Nuestra carta</a><a href="#ingredientes">Por dentro</a><a href="#experiencia">La experiencia</a></nav>
      <button className="bag-button" aria-haspopup="dialog" aria-expanded={cartOpen} onClick={() => setCartOpen(true)}><Bag /><span>Carrito</span><b>{count}</b></button>
    </header>
    <main>
      <section className="hero-scroll" id="inicio"><div className="hero hero-sticky">
        <div className="hero-copy">
          <div className="eyebrow"><span className="small-line" /> COFFEE & SANDWICH</div>
          <h1>Tu pausa.<br />Un poquito<br /><em>más grande.</em></h1>
          <p>Café, algo rico y ese momento que es solo tuyo. Encuentra tu combinación favorita en Bigger.</p>
          <div className="hero-actions"><a className="button primary" href="#carta">Explorar la carta <Arrow /></a><a className="text-link" href="#ingredientes">Descubre cada capa <span>↗</span></a></div>
          <div className="hero-note"><span className="note-icon">✳</span><span>Elige con antojo.<br /><strong>Disfruta a tu ritmo.</strong></span></div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit" /><span className="art-caption">EL RITUAL DE UNA BUENA PAUSA</span>
          <div className="hero-seal">HECHO PARA<br /><b>disfrutar</b><br />SIN PRISA · BIGGER</div>
          <Hero />
          <div className="scene-label"><span className="live-dot" /> Tú marcas el ritmo. Desliza para servir.</div>
          <span className="scene-number">01 / EL CAFÉ</span>
        </div>
        <a href="#carta" className="scroll-cue">SIGUE EL ANTOJO <span>↓</span></a>
      </div></section>
      <div className="ticker" aria-label="Café, pastelería, sándwiches y buenos momentos"><div>{[0, 1].map(i => <span key={i} aria-hidden={i === 1}>BUEN CAFÉ <i>✳</i> ALGO DULCE <i>✳</i> UN BUEN SÁNDWICH <i>✳</i> TU MOMENTO BIGGER <i>✳</i> </span>)}</div></div>
      <Menu onAdd={add} />
      <Tart />
      <section className="experience section-wrap" id="experiencia">
        <div><span className="eyebrow">EL PLAN ES SIMPLE</span><h2>Menos vueltas.<br /><em>Más disfrutar.</em></h2><p>Descubre qué lleva tu favorito y arma una pausa a tu medida.</p></div>
        <div className="steps"><article><span>01</span><div><h3>Déjate tentar</h3><p>Explora cafés, dulces y algo salado. Hay una pausa para cada antojo.</p></div></article><article><span>02</span><div><h3>Mira por dentro</h3><p>Conoce los ingredientes y las capas antes de elegir.</p></div></article><article><span>03</span><div><h3>Arma tu pedido</h3><p>Agrégalo a tu carrito y revisa el total y una estimación de preparación.</p></div></article></div>
      </section>
      <section className="closing"><span className="eyebrow">NOS GUSTAN LAS BUENAS PAUSAS</span><h2>La tuya tiene<br />sabor a <em>Bigger.</em></h2><a className="button cream" href="#carta">Encuentra tu favorito <Arrow /></a><span className="closing-flower" aria-hidden="true">✳</span></section>
    </main>
    <footer><Brand light /><p>Café, algo rico y un momento para ti.</p><a href="#inicio">Volver arriba ↑</a><div className="footer-bottom"><span>© {new Date().getFullYear()} Caffe Bigger</span><span>Webpay Plus · Integración de prueba</span></div></footer>
    {!cartOpen&&<button className="floating-cart" aria-label={`Ver carrito, ${count} productos, ${money(total)}`} aria-haspopup="dialog" onClick={()=>setCartOpen(true)}><Bag/><span><strong>Ver carrito <b>{count}</b></strong><small>{count?money(total):'Arma tu pedido'}</small></span><Arrow/></button>}
    <Cart open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />
    <div role="status" className={`toast ${notice ? 'visible' : ''}`}><Bag/> {notice}</div>
  </>
}
