'use client'
import { useState } from 'react'
import ProductArt from './ProductArt'
import { products } from './products'
import { Arrow, money } from './ui'
export default function Ingredients({ onAdd }) {
  const [index, setIndex] = useState(0), [exploded, setExploded] = useState(true), [active, setActive] = useState(-1)
  const choices = [products[1], products[2], products[0]], product = choices[index]
  return <section className="ingredients" id="ingredientes"><div className="section-wrap ingredient-layout">
    <div className="ingredient-visual"><span className="visual-index">BIGGER / POR DENTRO</span><ProductArt product={product} exploded={exploded} active={active} /><button className="assemble-button" onClick={() => setExploded(!exploded)}>{exploded ? '↓ Juntar las capas' : '↑ Separar las capas'}</button><span className="illustration-note">Ilustración de ingredientes</span></div>
    <div className="ingredient-copy"><span className="eyebrow">LO RICO ESTÁ EN LOS DETALLES</span><h2>Un antojo.<br /><em>Capa por capa.</em></h2><p>Porque elegir también es descubrir. Explora lo que hace especial a cada favorito.</p><div className="mini-tabs" aria-label="Producto para explorar">{choices.map((p, i) => <button key={p.id} aria-pressed={index === i} className={index === i ? 'active' : ''} onClick={() => { setIndex(i); setActive(-1) }}>{p.name}</button>)}</div><ol className="ingredient-list">{product.ingredients.map((name, i) => <li key={`${product.id}-${i}`}><button onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(-1)} onFocus={() => setActive(i)} onBlur={() => setActive(-1)}><span>0{i + 1}</span>{name}<span className="ingredient-line" /></button></li>)}</ol><button className="text-link ingredient-add" onClick={() => onAdd(product)}>Se me antojó · {money(product.price)} <Arrow /></button><small className="recipe-note">Desglose ilustrativo. Recetas y alérgenos por confirmar con la cafetería.</small></div>
  </div></section>
}
