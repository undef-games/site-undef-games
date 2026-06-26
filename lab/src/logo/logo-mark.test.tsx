import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { concepts } from '../concepts/registry'
import { LogoMark } from './logo-mark'

afterEach(() => {
  cleanup()
})

const defineConcept = concepts.find((c) => c.id === 'define-the-game')!
const consoleConcept = concepts.find((c) => c.id === 'command-console')!
const boardConcept = concepts.find((c) => c.id === 'rule-board')!

describe('LogoMark — ARIA behaviour', () => {
  it('renders as img role with default accessible label when not decorative', () => {
    const { container } = render(<LogoMark concept={defineConcept} />)
    const svg = container.querySelector('svg')!

    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBe('logo mark')
    expect(svg.getAttribute('aria-hidden')).toBeNull()
  })

  it('renders with a custom accessible label when provided', () => {
    const { container } = render(<LogoMark concept={defineConcept} accessibleLabel="Define the Game logo" />)
    const svg = container.querySelector('svg')!

    expect(svg.getAttribute('aria-label')).toBe('Define the Game logo')
    expect(svg.getAttribute('role')).toBe('img')
  })

  it('hides from the accessibility tree and removes role when decorative', () => {
    const { container } = render(<LogoMark concept={defineConcept} decorative />)
    const svg = container.querySelector('svg')!

    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('role')).toBeNull()
    expect(svg.getAttribute('aria-label')).toBeNull()
  })
})

describe('LogoMark — data attributes', () => {
  it('stamps the concept id onto the svg', () => {
    const { container } = render(<LogoMark concept={consoleConcept} />)
    const svg = container.querySelector('svg')!

    expect(svg.getAttribute('data-concept')).toBe('command-console')
  })

  it('stamps a different concept id for each concept', () => {
    const { container: c1 } = render(<LogoMark concept={defineConcept} />)
    const { container: c2 } = render(<LogoMark concept={boardConcept} />)

    expect(c1.querySelector('svg')!.getAttribute('data-concept')).toBe('define-the-game')
    expect(c2.querySelector('svg')!.getAttribute('data-concept')).toBe('rule-board')
  })
})

describe('LogoMark — define-the-game glyph', () => {
  it('renders a path at phase 0 (not filled, squiggly shape)', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={0} />)
    const paths = container.querySelectorAll('path')
    // phase 0 main path uses the squiggly "d" value (no M42 triangle)
    const mainPath = Array.from(paths).find((p) => p.getAttribute('d')?.includes('44 38'))
    expect(mainPath).toBeTruthy()
    expect(mainPath!.getAttribute('fill')).toBe('none')
  })

  it('renders the filled triangle at phase 2', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={2} />)
    const paths = container.querySelectorAll('path')
    const trianglePath = Array.from(paths).find((p) => p.getAttribute('d')?.includes('M42 60'))
    expect(trianglePath).toBeTruthy()
    expect(trianglePath!.getAttribute('fill')).toBe(defineConcept.colorTokens.accent)
  })

  it('does not render the accent border at phase 0', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={0} />)
    const paths = container.querySelectorAll('path')
    const accentBorder = Array.from(paths).find((p) => p.getAttribute('d')?.includes('M28 28'))
    expect(accentBorder).toBeFalsy()
  })

  it('renders the accent border at phase 1', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={1} />)
    const paths = container.querySelectorAll('path')
    const accentBorder = Array.from(paths).find((p) => p.getAttribute('d')?.includes('M28 28'))
    expect(accentBorder).toBeTruthy()
    expect(accentBorder!.getAttribute('stroke-width')).toBe('2')
  })

  it('renders a thicker accent border at phase 2', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={2} />)
    const paths = container.querySelectorAll('path')
    const accentBorder = Array.from(paths).find((p) => p.getAttribute('d')?.includes('M28 28'))
    expect(accentBorder).toBeTruthy()
    expect(accentBorder!.getAttribute('stroke-width')).toBe('4')
  })

  it('renders dots sized by progress — none filled at progress 0', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={0} progress={0} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(3)
    // at progress 0 all dots are unfilled (r=3, fill=foreground)
    Array.from(circles).forEach((c) => {
      expect(c.getAttribute('r')).toBe('3')
      expect(c.getAttribute('fill')).toBe(defineConcept.colorTokens.foreground)
    })
  })

  it('fills one dot at progress 1', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={0} progress={1} />)
    const circles = container.querySelectorAll('circle')
    const filled = Array.from(circles).filter((c) => c.getAttribute('r') === '6')
    expect(filled).toHaveLength(1)
    expect(filled[0].getAttribute('fill')).toBe(defineConcept.colorTokens.accent)
  })

  it('fills two dots at progress 2', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={0} progress={2} />)
    const circles = container.querySelectorAll('circle')
    const filled = Array.from(circles).filter((c) => c.getAttribute('r') === '6')
    expect(filled).toHaveLength(2)
  })

  it('fills three dots at progress 3', () => {
    const { container } = render(<LogoMark concept={defineConcept} phase={0} progress={3} />)
    const circles = container.querySelectorAll('circle')
    const filled = Array.from(circles).filter((c) => c.getAttribute('r') === '6')
    expect(filled).toHaveLength(3)
  })

  it('defaults progress to phase when progress is not provided', () => {
    const { container: c1 } = render(<LogoMark concept={defineConcept} phase={1} />)
    const { container: c2 } = render(<LogoMark concept={defineConcept} phase={1} progress={1} />)

    const filled1 = Array.from(c1.querySelectorAll('circle')).filter((c) => c.getAttribute('r') === '6').length
    const filled2 = Array.from(c2.querySelectorAll('circle')).filter((c) => c.getAttribute('r') === '6').length
    expect(filled1).toBe(filled2)
  })
})

