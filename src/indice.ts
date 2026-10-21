// Cómo se agrupan los bloques del reglamento en la sidebar.
//
// Va aparte del componente porque es lógica pura y se puede testear: una clasificación
// rota se lleva por delante la navegación entera, y antes esto no lo cubría nadie.
//
// Los ids del BOE dicen a qué grupo pertenece cada bloque:
//   pr            el preámbulo
//   a1, a2, au…   los artículos del Reglamento
//   da, dt, dd…   las disposiciones (adicionales, transitorias, derogatorias, finales)
//   re, fi        el Reglamento y la firma
//   id, ib-2…     las Instrucciones Técnicas Complementarias

import type { Fila } from './tipos.ts'

/** Las disposiciones y sus numerales: `da`, `da-2`, `dt`, `df-3`… */
const RE_DISPOSICION = /^(da|dt|dd|df|fi|re)(-\d+)?$/

export interface Grupos {
  preambulo: Fila[]
  /** Los artículos del Reglamento. */
  articulos: Fila[]
  /** Las disposiciones: van en un sub-acordeón, closed por defecto. */
  disposiciones: Fila[]
  /** Las ITC-BT, que es lo que se usa todos los días. */
  itcs: Fila[]
}

export function agruparBloques(rows: Fila[]): Grupos {
  const preambulo: Fila[] = []
  const articulos: Fila[] = []
  const disposiciones: Fila[] = []
  const itcs: Fila[] = []

  for (const fila of rows) {
    const id = fila.entry.id
    if (id === 'pr') preambulo.push(fila)
    else if (id.startsWith('a')) articulos.push(fila)
    else if (RE_DISPOSICION.test(id)) disposiciones.push(fila)
    else itcs.push(fila)
  }

  return { preambulo, articulos, disposiciones, itcs }
}
