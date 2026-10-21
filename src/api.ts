import { parseIndex, parseBlock } from './parse.ts'
import type { Bloque, BloqueConContenido } from './tipos.ts'

// REBT consolidado: Real Decreto 842/2002 con todas las ITC-BT
export const NORMA_ID = 'BOE-A-2002-18099'
const BASE = `/boe-api/legislacion-consolidada/id/${NORMA_ID}/texto`

const blocks = new Map<string, BloqueConContenido>()
const inflight = new Map<string, Promise<BloqueConContenido>>()
let indexPromise: Promise<Bloque[]> | undefined

async function getXml(path: string): Promise<Document> {
  const res = await fetch(BASE + path, { headers: { Accept: 'application/xml' } })
  if (!res.ok) throw new Error(`El BOE respondió ${res.status} al pedir ${path}.`)
  const doc = new DOMParser().parseFromString(await res.text(), 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('La respuesta del BOE no es XML válido.')
  }
  return doc
}

export function getIndex(): Promise<Bloque[]> {
  indexPromise ??= getXml('/indice')
    .then(parseIndex)
    .catch((e) => {
      indexPromise = undefined
      throw e
    })
  return indexPromise
}

export function getBlock(id: string): Promise<BloqueConContenido> {
  const cached = blocks.get(id)
  if (cached) return Promise.resolve(cached)
  const pending = inflight.get(id)
  if (pending) return pending
  const p = getXml(`/bloque/${encodeURIComponent(id)}`)
    .then((doc) => parseBlock(doc, id))
    .then((b) => {
      blocks.set(id, b)
      return b
    })
    .finally(() => inflight.delete(id))
  inflight.set(id, p)
  return p
}

export const peekBlock = (id: string): BloqueConContenido | undefined => blocks.get(id)

// Descarga todos los bloques con 4 peticiones a la vez para poder buscar en el texto completo.
// Devuelve los ids que fallaron.
export async function loadAll(
  ids: string[],
  { onProgress }: { onProgress?: (done: number) => void } = {},
): Promise<string[]> {
  let next = 0
  let done = 0
  const failed: string[] = []
  const worker = async () => {
    while (next < ids.length) {
      const id = ids[next++]
      try {
        await getBlock(id)
      } catch {
        failed.push(id)
      }
      onProgress?.(++done)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  return failed
}
