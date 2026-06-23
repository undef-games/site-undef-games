import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ConsoleHeader } from './ConsoleHeader'

afterEach(() => cleanup())

describe('ConsoleHeader', () => {
  it('renders one banner with brand, nav and a utilities slot', () => {
    render(<ConsoleHeader brandLabel="undef admin" nav={[{ href: '#roles', label: 'Roles' }]}
      activeNavHref="#roles" utilities={<button>menu</button>} />)
    const banner = screen.getByRole('banner')
    expect(banner).toHaveClass('console-header')
    expect(screen.getByRole('link', { name: 'Roles' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'menu' })).toBeInTheDocument()
  })

  it('omits the <nav> element when nav is empty or omitted (default)', () => {
    render(<ConsoleHeader brandLabel="undef admin" />)
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('does not set aria-current on a nav item that is not active', () => {
    render(
      <ConsoleHeader
        brandLabel="undef admin"
        nav={[{ href: '#roles', label: 'Roles' }, { href: '#audit', label: 'Audit' }]}
        activeNavHref="#roles"
      />
    )
    const auditLink = screen.getByRole('link', { name: 'Audit' })
    expect(auditLink).not.toHaveAttribute('aria-current')
    const rolesLink = screen.getByRole('link', { name: 'Roles' })
    expect(rolesLink).toHaveAttribute('aria-current', 'page')
  })

  it('uses default homeHref "/" when not provided', () => {
    render(<ConsoleHeader brandLabel="undef admin" />)
    // The brand link should point to "/"
    const brandLink = screen.getByRole('link', { name: 'undef admin' })
    expect(brandLink).toHaveAttribute('href', '/')
  })

  it('uses provided homeHref', () => {
    render(<ConsoleHeader brandLabel="undef admin" homeHref="/console" />)
    const brandLink = screen.getByRole('link', { name: 'undef admin' })
    expect(brandLink).toHaveAttribute('href', '/console')
  })

  it('renders the actions slot when provided', () => {
    render(
      <ConsoleHeader
        brandLabel="undef admin"
        actions={<button>save</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
  })

  it('renders both utilities and actions slots', () => {
    render(
      <ConsoleHeader
        brandLabel="undef admin"
        nav={[{ href: '#principals', label: 'Principals' }]}
        utilities={<button>menu</button>}
        actions={<button>save</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
