// La estrella de favoritos. La usan el índice del REBT y el de la guía, así que vive
// aquí y no duplicada en los dos.

import type { Favoritos } from './favoritos.ts'

export default function BotonFavorito({
  id,
  titulo,
  favoritos,
  className = '',
}: {
  /** Lo que se marca: el id del bloque o del documento. */
  id: string
  /** Para el texto accesible: el nombre de lo que se está marcando. */
  titulo: string
  favoritos: Favoritos
  /** Dónde va la estrella: la lista la pone encima de la fila, la guía la deja al lado. */
  className?: string
}) {
  const marcado = favoritos.esFavorito(id)
  return (
    <button
      className={`flex-none px-[0.2rem] py-0 text-[1.05rem] leading-[1.4] text-neutro bg-transparent border-0 rounded-[4px] cursor-pointer opacity-40 transition-[opacity,color] duration-150 ease hover:opacity-100 hover:text-fase aria-pressed:opacity-100 aria-pressed:text-fase focus-visible:outline-2 focus-visible:outline-fase focus-visible:outline-offset-1 ${className}`}
      aria-pressed={marcado}
      aria-label={marcado ? `Quitar ${titulo} de favoritos` : `Añadir ${titulo} a favoritos`}
      title={marcado ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      onClick={() => favoritos.alternar(id)}
    >
      {marcado ? '★' : '☆'}
    </button>
  )
}
