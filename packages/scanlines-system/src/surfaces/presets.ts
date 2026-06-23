export type SurfacePresetId = 'marketing' | 'console'
export interface SurfacePreset {
  id: SurfacePresetId
  atmosphere: boolean // landing/auth/lab true; consoles false
  header: 'brand' | 'console'
}
export const MARKETING_PRESET: SurfacePreset = { id: 'marketing', atmosphere: true, header: 'brand' }
export const CONSOLE_PRESET: SurfacePreset = { id: 'console', atmosphere: false, header: 'console' }
