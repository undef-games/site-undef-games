import type { LogoConcept } from '../concepts/types'

type LogoMarkProps = {
  concept: LogoConcept
  accessibleLabel?: string
  decorative?: boolean
}

export function LogoMark({ concept, accessibleLabel = 'logo mark', decorative = false }: LogoMarkProps) {
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
      <LogoGlyph conceptId={concept.id} accent={accent} foreground={foreground} />
    </svg>
  )
}

function LogoGlyph({ conceptId, accent, foreground }: { conceptId: string; accent: string; foreground: string }) {
  switch (conceptId) {
    case 'warp-gate':
      return (
        <>
          {[12, 24, 36].map((offset) => (
            <rect
              key={offset}
              x={offset}
              y={offset}
              width={120 - offset * 2}
              height={120 - offset * 2}
              rx="4"
              fill="none"
              stroke={offset === 24 ? foreground : accent}
              strokeWidth={offset === 24 ? 5 : 3}
              opacity={offset === 36 ? 0.7 : 1}
            />
          ))}
          <path d="M18 60h22M80 60h22M60 18v22M60 80v22" stroke={accent} strokeWidth="8" />
        </>
      )
    case 'wireframe-map':
      return (
        <>
          <path d="M16 86 34 42 58 72 82 28 104 74" fill="none" stroke={foreground} strokeWidth="4" />
          <path d="M22 98 45 68 70 92 98 50" fill="none" stroke={accent} strokeWidth="5" />
          {[16, 34, 58, 82, 104, 45, 70, 98].map((x, index) => (
            <circle key={`${x}-${index}`} cx={x} cy={[86, 42, 72, 28, 74, 68, 92, 50][index]} r="4" fill={accent} />
          ))}
        </>
      )
    case 'brutalist-glitch':
      return (
        <>
          <rect x="14" y="24" width="76" height="18" fill={foreground} />
          <rect x="30" y="48" width="76" height="20" fill={accent} />
          <rect x="18" y="74" width="84" height="22" fill={foreground} />
          <rect x="72" y="38" width="28" height="8" fill={accent} />
          <rect x="10" y="68" width="30" height="7" fill={accent} />
        </>
      )
    case 'ug-monogram':
      return (
        <>
          <path d="M30 26v48c0 18 12 28 30 28s30-10 30-28V26" fill="none" stroke={foreground} strokeWidth="11" />
          <path d="M74 56h28v38c-8 6-19 9-32 9" fill="none" stroke={accent} strokeWidth="11" />
          <path d="M54 26v54" stroke={accent} strokeWidth="8" />
        </>
      )
    case 'undefined-to-play':
      return (
        <>
          <path d="M42 38c3-15 35-18 42 0 8 21-23 25-23 45" fill="none" stroke={foreground} strokeWidth="9" />
          <path d="M56 46 86 62 56 78Z" fill={accent} />
          <circle cx="60" cy="98" r="6" fill={accent} />
        </>
      )
    case 'modular-nodes':
      return (
        <>
          <path d="M26 72 48 40 74 62 96 30M48 40l2 52 46-20" fill="none" stroke={foreground} strokeWidth="4" />
          {[
            [26, 72],
            [48, 40],
            [50, 92],
            [74, 62],
            [96, 30],
            [96, 72],
          ].map(([x, y], index) => (
            <rect key={`${x}-${y}`} x={x - 7} y={y - 7} width="14" height="14" fill={index % 2 ? accent : foreground} />
          ))}
        </>
      )
    case 'tile-anomaly':
      return (
        <>
          {Array.from({ length: 9 }).map((_, index) => {
            const col = index % 3
            const row = Math.floor(index / 3)
            const anomaly = index === 5
            return (
              <rect
                key={index}
                x={22 + col * 26}
                y={22 + row * 26}
                width={anomaly ? 22 : 18}
                height={anomaly ? 22 : 18}
                fill={anomaly ? accent : foreground}
                transform={anomaly ? `rotate(12 ${33 + col * 26} ${33 + row * 26})` : undefined}
                opacity={anomaly ? 1 : 0.82}
              />
            )
          })}
        </>
      )
    case 'emergence-chaos':
      return (
        <>
          {[
            [28, 30, 3],
            [42, 52, 4],
            [52, 36, 3],
            [61, 60, 10],
            [72, 70, 6],
            [86, 48, 4],
            [94, 88, 3],
            [30, 90, 2],
            [80, 24, 2],
          ].map(([x, y, r], index) => (
            <circle key={index} cx={x} cy={y} r={r} fill={index === 3 ? accent : foreground} opacity={index === 3 ? 1 : 0.75} />
          ))}
          <path d="M44 76c13 15 34 13 47-2" stroke={accent} strokeWidth="4" fill="none" />
        </>
      )
    case 'system-mutations':
      return (
        <>
          <polygon points="30,32 62,22 92,44 82,80 42,94 18,66" fill="none" stroke={foreground} strokeWidth="5" />
          <polygon points="38,28 82,34 96,70 60,100 25,72" fill="none" stroke={accent} strokeWidth="5" />
          <polygon points="47,42 78,46 83,76 55,86 37,64" fill={accent} opacity="0.28" />
        </>
      )
    case 'dice-pixel-dialogue':
      return (
        <>
          <path d="M20 28h78v54H55L36 100V82H20Z" fill="none" stroke={foreground} strokeWidth="7" />
          <rect x="28" y="36" width="12" height="12" fill={accent} />
          <circle cx="60" cy="54" r="6" fill={foreground} />
          <circle cx="80" cy="54" r="6" fill={accent} />
        </>
      )
    case 'party-energy':
      return (
        <>
          <circle cx="60" cy="60" r="10" fill={foreground} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
            <rect
              key={angle}
              x="56"
              y={index % 2 ? '16' : '20'}
              width="8"
              height={index % 2 ? '28' : '20'}
              rx="4"
              fill={index % 2 ? accent : foreground}
              transform={`rotate(${angle} 60 60)`}
            />
          ))}
          <circle cx="30" cy="34" r="5" fill={accent} />
          <circle cx="90" cy="88" r="5" fill={accent} />
        </>
      )
    case 'pixel-to-vector':
      return (
        <>
          <rect x="20" y="28" width="16" height="16" fill={foreground} />
          <rect x="36" y="44" width="16" height="16" fill={foreground} />
          <rect x="52" y="60" width="16" height="16" fill={accent} />
          <path d="M58 78c22-2 34-17 40-44" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" />
          <path d="M82 30h18v18" fill="none" stroke={foreground} strokeWidth="6" />
        </>
      )
    case 'prompt-cursor':
    default:
      return (
        <>
          <rect x="18" y="22" width="84" height="64" rx="2" fill="none" stroke={foreground} strokeWidth="5" />
          <path d="M30 42h24M30 58h36M30 74h18" stroke={foreground} strokeWidth="5" />
          <rect x="70" y="58" width="22" height="22" fill={accent} />
          <path d="M18 94h84" stroke={accent} strokeWidth="6" />
        </>
      )
  }
}
