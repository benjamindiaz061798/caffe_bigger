'use client'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { random,texture,tomatoTexture,breadGeometry,ribbonGeometry,leafGeometry,avocadoGeometry,wedgeGeometry,meringueGeometry,shellGeometry,strawberryGeometry,tortillaGeometry,foodLayers } from './geometry'
import { wrapPoint,saladLeafGeometry } from './DetailedShapes'

export function FoodLayer({index,motionIndex=index,labelHeight=.08,base,progress,children,label,labels,count=3}){
  const group=useRef(),caption=useRef()
  useFrame((_,dt)=>{
    const p=progress.current
    if(group.current)group.current.position.y=THREE.MathUtils.damp(group.current.position.y,base+p*motionIndex*(3.5/Math.max(1,count-1)),8,dt)
    if(caption.current){const reveal=THREE.MathUtils.smoothstep(p,.07+index*.105,.22+index*.105);caption.current.style.opacity=reveal;caption.current.style.visibility=reveal>.03?'visible':'hidden';caption.current.style.transform=`translateX(${(1-reveal)*9}px)`}
  })
  return <group ref={group} position-y={base}>{children}{labels&&<Html position={[1.7,labelHeight,0]} center={false} zIndexRange={[3,2]} style={{pointerEvents:'none'}}><div ref={caption} className="layer-caption" style={{opacity:0}}><span>{String(index+1).padStart(2,'0')}</span><b>{label}</b></div></Html>}</group>
}
function useMaterials(){
  const maps=useMemo(()=>Object.fromEntries(['bread','crumb','pastry','meat','tortilla','cream','avocado'].map(key=>[key,texture(key)])),[])
  const tomato=useMemo(tomatoTexture,[])
  useEffect(()=>()=>{Object.values(maps).forEach(map=>map.dispose());tomato.dispose()},[maps,tomato])
  return {...maps,tomato}
}
function Bread({top,maps}){
  const geo=useMemo(()=>breadGeometry(top),[top])
  const score=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:24},(_,i)=>{const z=-.86+i/23*1.72;return new THREE.Vector3(0,.073+.56*Math.sqrt(Math.max(0,1-(.17/.73)**2-z*z)),z)})),48,.023,8,false),[])
  return <group>{[-.59,.59].map((x,i)=><group key={x} position-x={x}><mesh geometry={geo} castShadow receiveShadow>{top?<meshStandardMaterial map={maps.bread} bumpMap={maps.bread} bumpScale={.035} roughness={.86}/>:<><meshStandardMaterial attach="material-0" map={maps.bread} bumpMap={maps.bread} bumpScale={.035} roughness={.88}/><meshStandardMaterial attach="material-1" map={maps.crumb} bumpMap={maps.crumb} bumpScale={.02} roughness={.95}/></>}</mesh>{top&&<mesh geometry={score} position-x={i?-.17:.17}><meshStandardMaterial color="#e9cb9b" roughness={1}/></mesh>}</group>)}{top&&<mesh position={[0,.1,0]} scale={[.24,.12,.88]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial map={maps.bread} roughness={.9}/></mesh>}</group>
}
function Beef({maps,wrap=false,chicken=false}){
  const pieces=useMemo(()=>{const rng=random(133);return Array.from({length:wrap?11:17},(_,i)=>({position:[(rng()-.5)*(wrap?.65:1.9),rng()*.12,(rng()-.5)*(wrap?1.85:1.3)],rotation:[(rng()-.5)*.2,rng()*Math.PI,(rng()-.5)*.08],geometry:ribbonGeometry(i+2,chicken)}))},[wrap,chicken])
  return <group>{pieces.map((piece,i)=><mesh key={i} geometry={piece.geometry} position={piece.position} rotation={piece.rotation} castShadow receiveShadow><meshStandardMaterial map={chicken?maps.pastry:maps.meat} color={chicken?'#fff0cf':'#ffffff'} bumpMap={maps.meat} bumpScale={.028} roughness={.64} side={THREE.DoubleSide}/></mesh>)}{wrap&&pieces.slice(0,4).map((piece,i)=><mesh key={`cut-${i}`} geometry={piece.geometry} position={[(-1+i*.66)*.32,.06+(i%2)*.09,1.23]} rotation={[.9,0,i*.7]} scale={[.7,1.7,.9]} castShadow><meshStandardMaterial map={chicken?maps.pastry:maps.meat} color={chicken?'#fff0cf':'#ffffff'} bumpMap={maps.meat} bumpScale={.025} roughness={.66}/></mesh>)}</group>
}
function Tomato({maps,wrap=false}){
  const places=wrap?[[-.18,-.05,1.29],[.19,.03,.3],[-.1,.02,-.58]]:[[-.66,0,.35],[.12,.035,.45],[.62,.01,-.15],[-.28,.02,-.48]]
  return <group>{places.map((position,i)=><mesh key={i} position={position} rotation={wrap&&i===0?[Math.PI/2,0,.15]:[.04*(i%2?1:-1),i*.5,.03]} scale={wrap?[.56,1,.56]:[1,1,.9]} castShadow><cylinderGeometry args={[.48,.48,.075,64]}/><meshStandardMaterial attach="material-0" color="#b93722" roughness={.53}/><meshPhysicalMaterial attach="material-1" map={maps.tomato} roughness={.42} clearcoat={.22}/><meshPhysicalMaterial attach="material-2" map={maps.tomato} roughness={.42}/></mesh>)}</group>
}
function Avocado({maps,wrap=false}){
  const geo=useMemo(avocadoGeometry,[])
  const rind=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-.12,.035,.6],[-.49,.035,.38],[-.56,.035,-.12],[-.36,.035,-.52],[-.12,.035,-.65]].map(p=>new THREE.Vector3(...p))),40,.016,7,false),[])
  return <group>{Array.from({length:4},(_,i)=><group key={i} position={wrap?[(i%2?1:-1)*.14,.02*(i%2),-.8+i*.62]:[-.57+i*.4,.035*(i%3),Math.cos(i*.8)*.14-.12]} rotation-y={wrap?.2:i*.16-.35} scale={wrap?[.7,.8,.7]:[.95,1,.85]}><mesh geometry={geo} castShadow><meshStandardMaterial map={maps.avocado} bumpMap={maps.avocado} bumpScale={.018} roughness={.6}/></mesh><mesh geometry={rind}><meshStandardMaterial color="#547634" roughness={.75}/></mesh></group>)}{wrap&&<group position={[.25,.08,1.25]} rotation-x={Math.PI/2} scale={[.5,.8,.5]}><mesh geometry={geo}><meshStandardMaterial map={maps.avocado} roughness={.6}/></mesh><mesh geometry={rind}><meshStandardMaterial color="#547634" roughness={.75}/></mesh></group>}</group>
}
function Lettuce({wrap=false}){
  const leaves=useMemo(()=>Array.from({length:7},(_,i)=>leafGeometry(i+4)),[])
  return <group>{leaves.map((geo,i)=><mesh key={i} geometry={geo} position={[(i%2?1:-1)*(wrap?.13:.5),i*.008,wrap?-.85+i*.28:Math.sin(i*2.4)*.55]} rotation-y={i*2.4} scale={wrap?[.85,1,1]:[1.2,1,1]} castShadow><meshStandardMaterial color={['#719640','#89a746','#9bb65a'][i%3]} roughness={.74} side={THREE.DoubleSide}/></mesh>)}</group>
}
function Sauce({wrap=false,color='#f4e7c4'}){
  const geo=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:48},(_,i)=>new THREE.Vector3(Math.sin(i/47*Math.PI*5)*(wrap?.25:.8),.04,-.8+i/47*1.6))),64,.027,10,false),[wrap])
  return <mesh geometry={geo} castShadow><meshPhysicalMaterial color={color} roughness={.38} clearcoat={.16}/></mesh>
}
function Ingredient({name,maps,wrap}){
  if(/tomate|pimentón/i.test(name))return <Tomato maps={maps} wrap={wrap}/>
  if(/palta/i.test(name))return <Avocado maps={maps} wrap={wrap}/>
  if(/lechuga|verde|cilantro|orégano/i.test(name))return <Lettuce wrap={wrap}/>
  if(/mayo|salsa|queso|quesillo/i.test(name))return <Sauce wrap={wrap} color={/queso/i.test(name)?'#e9c46b':'#f5e8c7'}/>
  if(/choclo/i.test(name))return <group>{Array.from({length:24},(_,i)=><mesh key={i} position={[Math.sin(i*2.4)*.35,.035,-.85+(i%8)*.24]} scale={[.065,.045,.055]} castShadow><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#e1c353" roughness={.6}/></mesh>)}</group>
  return <Beef maps={maps} wrap={wrap} chicken={/pollo|ave/i.test(name)}/>
}
function Tortilla({progress,map}){
  const geo=useMemo(tortillaGeometry,[]),previous=useRef(-1)
  useEffect(()=>{previous.current=-1},[geo])
  useFrame(()=>{
    const p=progress.current
    if(Math.abs(previous.current-p)<.0003)return
    previous.current=p
    const pos=geo.attributes.position,uv=geo.attributes.uv
    for(let i=0;i<pos.count;i++){
      pos.setXYZ(i,...wrapPoint(uv.getX(i)*2-1,uv.getY(i)*2-1,p))
    }
    pos.needsUpdate=true;geo.computeVertexNormals()
  })
  return <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial map={map} bumpMap={map} bumpScale={.018} roughness={.9} side={THREE.DoubleSide}/></mesh>
}
function FoldSeams({progress}){
  const group=useRef(),curves=useMemo(()=>[1].map(u=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:32},(_,i)=>{const [x,y,z]=wrapPoint(u,-.76+i/31*1.72,0);return new THREE.Vector3(x,y+.006,z)})),48,.005,6,false)),[])
  useFrame(()=>{if(group.current)group.current.visible=progress.current<.035})
  return <group ref={group}>{curves.map((geo,i)=><mesh key={i} geometry={geo}><meshStandardMaterial color="#c5ae87" roughness={.9}/></mesh>)}</group>
}
function WrapPresentation({product,progress,maps}){
  const first=useRef(),second=useRef(),plate=useRef()
  const plateGeo=useMemo(()=>new THREE.LatheGeometry([[0,0],[1.35,0],[1.7,.05],[1.85,.12],[1.83,.15],[1.64,.09],[0,.045]].map(p=>new THREE.Vector2(...p)),80),[])
  useFrame(()=>{
    const p=THREE.MathUtils.smoothstep(progress.current,.01,.32),s=1-THREE.MathUtils.smoothstep(progress.current,.01,.16)
    if(first.current){first.current.position.set(-.48*(1-p),.055*(1-p),-.22*(1-p));first.current.rotation.y=-.48*(1-p);first.current.scale.set(THREE.MathUtils.lerp(.9,1,p),1,THREE.MathUtils.lerp(.67,1,p))}
    if(second.current){second.current.visible=s>.005;second.current.scale.set(.84*s,s,.65*s)}
    if(plate.current)plate.current.visible=progress.current<.10
  })
  const shell=<><Tortilla progress={progress} map={maps.tortilla}/><FoldSeams progress={progress}/><WrapCut product={product} progress={progress} maps={maps}/></>
  return <><mesh ref={plate} geometry={plateGeo} position-y={-.10} receiveShadow><meshPhysicalMaterial color="#f5edde" roughness={.3} clearcoat={.2}/></mesh><group ref={first}>{shell}</group><group ref={second} position={[.57,.06,.10]} rotation-y={.28}>{shell}</group></>
}
function PackedIngredient({progress,index,children}){
  const group=useRef()
  useFrame(()=>{if(!group.current)return;const p=THREE.MathUtils.smoothstep(progress.current,0,.4);group.current.visible=p>.01;group.current.scale.set(THREE.MathUtils.lerp(.68,1,p),THREE.MathUtils.lerp(.75,1,p),THREE.MathUtils.lerp(.78,1,p));group.current.position.y=(.12-index*.075)*(1-p)})
  return <group ref={group}>{children}</group>
}
function WrapCut({product,progress,maps}){
  const group=useRef(),leaf=useMemo(()=>saladLeafGeometry(2),[])
  const names=product.ingredients.join(' '),hasMeat=/pollo|carne|churrasco|jamón|camarón|atún/i.test(names),chicken=/pollo/i.test(names),shrimp=/camarón/i.test(names),ham=/jamón/i.test(names),tuna=/atún/i.test(names)
  useFrame(()=>{if(!group.current)return;const s=1-THREE.MathUtils.smoothstep(progress.current,.025,.20);group.current.visible=s>.005;group.current.scale.setScalar(s)})
  return <group ref={group} position={[0,.36,1.15]}>
    {Array.from({length:10},(_,i)=>{const a=i/10*Math.PI*2,x=Math.cos(a)*.51,y=Math.sin(a)*.20;return <mesh key={`leaf-${i}`} geometry={leaf} position={[x,y,x*.9]} rotation={[Math.PI/2,0,a]} scale={[.27,.35,.26]}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={.7}/></mesh>})}
    {hasMeat&&Array.from({length:9},(_,i)=>{const x=Math.cos(i*2.4)*Math.sqrt(i/9)*.36,y=Math.sin(i*2.4)*.11;return <mesh key={`protein-${i}`} position={[x,y,.12+x*.9]} rotation={[0,0,i*.8]} scale={[1,1,.65]}>{shrimp?<torusGeometry args={[.085,.035,10,18,Math.PI*1.6]}/>:ham?<boxGeometry args={[.15,.12,.04]}/>:tuna?<dodecahedronGeometry args={[.09,0]}/>:<capsuleGeometry args={[.055,.15,5,12]}/>}<meshStandardMaterial color={shrimp?'#dc9b79':ham?'#c68e7c':chicken?i%2?'#e4cba6':'#cfa777':/atún/i.test(names)?'#d5ae98':'#966c4d'} roughness={.68}/></mesh>})}
    {/tomate/i.test(names)&&[-.27,.23].map((x,i)=><mesh key={`tomato-${i}`} position={[x,i?-.08:.09,.14+x*.9]} rotation={[Math.PI/2,0,i*.7]}><cylinderGeometry args={[.13,.13,.06,32,1,false,0,Math.PI*1.3]}/><meshStandardMaterial attach="material-0" color="#bf442c"/><meshStandardMaterial attach="material-1" map={maps.tomato}/><meshStandardMaterial attach="material-2" map={maps.tomato}/></mesh>)}
    {/palta/i.test(names)&&[0,1,2].map(i=><mesh key={`avocado-${i}`} position={[(i-1)*.17,.06+(i%2)*.07,.15+(i-1)*.17*.9]} rotation={[.3,.1,i*.7]} scale={[.12,.06,.07]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial map={maps.avocado} roughness={.6}/></mesh>)}
    {/queso/i.test(names)&&[0,1,2].map(i=>{const x=(i-1)*.25;return <mesh key={`cheese-${i}`} position={[x,.08,.16+x*.9]} rotation-z={i*.8}><boxGeometry args={[.18,.045,.04]}/><meshStandardMaterial color="#e6c369" roughness={.6}/></mesh>})}
    {/cebolla/i.test(names)&&[0,1,2].map(i=>{const x=(i-1)*.24;return <mesh key={`onion-${i}`} position={[x,-.06,.17+x*.9]} rotation-z={i}><torusGeometry args={[.065,.014,7,20,Math.PI*1.5]}/><meshStandardMaterial color="#ad7c9b" roughness={.6}/></mesh>})}
    {/choclo/i.test(names)&&Array.from({length:10},(_,i)=><mesh key={`corn-${i}`} position={[Math.cos(i*2.4)*.3,Math.sin(i*2.4)*.13,.075]} scale={[.035,.028,.025]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#e5c558"/></mesh>)}
  </group>
}
function Sandwich({product,progress,labels,maps,wrap=false}){
  const names=foodLayers(product),count=names.length
  return <group rotation-y={wrap?-.38:-.3}>
    <FoodLayer index={0} base={.12} progress={progress} labels={labels} label={names[0]} count={count}>{wrap?<WrapPresentation product={product} progress={progress} maps={maps}/>:<Bread top={false} maps={maps}/>}</FoodLayer>
    {product.ingredients.slice(1).map((name,i)=><FoodLayer key={`${name}-${i}`} index={i+1} base={wrap?.25+i*.15:.38+i*.14} progress={progress} labels={labels} label={name} count={count}>{wrap?<PackedIngredient progress={progress} index={i}><Ingredient name={name} maps={maps} wrap/></PackedIngredient>:<Ingredient name={name} maps={maps}/>}</FoodLayer>)}
    {!wrap&&<FoodLayer index={count-1} base={.43+(product.ingredients.length-1)*.14} progress={progress} labels={labels} label={names[count-1]} count={count}><Bread top maps={maps}/></FoodLayer>}
  </group>
}
function Strawberry({position,rotation=[0,0,0],scale=1,glaze=false}){
  const geo=useMemo(strawberryGeometry,[]),seeds=useRef()
  useEffect(()=>{
    if(!seeds.current)return
    const dummy=new THREE.Object3D(),profile=[[.08,.1],[.15,.155],[.22,.195],[.29,.231],[.36,.25],[.43,.247],[.49,.21]]
    let index=0
    for(let j=0;j<profile.length;j++)for(let i=0;i<10;i++){
      const [y,r]=profile[j],a=i*Math.PI/5+(j%2)*.31
      dummy.position.set(Math.cos(a)*(r+.002),y,Math.sin(a)*(r+.002)*.93);dummy.scale.set(.006,.011,.0045);dummy.rotation.set(0,-a,0);dummy.updateMatrix();seeds.current.setMatrixAt(index++,dummy.matrix)
    }seeds.current.instanceMatrix.needsUpdate=true
  },[])
  return <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={geo} castShadow={!glaze}><meshPhysicalMaterial color={glaze?'#edbc72':'#bd2924'} roughness={glaze?.12:.43} clearcoat={glaze?1:.25} clearcoatRoughness={.15} transparent={glaze} opacity={glaze?.2:1} depthWrite={!glaze}/></mesh>
    {!glaze&&<><instancedMesh ref={seeds} args={[undefined,undefined,70]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#d7b16b" roughness={.75}/></instancedMesh>{Array.from({length:5},(_,i)=><mesh key={i} position={[Math.cos(i*1.256)*.08,.525,Math.sin(i*1.256)*.08]} rotation={[.08,i*1.256,.18]} scale={[.07,.02,.18]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#4e7130" roughness={.8}/></mesh>)}</>}
  </group>
}
function Mint(){
  const geo=useMemo(()=>leafGeometry(1),[])
  return <group>{[0,1,2].map(i=><mesh key={i} geometry={geo} position={[Math.cos(i*2.1)*.12,.03,Math.sin(i*2.1)*.1]} rotation={[.08,i*2.1,.16]} scale={[.52,.7,.3]}><meshStandardMaterial color="#5d7f38" roughness={.8} side={THREE.DoubleSide}/></mesh>)}</group>
}
function Tartlet({product,progress,labels,maps}){
  const shell=useMemo(shellGeometry,[])
  const berries=useMemo(()=>Array.from({length:9},(_,i)=>({position:i===8?[0,0,0]:[Math.cos(i*Math.PI/4)*.93,0,Math.sin(i*Math.PI/4)*.93],rotation:[Math.sin(i)*.14,i*.8,Math.cos(i)*.13],scale:.93+(i%3)*.07})),[])
  return <group rotation-y={-.22}>
    <FoodLayer index={0} base={.04} progress={progress} labels={labels} label={product.ingredients[0]} count={5}><mesh geometry={shell} castShadow receiveShadow><meshStandardMaterial map={maps.pastry} bumpMap={maps.pastry} bumpScale={.028} roughness={.88} side={THREE.DoubleSide}/></mesh></FoodLayer>
    <FoodLayer index={1} base={.235} progress={progress} labels={labels} label={product.ingredients[1]} count={5}><mesh castShadow><cylinderGeometry args={[1.31,1.29,.19,96]}/><meshPhysicalMaterial map={maps.cream} roughness={.48} clearcoat={.08}/></mesh></FoodLayer>
    <FoodLayer index={2} base={.34} progress={progress} labels={labels} label={product.ingredients[2]} count={5}>{berries.map((berry,i)=><Strawberry key={i} {...berry}/>)}</FoodLayer>
    <FoodLayer index={3} motionIndex={2} labelHeight={.55} base={.345} progress={progress} labels={labels} label="Glaseado ligero de fruta" count={5}>{berries.map((berry,i)=><Strawberry key={i} {...berry} scale={berry.scale*1.015} glaze/>)}</FoodLayer>
    <FoodLayer index={4} base={.91} progress={progress} labels={labels} label={product.ingredients[4]} count={5}><Mint/></FoodLayer>
  </group>
}
function Pie({product,progress,labels,maps,cheesecake=false}){
  const base=useMemo(()=>wedgeGeometry(.14),[]),filling=useMemo(()=>wedgeGeometry(.46),[]),topping=useMemo(()=>wedgeGeometry(.08),[])
  const peaks=useMemo(()=>Array.from({length:9},(_,i)=>meringueGeometry(i)),[])
  const places=[[0,.67],[-.22,.25],[.22,.25],[-.46,-.18],[0,-.18],[.46,-.18],[-.7,-.58],[0,-.63],[.7,-.58]]
  return <group rotation-y={-.15}>
    <FoodLayer index={0} base={.08} progress={progress} labels={labels} label={product.ingredients[0]}><mesh geometry={base} castShadow><meshStandardMaterial map={maps.pastry} bumpMap={maps.pastry} bumpScale={.035} roughness={.9}/></mesh></FoodLayer>
    <FoodLayer index={1} base={.23} progress={progress} labels={labels} label={product.ingredients[1]}><mesh geometry={filling} castShadow><meshPhysicalMaterial map={maps.cream} color={cheesecake?'#fff3d9':'#f6e4a4'} roughness={.46}/></mesh></FoodLayer>
    <FoodLayer index={2} base={.7} progress={progress} labels={labels} label={product.ingredients[2]}><mesh geometry={topping} castShadow><meshPhysicalMaterial color={cheesecake?(product.id.includes('maracuya')?'#dca646':'#963d48'):'#fff1d5'} roughness={cheesecake?.28:.5}/></mesh>{!cheesecake&&places.map(([x,z],i)=><mesh key={i} geometry={peaks[i]} position={[x,.055,z]} scale={i===0?[.8,.88,.8]:[1,1,1]} castShadow><meshStandardMaterial vertexColors roughness={.5}/></mesh>)}</FoodLayer>
  </group>
}
export default function ArtisanFood({product,progress,labels}){
  const maps=useMaterials(),type=product.model||product.kind
  if(type==='tart')return <Tartlet product={product} progress={progress} labels={labels} maps={maps}/>
  if(type==='pie'||type==='cheesecake')return <Pie product={product} progress={progress} labels={labels} maps={maps} cheesecake={type==='cheesecake'}/>
  return <Sandwich product={product} progress={progress} labels={labels} maps={maps} wrap={type==='wrap'}/>
}

