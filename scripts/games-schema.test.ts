// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateGames } from './games-schema'

const games = JSON.parse(readFileSync(new URL('../data/site/games.json', import.meta.url), 'utf8'))

describe('games.json', () => {
  it('is valid', () => {
    expect(validateGames(games)).toEqual([])
  })

  it('has ten games', () => {
    expect(games.games).toHaveLength(10)
  })

  it('points taybols at taybols.com', () => {
    const taybols = games.games.find((g: { tag: string }) => g.tag === 'taybols')
    expect(taybols.href).toBe('https://taybols.com')
  })

  it('has five flagships', () => {
    expect(games.games.filter((g: { tier: string }) => g.tier === 'flagship')).toHaveLength(5)
  })
})

describe('validateGames', () => {
  const base = { tag: 'x', tier: 'listed', label: 'L', href: 'https://x.test', description: 'd', motif: 'x' }

  it('rejects a non-object', () => {
    expect(validateGames(null)).toContain('games.json must be an object with a games array')
  })

  it('rejects a non-object game entry', () => {
    expect(validateGames({ games: [null] })).toContain('every game must be an object')
  })

  it('labels a game with no tag as untagged', () => {
    expect(validateGames({ games: [{}] })).toContain('(untagged): missing tag')
  })

  it('rejects a duplicate tag', () => {
    expect(validateGames({ games: [base, base] })).toContain('duplicate tag: x')
  })

  it('rejects an unknown tier', () => {
    expect(validateGames({ games: [{ ...base, tier: 'wat' }] })).toContain('x: tier must be flagship or listed')
  })

  it('rejects a missing required field', () => {
    const { href: _href, ...noHref } = base
    expect(validateGames({ games: [noHref] })).toContain('x: missing href')
  })

  it('requires a section on a flagship', () => {
    expect(validateGames({ games: [{ ...base, tier: 'flagship', variant: 'signal' }] })).toContain('x: flagship needs a section')
  })

  it('requires a variant on a flagship', () => {
    const section = { kicker: 'k', title: 't', copy: 'c', link_label: 'l' }
    expect(validateGames({ games: [{ ...base, tier: 'flagship', section }] })).toContain('x: flagship needs a variant')
  })

  it('rejects a section on a listed game', () => {
    const section = { kicker: 'k', title: 't', copy: 'c', link_label: 'l' }
    expect(validateGames({ games: [{ ...base, section }] })).toContain('x: listed game must not have a section')
  })

  it('rejects an incomplete section', () => {
    expect(validateGames({ games: [{ ...base, tier: 'flagship', variant: 'signal', section: { kicker: 'k' } }] }))
      .toContain('x: section missing title')
  })

  it('rejects a non-https href', () => {
    expect(validateGames({ games: [{ ...base, href: 'http://x.test' }] })).toContain('x: href must be https')
  })
})
