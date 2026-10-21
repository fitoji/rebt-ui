// Los favoritos: los bloques y los documentos que el usuario marca para tenerlos a mano.
//
// La lista se guarda en `localStorage`, que es lo que sobrevive entre sesiones y no
// necesita ni servidor ni cuenta. La lógica de leer y guardar está aparte del hook
// para poder testearla sin navegador.

import { useCallback, useState } from 'react'

/** Los favoritos del lector del REBT (los ids de bloque: `ib-19`, `a1`…). */
export const CLAVE_REBT = 'rebt-favoritos'
/** Los favoritos de la guía (los ids de documento: `BT-19`, `BT-Anexo-2`…). */
export const CLAVE_GUIA = 'guia-favoritos'

/**
 * Lee los favoritos guardados.
 * Un valor corrupto (o de otra versión de la app) no debe romper la app: se descarta
 * y se empieza de cero.
 */
export function parseFavoritos(valor: string | null): string[] {
  if (!valor) return []
  try {
    const datos: unknown = JSON.parse(valor)
    if (!Array.isArray(datos)) return []
    return datos.filter((d): d is string => typeof d === 'string' && d.length > 0)
  } catch {
    return []
  }
}

/** Agrega un favorito si no está, o lo quita si ya estaba. */
export function alternaFavoritos(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

/** Lee los favoritos de `localStorage`, tolerando que no exista. */
export function leerFavoritos(clave: string): string[] {
  try {
    return parseFavoritos(localStorage.getItem(clave))
  } catch {
    return []
  }
}

/** Guarda los favoritos, tolerando que no haya espacio o que esté bloqueado. */
export function guardarFavoritos(clave: string, ids: string[]): void {
  try {
    localStorage.setItem(clave, JSON.stringify(ids))
  } catch {
    // Modo privado o cuota llena: los favoritos viven solo en esta sesión.
  }
}

/** Los favoritos del usuario, con su lista y las dos operaciones. */
export interface Favoritos {
  /** Los ids marcados, en el orden en que se fueron marcando. */
  ids: string[]
  esFavorito: (id: string) => boolean
  alternar: (id: string) => void
}

export function useFavoritos(clave: string): Favoritos {
  const [ids, setIds] = useState<string[]>(() => leerFavoritos(clave))

  const alternar = useCallback(
    (id: string) => {
      setIds((actual) => {
        const siguiente = alternaFavoritos(actual, id)
        guardarFavoritos(clave, siguiente)
        return siguiente
      })
    },
    [clave],
  )

  const esFavorito = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, esFavorito, alternar }
}
