import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Router from './Router.tsx'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró el nodo #root donde montar la aplicación.')

createRoot(root).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
