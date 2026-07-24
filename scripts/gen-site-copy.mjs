#!/usr/bin/env node
// Regenerates lab/src/app/site-copy.ts from data/site/games.json + data/site/home.json.
// Pure Node, no TypeScript imports — safe to run before the lab toolchain exists.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const GAMES_PATH = join(ROOT, 'data/site/games.json')
const HOME_PATH = join(ROOT, 'data/site/home.json')
const OUTPUT_PATH = join(ROOT, 'lab/src/app/site-copy.ts')

const BANNER = '// GENERATED FILE — do not edit. Regenerate: make gen-site-copy\n'
const INDENT = '  '

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function quoteString(value) {
  const escaped = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `'${escaped}'`
}

// Minimal deterministic serializer: objects/arrays render as one entry per
// line with a fixed key order (callers pass entries as [key, value] pairs so
// insertion order is explicit rather than relying on object key order).
function formatValue(value, depth) {
  if (typeof value === 'string') return quoteString(value)
  if (Array.isArray(value)) return formatArray(value, depth)
  if (value && typeof value === 'object' && value.__entries) return formatObject(value.__entries, depth)
  throw new Error(`unsupported value: ${JSON.stringify(value)}`)
}

function formatObject(entries, depth) {
  const inner = INDENT.repeat(depth + 1)
  const outer = INDENT.repeat(depth)
  const lines = entries.map(([key, value]) => `${inner}${key}: ${formatValue(value, depth + 1)},`)
  return `{\n${lines.join('\n')}\n${outer}}`
}

function formatArray(items, depth) {
  const inner = INDENT.repeat(depth + 1)
  const outer = INDENT.repeat(depth)
  const lines = items.map((item) => `${inner}${formatValue(item, depth + 1)},`)
  return `[\n${lines.join('\n')}\n${outer}]`
}

function obj(entries) {
  return { __entries: entries }
}

function buildHeroCopy(home) {
  const { hero } = home
  return obj([
    ['support', hero.copy],
    ['primaryAction', obj([
      ['href', hero.primary_href],
      ['label', hero.primary_label],
    ])],
    ['secondaryAction', obj([
      ['href', hero.secondary_href],
      ['label', hero.secondary_label],
    ])],
    ['statusLabel', hero.status_label],
  ])
}

function buildProjects(games) {
  return games.map((game) =>
    obj([
      ['className', `product-link--${game.tag}`],
      ['description', game.description],
      ['href', game.href],
      ['label', game.label],
      ['tag', game.tag],
    ]),
  )
}

function buildSections(games, home) {
  const flagships = games.filter((game) => game.tier === 'flagship')

  const entries = [
    ['signal', obj([
      ['kicker', home.signal.kicker],
      ['title', home.signal.title],
      ['body', home.signal.copy],
    ])],
    ['projects', obj([
      ['kicker', home.products_intro.kicker],
      ['title', home.products_intro.title],
    ])],
  ]

  for (const game of flagships) {
    entries.push([
      game.tag,
      obj([
        ['kicker', game.section.kicker],
        ['title', game.section.title],
        ['body', game.section.copy],
        ['href', game.href],
        ['linkLabel', game.section.link_label],
      ]),
    ])
  }

  entries.push(
    ['identity', obj([
      ['kicker', home.identity.kicker],
      ['title', home.identity.title],
      ['body', home.identity.copy],
    ])],
    ['closing', obj([
      ['kicker', home.closing.kicker],
      ['title', home.closing.title],
      ['action', home.closing.action],
    ])],
  )

  return obj(entries)
}

function generate() {
  const games = readJson(GAMES_PATH).games
  const home = readJson(HOME_PATH)

  const heroCopy = formatValue(buildHeroCopy(home), 0)
  const projects = formatArray(buildProjects(games), 0)
  const sections = formatValue(buildSections(games, home), 0)

  return (
    BANNER +
    '\n' +
    `export const LAB_HERO_COPY = ${heroCopy} as const\n` +
    '\n' +
    `export const LAB_PROJECTS = ${projects} as const\n` +
    '\n' +
    `export const LAB_SECTIONS = ${sections} as const\n`
  )
}

const output = generate()
writeFileSync(OUTPUT_PATH, output)
