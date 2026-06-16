import React from 'react'
import ReactDOM from 'react-dom/client'
import { SiteApp } from './site-app'

export function mountSiteSurface(root: HTMLElement) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SiteApp />
    </React.StrictMode>,
  )
}
