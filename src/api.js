import { parseIndex, parseBlock } from './parse.js'

// REBT consolidado: Real Decreto 842/2002 con todas las ITC-BT
export const NORMA_ID = 'BOE-A-2002-18099'
const BASE = `/boe-api/legislacion-consolidada/id/${NORMA_ID}/texto`

const blocks = new Map()
const inflight = new Map()
let indexPromise

async function getXml(path) {
  const res = await fetch(BASE + path, { headers: { Accept: 'application/xml' } })
  if (!res.ok) throw new Error(`El BOE respondió ${res.status} al pedir ${path}.`)
  const doc = new DOMParser().parseFromString(await res.text(), 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('La respuesta del BOE no es XML válido.')
  }
  return doc
}

export function getIndex() {
  indexPromise ??= getXml('/indice')
    .then(parseIndex)
    .catch((e) => {
      indexPromise = undefined
      throw e
    })
  return indexPromise
}

export function getBlock(id) {
  if (blocks.has(id)) return Promise.resolve(blocks.get(id))
  if (inflight.has(id)) return inflight.get(id)
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

export const peekBlock = (id) => blocks.get(id)

// Descarga todos los bloques con 4 peticiones a la vez para poder buscar en el texto completo.
// Devuelve los ids que fallaron.
export async function loadAll(ids, { onProgress } = {}) {
  let next = 0
  let done = 0
  const failed = []
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
