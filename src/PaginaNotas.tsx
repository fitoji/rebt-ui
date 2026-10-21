// La página de notas: todas las guardadas, de las dos vistas, para poder leerlas enteras
// y saltar a cada una.

import InicioBoton from './InicioBoton.tsx'
import type { Nota } from './notas.ts'

/** "hace 3 días", "hoy"… para la fecha de cada nota. */
function cuando(creado: number): string {
  const dias = Math.floor((Date.now() - creado) / 86_400_000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  return new Date(creado).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PaginaNotas({
  notas,
  onInicio,
  onIr,
  onQuitar,
}: {
  notas: Nota[]
  onInicio: () => void
  /** Saltar al texto de la nota. */
  onIr: (nota: Nota) => void
  onQuitar: (nota: Nota) => void
}) {
  // De más reciente a más antigua.
  const ordenadas = [...notas].sort((a, b) => b.creado - a.creado)

  return (
    <div className="pagina-notas">
      <header className="pagina-notas-cab">
        <div className="guia-doc-nav">
          <InicioBoton onInicio={onInicio} />
        </div>
        <h1 className="marca">Notas</h1>
        <p className="sub">
          {notas.length === 0
            ? 'Todavía no hay ninguna.'
            : `${notas.length} ${notas.length === 1 ? 'nota guardada' : 'notas guardadas'} en este navegador.`}
        </p>
      </header>

      {ordenadas.length === 0 ? (
        <p className="vacio">
          Subrayá un trozo del texto de una guía o de un bloque del reglamento y guardalo como
          nota: aparecerá acá.
        </p>
      ) : (
        <ul className="pagina-notas-lista">
          {ordenadas.map((nota) => (
            <li key={nota.id}>
              <blockquote className="nota-citada">{nota.texto}</blockquote>
              {(nota.antes || nota.despues) && (
                <p className="nota-contexto">
                  {nota.antes && <span className="nota-antes">…{nota.antes}</span>}
                  <mark className="nota">{nota.texto}</mark>
                  {nota.despues && <span className="nota-despues">{nota.despues}…</span>}
                </p>
              )}
              <footer className="nota-pie">
                <button className="nota-ir" onClick={() => onIr(nota)} title="Ir al texto">
                  {nota.titulo || nota.origen} ↗
                </button>
                <span className="nota-cuando">{cuando(nota.creado)}</span>
                <button
                  className="nota-quitar"
                  onClick={() => onQuitar(nota)}
                  aria-label={`Quitar la nota «${nota.texto}»`}
                  title="Quitar la nota"
                >
                  ×
                </button>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
