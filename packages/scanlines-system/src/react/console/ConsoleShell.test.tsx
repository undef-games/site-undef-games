import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('../telemetry', () => ({
  TelemetryErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

import { ConsoleShell } from './ConsoleShell'

afterEach(() => cleanup())

describe('ConsoleShell', () => {
  it('renders root with data-surface="console", one banner, and a main containing children', () => {
    const { container } = render(
      <ConsoleShell brandLabel="undef admin">
        <div>body</div>
      </ConsoleShell>
    )
    const root = container.firstElementChild
    expect(root).toHaveAttribute('data-surface', 'console')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(main).toHaveTextContent('body')
  })
})
