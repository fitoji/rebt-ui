// Los favoritos: las ITC que el usuario marca para tenerlas a mano.
//
// La lista se guarda en `localStorage`, que es lo que sobrevive entre sesiones y no
// necesita ni servidor ni cuenta. La lógica de leer y guardar está aparte del hook
// para poder testearla sin navegador.

import { useCallback, useState } from 'react'

const CLAVE = 'rebt-favoritos'

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
export function leerFavoritos(): string[] {
  try {
    return parseFavoritos(localStorage.getItem(CLAVE))
  } catch {
    return []
  }
}

/** Guarda los favoritos, tolerando que no haya espacio o que esté bloqueado. */
export function guardarFavoritos(ids: string[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ids))
  } catch {
    // Modo privado o cuota llena: los favoritos viven solo en esta sesión.
  }
}

/** Los favoritos del usuario, con su lista y las dos operaciones. */
export function useFavoritos(): {
  favoritos: string[]
  esFavorito: (id: string) => boolean
  alternar: (id: string) => void
} {
  const [favoritos, setFavoritos] = useState<string[]>(leerFavoritos)

  const alternar = useCallback((id: string) => {
    setFavoritos((actual) => {
      const siguiente = alternaFavoritos(actual, id)
      guardarFavoritos(siguiente)
      return siguiente
    })
  }, [])

  const esFavorito = useCallback((id: string) => favoritos.includes(id), [favoritos])

  return { favoritos, esFavorito, alternar }
}
