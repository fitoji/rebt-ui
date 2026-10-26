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
        <p className="mx-[1.1rem] my-[1rem] text-tinta-2">Subrayá un trozo del texto y guardalo como nota.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {notas.map((nota) => (
            <li key={nota.id} className="flex items-start gap-[0.3rem] py-[0.2rem]">
              <button
                className={`min-w-0 flex-1 overflow-hidden rounded-[4px] border-0 bg-nota-amarillo px-[0.4rem] py-[0.2rem] text-left text-[0.85rem] leading-[1.35] text-tinta cursor-pointer line-clamp-2 hover:brightness-[1.08] ${
                  nota.color === 'verde' ? 'bg-nota-verde' : nota.color === 'rojo' ? 'bg-nota-rojo' : ''
                }`}
                onClick={() => onIr(nota)}
                title="Ir al resaltado en el texto"
              >
                «{nota.tags.includes('tablas') ? 'Tabla' : nota.texto}»
              </button>
              <button
                className="flex-none cursor-pointer rounded-[4px] border-0 bg-transparent px-[0.35rem] py-0 text-[1rem] leading-[1.2] text-tinta-2 hover:bg-plano hover:text-fase"
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
      <button className="mt-[0.4rem] cursor-pointer rounded-[4px] border-0 bg-transparent px-[0.35rem] py-[0.2rem] text-left text-[0.85rem] text-neutro hover:bg-plano hover:text-fase" onClick={onVerTodas}>
        Ver todas las notas →
      </button>
    </Accordion>
  )
}
