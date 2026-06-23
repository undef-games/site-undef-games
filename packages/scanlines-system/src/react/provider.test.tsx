// packages/scanlines-system/src/theme/provider.test.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './provider'
import { STORAGE_KEY } from '../tokens/persistence'

function Probe() {
  const { tone, toggle } = useTheme()
  return <button onClick={toggle}>tone:{tone}</button>
}

afterEach(() => { localStorage.clear() })

describe('ThemeProvider', () => {
  it('toggles tone and writes both stores', async () => {
    const user = userEvent.setup()
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('tone:dark')
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveTextContent('tone:light')
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"activeTone":"light"')
    expect(document.cookie).toContain(`${STORAGE_KEY}=`)
  })
})
