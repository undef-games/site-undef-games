import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppShell } from './app/app-shell'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppShell />
  </StrictMode>
)
