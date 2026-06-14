import type { LogoConcept } from '../concepts/types'

type LogoMarkProps = {
  concept: LogoConcept
  phase?: number
  accessibleLabel?: string
  decorative?: boolean
}

export function LogoMark({ concept, phase = 0, accessibleLabel = 'logo mark', decorative = false }: LogoMarkProps) {
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
      <LogoGlyph conceptId={concept.id} phase={phase} accent={accent} foreground={foreground} />
    </svg>
  )
}

function LogoGlyph({ conceptId, phase, accent, foreground }: { conceptId: string; phase: number; accent: string; foreground: string }) {
  switch (conceptId) {
    case 'command-console':
      return (
        <>
          <rect x="14" y="20" width="92" height="74" rx="4" fill="none" stroke={foreground} strokeWidth="5" />
          <path d="M28 42h18l-12 12 12 12H28" fill="none" stroke={accent} strokeWidth="6" />
          <rect x="58" y="60" width={phase === 0 ? 22 : phase === 1 ? 38 : 28} height="8" fill={accent} />
          <path d={phase === 2 ? 'M36 82h48M84 82l-12-10M84 82 72 92' : 'M64 82h20'} stroke={foreground} strokeWidth="5" />
        </>
      )
    case 'rule-board':
      return (
        <>
          {Array.from({ length: 9 }).map((_, index) => {
            const col = index % 3
            const row = Math.floor(index / 3)
            const active = phase === 0 ? index === 4 : phase === 1 ? index === 5 : [2, 4, 6].includes(index)
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
          <path d={phase === 2 ? 'M32 84 58 58 84 32' : 'M58 58h26'} stroke={accent} strokeWidth="6" />
        </>
      )
    case 'define-the-game':
    default:
      return (
        <>
          <path d={phase === 0 ? 'M44 38c4-18 36-18 40 0 4 17-22 21-22 40' : 'M42 60 78 38v44Z'} fill={phase === 2 ? accent : 'none'} stroke={phase === 2 ? accent : foreground} strokeWidth="8" />
          <circle cx="60" cy="94" r={phase === 0 ? 6 : 3} fill={accent} />
          {phase > 0 && <path d="M28 28h64v64H28Z" fill="none" stroke={accent} strokeWidth={phase === 2 ? 4 : 2} opacity="0.65" />}
        </>
      )
  }
}
