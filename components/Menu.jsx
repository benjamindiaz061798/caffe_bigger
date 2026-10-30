'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { products, categories, menuSources, saladVegetables, sauces, resolveLine } from './products'
import ProductImage from './ProductImage'
import { Modal, money, Arrow } from './ui'
const FoodCanvas=dynamic(()=>import('./FoodScene'),{ssr:false,loading:()=> <p className="model-loading">Preparando el modelo 3D…</p>})
const featured=['latte','pie-limon','italiano','brownie','ensalada-grande','fajita']
const canAddDirectly=p=>p.price&&!p.options?.length&&!p.saladCount
export default function Menu({ onAdd }) {
  const [category,setCategory]=useState('Destacados'),[search,setSearch]=useState(''),[selected,setSelected]=useState(null),[exploded,setExploded]=useState(false),[options,setOptions]=useState({}),[error,setError]=useState('')
  const [modalOpen,setModalOpen]=useState(false)
  const visible=products.filter(p=>(search?true:category==='Destacados'?featured.includes(p.id):p.category===category)&&`${p.name} ${p.group||''} ${p.ingredients.join(' ')}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')))
  function select(product){setSelected(product);setModalOpen(true);setExploded(false);setOptions({});setError('')}
  let line,selectionError=''
  if(selected?.price){try{line=resolveLine({id:selected.id,quantity:1,options})}catch(error){selectionError=error.message}}
  function addSelected(){if(!line){setError(selectionError);return}onAdd(selected,line.options);setModalOpen(false)}
  const showIllustrations=category==='Destacados'&&!search
  return <section className="menu section-wrap" id="carta">
    <div className="section-heading"><div><span className="eyebrow">LAS CINCO CARTAS DE BIGGER</span><h2>Todos tus antojos.<br /><em>En un solo lugar.</em></h2></div><p>Café caliente o frío, pastelería,<br className="desktop-break"/> sándwiches, fajitas y ensaladas.</p></div>
    <div className="menu-toolbar"><div className="category-tabs" aria-label="Categorías de la carta">{categories.map(c=><button key={c} onClick={()=>{setCategory(c);setSearch('')}} className={category===c?'active':''} aria-pressed={category===c}>{c}</button>)}</div></div>
    <div className="menu-search-row"><label className="menu-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Busca tu próximo antojo…" aria-label="Buscar en toda la carta"/>{search&&<button onClick={()=>setSearch('')} aria-label="Limpiar búsqueda">×</button>}</label><span>{visible.length} {search?'resultados': 'para descubrir'} · {products.length} en la carta</span></div>
    {category==='Sándwiches'&&!search&&<div className="category-note"><p><b>Elige tu pan:</b> marraqueta o amasado · integral +$200 · churrasca +$400.</p><p><b>Salsas en la carta:</b> {sauces.join(', ')}. Consulta disponibilidad y condiciones en tienda.</p></div>}
    {['Fajitas','Cafés fríos'].includes(category)&&!search&&<p className="category-note">La carta original no indica precios para esta categoría. Puedes ver todos los productos e ingredientes; la compra se habilitará al confirmar sus valores.</p>}
    <div className={showIllustrations?'product-grid':'full-menu-grid'}>{visible.map((product,i)=><article className={`product-card art-${product.kind} ${showIllustrations?'':'compact-product'}`} key={product.id} style={{'--delay':`${Math.min(i,8)*35}ms`}}>
      {showIllustrations&&<button className="product-image" onClick={()=>select(product)} aria-label={`Ver producto ${product.name}`}><span className="product-badge">{product.category}</span><ProductImage product={product}/><span className="explore-product">{product.decomposable?'Explorar en 3D ↗':'Ver producto ↗'}</span></button>}
      <div className="product-info">{!showIllustrations&&<span className="product-group">{product.group||product.category}</span>}<div className="product-title"><h3><button onClick={()=>select(product)}>{product.name}</button></h3><span>{product.price?money(product.price):'Precio por confirmar'}</span></div><p>{product.description}</p><div className="product-bottom"><button className="ingredient-link" onClick={()=>select(product)}>{product.decomposable?'Ingredientes en 3D':product.options?.length||product.saladCount?'Elegir opciones':'Ver producto'} <span>↗</span></button><button className="add-button" disabled={!product.price} onClick={()=>canAddDirectly(product)?onAdd(product):select(product)} aria-label={`${canAddDirectly(product)?'Agregar':'Configurar'} ${product.name}${canAddDirectly(product)?' al pedido':''}`}>+</button></div></div>
    </article>)}</div>
    {!visible.length&&<div className="empty-search"><h3>No encontramos ese antojo.</h3><p>Prueba con otro nombre o ingrediente.</p><button className="text-link" onClick={()=>setSearch('')}>Limpiar búsqueda →</button></div>}
    <div className="menu-footnote"><span>Precios en pesos chilenos · Transcritos de las cinco cartas proporcionadas.</span><span>Imágenes de estilo fotográfico generadas con IA y modelos 3D referenciales.</span></div>
    <details className="original-menus"><summary>Ver las cinco cartas originales <span>↗</span></summary><div>{menuSources.map(source=><a key={source.id} href={source.url} target="_blank" rel="noreferrer"><img src={source.url} alt={`Carta original: ${source.title}`} loading="lazy"/><span>{source.title} ↗</span></a>)}</div></details>
    <Modal open={modalOpen} keepMounted={!!selected} onClose={()=>setModalOpen(false)} title={selected?.name||'Detalle del producto'} className="product-modal">{selected&&<>
      <div className={`detail-art art-${selected.kind}`}><FoodCanvas product={selected} exploded={exploded} options={options} active={modalOpen}/>{selected.decomposable?<button className="assemble-button" onClick={()=>setExploded(!exploded)}>{exploded?'↓ Volver a armar':'↑ Separar ingredientes en 3D'}</button>:<span className="model-whole">MODELO 3D REFERENCIAL</span>}</div>
      <div className="detail-copy"><span className="eyebrow">{selected.category}{selected.group?` / ${selected.group}`:''}</span><h2>{selected.name}</h2><p>{selected.description}</p>{selected.saladCount&&<p className="salad-preview-note">Vista de ejemplo: el modelo cambia con los vegetales y la proteína que elijas.</p>}
        {!!selected.ingredients.length&&<><h3>Ingredientes</h3><ul className="detail-ingredients">{selected.ingredients.map((ingredient,i)=><li key={`${ingredient}-${i}`}><span style={{background:selected.colors[i%selected.colors.length]}}/>{ingredient}</li>)}</ul></>}
        {(selected.options||[]).map(option=><fieldset className="product-options" key={option.id}><legend>{option.label}</legend>{option.choices.map(choice=><label key={choice.id}><input type="radio" name={`${selected.id}-${option.id}`} value={choice.id} checked={(options[option.id]??option.choices[0].id)===choice.id} onChange={()=>{setOptions(current=>({...current,[option.id]:choice.id}));setError('')}}/><span>{choice.label}</span><small>{choice.extra?`+${money(choice.extra)}`:'Incluido'}</small></label>)}</fieldset>)}
        {selected.saladCount&&<fieldset className="product-options vegetable-options"><legend>Elige {selected.saladCount} vegetales · {options.vegetables?.length||0}/{selected.saladCount}</legend>{saladVegetables.map(name=><label key={name}><input type="checkbox" checked={options.vegetables?.includes(name)||false} disabled={!options.vegetables?.includes(name)&&(options.vegetables?.length||0)>=selected.saladCount} onChange={e=>{const checked=e.target.checked;setOptions(current=>({...current,vegetables:checked?[...(current.vegetables||[]),name]:(current.vegetables||[]).filter(v=>v!==name)}));setError('')}}/><span>{name}</span></label>)}</fieldset>}
        <div className="allergen-note"><strong>Antes de elegir</strong><p>Consulta al local los alérgenos y la contaminación cruzada. Los modelos y recetas son referenciales.</p></div><a className="source-link" href={menuSources.find(s=>s.id===selected.source)?.url} target="_blank" rel="noreferrer">Ver en la carta original ↗</a>
        {selectionError&&<p className="selection-hint">{selectionError}</p>}{error&&<p role="alert" className="checkout-error">{error}</p>}<button disabled={!selected.price||!line} className="button primary full-width" onClick={addSelected}>{selected.price?`Agregar · ${money(line?.unitPrice||selected.price)}`:'Precio pendiente de confirmar'}{selected.price&&<Arrow/>}</button>
      </div></>}</Modal>
  </section>
}

