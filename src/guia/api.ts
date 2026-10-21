// Acceso al corpus de `guia_rebt/`, que el plugin de Vite publica en `/guia/`
// (ver `vite/guia-corpus.ts`). En `dev` y `preview` lo sirve ese middleware; en producción
// son los archivos copiados a `dist/guia/`.

import type { IndiceGuia } from '../tipos.ts'

const BASE = '/guia'

async function get(url: string): Promise<Response> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} al pedir ${url}`)
  return res
}

export async function loadIndice(): Promise<IndiceGuia> {
  return (await get(`${BASE}/indice.json`)).json()
}

export async function loadDocumento(id: string): Promise<string> {
  const res = await get(`${BASE}/md/${encodeURIComponent(id)}.md`)
  return res.text()
}
