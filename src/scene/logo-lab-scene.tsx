import { Canvas } from '@react-three/fiber'
import { CameraRig } from './camera-rig'
import { SceneBackground } from './scene-background'
import { SceneLights } from './scene-lights'

export function LogoLabScene({ activeConceptId }: { activeConceptId: string }) {
  return (
    <div className="scene-canvas" aria-label="interactive logo scene">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <color attach="background" args={['#05070c']} />
        <SceneLights />
        <CameraRig />
        <SceneBackground />
        <mesh>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#69a7ff" wireframe={activeConceptId === 'wireframe-map'} />
        </mesh>
      </Canvas>
    </div>
  )
}
