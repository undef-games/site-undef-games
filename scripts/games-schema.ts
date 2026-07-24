const REQUIRED = ['tag', 'tier', 'label', 'href', 'description', 'motif'] as const
const SECTION_REQUIRED = ['kicker', 'title', 'copy', 'link_label'] as const
const VARIANTS = ['signal', 'system', 'identity']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function validateGames(data: unknown): string[] {
  if (!isRecord(data) || !Array.isArray(data.games)) {
    return ['games.json must be an object with a games array']
  }

  const problems: string[] = []
  const seen = new Set<string>()

  for (const game of data.games) {
    if (!isRecord(game)) {
      problems.push('every game must be an object')
      continue
    }

    const tag = typeof game.tag === 'string' ? game.tag : '(untagged)'
    if (seen.has(tag)) problems.push(`duplicate tag: ${tag}`)
    seen.add(tag)

    for (const field of REQUIRED) {
      if (typeof game[field] !== 'string' || game[field] === '') problems.push(`${tag}: missing ${field}`)
    }

    if (typeof game.href === 'string' && !game.href.startsWith('https://')) {
      problems.push(`${tag}: href must be https`)
    }

    if (game.tier !== 'flagship' && game.tier !== 'listed') {
      problems.push(`${tag}: tier must be flagship or listed`)
      continue
    }

    if (game.tier === 'flagship') {
      if (!VARIANTS.includes(game.variant as string)) problems.push(`${tag}: flagship needs a variant`)
      if (!isRecord(game.section)) {
        problems.push(`${tag}: flagship needs a section`)
      } else {
        for (const field of SECTION_REQUIRED) {
          if (typeof game.section[field] !== 'string' || game.section[field] === '') {
            problems.push(`${tag}: section missing ${field}`)
          }
        }
      }
    } else if (game.section !== undefined) {
      problems.push(`${tag}: listed game must not have a section`)
    }
  }

  return problems
}
