// La búsqueda de texto completo del reglamento.
//
// Va aparte del componente porque es lógica pura y se puede testear. La clave es que
// `obtener` devuelve el bloque si ya está descargado y `undefined` si todavía no: por
// eso los resultados van apareciendo **mientras** se indexa, sin esperar a que
// terminen los 98 bloques.

import { fold } from './parse.ts'
import type { Bloque, BloqueConContenido, Fila } from './tipos.ts'

/** Normaliza para buscar: sin tildes y en minúsculas. */
export const normaliza = (s: string): string => fold(s)

/** Cuántas veces aparece `needle` en un texto ya normalizado. */
export function countOf(folded: string, needle: string): number {
  let n = 0
  for (let i = folded.indexOf(needle); i !== -1; i = folded.indexOf(needle, i + needle.length)) n++
  return n
}

/** El trozo de texto alrededor de la coincidencia, para mostrarlo en el índice. */
export function snippetOf(text: string, needle: string): string {
  const f = fold(text)
  const i = f.indexOf(needle)
  if (i < 0 || f.length !== text.length) return ''
  const a = Math.max(0, i - 50)
  const b = Math.min(text.length, i + needle.length + 70)
  return (a > 0 ? '…' : '') + text.slice(a, b).replace(/\s+/g, ' ') + (b < text.length ? '…' : '')
}

/**
 * Busca en los bloques del índice.
 *
 * @param blocks    todos los bloques del BOE
 * @param consulta  lo que se busca
 * @param titulos   los títulos ya normalizados, en el mismo orden que `blocks`
 * @param obtener   el bloque si ya está descargado, `undefined` si todavía no
 */
export function buscarEnBloques(
  blocks: Bloque[],
  consulta: string,
  titulos: string[],
  obtener: (id: string) => BloqueConContenido | undefined,
): Fila[] {
  const needle = fold(consulta)
  const out: Fila[] = []
  blocks.forEach((entry, i) => {
    const b = obtener(entry.id)
    // El título se busca siempre, esté descargado o no: así hay resultados desde el
    // primer bloque, y no solo al terminar de indexar.
    const enTitulo = (titulos[i] ?? '').includes(needle)
    const count = b ? countOf(b.folded, needle) : 0
    if (!enTitulo && !count) return
    out.push({
      entry,
      count,
      snippet: count ? snippetOf(b?.versions[0].text ?? '', needle) : '',
    })
  })
  return out
}
