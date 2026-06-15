import type { CSSProperties } from 'react'
import type { ChannelMode } from './station-signal-scene'

export type SectionToyEffect = 'bars' | 'frames' | 'rails' | 'rungs' | 'scatter' | 'slab' | 'tumble'
export type SectionEffectId = 'dice' | 'identity' | 'projects' | 'signal' | 'taybols' | 'warp'
export type SectionEffects = Record<SectionEffectId, SectionToyEffect>

export type StationChannel = {
  id: string
  label: string
  mode: ChannelMode
  note: string
}

export const STATION_CHANNELS: StationChannel[] = [
  { id: 'ch00', label: 'CH 00', mode: 'baseline', note: 'carrier' },
  { id: 'ch13', label: 'CH 13', mode: 'game', note: 'toy band' },
  { id: 'ch??', label: 'CH ??', mode: 'noise', note: 'drift' },
  { id: 'chug', label: 'UG', mode: 'lock', note: 'lock' },
]

export function ChannelSelector({
  activeChannel,
  channels,
  onSelect,
}: {
  activeChannel: StationChannel
  channels: StationChannel[]
  onSelect: (channel: StationChannel) => void
}) {
  return (
    <section className="channel-selector" aria-label="channel toys">
      <p className="control-label">Channels</p>
      <div className="channel-buttons">
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            aria-pressed={channel.id === activeChannel.id}
            onClick={() => onSelect(channel)}
          >
            <span>{channel.label}</span>
            <small>{channel.note}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

export function SignalScope({ signal, scrollDepth, activeChannel }: { signal: number; scrollDepth: number; activeChannel: StationChannel }) {
  const bars = Array.from({ length: 18 }, (_, index) => {
    const phase = (index + 1) / 18
    const signalLift = signal / 100
    const scrollLift = Math.min(1, Math.max(0, scrollDepth))
    const modeLift = activeChannel.mode === 'noise' ? 0.24 : activeChannel.mode === 'game' ? 0.16 : activeChannel.mode === 'lock' ? 0.08 : 0
    return Math.max(8, Math.round((0.18 + signalLift * phase * 0.58 + scrollLift * (1 - phase) * 0.34 + modeLift) * 100))
  })

  return (
    <section className="signal-scope" aria-label="signal scope" data-channel-mode={activeChannel.mode}>
      <div className="identity-header">
        <p>Scope</p>
        <span>{activeChannel.label}</span>
      </div>
      <div className="scope-bars" aria-hidden="true">
        {bars.map((bar, index) => (
          <span key={index} style={{ blockSize: `${bar}%` }} />
        ))}
      </div>
    </section>
  )
}

export function PacketDrift({ activeChannel }: { activeChannel: StationChannel }) {
  const packets = ['x:08 y:13', 'seed:undef', 'roll:2d6', 'route:05-14', 'tick:00ff', 'mode:toy']

  return (
    <div className="packet-drift" aria-hidden="true" data-channel-mode={activeChannel.mode}>
      {packets.map((packet, index) => (
        <span key={packet} style={{ '--packet-index': index, '--packet-row': index % 3 } as CSSProperties}>
          {packet}
        </span>
      ))}
    </div>
  )
}

export function SectionToy({ effect, variant }: { effect: SectionToyEffect; variant: 'signal' | 'system' | 'identity' }) {
  const count = variant === 'system' ? 18 : 12

  return (
    <div className={`section-toy section-toy--${variant} section-toy--effect-${effect}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const row = index % 7
        const width = 48 + (index % 5) * 34
        const height = index % 4 === 0 ? 8 : index % 3 === 0 ? 5 : 2
        const travelsLeftToRight = index % 5 === 0 || index % 7 === 3
        const start = travelsLeftToRight ? -34 - (index % 4) * 12 : 84 + (index % 6) * 12
        const travel = (150 + (index % 5) * 22) * (travelsLeftToRight ? 1 : -1)
        const drift = index % 2 === 0 ? -1 : 1
        const verticalStart = variant === 'system' ? (index % 3) * 18 : 0
        const verticalTravel = variant === 'system' ? (index % 2 === 0 ? -92 : 78) - row * 6 : drift * (34 + (index % 4) * 9)
        const spinStart = (index % 6) * 11 * drift
        const spin = (variant === 'system' ? 48 + (index % 5) * 18 : 96 + (index % 6) * 28) * drift

        return (
          <span
            key={index}
            style={
              {
                '--toy-drift': drift,
                '--toy-height': `${height}px`,
                '--toy-index': index,
                '--toy-row': row,
                '--toy-spin': `${spin}deg`,
                '--toy-spin-start': `${spinStart}deg`,
                '--toy-x-start': `${start}vw`,
                '--toy-x-travel': `${travel}vw`,
                '--toy-width': `${width}px`,
                '--toy-y-start': `${verticalStart}px`,
                '--toy-y-travel': `${verticalTravel}px`,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
