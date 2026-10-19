/**
 * Botón de vuelta al inicio. Aparece en el header del lector y en los dos de la guía, así
 * que vive aquí para que sea siempre el mismo control y no tres variantes parecidas.
 */
export default function InicioBoton({ onInicio }) {
  return (
    <button className="volver" onClick={onInicio}>
      ← Inicio
    </button>
  )
}
