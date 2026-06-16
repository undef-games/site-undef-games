import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PROMINENT_ENTRANCE_CONFIGS,
  PROMINENT_ENTRANCE_EFFECTS,
  type ProminentEntranceConfig,
  ProminentEntrance,
  getProminentEntranceStorageKey,
  shouldPlayProminentEntrance,
} from './prominent-entrance'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe('ProminentEntrance', () => {
  it('defines five configurable entrance effects', () => {
    expect(PROMINENT_ENTRANCE_EFFECTS).toEqual([
      'geometric-genie',
      'jump-pulse-slices',
      'signal-lock',
      'frame-step',
      'shard-assemble',
    ])
  })

  it('plays once per configured storage key and marks completion', () => {
    vi.useFakeTimers()
    const config: ProminentEntranceConfig = {
      id: 'tutorial-home-mark',
      effect: 'jump-pulse-slices',
      replay: 'once',
      role: 'tutorial',
      veil: true,
      durationMs: 900,
    }

    render(
      <ProminentEntrance config={config} activeClassName="is-prominent">
        <button type="button">Open feature</button>
      </ProminentEntrance>,
    )

    const button = screen.getByRole('button', { name: /open feature/i })
    expect(screen.getByTestId('prominent-control-veil')).toBeInTheDocument()
    expect(button).toHaveClass('prominent-entrance--active', 'prominent-entrance--jump-pulse-slices', 'is-prominent')
    expect(button).toHaveAttribute('data-prominent-effect', 'jump-pulse-slices')
    expect(button).toHaveAttribute('data-prominent-role', 'tutorial')

    act(() => vi.advanceTimersByTime(900))

    expect(screen.queryByTestId('prominent-control-veil')).not.toBeInTheDocument()
    expect(button).not.toHaveClass('prominent-entrance--active')
    expect(window.localStorage.getItem(getProminentEntranceStorageKey(config))).toBe('true')
  })

  it('supports once session always and never replay policies', () => {
    const base = {
      id: 'feature-tour-step',
      effect: 'signal-lock',
      role: 'spotlight',
      veil: false,
      durationMs: 1200,
    } satisfies Omit<ProminentEntranceConfig, 'replay'>

    expect(shouldPlayProminentEntrance({ ...base, replay: 'always' })).toBe(true)
    expect(shouldPlayProminentEntrance({ ...base, replay: 'never' })).toBe(false)

    const once = { ...base, replay: 'once' } satisfies ProminentEntranceConfig
    expect(shouldPlayProminentEntrance(once)).toBe(true)
    window.localStorage.setItem(getProminentEntranceStorageKey(once), 'true')
    expect(shouldPlayProminentEntrance(once)).toBe(false)

    const session = { ...base, replay: 'session' } satisfies ProminentEntranceConfig
    expect(shouldPlayProminentEntrance(session)).toBe(true)
    window.sessionStorage.setItem(getProminentEntranceStorageKey(session), 'true')
    expect(shouldPlayProminentEntrance(session)).toBe(false)
  })

  it('waits for an enabled signal before playing the entrance effect', () => {
    vi.useFakeTimers()
    const config: ProminentEntranceConfig = {
      id: 'deferred-intro',
      effect: 'geometric-genie',
      replay: 'once',
      role: 'spotlight',
      veil: true,
      durationMs: 640,
    }

    const { rerender } = render(
      <ProminentEntrance config={config} enabled={false}>
        <button type="button">Deferred intro</button>
      </ProminentEntrance>,
    )

    const button = screen.getByRole('button', { name: /deferred intro/i })
    expect(screen.queryByTestId('prominent-control-veil')).not.toBeInTheDocument()
    expect(button).not.toHaveClass('prominent-entrance--active')

    rerender(
      <ProminentEntrance config={config} enabled>
        <button type="button">Deferred intro</button>
      </ProminentEntrance>,
    )

    expect(screen.getByTestId('prominent-control-veil')).toBeInTheDocument()
    expect(button).toHaveClass('prominent-entrance--active', 'prominent-entrance--geometric-genie')
  })

  it('keeps the lab back intro on the short timing budget', () => {
    expect(PROMINENT_ENTRANCE_CONFIGS.labBack.durationMs).toBe(640)
  })
})
