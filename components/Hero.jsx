'use client'
import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import ProductArt from './ProductArt'
import { products } from './products'
import { useScrollProgress } from './useScrollProgress'

const cream = { color: '#eee2ca', metalness: .24, roughness: .32 }
const metal = { color: '#c8c3b7', metalness: .92, roughness: .22 }
const copper = { color: '#b8754c', metalness: .8, roughness: .3 }
const dark = { color: '#382b26', metalness: .25, roughness: .38 }
function Box({ args, position, material = cream, radius = .12 }) { return <RoundedBox args={args} position={position} radius={radius} smoothness={4} castShadow receiveShadow><meshStandardMaterial {...material} /></RoundedBox> }
function Gauge({ x }) {
  return <group position={[x, 3.32, .59]} rotation={[Math.PI / 2, 0, 0]}>
    <mesh><cylinderGeometry args={[.33, .33, .1, 48]} /><meshStandardMaterial {...copper} /></mesh>
    <mesh position-y={.06}><cylinderGeometry args={[.285, .285, .025, 48]} /><meshStandardMaterial color="#f9f1dd" /></mesh>
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 6 + Math.PI / 6) * .225, .08, Math.sin(i * Math.PI / 6 + Math.PI / 6) * .225]} rotation-y={-i * Math.PI / 6 - Math.PI / 6}><boxGeometry args={[.045, .01, .012]} /><meshStandardMaterial color="#634530" /></mesh>)}
    <mesh position={[.055, .09, -.03]} rotation-y={.6}><boxGeometry args={[.23, .012, .018]} /><meshStandardMaterial color="#a75235" /></mesh>
  </group>
}
function Machine({ progress, reduced }) {
  const stream = useRef(), coffee = useRef(), steam = useRef(), root = useRef()
  const elapsed = useRef(0)
  const brand = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 160
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#eee2ca'; ctx.fillRect(0, 0, 512, 160); ctx.fillStyle = '#624331'; ctx.textAlign = 'center'; ctx.font = 'bold 76px Georgia'; ctx.fillText('BIGGER', 256, 93); ctx.font = '15px sans-serif'; ctx.fillText('C O F F E E  &  S A N D W I C H', 256, 125)
    return new THREE.CanvasTexture(canvas)
  }, [])
  const cupGeometry = useMemo(() => new THREE.LatheGeometry([[0, 0], [.34, 0], [.46, .04], [.58, .16], [.66, .49], [.68, .72], [.62, .74], [.6, .49], [.5, .18], [.32, .12], [0, .12]].map(([x, y]) => new THREE.Vector2(x, y)), 64), [])
  useEffect(() => () => { brand.dispose(); cupGeometry.dispose() }, [brand, cupGeometry])
  useFrame((state, dt) => {
    elapsed.current += dt
    const time = elapsed.current, phase = reduced ? 1 : THREE.MathUtils.smoothstep(progress.current, .18, .9)
    if (stream.current) { stream.current.visible = !reduced && phase > .08 && phase < .93; stream.current.scale.x = 1 + Math.sin(time * 32) * .1 }
    if (coffee.current) coffee.current.position.y = .65 + .5 * (reduced ? 1 : phase)
    if (root.current) root.current.rotation.y = -.25 + phase * .2
    if (steam.current) steam.current.children.forEach((mesh, i) => { const life = (time * .19 + i / 5) % 1; mesh.position.y = 1.2 + life * .65; mesh.position.x = Math.sin(time + i) * .1; mesh.material.opacity = Math.sin(life * Math.PI) * .13 * phase })
  })
  return <group ref={root} position={[0, -.35, 0]} rotation-y={-.13}>
    <Box args={[3.65, .22, 2.45]} position={[0, .12, 0]} material={dark} radius={.09} />
    <Box args={[3.55, 3.6, 1.35]} position={[0, 2, -.58]} />
    <Box args={[3.73, .28, 1.55]} position={[0, 3.87, -.54]} material={copper} radius={.07} />
    <Box args={[3.1, .08, 1.06]} position={[0, 4.04, -.54]} material={metal} radius={.025} />
    <Box args={[3.25, 1.72, .12]} position={[0, 1.33, .14]} material={dark} radius={.06} />
    <Box args={[3.6, .9, 1.58]} position={[0, 3.15, -.35]} radius={.15} />
    <Gauge x={-1.12} /><Gauge x={1.12} />
    <mesh position={[0, 3.3, .46]}><planeGeometry args={[1.25, .39]} /><meshStandardMaterial map={brand} roughness={.7} /></mesh>
    {[-.32, 0, .32].map((x, i) => <mesh key={x} position={[x, 2.95, .48]} rotation-x={Math.PI / 2}><cylinderGeometry args={[.07, .07, .06, 24]} /><meshStandardMaterial color={i === 1 ? '#b46845' : '#695745'} emissive={i === 1 ? '#a95b36' : '#000000'} emissiveIntensity={.3} /></mesh>)}
    <mesh position={[0, 2.58, .35]}><cylinderGeometry args={[.53, .46, .32, 48]} /><meshStandardMaterial {...metal} /></mesh>
    <mesh position={[0, 2.39, .4]}><cylinderGeometry args={[.52, .43, .12, 48]} /><meshStandardMaterial {...copper} /></mesh>
    <group position={[.1, 2.47, .65]} rotation={[Math.PI / 2, 0, -.35]}><mesh position-y={.63}><cylinderGeometry args={[.1, .14, 1.35, 24]} /><meshStandardMaterial {...dark} /></mesh><mesh position-y={1.26}><sphereGeometry args={[.14, 24, 24]} /><meshStandardMaterial {...dark} /></mesh></group>
    <mesh position={[0, 2.23, .47]}><cylinderGeometry args={[.07, .05, .23, 24]} /><meshStandardMaterial {...metal} /></mesh>
    <mesh ref={stream} position={[0, 1.53, .47]}><cylinderGeometry args={[.024, .033, 1.22, 16]} /><meshStandardMaterial color="#663921" roughness={.18} /></mesh>
    <mesh position={[1.25, 2, .43]} rotation-z={-.2}><cylinderGeometry args={[.045, .045, 1.1, 16]} /><meshStandardMaterial {...metal} /></mesh>
    <mesh position={[1.35, 1.48, .43]} rotation-z={-.9}><cylinderGeometry args={[.045, .045, .25, 16]} /><meshStandardMaterial {...metal} /></mesh>
    <Box args={[3.3, .15, 2.05]} position={[0, .31, .17]} material={metal} radius={.04} />
    {Array.from({ length: 17 }, (_, i) => <Box key={i} args={[.055, .018, 1.8]} position={[-1.45 + i * .18, .397, .17]} material={dark} radius={.005} />)}
    <mesh position={[0, .44, .49]}><cylinderGeometry args={[1.05, .94, .06, 64]} /><meshStandardMaterial {...cream} /></mesh>
    <mesh position={[0, .49, .47]} geometry={cupGeometry} castShadow receiveShadow><meshPhysicalMaterial color="#f9f0dc" roughness={.2} clearcoat={.6} side={THREE.DoubleSide} /></mesh>
    <mesh position={[.69, .91, .47]}><torusGeometry args={[.24, .065, 16, 40]} /><meshPhysicalMaterial color="#f9f0dc" roughness={.2} clearcoat={.6} /></mesh>
    <mesh ref={coffee} position={[0, .89, .47]} rotation-x={-Math.PI / 2}><circleGeometry args={[.58, 64]} /><meshStandardMaterial color="#a36e3d" roughness={.26} /></mesh>
    <group ref={steam} position={[0, 0, .47]}>{Array.from({ length: 5 }, (_, i) => <mesh key={i} scale={[.08, .25, .08]}><sphereGeometry args={[1, 12, 12]} /><meshBasicMaterial color="#fff2d8" transparent opacity={.1} depthWrite={false} /></mesh>)}</group>
    {[-1.2, 1.2].map(x => <Box key={x} args={[.4, .18, .6]} position={[x, -.04, -.2]} material={dark} radius={.05} />)}
  </group>
}
function Fallback() { return <div className="scene-fallback"><ProductArt product={products[0]} /></div> }
class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <Fallback /> : this.props.children }
}
export default function Hero() {
  const { progress, stage, reduced } = useScrollProgress('inicio')
  return <div className="coffee-scene"><SceneBoundary><Canvas shadows dpr={[1, 1.5]} camera={{ fov: 34, position: [6.5, 5.2, 10.8] }} fallback={<Fallback />} onCreated={({ camera }) => camera.lookAt(0, 1.7, 0)}>
    <ambientLight intensity={1.7} color="#fff2de" /><hemisphereLight args={['#ffefd7', '#7e6650', 1.3]} />
    <directionalLight position={[-3, 8, 5]} intensity={4} color="#fff3dc" castShadow shadow-mapSize={[1024, 1024]} shadow-normalBias={.035} /><directionalLight position={[5, 4, -2]} intensity={2.5} color="#ffd2a3" />
    <Machine progress={progress} reduced={reduced} />
    <mesh rotation-x={-Math.PI / 2} position-y={-.46} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={.17} /></mesh>
  </Canvas></SceneBoundary><div className="brew-button scroll-stage" aria-live="polite"><span>{stage === 2 ? '✓' : '↓'}</span>{['Primero, la taza. Sigue bajando.', 'El espresso se sirve con tu scroll.', 'Tu café está listo. Sigue el antojo.'][stage]}</div><div className="brew-progress" aria-hidden="true"><span style={{ transform: `scaleX(${stage === 0 ? .08 : stage === 1 ? .55 : 1})` }} /></div></div>
}
