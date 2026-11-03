import { parseIndex, parseBlock } from './parse.ts'
import type { Bloque, BloqueConContenido } from './tipos.ts'

// REBT consolidado: Real Decreto 842/2002 con todas las ITC-BT
export const NORMA_ID = 'BOE-A-2002-18099'

// Las funciones llevan la norma como último argumento opcional: sin él trabajan sobre el
// REBT, que es lo que hacían antes de que existiera el lector de normas modificadoras. Así
// el lector de siempre no cambia y el nuevo pasa su propio id.
const BASE = (norma: string) => `/boe-api/legislacion-consolidada/id/${norma}/texto`

/** norma → id de bloque → bloque. */
const blocks = new Map<string, Map<string, BloqueConContenido>>()
/** `${norma}\n${id}` → la descarga en curso, para no pedir dos veces el mismo bloque. */
const inflight = new Map<string, Promise<BloqueConContenido>>()
const indices = new Map<string, Promise<Bloque[]>>()

async function getXml(norma: string, path: string): Promise<Document> {
  const res = await fetch(BASE(norma) + path, { headers: { Accept: 'application/xml' } })
  if (!res.ok) throw new Error(`El BOE respondió ${res.status} al pedir ${path}.`)
  const doc = new DOMParser().parseFromString(await res.text(), 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('La respuesta del BOE no es XML válido.')
  }
  return doc
}

export function getIndex(norma: string = NORMA_ID): Promise<Bloque[]> {
  const cached = indices.get(norma)
  if (cached) return cached
  const p = getXml(norma, '/indice')
    .then(parseIndex)
    .catch((e: Error) => {
      indices.delete(norma)
      throw e
    })
  indices.set(norma, p)
  return p
}

export function getBlock(id: string, norma: string = NORMA_ID): Promise<BloqueConContenido> {
  const cached = blocks.get(norma)?.get(id)
  if (cached) return Promise.resolve(cached)
  const clave = `${norma}\n${id}`
  const pending = inflight.get(clave)
  if (pending) return pending
  const p = getXml(norma, `/bloque/${encodeURIComponent(id)}`)
    .then((doc) => parseBlock(doc, id))
    .then((b) => {
      let porNorma = blocks.get(norma)
      if (!porNorma) {
        porNorma = new Map()
        blocks.set(norma, porNorma)
      }
      porNorma.set(id, b)
      return b
    })
    .finally(() => inflight.delete(clave))
  inflight.set(clave, p)
  return p
}

export const peekBlock = (id: string, norma: string = NORMA_ID): BloqueConContenido | undefined =>
  blocks.get(norma)?.get(id)

// Descarga todos los bloques con 4 peticiones a la vez para poder buscar en el texto completo.
// Devuelve los ids que fallaron.
export async function loadAll(
  ids: string[],
  { onProgress }: { onProgress?: (done: number) => void } = {},
  norma: string = NORMA_ID,
): Promise<string[]> {
  let next = 0
  let done = 0
  const failed: string[] = []
  const worker = async () => {
    while (next < ids.length) {
      const id = ids[next++]
      try {
        await getBlock(id, norma)
      } catch {
        failed.push(id)
      }
      onProgress?.(++done)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  return failed
}
