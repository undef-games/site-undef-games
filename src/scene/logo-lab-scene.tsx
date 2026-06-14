import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { LogoConcept } from '../concepts/types'
import { boardRoute, getConceptPhase, getConceptProgress, type LogoPlayState } from '../logo/logo-play-state'
import { getLogoSystem } from '../logo/logo-system'
import { CameraRig } from './camera-rig'
import { SceneBackground } from './scene-background'
import { SceneLights } from './scene-lights'

export function LogoLabScene({
  concept,
  playState,
  onAdvance,
}: {
  concept: LogoConcept
  playState: LogoPlayState
  onAdvance: () => void
}) {
  const system = getLogoSystem(concept)
  const phase = getConceptPhase(concept.id, playState)
  const progress = getConceptProgress(concept.id, playState)

  return (
    <div className="scene-canvas" aria-label="interactive logo scene" data-phase={system.phases[phase]} data-progress={progress} onClick={onAdvance}>
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <color attach="background" args={[concept.colorTokens.background]} />
        <SceneLights />
        <CameraRig />
        <SceneBackground />
        <PrototypeScene
          scene={system.scene}
          phase={phase}
          progress={progress}
          playState={playState}
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
  progress,
  playState,
  accent,
  foreground,
}: {
  scene: ReturnType<typeof getLogoSystem>['scene']
  phase: number
  progress: number
  playState: LogoPlayState
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
        <ConsoleScene phase={phase} progress={progress} errors={playState.consoleHistory.filter((entry) => entry.status === 'error').length} accent={accent} foreground={foreground} />
      ) : scene === 'board' ? (
        <BoardScene boardPath={playState.boardPath} accent={accent} foreground={foreground} />
      ) : (
        <DefineScene phase={phase} progress={progress} accent={accent} foreground={foreground} />
      )}
    </group>
  )
}

function DefineScene({ phase, progress, accent, foreground }: { phase: number; progress: number; accent: string; foreground: string }) {
  const pieces =
    progress === 0
      ? [
          [-1.1, 0.75, 0.18],
          [-0.3, -0.2, 0.28],
          [0.8, 0.55, 0.16],
          [1.15, -0.75, 0.12],
          [-0.9, -0.9, 0.14],
        ]
      : progress < 3
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
      {[-0.95, 0, 0.95].map((x, index) => (
        <mesh key={index} position={[x, -1.62, 0.22]}>
          <sphereGeometry args={[index < progress ? 0.16 : 0.08, 18, 18]} />
          <meshStandardMaterial color={index < progress ? accent : foreground} opacity={index < progress ? 1 : 0.36} transparent={index >= progress} />
        </mesh>
      ))}
    </>
  )
}

function ConsoleScene({
  phase,
  progress,
  errors,
  accent,
  foreground,
}: {
  phase: number
  progress: number
  errors: number
  accent: string
  foreground: string
}) {
  const lineWidths = [1.8 + progress * 0.25, 1.2 + progress * 0.32, 1.4 + progress * 0.42]

  return (
    <>
      <mesh position={[0, 0, -0.18]}>
        <boxGeometry args={[3.6, 2.35, 0.16]} />
        <meshStandardMaterial color={foreground} opacity={0.09} transparent />
      </mesh>
      {lineWidths.map((width, index) => (
        <mesh key={index} position={[-0.3 + width / 4, 0.72 - index * 0.58, 0]}>
          <boxGeometry args={[width, 0.09, 0.09]} />
          <meshStandardMaterial color={index < progress ? accent : foreground} emissive={index < progress ? accent : '#000000'} emissiveIntensity={0.14} />
        </mesh>
      ))}
      <mesh position={[-1.35, 0.72 - Math.min(progress, 2) * 0.58, 0.12]}>
        <boxGeometry args={[0.26, 0.26, 0.18]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
      </mesh>
      {errors > 0 && (
        <mesh position={[1.45, 0.9, 0.16]} rotation={[0, 0, 0.68]}>
          <boxGeometry args={[0.18 + errors * 0.12, 0.72, 0.12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.24} />
        </mesh>
      )}
      {phase === 2 && (
        <mesh position={[1.15, -0.55, 0.2]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.42, 0.68, 3]} />
          <meshStandardMaterial color={accent} />
        </mesh>
      )}
    </>
  )
}

function BoardScene({ boardPath, accent, foreground }: { boardPath: number[]; accent: string; foreground: string }) {
  return (
    <>
      {Array.from({ length: 16 }).map((_, index) => {
        const col = index % 4
        const row = Math.floor(index / 4)
        const tile = index + 1
        const active = boardPath.includes(tile)
        const illegal = tile === 6 && boardPath.includes(6)

        return (
          <mesh
            key={index}
            position={[(col - 1.5) * 0.62, (1.5 - row) * 0.62, active ? 0.1 : 0]}
            rotation={[0, 0, illegal ? 0.38 : 0]}
          >
            <boxGeometry args={[0.5, 0.5, active ? 0.18 : 0.08]} />
            <meshStandardMaterial color={active ? accent : foreground} opacity={active ? 1 : 0.32} transparent={!active} />
          </mesh>
        )
      })}
      {boardPath.slice(1).map((tile, index) => {
        const previous = boardRoute[index]
        const start = boardPoint(previous)
        const end = boardPoint(tile)
        const mid: [number, number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, 0.32]
        const horizontal = start[1] === end[1]
        return (
          <mesh key={`${previous}-${tile}`} position={mid} rotation={[0, 0, horizontal ? 0 : Math.PI / 2]}>
            <boxGeometry args={[0.62, 0.06, 0.08]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.14} />
          </mesh>
        )
      })}
      <mesh position={[...boardPoint(boardPath[boardPath.length - 1]), 0.44]}>
        <sphereGeometry args={[0.18, 22, 22]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.14} />
      </mesh>
    </>
  )
}

function boardPoint(tile: number): [number, number] {
  const index = tile - 1
  const col = index % 4
  const row = Math.floor(index / 4)
  return [(col - 1.5) * 0.62, (1.5 - row) * 0.62]
}
