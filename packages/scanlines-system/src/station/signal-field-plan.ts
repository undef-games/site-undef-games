export type ChannelMode = 'baseline' | 'game' | 'noise' | 'lock'

export type SignalFieldPlan = {
  activeScanlines: number
  hasCenterMark: boolean
  hasMast: boolean
  mode: ChannelMode
  shape: 'scan-field'
  totalScanlines: number
}

export function getSignalFieldPlan(signal: number, channelMode: ChannelMode = 'baseline'): SignalFieldPlan {
  const normalizedSignal = Math.min(100, Math.max(0, Math.round(Number.isFinite(signal) ? signal : 0)))
  const clarity = normalizedSignal / 100
  const modeBonus = channelMode === 'noise' ? 34 : channelMode === 'game' ? 18 : channelMode === 'lock' ? 10 : 0
  const totalScanlines = 96 + modeBonus

  return {
    activeScanlines: Math.round(14 + clarity * 70 + modeBonus * 0.45),
    hasCenterMark: false,
    hasMast: false,
    mode: channelMode,
    shape: 'scan-field',
    totalScanlines,
  }
}
