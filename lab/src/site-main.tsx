import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppShell } from './app/app-shell'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/fonts.css'
import './styles/app.css'

const root = document.getElementById('scanlines-root')

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppShell surface="site" />
    </React.StrictMode>,
  )
}
