export const MAZE_GATE_OUTER_PATH = 'M30 24v48c0 18 12 30 30 30s30-12 30-30V24'
export const MAZE_GATE_INNER_PATH = 'M46 24v46c0 9 5 14 14 14s14-5 14-14V24'
export const MAZE_GATE_BASELINE_PATH = 'M30 44h18M72 44h18M44 98h32'

export interface MazeGateMarkupOptions {
  className?: string
  decorative?: boolean
  innerOpacity?: number
  outerOpacity?: number
  baselineOpacity?: number
  ariaLabel?: string
}

function formatOpacity(value: number | undefined, fallback: number) {
  const next = Number.isFinite(value) ? Number(value) : fallback
  return String(Math.max(0, Math.min(1, next)))
}

function escapeAttribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function renderMazeGateSvgMarkup({
  className = 'station-glyph',
  decorative = false,
  innerOpacity,
  outerOpacity,
  baselineOpacity,
  ariaLabel = 'undef games maze gate u cut mark',
}: MazeGateMarkupOptions = {}) {
  const role = decorative ? '' : ' role="img"'
  const ariaHidden = decorative ? ' aria-hidden="true"' : ''
  const label = decorative ? '' : ` aria-label="${escapeAttribute(ariaLabel)}"`

  return `<svg class="${escapeAttribute(className)}" viewBox="0 0 120 120"${role}${ariaHidden}${label} focusable="false">
  <path d="${MAZE_GATE_OUTER_PATH}" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter" fill="none" opacity="${formatOpacity(outerOpacity, 1)}" />
  <path d="${MAZE_GATE_INNER_PATH}" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter" fill="none" opacity="${formatOpacity(innerOpacity, 0.4)}" />
  <path d="${MAZE_GATE_BASELINE_PATH}" stroke="currentColor" stroke-width="7" stroke-linecap="square" fill="none" opacity="${formatOpacity(baselineOpacity, 0.34)}" />
</svg>`
}