describe('LogoMark — command-console glyph', () => {
  it('renders the console border rect', () => {
    const { container } = render(<LogoMark concept={consoleConcept} phase={0} progress={0} />)
    const rects = container.querySelectorAll('rect')
    const borderRect = Array.from(rects).find((r) => r.getAttribute('x') === '14')
    expect(borderRect).toBeTruthy()
    expect(borderRect!.getAttribute('fill')).toBe('none')
    expect(borderRect!.getAttribute('stroke')).toBe(consoleConcept.colorTokens.foreground)
  })

  it('renders narrow lines at progress 0 (none active)', () => {
    const { container } = render(<LogoMark concept={consoleConcept} phase={0} progress={0} />)
    const rects = container.querySelectorAll('rect')
    // The 3 line rects all have width 16 at progress 0
    const lineRects = Array.from(rects).filter((r) => r.getAttribute('y') !== null && ['46', '60', '74'].includes(r.getAttribute('y')!))
    lineRects.forEach((r) => {
      expect(r.getAttribute('width')).toBe('16')
      expect(r.getAttribute('fill')).toBe(consoleConcept.colorTokens.foreground)
    })
  })

  it('widens the first line at progress 1', () => {
    const { container } = render(<LogoMark concept={consoleConcept} phase={0} progress={1} />)
    const rects = container.querySelectorAll('rect')
    const firstLineRect = Array.from(rects).find((r) => r.getAttribute('y') === '46')!
    expect(firstLineRect.getAttribute('width')).toBe('34')
    expect(firstLineRect.getAttribute('fill')).toBe(consoleConcept.colorTokens.accent)
  })

  it('widens first two lines at progress 2', () => {
    const { container } = render(<LogoMark concept={consoleConcept} phase={0} progress={2} />)
    const rects = container.querySelectorAll('rect')
    const secondLineRect = Array.from(rects).find((r) => r.getAttribute('y') === '60')!
    expect(secondLineRect.getAttribute('width')).toBe('42')
    expect(secondLineRect.getAttribute('fill')).toBe(consoleConcept.colorTokens.accent)
  })

  it('renders the short bottom path at phase 0 and 1', () => {
    const { container, rerender } = render(<LogoMark concept={consoleConcept} phase={0} progress={0} />)
    const paths = container.querySelectorAll('path')
    const bottomPath = Array.from(paths).find((p) => p.getAttribute('d')?.includes('M64 88'))
    expect(bottomPath).toBeTruthy()

    rerender(<LogoMark concept={consoleConcept} phase={1} progress={0} />)
    const paths1 = container.querySelectorAll('path')
    const bottomPath1 = Array.from(paths1).find((p) => p.getAttribute('d')?.includes('M64 88'))
    expect(bottomPath1).toBeTruthy()
    expect(bottomPath1!.getAttribute('d')).toBe('M64 88h20')
  })

  it('renders the arrow path at phase 2', () => {
    const { container } = render(<LogoMark concept={consoleConcept} phase={2} progress={0} />)
    const paths = container.querySelectorAll('path')
    const arrowPath = Array.from(paths).find((p) => p.getAttribute('d')?.includes('M36 84'))
    expect(arrowPath).toBeTruthy()
  })
})

