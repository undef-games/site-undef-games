import { describe, expect, it } from 'vitest'
import { CONSOLE_PRESET, MARKETING_PRESET } from './presets'

describe('surface presets', () => {
  it('console preset turns atmosphere off and uses the console header', () => {
    expect(CONSOLE_PRESET).toMatchObject({ id: 'console', atmosphere: false, header: 'console' })
  })
  it('marketing preset keeps atmosphere + brand header', () => {
    expect(MARKETING_PRESET).toMatchObject({ id: 'marketing', atmosphere: true, header: 'brand' })
  })
})
