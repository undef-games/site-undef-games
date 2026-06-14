import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { LogoConcept } from '../concepts/types'
import { getLogoSystem } from '../logo/logo-system'
import { CameraRig } from './camera-rig'
import { SceneBackground } from './scene-background'
import { SceneLights } from './scene-lights'

export function LogoLabScene({ concept }: { concept: LogoConcept }) {
  const system = getLogoSystem(concept)

  return (
    <div className="scene-canvas" aria-label="interactive logo scene">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <color attach="background" args={[concept.colorTokens.background]} />
        <SceneLights />
        <CameraRig />
        <SceneBackground />
        <ConceptScene scene={system.scene} accent={concept.colorTokens.accent} foreground={concept.colorTokens.foreground} />
      </Canvas>
    </div>
  )
}

function ConceptScene({ scene, accent, foreground }: { scene: ReturnType<typeof getLogoSystem>['scene']; accent: string; foreground: string }) {
  const ref = useRef<Group>(null)

  useFrame(({ clock, pointer }) => {
    if (!ref.current) return
    ref.current.rotation.y = -0.35 + pointer.x * 0.25 + Math.sin(clock.elapsedTime * 0.4) * 0.08
    ref.current.rotation.x = 0.25 - pointer.y * 0.18
  })

  return (
    <group ref={ref} rotation={[0.25, -0.35, 0]}>
      <SceneGlyph scene={scene} accent={accent} foreground={foreground} />
    </group>
  )
}

