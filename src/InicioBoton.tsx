/**
 * Botón de vuelta al inicio. Aparece en el header del lector y en los dos de la guía, así
 * que vive aquí para que sea siempre el mismo control y no tres variantes parecidas.
 */
import { ArrowLeft } from 'lucide-react'

export default function InicioBoton({ onInicio }: { onInicio: () => void }) {
  return (
    <button
      className="group inline-flex items-center gap-[0.25rem] border-0 bg-transparent py-[0.3rem] text-[0.95rem] text-neutro hover:underline"
      onClick={onInicio}
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-3.5 transition-transform duration-200 ease-plano group-hover:-translate-x-0.5"
        strokeWidth={1.75}
      />
      Inicio
    </button>
  )
}