describe('LogoMark — rule-board glyph', () => {
  it('renders 9 tile rects with active and inactive opacities', () => {
    const { container } = render(<LogoMark concept={boardConcept} phase={0} progress={0} />)
    // The border rect from rule-board is absent; but we need to count only tile rects
    // rule-board has no border rect, just 9 tile rects
    const rects = Array.from(container.querySelectorAll('rect'))
    expect(rects).toHaveLength(9)
    // center tile (index 4) is active at progress 0
    const active = rects.filter((r) => r.getAttribute('opacity') === '1')
    expect(active).toHaveLength(1)
    expect(active[0].getAttribute('fill')).toBe(boardConcept.colorTokens.accent)
    // all other tiles are inactive with dimmed opacity
    const inactive = rects.filter((r) => r.getAttribute('opacity') !== '1')
    expect(inactive).toHaveLength(8)
    inactive.forEach((r) => {
      expect(r.getAttribute('opacity')).toBe('0.42')
    })
  })

  it('highlights only the center tile at progress 0', () => {
    const { container } = render(<LogoMark concept={boardConcept} phase={0} progress={0} />)
    const rects = Array.from(container.querySelectorAll('rect'))
    const active = rects.filter((r) => r.getAttribute('opacity') === '1')
    // index 4 is the center tile
    expect(active).toHaveLength(1)
    expect(active[0].getAttribute('fill')).toBe(boardConcept.colorTokens.accent)
  })

  it('highlights two tiles at progress 1', () => {
    const { container } = render(<LogoMark concept={boardConcept} phase={0} progress={1} />)
    const rects = Array.from(container.querySelectorAll('rect'))
    const active = rects.filter((r) => r.getAttribute('opacity') === '1')
    expect(active).toHaveLength(2)
  })

  it('highlights four tiles at progress 2', () => {
    const { container } = render(<LogoMark concept={boardConcept} phase={0} progress={2} />)
    const rects = Array.from(container.querySelectorAll('rect'))
    const active = rects.filter((r) => r.getAttribute('opacity') === '1')
    expect(active).toHaveLength(4)
  })

  it('renders path with d=M58 58h26 at progress 0', () => {
    const { container } = render(<LogoMark concept={boardConcept} phase={0} progress={0} />)
    const paths = container.querySelectorAll('path')
    const routePath = Array.from(paths).find((p) => p.getAttribute('d')?.startsWith('M58 58'))!
    expect(routePath.getAttribute('d')).toBe('M58 58h26')
  })

  it('renders horizontal route at progress 2', () => {
    const { container } = render(<LogoMark concept={boardConcept} phase={0} progress={2} />)
    const paths = container.querySelectorAll('path')
    const routePath = Array.from(paths).find((p) => p.getAttribute('d')?.startsWith('M58 58'))!
    expect(routePath.getAttribute('d')).toBe('M58 58 84 58')
  })

  it('renders L-shaped route at progress 3', () => {
    const { container } = render(<LogoMark concept={boardConcept} phase={0} progress={3} />)
    const paths = container.querySelectorAll('path')
    const routePath = Array.from(paths).find((p) => p.getAttribute('d')?.startsWith('M58 58'))!
    expect(routePath.getAttribute('d')).toBe('M58 58 84 58 84 84')
  })
})
