'use client'
import { useState } from 'react'
import FoodCanvas, { tartReference } from './FoodScene'
import { useScrollProgress } from './useScrollProgress'
import { products } from './products'
export default function Tart() {
  const [selected,setSelected]=useState('tart-reference')
  const {progress,stage,reduced}=useScrollProgress('ingredientes')
  const choices=[tartReference,products.find(p=>p.id==='pie-limon'),products.find(p=>p.id==='italiano'),products.find(p=>p.id==='fajita')]
  const product=choices.find(p=>p.id===selected)
  return <section className="tart-scroll" id="ingredientes"><div className="tart-sticky"><div className="tart-copy"><span className="eyebrow">DE VERDAD, POR DENTRO · 3D</span><h2>Cada capa<br /> tiene su <em>historia.</em></h2><p>Desliza para descubrir cada ingrediente. Sus nombres aparecen junto a cada capa; al subir, todo vuelve a su lugar.</p><div className="model-tabs" aria-label="Modelo 3D para explorar">{choices.map(choice=><button aria-pressed={selected===choice.id} className={selected===choice.id?'active':''} key={choice.id} onClick={()=>setSelected(choice.id)}>{choice.name}</button>)}</div><ol className="model-ingredients sr-only">{product.ingredients.map((name,i)=><li key={name}><span>0{i+1}</span>{name}</li>)}</ol><small className="recipe-note">{product.id==='tart-reference'?'Tartaleta de referencia del proyecto original; no figura en la carta de venta.':'Modelado referencial. Confirma la receta y los alérgenos con el local.'}</small><a className="text-link" href="#carta">Volver a la carta ↗</a></div><div className="tart-canvas"><span className="visual-index">BIGGER / ANATOMÍA DE UN ANTOJO</span><FoodCanvas product={product} progress={progress} labels/><div className="tart-stage" aria-live="polite"><span>{stage===2?'✓':'↓'}</span>{reduced?'Todos los ingredientes, a la vista.':['Todo empieza con un antojo.','Un poco más. Descubre cada capa.','Así se hace tu momento Bigger.'][stage]}</div></div></div></section>
}


