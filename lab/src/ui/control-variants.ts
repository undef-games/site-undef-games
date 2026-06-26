import type { ScanlinesButtonVariant } from '@undef-games/scanlines-system'

// Single place to tune the lab control buttons' variants.
export const CONTROL_VARIANTS = {
  tune: 'primary',
  detune: 'ghost',          // flip to 'warning' to flag it pulls the signal down
  signalReset: 'danger',
  themeReset: 'danger',
  prominentReset: 'danger',
  addLayer: 'primary',
  removeLayer: 'danger',
  duplicateLayer: 'ghost',
  toggleLayer: 'ghost',
  moveLayer: 'ghost',
  runCommand: 'primary',
  prototypeReset: 'ghost',
  prototypeAdvance: 'ghost',
} as const satisfies Record<string, ScanlinesButtonVariant>
