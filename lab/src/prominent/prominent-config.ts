export const PROMINENT_ENTRANCE_EFFECTS = [
  'geometric-genie',
  'jump-pulse-slices',
  'signal-lock',
  'frame-step',
  'shard-assemble',
] as const

export type ProminentEntranceEffect = (typeof PROMINENT_ENTRANCE_EFFECTS)[number]
export type ProminentEntranceReplay = 'once' | 'session' | 'always' | 'never'
export type ProminentEntranceRole = 'intro' | 'tutorial' | 'spotlight'

export type ProminentEntranceConfig = {
  id: string
  effect: ProminentEntranceEffect
  replay: ProminentEntranceReplay
  role: ProminentEntranceRole
  veil: boolean
  durationMs: number
  storageKey?: string
}

export const PROMINENT_ENTRANCE_CONFIGS = {
  labBack: {
    id: 'lab-back',
    effect: 'geometric-genie',
    replay: 'once',
    role: 'spotlight',
    veil: true,
    durationMs: 640,
    storageKey: 'undef-prominent-back-seen',
  },
  siteHomeMark: {
    id: 'site-home-mark',
    effect: 'jump-pulse-slices',
    replay: 'once',
    role: 'intro',
    veil: true,
    durationMs: 1800,
  },
} satisfies Record<string, ProminentEntranceConfig>
