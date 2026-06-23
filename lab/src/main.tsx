import React from 'react'
import ReactDOM from 'react-dom/client'
import '@undef-games/scanlines-system/styles/site.css'
import App from './app/App'
import './styles/controls.css'
import './styles/quick-links.css'
import './styles/prominent-entrance.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
