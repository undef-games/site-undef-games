// packages/scanlines-system/src/theme/provider.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyThemeState } from './hydrate'
import { createDefaultThemeState, readThemeState, writeThemeState } from './persistence'

type Tone = 'dark' | 'light'
interface ThemeContextValue { tone: Tone; toggle: () => void }
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tone, setTone] = useState<Tone>(() => readThemeState()?.activeTone ?? 'dark')

  useEffect(() => {
    applyThemeState(readThemeState())
    const onStorage = () => {
      const next = readThemeState()
      setTone(next?.activeTone ?? 'dark')
      applyThemeState(next)
    }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('storage', onStorage) }
  }, [])

  const toggle = useCallback(() => {
    const current = readThemeState() ?? createDefaultThemeState()
    const nextTone: Tone = current.activeTone === 'light' ? 'dark' : 'light'
    const next = { ...current, activeTone: nextTone }
    writeThemeState(next)
    applyThemeState(next)
    setTone(nextTone)
    window.dispatchEvent(new CustomEvent('undef-theme-change'))
  }, [])

  const value = useMemo(() => ({ tone, toggle }), [tone, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (ctx === null) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
