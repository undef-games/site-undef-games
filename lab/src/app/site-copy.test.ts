import { describe, expect, it } from 'vitest'
import { LAB_HERO_COPY, LAB_SECTIONS } from './site-copy'

describe('site copy', () => {
  it('keeps the hydrated homepage aligned with the production messaging', () => {
    expect(LAB_HERO_COPY.support).toBe(
      'Indie developer building game tools and systems for fun shared experiences online and off.',
    )
    expect(LAB_SECTIONS.signal.title).not.toBe('Responsive by design, not by decoration.')
    expect(LAB_SECTIONS.signal.body).not.toContain('The scanline field stays alive under the cursor and the page')
    expect(LAB_SECTIONS.projects.title).toBe('Projects built to be used, watched, and played with.')
    expect(LAB_SECTIONS.identity.title).toBe('Good systems should make shared play easier to reach.')
  })
})
