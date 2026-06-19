import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScanlinesHeader } from './header'

describe('ScanlinesHeader', () => {
  it('renders site navigation on the site surface', () => {
    render(
      <ScanlinesHeader
        surface="site"
        brandLabel="undef games"
        navItems={[
          { href: '/games/', label: 'Games' },
          { href: '/logs/', label: 'Logs' },
          { href: '/about/', label: 'About' },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Games' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Logs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('renders a back-to-site utility on the auth surface', () => {
    render(
      <ScanlinesHeader
        surface="auth"
        brandLabel="undef games"
        utilityAction={{ href: 'https://undef.games/', label: 'Back to site' }}
      />,
    )

    expect(screen.getByRole('link', { name: 'Back to site' })).toBeInTheDocument()
  })
})
