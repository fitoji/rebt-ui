// El acordeón «Notas»: los trozos de texto subrayados en lo que se está leyendo.
//
// Es el mismo componente en las dos vistas: la lista de notas, el botón para ir al
// resaltado y el que la borra.

import Accordion from './Accordion.tsx'
import type { Nota } from './notas.ts'

export default function CajaNotas({
  notas,
  total,
  abierto,
  onAlternar,
  onIr,
  onQuitar,
  onVerTodas,
}: {
  notas: Nota[]
  /** Cuántas hay en total, en las dos vistas: el enlace va a la página con todas. */
  total: number
  abierto: boolean
  onAlternar: () => void
  /** Ir al resaltado del texto. */
  onIr: (nota: Nota) => void
  /** Borrar la nota (y su resaltado). */
  onQuitar: (nota: Nota) => void
  /** Abrir la página con todas las notas. */
  onVerTodas: () => void
}) {
  return (
    <Accordion title={`Notas (${total})`} open={abierto} onToggle={onAlternar}>
      {notas.length === 0 ? (
        <p className="vacio">Subrayá un trozo del texto y guardalo como nota.</p>
      ) : (
        <ul className="lista-notas">
          {notas.map((nota) => (
            <li key={nota.id}>
              <button
                className={`nota-texto nota-texto-${nota.color}`}
                onClick={() => onIr(nota)}
                title="Ir al resaltado en el texto"
              >
                «{nota.texto}»
              </button>
              <button
                className="nota-quitar"
                onClick={() => onQuitar(nota)}
                aria-label={`Quitar la nota «${nota.texto}»`}
                title="Quitar la nota"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="notas-todas" onClick={onVerTodas}>
        Ver todas las notas →
      </button>
    </Accordion>
  )
}
