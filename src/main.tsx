import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { esMarcaNeutra } from './lib/marca'

// Marca neutra (?marca=neutra): se resuelve antes del primer render (título, favicon, data-marca).
esMarcaNeutra()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
