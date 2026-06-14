import type { CSSProperties } from 'react'
import type { ChannelMode } from './station-signal-scene'

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

export function SectionToy({ variant }: { variant: 'signal' | 'system' | 'identity' }) {
  return (
    <div className={`section-toy section-toy--${variant}`} aria-hidden="true">
      {Array.from({ length: variant === 'system' ? 16 : 12 }, (_, index) => (
        <span key={index} style={{ '--toy-index': index } as CSSProperties} />
      ))}
    </div>
  )
}

export function ScrollFollowField() {
  return (
    <div className="scroll-follow-field" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <span key={index} style={{ '--trail-index': index } as CSSProperties} />
      ))}
      <i />
    </div>
  )
}
