'use client'
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import { useEffect } from 'react'

export function useProg(ref, P, cb) {
  useEffect(() => {
    const f = () => {
      const r = ref.current.getBoundingClientRect()
      const v = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
      P.current = v
      cb && cb(v)
    }
    f()
    addEventListener('scroll', f, { passive: true })
    addEventListener('resize', f)
    return () => { removeEventListener('scroll', f); removeEventListener('resize', f) }
  }, [])
}

export const Studio = () => (
  <>
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={7} color="#fff1dc" position={[0, 6, 4]} scale={[12, 3, 1]} />
      <Lightformer form="rect" intensity={5} color="#ffb067" position={[-6, 2, 2]} scale={[2, 8, 1]} />
      <Lightformer form="rect" intensity={4} color="#cfe3ff" position={[6, 3, -3]} scale={[2, 8, 1]} />
      <Lightformer form="rect" intensity={3} color="#fff6ea" position={[0, 3, 9]} scale={[9, 4, 1]} />
      <Lightformer form="ring" intensity={2} position={[0, 3, -6]} scale={6} />
    </Environment>
    <spotLight position={[3, 9, 6]} angle={0.35} penumbra={1} intensity={350} color="#ffe2bd" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03} />
    <ambientLight intensity={0.5} color="#ffe9d0" />
  </>
)

export const Floor = ({ y = 0 }) => (
  <mesh rotation-x={-Math.PI / 2} position-y={y} receiveShadow>
    <planeGeometry args={[40, 40]} />
    <MeshReflectorMaterial blur={[300, 80]} resolution={512} mixBlur={1} mixStrength={10} roughness={0.9} depthScale={0.8} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#4a2e1c" metalness={0.25} mirror={0.55} />
  </mesh>
)
