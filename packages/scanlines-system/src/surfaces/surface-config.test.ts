import { describe, expect, it } from 'vitest'
import { ADMIN_SURFACE_NAV_ITEMS } from './surface-config'

describe('admin surface', () => {
  it('exposes admin nav items', () => {
    expect(ADMIN_SURFACE_NAV_ITEMS.map((i) => i.label)).toContain('Principals')
  })
})
