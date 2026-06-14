import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/fonts.css'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
