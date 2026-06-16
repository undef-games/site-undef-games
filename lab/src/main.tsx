import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import '../../packages/scanlines-system/src/styles/site.css'
import './styles/controls.css'
import './styles/quick-links.css'
import './styles/prominent-entrance.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
