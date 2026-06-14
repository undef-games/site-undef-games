import type { LogoConcept } from '../concepts/types'

type LogoMarkProps = {
  concept: LogoConcept
  phase?: number
  progress?: number
  accessibleLabel?: string
  decorative?: boolean
}

export function LogoMark({ concept, phase = 0, progress = phase, accessibleLabel = 'logo mark', decorative = false }: LogoMarkProps) {
  const accent = concept.colorTokens.accent
  const foreground = concept.colorTokens.foreground

  return (
    <svg
      className="logo-mark"
      data-concept={concept.id}
      viewBox="0 0 120 120"
      width="120"
      height="120"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : accessibleLabel}
      aria-hidden={decorative ? true : undefined}
    >
      <LogoGlyph conceptId={concept.id} phase={phase} progress={progress} accent={accent} foreground={foreground} />
    </svg>
  )
}

function LogoGlyph({
  conceptId,
  phase,
  progress,
  accent,
  foreground,
}: {
  conceptId: string
  phase: number
  progress: number
  accent: string
  foreground: string
}) {
  switch (conceptId) {
    case 'command-console':
      return (
        <>
          <rect x="14" y="20" width="92" height="74" rx="4" fill="none" stroke={foreground} strokeWidth="5" />
          <path d="M28 42h18l-12 12 12 12H28" fill="none" stroke={accent} strokeWidth="6" />
          {Array.from({ length: 3 }).map((_, index) => (
            <rect
              key={index}
              x="58"
              y={46 + index * 14}
              width={index < progress ? 34 + index * 8 : 16}
              height="7"
              fill={index < progress ? accent : foreground}
              opacity={index < progress ? 1 : 0.35}
            />
          ))}
          <path d={phase === 2 ? 'M36 84h48M84 84l-12-10M84 84 72 94' : 'M64 88h20'} stroke={foreground} strokeWidth="5" />
        </>
      )
    case 'rule-board':
      return (
        <>
          {Array.from({ length: 9 }).map((_, index) => {
            const col = index % 3
            const row = Math.floor(index / 3)
            const active = progress === 0 ? index === 4 : progress === 1 ? [4, 5].includes(index) : [2, 4, 5, 8].includes(index)
            return (
              <rect
                key={index}
                x={22 + col * 26}
                y={22 + row * 26}
                width="20"
                height="20"
                fill={active ? accent : foreground}
                opacity={active ? 1 : 0.42}
              />
            )
          })}
          <path
            d={progress >= 3 ? 'M58 58 84 58 84 84' : progress >= 2 ? 'M58 58 84 58' : 'M58 58h26'}
            stroke={accent}
            strokeWidth="6"
            fill="none"
          />
        </>
      )
    case 'define-the-game':
    default:
      return (
        <>
          <path
            d={phase === 2 ? 'M42 60 78 38v44Z' : 'M44 38c4-18 36-18 40 0 4 17-22 21-22 40'}
            fill={phase === 2 ? accent : 'none'}
            stroke={phase === 2 ? accent : foreground}
            strokeWidth="8"
          />
          {[0, 1, 2].map((index) => (
            <circle
              key={index}
              cx={34 + index * 26}
              cy="94"
              r={index < progress ? 6 : 3}
              fill={index < progress ? accent : foreground}
              opacity={index < progress ? 1 : 0.42}
            />
          ))}
          {phase > 0 && <path d="M28 28h64v64H28Z" fill="none" stroke={accent} strokeWidth={phase === 2 ? 4 : 2} opacity="0.65" />}
        </>
      )
  }
}
