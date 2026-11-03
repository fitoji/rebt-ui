// El texto del diario oficial, para las normas que el BOE no consolida.
//
// La colección consolidada solo tiene lo que el BOE digitalizó como texto: once normas
// modificaron el reglamento y cinco de ellas no están ahí. Pero todas existen en el
// diario del día en que se publicaron, y esa página (`diario_boe/txt.php?id=`) trae el
// texto completo dentro de `#textoxslt`, con los mismos párrafos que el XML.
//
// Se parsea igual que un bloque —`collectItems` es el mismo— y se renderiza con el mismo
// componente, así que una orden de 1980 se lee como se lee el reglamento. Lo que no hay
// es XML: ni versiones, ni bloques, ni índice. Es un documento, no una norma consolidada.
//
// El HTML del BOE nunca se inyecta: se convierte en `Item`s y se dibuja con React.

import { collectItems, fold } from './parse.ts'
import type { BloqueConContenido } from './tipos.ts'

const cache = new Map<string, Promise<BloqueConContenido>>()

async function descargar(id: string): Promise<BloqueConContenido> {
  const res = await fetch(`/boe-doc/txt.php?id=${encodeURIComponent(id)}`, {
    headers: { Accept: 'text/html' },
  })
  if (!res.ok) throw new Error(`El BOE respondió ${res.status} al pedir ${id}.`)
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html')

  const cuerpo = doc.querySelector('#textoxslt')
  if (!cuerpo) throw new Error('El documento del BOE llegó sin texto: no se puede leer acá.')

  // Las disposiciones más viejas —todo 1973 y 1974— no están digitalizadas como texto: el
  // BOE pone en su lugar un aviso y remite al PDF. Se corta acá para que la vista muestre
  // el enlace al documento y no ese cartel como si fuera contenido.
  if (cuerpo.querySelector('p.caja')) {
    throw new Error('El BOE no tiene este documento digitalizado como texto: solo el PDF.')
  }

  const items = collectItems(cuerpo)
  if (!items.length) throw new Error('El documento del BOE no tiene párrafos que mostrar.')

  const titulo = doc.querySelector('h3.documento-tit')?.textContent?.trim() ?? ''
  const text = items.map((i) => i.text).join('\n')

  return {
    id,
    titulo,
    versions: [{ vigencia: '', publicacion: '', items, text }],
    folded: fold(text),
  }
}

/** El documento del diario, con la misma forma que un bloque para poder renderizarlo igual. */
export function getDiario(id: string): Promise<BloqueConContenido> {
  const cached = cache.get(id)
  if (cached) return cached
  const p = descargar(id).catch((e: Error) => {
    cache.delete(id)
    throw e
  })
  cache.set(id, p)
  return p
}
