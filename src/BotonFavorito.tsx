// La estrella de favoritos. La usan el índice del REBT y el de la guía, así que vive
// aquí y no duplicada en los dos.

import type { Favoritos } from './favoritos.ts'

export default function BotonFavorito({
  id,
  titulo,
  favoritos,
}: {
  /** Lo que se marca: el id del bloque o del documento. */
  id: string
  /** Para el texto accesible: el nombre de lo que se está marcando. */
  titulo: string
  favoritos: Favoritos
}) {
  const marcado = favoritos.esFavorito(id)
  return (
    <button
      className="favorito"
      aria-pressed={marcado}
      aria-label={marcado ? `Quitar ${titulo} de favoritos` : `Añadir ${titulo} a favoritos`}
      title={marcado ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      onClick={() => favoritos.alternar(id)}
    >
      {marcado ? '★' : '☆'}
    </button>
  )
}
