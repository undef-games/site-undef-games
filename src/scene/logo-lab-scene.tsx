import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { LogoConcept } from '../concepts/types'
import { getLogoSystem } from '../logo/logo-system'
import { CameraRig } from './camera-rig'
import { SceneBackground } from './scene-background'
import { SceneLights } from './scene-lights'

export function LogoLabScene({
  concept,
  phase,
  onAdvance,
}: {
  concept: LogoConcept
  phase: number
  onAdvance: () => void
}) {
  const system = getLogoSystem(concept)

  return (
    <div className="scene-canvas" aria-label="interactive logo scene" data-phase={system.phases[phase]} onClick={onAdvance}>
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <color attach="background" args={[concept.colorTokens.background]} />
        <SceneLights />
        <CameraRig />
        <SceneBackground />
        <PrototypeScene
          scene={system.scene}
          phase={phase}
          accent={concept.colorTokens.accent}
          foreground={concept.colorTokens.foreground}
        />
      </Canvas>
      <div className="scene-status" aria-live="polite">
        {system.phases[phase]}
      </div>
    </div>
  )
}

function PrototypeScene({
  scene,
  phase,
  accent,
  foreground,
}: {
  scene: ReturnType<typeof getLogoSystem>['scene']
  phase: number
  accent: string
  foreground: string
}) {
  const ref = useRef<Group>(null)

  useFrame(({ clock, pointer }) => {
    if (!ref.current) return
    const pace = scene === 'console' ? 0.18 : scene === 'board' ? 0.32 : 0.42
    ref.current.rotation.y = -0.35 + pointer.x * 0.28 + Math.sin(clock.elapsedTime * pace) * 0.1
    ref.current.rotation.x = 0.22 - pointer.y * 0.18
  })

  return (
    <group ref={ref} rotation={[0.22, -0.35, 0]}>
      {scene === 'console' ? (
        <ConsoleScene phase={phase} accent={accent} foreground={foreground} />
      ) : scene === 'board' ? (
        <BoardScene phase={phase} accent={accent} foreground={foreground} />
      ) : (
        <DefineScene phase={phase} accent={accent} foreground={foreground} />
      )}
    </group>
  )
}

function DefineScene({ phase, accent, foreground }: { phase: number; accent: string; foreground: string }) {
  const pieces =
    phase === 0
      ? [
          [-1.1, 0.75, 0.18],
          [-0.3, -0.2, 0.28],
          [0.8, 0.55, 0.16],
          [1.15, -0.75, 0.12],
          [-0.9, -0.9, 0.14],
        ]
      : phase === 1
        ? [
            [-0.85, 0.6, 0.2],
            [-0.25, 0.2, 0.24],
            [0.35, -0.15, 0.22],
            [0.85, -0.45, 0.16],
            [0.1, 0.85, 0.12],
          ]
        : []

  return (
    <>
      {pieces.map(([x, y, size], index) => (
        <mesh key={index} position={[x, y, index * 0.05]} rotation={[0, 0, index * 0.45]}>
          <boxGeometry args={[size * 2.2, size * 2.2, 0.22]} />
          <meshStandardMaterial color={index === 1 ? accent : foreground} emissive={index === 1 ? accent : '#000000'} emissiveIntensity={0.1} />
        </mesh>
      ))}
      {phase < 2 ? (
        <>
          <mesh position={[0.2, 0.2, 0]}>
            <torusGeometry args={[0.92, 0.08, 16, 56, Math.PI * 1.45]} />
            <meshStandardMaterial color={foreground} />
          </mesh>
          <mesh position={[0.16, -0.95, 0.1]}>
            <sphereGeometry args={[0.13, 18, 18]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
          </mesh>
        </>
      ) : (
        <>
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[1.25, 1.75, 3]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} />
          </mesh>
          <mesh position={[0, 0, -0.12]}>
            <torusGeometry args={[1.45, 0.055, 12, 72]} />
            <meshStandardMaterial color={foreground} opacity={0.55} transparent />
          </mesh>
        </>
      )}
    </>
  )
}

function ConsoleScene({ phase, accent, foreground }: { phase: number; accent: string; foreground: string }) {
  const lineWidths = phase === 0 ? [1.8, 1.2, 2.4] : phase === 1 ? [2.6, 2.1, 1.7] : [2.7, 2.7, 2.7]

  return (
    <>
      <mesh position={[0, 0, -0.18]}>
        <boxGeometry args={[3.6, 2.35, 0.16]} />
        <meshStandardMaterial color={foreground} opacity={0.09} transparent />
      </mesh>
      {lineWidths.map((width, index) => (
        <mesh key={index} position={[-0.3 + width / 4, 0.72 - index * 0.58, 0]}>
          <boxGeometry args={[width, 0.09, 0.09]} />
          <meshStandardMaterial color={index === phase ? accent : foreground} emissive={index === phase ? accent : '#000000'} emissiveIntensity={0.14} />
        </mesh>
      ))}
      <mesh position={[-1.35, 0.72 - phase * 0.58, 0.12]}>
        <boxGeometry args={[0.26, 0.26, 0.18]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
      </mesh>
      {phase === 2 && (
        <mesh position={[1.15, -0.55, 0.2]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.42, 0.68, 3]} />
          <meshStandardMaterial color={accent} />
        </mesh>
      )}
    </>
  )
}

function BoardScene({ phase, accent, foreground }: { phase: number; accent: string; foreground: string }) {
  return (
    <>
      {Array.from({ length: 16 }).map((_, index) => {
        const col = index % 4
        const row = Math.floor(index / 4)
        const active =
          phase === 0 ? index === 5 : phase === 1 ? index === 6 : [2, 5, 8, 11, 14].includes(index)

        return (
          <mesh
            key={index}
            position={[(col - 1.5) * 0.62, (1.5 - row) * 0.62, active ? 0.1 : 0]}
            rotation={[0, 0, phase === 1 && index === 6 ? 0.38 : 0]}
          >
            <boxGeometry args={[0.5, 0.5, active ? 0.18 : 0.08]} />
            <meshStandardMaterial color={active ? accent : foreground} opacity={active ? 1 : 0.32} transparent={!active} />
          </mesh>
        )
      })}
      <mesh position={phase === 0 ? [-0.31, 0.31, 0.36] : phase === 1 ? [0.31, 0.31, 0.42] : [0, -0.62, 0.44]}>
        <sphereGeometry args={[0.18, 22, 22]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.14} />
      </mesh>
    </>
  )
}
