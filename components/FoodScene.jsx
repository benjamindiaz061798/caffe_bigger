'use client'
import { Component, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import ProductArt from './ProductArt'
import ArtisanFood from './food/ArtisanFood'
import BakeryModel from './food/BakeryModel'
import SaladModel from './food/SaladModel'
export const tartReference = {id:'tart-reference',name:'Tartaleta de frutillas',kind:'pie',model:'tart',decomposable:true,ingredients:['Masa sablée','Crema pastelera','Frutillas frescas','Glaseado de fruta','Menta fresca'],colors:['#c7975c','#edcf83','#b63739']}
export function FoodModel({product,progress,labels=false,options={}}) {
  const type=product.model||product.kind
  const cup=useMemo(()=>new THREE.LatheGeometry([[0,0],[.45,0],[.65,.06],[.9,.5],[.98,1],[.91,1.02],[.84,.53],[.59,.16],[0,.13]].map(([x,y])=>new THREE.Vector2(x,y)),64),[])
  if(product.category==='Pastelería'&&product.id!=='pie-limon')return <BakeryModel product={product} progress={progress} labels={labels} options={options}/>
  if(type==='salad')return <SaladModel product={product} options={options}/>
  if(['tart','pie','cheesecake','sandwich','wrap'].includes(type))return <ArtisanFood product={product} progress={progress} labels={labels}/>
  if(['coffee','tea','iced'].includes(type))return <group position-y={.12}>
    <mesh><cylinderGeometry args={[1.4,1.3,.08,64]}/><meshPhysicalMaterial color="#f1e2c7" roughness={.25}/></mesh><mesh geometry={cup} position-y={.08} castShadow><meshPhysicalMaterial color="#faf1de" roughness={.2} clearcoat={.65} side={THREE.DoubleSide}/></mesh><mesh position={[.95,.7,0]}><torusGeometry args={[.32,.08,16,40]}/><meshPhysicalMaterial color="#faf1de" roughness={.2}/></mesh><mesh rotation-x={-Math.PI/2} position-y={1.03}><circleGeometry args={[.88,64]}/><meshStandardMaterial color={type==='tea'?'#976132':product.id?.includes('matcha')?'#91a265':'#a57443'} roughness={.3}/></mesh>{type==='iced'&&[0,1,2,3].map(i=><RoundedBox key={i} args={[.3,.17,.28]} position={[Math.cos(i*1.6)*.4,1.08,Math.sin(i*1.6)*.4]} radius={.04}><meshPhysicalMaterial color="#e5ddd0" transparent opacity={.65} roughness={.1}/></RoundedBox>)}</group>
  return null
}
function Scene({product,exploded,labels,scrollProgress,options,rotation}) {
  const expansion=useRef(0),model=useRef()
  useFrame(({camera,size},dt)=>{
    if(model.current)model.current.rotation.y=THREE.MathUtils.damp(model.current.rotation.y,rotation.current,12,dt)
    const target=product.decomposable?(scrollProgress?scrollProgress.current:exploded?1:0):0
    expansion.current=THREE.MathUtils.damp(expansion.current,target,6,dt)
    const p=expansion.current,aspect=size.width/size.height,requiredWidth=labels?5.9:(product.kind==='wrap'?3.8:3.5)+p*.4
    const distance=Math.max(labels?7.3:6.5,requiredWidth/(2*Math.tan(35*Math.PI/360)*aspect))+p*(labels?1.2:aspect>.95?3.2:1.7)
    const plated=product.kind==='salad'||product.category==='Pastelería'&&product.id!=='pie-limon'
    camera.position.set(distance*.31,(plated?4.4:3.4)+p*1.65,distance*.95)
    camera.lookAt(labels?.15:0,.65+p*1.8,0)
  })
  return <>
    <ambientLight intensity={.48} color="#fff4e6"/>
    <hemisphereLight args={['#fff8ee','#a28c72',.65]}/>
    <Environment resolution={128} frames={1}><Lightformer position={[-4,6,4]} scale={[5,5,1]} intensity={2.2} color="#fff4e2"/><Lightformer position={[4,3,-4]} scale={[3,6,1]} intensity={1} color="#f7eee2"/></Environment>
    <directionalLight position={[-3,8,5]} intensity={2.3} castShadow shadow-mapSize={[1024,1024]} shadow-normalBias={.035} shadow-radius={4}/>
    <directionalLight position={[4,4,-3]} intensity={.65} color="#ffe3bf"/>
    <group position-x={labels?-.65:0}><group ref={model}><FoodModel key={product.id} product={product} progress={expansion} labels={labels} options={options}/></group></group>
    <mesh rotation-x={-Math.PI/2} position-y={-.03} receiveShadow><planeGeometry args={[100,100]}/><shadowMaterial transparent opacity={.12}/></mesh>
  </>
}
class Boundary extends Component { state={failed:false};static getDerivedStateFromError(){return {failed:true}};render(){return this.state.failed?<div className="model-fallback">La vista 3D no está disponible en este dispositivo.<ProductArt product={this.props.product}/></div>:this.props.children} }
export default function FoodCanvas({product,exploded=false,labels=false,progress,options={},active=true}) {
  const rotation=useRef(0),drag=useRef(null)
  useEffect(()=>{rotation.current=0},[product.id])
  function endDrag(event){if(drag.current?.id!==event.pointerId)return;drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}
  return <div className="food-viewer" role="group" aria-label={`Vista 3D de ${product.name}. Arrastra horizontalmente o usa los botones para girar 360 grados.`} tabIndex={0}
    onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(['ArrowLeft','ArrowRight','Home'].includes(event.key)){event.preventDefault();rotation.current=event.key==='Home'?0:rotation.current+(event.key==='ArrowLeft'?-.3:.3)}}}
    onPointerDown={event=>{if(event.target.tagName!=='CANVAS'||event.button!==0)return;drag.current={id:event.pointerId,x:event.clientX};event.currentTarget.setPointerCapture(event.pointerId)}}
    onPointerMove={event=>{if(drag.current?.id!==event.pointerId)return;rotation.current+=(event.clientX-drag.current.x)*.012;drag.current.x=event.clientX}}
    onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={()=>{drag.current=null}}>
    <Boundary product={product}><Canvas shadows frameloop={active?'always':'never'} dpr={[1,1.5]} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1}} camera={{fov:35,position:[4,3.5,9]}} fallback={<p className="model-fallback">La vista 3D requiere WebGL. Puedes consultar los ingredientes en la ficha.</p>}><Scene product={product} exploded={exploded} labels={labels} scrollProgress={progress} options={options} rotation={rotation}/></Canvas></Boundary>
    <div className="model-controls"><span>Arrastra para girar · 360°</span><div><button aria-label="Girar producto a la izquierda" onClick={()=>{rotation.current-=Math.PI/4}}>↶</button><button aria-label="Girar producto a la derecha" onClick={()=>{rotation.current+=Math.PI/4}}>↷</button><button className="reset-model" onClick={()=>{rotation.current=0}}>Restablecer</button></div></div>
  </div>
}
