import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './app-shell'
import { createDefaultFullThemeState, STORAGE_KEY } from '../store/persistence'
import { PROMINENT_ENTRANCE_CONFIGS } from '../prominent/prominent-config'
import { getProminentEntranceStorageKey } from '../prominent/prominent-storage'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('AppShell', () => {
  it('renders the static station identity surface', () => {
    render(<AppShell />)

    expect(screen.getByRole('heading', { name: /undef games/i })).toBeInTheDocument()
    expect(screen.getAllByText(/NO SIGNAL/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/CH 00/i).length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/interactive station signal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/undef games maze gate u cut mark/i)).toBeInTheDocument()
    expect(screen.queryByText(/undef logos/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^LIVE$/i)).not.toBeInTheDocument()
  })

  it('keeps tuning controls in the right sidebar instead of the broadcast field', () => {
    render(<AppShell />)

    const controls = screen.getByLabelText(/station controls/i)
    const broadcast = screen.getByLabelText(/static station identity/i)
    const sidebar = screen.getByLabelText(/station tools and identity/i)

    expect(broadcast).not.toContainElement(controls)
    expect(sidebar).toContainElement(controls)
  })

  it('renders the production site surface without the lab control rail', () => {
    render(<AppShell surface="site" />)

    expect(screen.getByRole('heading', { name: /undef games/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/interactive station signal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/interactive station signal/i)).toHaveAttribute('data-signal', '50')
    const landingActions = screen.getByLabelText(/landing actions/i)
    expect(within(landingActions).getByRole('link', { name: /explore warp/i })).toHaveAttribute(
      'href',
      'https://warp.undef.games',
    )
    expect(screen.getByRole('link', { name: /view projects/i })).toHaveAttribute('href', '#projects')
    expect(screen.queryByLabelText(/station tools and identity/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/station controls/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/effects controls/i)).not.toBeInTheDocument()
  })

  it('renders the refreshed company and flagship copy on the landing surface', () => {
    render(<AppShell />)

    expect(
      screen.getByText(/indie studio building game tools and systems for fun shared experiences/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /explore warp/i })).toBeInTheDocument()
    expect(screen.getAllByText(/WARP: Warp Agent Runtime Portal/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/at the table and on the network/i)).toBeInTheDocument()
  })

  it('hydrates the production site surface from the saved lab theme', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...createDefaultFullThemeState(),
        activeTone: 'light',
        scanlineLayers: { graph: true, crt: true, glitch: false },
        tones: {
          ...createDefaultFullThemeState().tones,
          light: {
            presetId: 'custom',
            settings: {
              ...createDefaultFullThemeState().tones.light.settings,
              paletteBg: '#ffffff',
              paletteSignal: '#123456',
            },
          },
        },
      }),
    )

    render(<AppShell surface="site" />)

    const shell = screen.getByRole('main').parentElement!
    expect(shell).toHaveAttribute('data-tone', 'light')
    expect(shell).toHaveAttribute('data-scan-graph', 'true')
    expect(shell).toHaveAttribute('data-scan-crt', 'true')
  })

  it('passes persisted scanline engine state into the scene metadata', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...createDefaultFullThemeState(),
        scanlineEngine: {
          basePattern: 'audit',
          layers: [
            {
              amplitude: 0.4,
              blendMode: 'screen',
              dashLength: 0,
              enabled: true,
              frequency: 1,
              gapLength: 0,
              id: 'layer-a',
              jitter: 0,
              kind: 'sine',
              opacity: 0.6,
              phase: 0,
              pointerCoupling: 0,
              role: 'advanced',
              scrollCoupling: 0,
              spacingInfluence: 0.5,
              speed: 0,
              stepSharpness: 0.5,
              thickness: 1,
              verticalOffset: 0,
            },
          ],
        },
      }),
    )

    render(<AppShell />)

    const scene = screen.getByLabelText(/interactive station signal/i)
    expect(scene).toHaveAttribute('data-scanline-base-pattern', 'audit')
    expect(scene).toHaveAttribute('data-scanline-layer-count', '1')
  })

  it('saves separate dark and light theme choices and clears them with reset theme', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.selectOptions(screen.getByLabelText(/dark theme preset/i), 'cyan-ice')
    await user.selectOptions(screen.getByLabelText(/light theme preset/i), 'paper-terminal')
    await user.click(screen.getByRole('button', { name: /light mode/i }))

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      activeTone: 'light',
      tones: {
        dark: { presetId: 'cyan-ice' },
        light: { presetId: 'paper-terminal' },
      },
      version: 1,
    })

    await user.click(screen.getByRole('button', { name: /reset theme/i }))

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.getByLabelText(/dark theme preset/i)).toHaveValue('blue-noise')
    expect(screen.getByLabelText(/light theme preset/i)).toHaveValue('paper-terminal')
  })

  it('wires the scanline engine controls through app state', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByRole('button', { name: /add scanline layer/i }))

    expect(screen.getByText('Layer 1')).toBeInTheDocument()
  })

  it('keeps the identity rail focused on the selected mark instead of exploration boards', () => {
    render(<AppShell />)

    expect(screen.queryByLabelText(/symbol directions/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/focused variants/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/style probes/i)).not.toBeInTheDocument()
  })

  it('tunes the dead channel into a locked station ID without live broadcast copy', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /tune signal/i }))

    expect(screen.getAllByText(/LOCKED/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/^LIVE$/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/signal 100/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/station lockup/i)).toBeInTheDocument()
  })

  it('detunes and resets the station', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /detune/i }))
    expect(screen.getAllByText(/NO SIGNAL/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    expect(screen.getByLabelText(/signal 0/i)).toBeInTheDocument()
  })

  it('does not tune from an incidental scene click', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByLabelText(/interactive station signal/i))

    expect(screen.getByLabelText(/signal 0/i)).toBeInTheDocument()
    expect(screen.getAllByText(/NO SIGNAL/i).length).toBeGreaterThan(0)
  })

  it('resets saved prominent entrances from the lab rail and replays the back control intro', async () => {
    const user = userEvent.setup()
    const storageKey = getProminentEntranceStorageKey(PROMINENT_ENTRANCE_CONFIGS.labBack)
    window.localStorage.setItem(storageKey, 'true')
    const getBoundingClientRectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute('aria-label') === 'static station identity') {
        return new DOMRect(0, 0, 1200, 720)
      }
      return new DOMRect(0, 0, 160, 48)
    })

    try {
      render(<AppShell />)

      const backLink = screen.getByRole('link', { name: /^< back$/i })
      expect(backLink).not.toHaveClass('prominent-entrance--active')

      await user.click(screen.getByRole('button', { name: /reset intros/i }))

      const replayedBackLink = screen.getByRole('link', { name: /^< back$/i })
      expect(window.localStorage.getItem(storageKey)).toBeNull()
      expect(replayedBackLink).toHaveClass('prominent-entrance--active')
      expect(replayedBackLink).toHaveAttribute('data-prominent-effect', 'geometric-genie')
    } finally {
      getBoundingClientRectSpy.mockRestore()
    }
  })
})
