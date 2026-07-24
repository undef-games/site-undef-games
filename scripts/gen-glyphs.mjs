import { appendFileSync } from 'node:fs'

// Same ten marks as layouts/partials/motif.html, flattened to single-colour
// silhouettes so they can be used as CSS masks and painted with currentColor.
const S = (body) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>${body}</svg>`

const dot = (cx, cy, r) => `<circle cx='${cx}' cy='${cy}' r='${r}' fill='white' stroke='none'/>`

const GLYPHS = {
  // diamond core with warp streaks pulling past it
  warp: S(`<path d='M15 6 L23 15 L15 24 L7 15 Z'/><path d='M2 11H8M2 19H8M28 11H22M28 19H22'/>`),
  // pip cube
  dice: S(`<rect x='6.5' y='6.5' width='17' height='17' rx='3.5'/>${dot(12, 12, 2)}${dot(15, 15, 2)}${dot(18, 18, 2)}`),
  // table rows, a roll landing
  taybols: S(`<rect x='5' y='6' width='20' height='18' rx='2.5'/><path d='M10 12H19M10 16H21M10 20H15'/>`),
  // branching tree with commit nodes
  grove: S(`<path d='M15 26V17M15 17L9.5 11.5M15 17L20.5 11.5'/><path d='M9.5 11.5L6.5 8M20.5 11.5L23.5 8'/>${dot(23.5, 7, 2.4)}${dot(6.5, 7, 2.2)}`),
  // three lines in 5-7-5 proportion
  haiku: S(`<path d='M7 10H16M7 15H23M7 20H16'/>`),
  // sun clearing the horizon
  becoming: S(`<path d='M4 24H26'/><path d='M8.5 24A6.5 6.5 0 0 1 21.5 24'/>${dot(15, 16, 2.8)}`),
  // compass ring
  proverb: S(`<circle cx='15' cy='15' r='9'/><path d='M15 3.5V6.5M26.5 15H23.5M15 26.5V23.5M3.5 15H6.5'/>${dot(15, 15, 2.4)}`),
  // a spark catching
  stoke: S(`<path d='M15 3V7.5M15 22.5V27M3 15H7.5M22.5 15H27M6.6 6.6L9.8 9.8M23.4 6.6L20.2 9.8M6.6 23.4L9.8 20.2M23.4 23.4L20.2 20.2'/>${dot(15, 15, 3.4)}`),
  // one sumi-e brushstroke
  currents: S(`<path d='M3 20Q9 10 15 16T27 12'/>${dot(27, 12, 2.2)}`),
  // two touches on one shared crystal
  amor: S(`<path d='M15 6.5L21.5 15L15 23.5L8.5 15Z'/>${dot(8.5, 15, 2.6)}${dot(21.5, 15, 2.6)}`),
}

const encode = (svg) =>
  svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23').replace(/\s+/g, ' ').trim()

const lines = Object.entries(GLYPHS).map(
  ([name, svg]) => `  --ug-glyph-${name}: url("data:image/svg+xml,${encode(svg)}");`,
)

appendFileSync(
  process.argv[2],
  `\n/* Glyph artwork. Regenerate with scripts/gen-glyphs.mjs if the marks change. */\n:root {\n${lines.join('\n')}\n}\n`,
)

console.log(`appended ${lines.length} glyph definitions`)
