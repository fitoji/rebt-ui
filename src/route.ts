// Rutas de la aplicación, todas por hash. Se pueden separar del JSX porque son lógica pura
// y condicionan un contrato ya publicado (ver `## Specs` S5 de odd/tasks/landing-y-visor-guia.md).
//
//   #/                 landing
//   #/rebt             lector del reglamento, primer bloque
//   #/rebt/<bloque>    lector del reglamento en ese bloque
//   #/guia             índice de las guías
//   #/guia/<id>        una guía concreta
//   #/<bloque>         enlace antiguo del lector, sigue funcionando
import type { Ruta } from './tipos.ts'

export function parseRoute(hash?: string | null): Ruta {
  let raw = (hash ?? '').replace(/^#\/?/, '')
  try {
    raw = decodeURIComponent(raw)
  } catch {
    // Un hash mal formado no debe dejar la app en blanco.
  }

  const path = raw.replace(/^\/+|\/+$/g, '')
  if (!path) return { name: 'landing' }

  const slash = path.indexOf('/')
  const head = slash === -1 ? path : path.slice(0, slash)
  const tail = slash === -1 ? '' : path.slice(slash + 1)

  if (head === 'guia') return { name: 'guia', id: tail || null }
  if (head === 'rebt') return { name: 'rebt', id: tail || null }

  // Cualquier otra cosa es un id de bloque del lector: es el contrato que ya tenía el
  // proyecto antes de la landing, y no se rompe.
  return { name: 'rebt', id: path }
}