function SceneGlyph({ scene, accent, foreground }: { scene: ReturnType<typeof getLogoSystem>['scene']; accent: string; foreground: string }) {
  switch (scene) {
    case 'gate':
      return (
        <>
          {[1.2, 1.8, 2.4].map((radius, index) => (
            <mesh key={radius} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[radius, 0.035 + index * 0.012, 12, 72]} />
              <meshStandardMaterial color={index === 1 ? foreground : accent} emissive={accent} emissiveIntensity={0.12} />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.42, 3.2, 0.18]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </>
      )
    case 'map':
      return (
        <>
          {[-1.8, -0.9, 0, 0.9, 1.8].map((x) => (
            <mesh key={`v-${x}`} position={[x, 0, -0.1]}>
              <boxGeometry args={[0.025, 3.4, 0.025]} />
              <meshStandardMaterial color={foreground} opacity={0.35} transparent />
            </mesh>
          ))}
          {[-1.2, 0, 1.2].map((y) => (
            <mesh key={`h-${y}`} position={[0, y, -0.1]}>
              <boxGeometry args={[4, 0.025, 0.025]} />
              <meshStandardMaterial color={foreground} opacity={0.35} transparent />
            </mesh>
          ))}
          {[
            [-1.6, -0.8, 0],
            [-0.7, 0.4, 0],
            [0.3, -0.2, 0],
            [1.3, 0.9, 0],
          ].map(([x, y, z], index) => (
            <mesh key={`${x}-${y}`} position={[x, y, z]}>
              <sphereGeometry args={[index === 2 ? 0.18 : 0.12, 18, 18]} />
              <meshStandardMaterial color={index === 2 ? accent : foreground} />
            </mesh>
          ))}
        </>
      )
    case 'glitch':
      return (
        <>
          {[
            [-0.35, 1.0, 2.4, 0.34],
            [0.28, 0.35, 2.8, 0.42],
            [-0.12, -0.42, 2.55, 0.52],
            [0.5, -1.08, 1.7, 0.28],
          ].map(([x, y, w, h], index) => (
            <mesh key={index} position={[x, y, index * 0.08]}>
              <boxGeometry args={[w, h, 0.22]} />
              <meshStandardMaterial color={index === 1 ? accent : foreground} />
            </mesh>
          ))}
        </>
      )
    case 'monogram':
      return (
        <>
          <mesh position={[-0.55, 0, 0]}>
            <torusGeometry args={[0.72, 0.13, 16, 48, Math.PI]} />
            <meshStandardMaterial color={foreground} />
          </mesh>
          <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.74, 0.13, 16, 48, Math.PI * 1.5]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.18, 2.1, 0.2]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </>
      )
    case 'play':
      return (
        <>
          <mesh position={[-0.65, 0.1, 0]}>
            <torusGeometry args={[0.7, 0.08, 12, 44, Math.PI * 1.65]} />
            <meshStandardMaterial color={foreground} />
          </mesh>
          <mesh position={[0.55, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.9, 1.25, 3]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <mesh position={[-0.42, -1.18, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </>
      )
    case 'nodes':
      return (
        <>
          {[
            [-1.4, -0.7],
            [-0.6, 0.8],
            [0.25, -0.1],
            [1.1, 0.75],
            [1.4, -0.8],
          ].map(([x, y], index) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0]}>
              <boxGeometry args={[0.32, 0.32, 0.32]} />
              <meshStandardMaterial color={index % 2 ? accent : foreground} />
            </mesh>
          ))}
          {[-1, -0.2, 0.7, 1.25].map((x, index) => (
            <mesh key={x} position={[x, index % 2 ? 0.35 : -0.35, -0.05]} rotation={[0, 0, index % 2 ? -0.6 : 0.8]}>
              <boxGeometry args={[1.05, 0.045, 0.045]} />
              <meshStandardMaterial color={foreground} />
            </mesh>
          ))}
        </>
      )
    case 'tiles':
      return (
        <>
          {Array.from({ length: 9 }).map((_, index) => {
            const col = index % 3
            const row = Math.floor(index / 3)
            const anomaly = index === 5
            return (
              <mesh
                key={index}
                position={[(col - 1) * 0.78, (1 - row) * 0.78, anomaly ? 0.2 : 0]}
                rotation={[0, 0, anomaly ? 0.3 : 0]}
              >
                <boxGeometry args={[anomaly ? 0.58 : 0.5, anomaly ? 0.58 : 0.5, 0.14]} />
                <meshStandardMaterial color={anomaly ? accent : foreground} />
              </mesh>
            )
          })}
        </>
      )
    case 'particles':
      return (
        <>
          {[
            [-1.5, 0.8, 0.08],
            [-0.9, -0.6, 0.12],
            [-0.25, 0.45, 0.1],
            [0.1, 0, 0.35],
            [0.7, 0.3, 0.18],
            [1.3, -0.65, 0.1],
            [1.55, 0.7, 0.08],
            [-1.35, -1, 0.06],
          ].map(([x, y, r], index) => (
            <mesh key={index} position={[x, y, index * 0.03]}>
              <sphereGeometry args={[r, 20, 20]} />
              <meshStandardMaterial color={index === 3 ? accent : foreground} emissive={index === 3 ? accent : '#000000'} emissiveIntensity={0.18} />
            </mesh>
          ))}
        </>
      )
    case 'mutations':
      return (
        <>
          {[-0.8, 0, 0.8].map((x, index) => (
            <mesh key={x} position={[x, 0, -index * 0.08]} rotation={[0, 0, index * 0.35]}>
              <icosahedronGeometry args={[0.58 + index * 0.12, 0]} />
              <meshStandardMaterial color={index === 1 ? accent : foreground} wireframe={index !== 1} />
            </mesh>
          ))}
        </>
      )
    case 'dice':
      return (
        <>
          <mesh>
            <boxGeometry args={[2.1, 1.35, 0.22]} />
            <meshStandardMaterial color={foreground} />
          </mesh>
          {[
            [-0.55, 0.28],
            [0, 0],
            [0.55, -0.28],
          ].map(([x, y]) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0.16]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color={accent} />
            </mesh>
          ))}
          <mesh position={[-0.75, -0.82, 0]} rotation={[0, 0, 0.78]}>
            <boxGeometry args={[0.62, 0.22, 0.2]} />
            <meshStandardMaterial color={foreground} />
          </mesh>
        </>
      )
    case 'burst':
      return (
        <>
          <mesh>
            <sphereGeometry args={[0.2, 20, 20]} />
            <meshStandardMaterial color={foreground} />
          </mesh>
          {Array.from({ length: 10 }).map((_, index) => (
            <mesh key={index} position={[Math.cos(index * 0.63) * 1.25, Math.sin(index * 0.63) * 1.25, 0]} rotation={[0, 0, index * 0.63]}>
              <boxGeometry args={[0.18, 0.62, 0.16]} />
              <meshStandardMaterial color={index % 2 ? accent : foreground} />
            </mesh>
          ))}
        </>
      )
    case 'pixel':
      return (
        <>
          {[
            [-1.05, 0.6],
            [-0.72, 0.28],
            [-0.39, -0.04],
            [-0.06, -0.36],
          ].map(([x, y], index) => (
            <mesh key={index} position={[x, y, 0]}>
              <boxGeometry args={[0.34, 0.34, 0.2]} />
              <meshStandardMaterial color={index === 3 ? accent : foreground} />
            </mesh>
          ))}
          <mesh position={[0.7, 0.05, 0]} rotation={[0, 0, -0.55]}>
            <torusGeometry args={[0.82, 0.08, 14, 52, Math.PI * 1.2]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </>
      )
    case 'cursor':
    default:
      return (
        <>
          {[-1.2, 0, 1.2].map((y) => (
            <mesh key={y} position={[-0.35, y, 0]}>
              <boxGeometry args={[1.8, 0.08, 0.08]} />
              <meshStandardMaterial color={foreground} />
            </mesh>
          ))}
          <mesh position={[1.05, -0.75, 0.16]}>
            <boxGeometry args={[0.58, 0.58, 0.22]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} />
          </mesh>
          <mesh position={[0, -1.7, 0]}>
            <boxGeometry args={[2.8, 0.08, 0.08]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </>
      )
  }
}
