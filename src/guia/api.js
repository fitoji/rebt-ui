// Acceso al corpus de `guia_rebt/`, que el plugin de Vite publica en `/guia/`
// (ver `vite/guia-corpus.js`). En `dev` y `preview` lo sirve ese middleware; en producción
// son los archivos copiados a `dist/guia/`.

const BASE = '/guia'

async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} al pedir ${url}`)
  return res
}

export async function loadIndice() {
  return (await get(`${BASE}/indice.json`)).json()
}

export async function loadDocumento(id) {
  const res = await get(`${BASE}/md/${encodeURIComponent(id)}.md`)
  return res.text()
}
