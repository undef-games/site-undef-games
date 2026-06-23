// packages/scanlines-system/src/react/panel.test.tsx
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ScanlinesPanel } from './panel'

describe('ScanlinesPanel', () => {
  it('renders with default classes when variant is omitted', () => {
    const { container } = render(<ScanlinesPanel>content</ScanlinesPanel>)
    const el = container.firstElementChild as HTMLElement
    expect(el.classList.contains('scanlines-panel')).toBe(true)
    expect(el.classList.contains('panel--console')).toBe(false)
  })

  it('renders with default classes when variant="default"', () => {
    const { container } = render(<ScanlinesPanel variant="default">content</ScanlinesPanel>)
    const el = container.firstElementChild as HTMLElement
    expect(el.classList.contains('scanlines-panel')).toBe(true)
    expect(el.classList.contains('panel--console')).toBe(false)
  })

  it('adds panel--console class when variant="console"', () => {
    const { container } = render(<ScanlinesPanel variant="console">content</ScanlinesPanel>)
    const el = container.firstElementChild as HTMLElement
    expect(el.classList.contains('scanlines-panel')).toBe(true)
    expect(el.classList.contains('panel--console')).toBe(true)
  })

  it('merges additional className with the base classes', () => {
    const { container } = render(<ScanlinesPanel className="custom-class">content</ScanlinesPanel>)
    const el = container.firstElementChild as HTMLElement
    expect(el.classList.contains('scanlines-panel')).toBe(true)
    expect(el.classList.contains('custom-class')).toBe(true)
  })

  it('renders title when provided', () => {
    const { getByRole } = render(<ScanlinesPanel title="My Panel">content</ScanlinesPanel>)
    expect(getByRole('heading', { level: 2 })).toHaveTextContent('My Panel')
  })
})
