type LogoMarkProps = {
  accent: string
  accessibleLabel?: string
  decorative?: boolean
}

export function LogoMark({ accent, accessibleLabel = 'logo mark', decorative = false }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : accessibleLabel}
      aria-hidden={decorative ? true : undefined}
    >
      <circle cx="60" cy="60" r="46" stroke={accent} strokeWidth="6" fill="none" />
      <rect x="40" y="40" width="40" height="40" fill={accent} opacity="0.22" transform="rotate(45 60 60)" />
    </svg>
  )
}
