import type { ProminentEntranceConfig } from '@undef-games/scanlines-system'

export const LAB_BACK_ENTRANCE: ProminentEntranceConfig = {
  id: 'lab-back',
  effect: 'geometric-genie',
  travel: 'journey',
  replay: 'once',
  role: 'spotlight',
  veil: true,
  durationMs: 640,
  storageKey: 'undef-prominent-back-seen',
}
