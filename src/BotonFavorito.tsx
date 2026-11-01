// La estrella de favoritos. La usan el índice del REBT y el de la guía, así que vive
// aquí y no duplicada en los dos.

import { Star } from 'lucide-react'
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
      className={`flex-none rounded-[4px] border-0 bg-transparent px-[0.2rem] py-0 leading-[1.4] text-tinta-2 transition-[opacity,color] duration-150 ease-plano hover:text-fase aria-pressed:text-fase focus-visible:outline-2 focus-visible:outline-fase focus-visible:outline-offset-1 ${marcado ? 'opacity-100' : 'opacity-45 hover:opacity-100'} ${className}`}
      aria-pressed={marcado}
      aria-label={marcado ? `Quitar ${titulo} de favoritos` : `Añadir ${titulo} a favoritos`}
      title={marcado ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      onClick={() => favoritos.alternar(id)}
    >
      <Star
        aria-hidden="true"
        className="size-[0.95rem] transition-transform duration-200 ease-plano active:scale-90"
        strokeWidth={1.75}
        fill={marcado ? 'currentColor' : 'none'}
      />
    </button>
  )
}
