/**
 * Botón de vuelta al inicio. Aparece en el header del lector y en los dos de la guía, así
 * que vive aquí para que sea siempre el mismo control y no tres variantes parecidas.
 */
export default function InicioBoton({ onInicio }: { onInicio: () => void }) {
  return (
    <button className="py-[0.3rem] bg-transparent border-0 text-neutro text-[0.95rem] hover:underline" onClick={onInicio}>
      ← Inicio
    </button>
  )
}
