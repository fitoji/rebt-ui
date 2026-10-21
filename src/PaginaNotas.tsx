// La página de notas: todas las guardadas, de las dos vistas, para poder leerlas enteras
// y saltar a cada una.

import { useMemo, useState } from 'react'
import InicioBoton from './InicioBoton.tsx'
import { COLORES } from './notas.ts'
import type { ColorNota, Nota } from './notas.ts'

/** "hace 3 días", "hoy"… para la fecha de cada nota. */
function cuando(creado: number): string {
  const dias = Math.floor((Date.now() - creado) / 86_400_000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  return new Date(creado).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Cómo se llaman los colores en el filtro, en plural. */
const ETIQUETAS: Record<ColorNota, string> = {
  amarillo: 'Amarillas',
  verde: 'Verdes',
  rojo: 'Rojas',
}

export default function PaginaNotas({
  notas,
  onInicio,
  onIr,
  onQuitar,
  onColor,
}: {
  notas: Nota[]
  onInicio: () => void
  /** Saltar al texto de la nota. */
  onIr: (nota: Nota) => void
  onQuitar: (nota: Nota) => void
  /** Cambiar el color del resaltado. */
  onColor: (nota: Nota, color: ColorNota) => void
}) {
  // De más reciente a más antigua.
  const ordenadas = useMemo(
    () => [...notas].sort((a, b) => b.creado - a.creado),
    [notas],
  )

  // El filtro por color, con cuántas hay de cada uno.
  const [filtro, setFiltro] = useState<ColorNota | 'todas'>('todas')
  const conteos = useMemo(() => {
    const c: Record<ColorNota, number> = { amarillo: 0, verde: 0, rojo: 0 }
    for (const n of notas) c[n.color]++
    return c
  }, [notas])
  const visibles = filtro === 'todas' ? ordenadas : ordenadas.filter((n) => n.color === filtro)

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

      {notas.length === 0 ? (
        <p className="vacio">
          Subrayá un trozo del texto de una guía o de un bloque del reglamento y guardalo como
          nota: aparecerá acá.
        </p>
      ) : (
        <>
          <div className="notas-filtro" role="group" aria-label="Filtrar las notas por color">
            <button
              className={filtro === 'todas' ? 'nota-ficha activa' : 'nota-ficha'}
              aria-pressed={filtro === 'todas'}
              onClick={() => setFiltro('todas')}
            >
              Todas ({notas.length})
            </button>
            {COLORES.map((color) => (
              <button
                key={color}
                className={filtro === color ? 'nota-ficha activa' : 'nota-ficha'}
                aria-pressed={filtro === color}
                onClick={() => setFiltro(color)}
              >
                <span className={`nota-color nota-color-${color}`} aria-hidden="true" />
                {ETIQUETAS[color]} ({conteos[color]})
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p className="vacio">
              {filtro === 'todas' ? 'No hay notas.' : `No hay notas ${ETIQUETAS[filtro].toLowerCase()}.`}
            </p>
          ) : (
            <ul className="pagina-notas-lista">
              {visibles.map((nota) => (
                <li key={nota.id} className={`nota-fila nota-fila-${nota.color}`}>
                  <blockquote className="nota-citada">{nota.texto}</blockquote>
                  {(nota.antes || nota.despues) && (
                    <p className="nota-contexto">
                      {nota.antes && <span className="nota-antes">…{nota.antes}</span>}
                      <mark className={`nota nota-${nota.color}`}>{nota.texto}</mark>
                      {nota.despues && <span className="nota-despues">{nota.despues}…</span>}
                    </p>
                  )}
                  <footer className="nota-pie">
                    <button className="nota-ir" onClick={() => onIr(nota)} title="Ir al texto">
                      {nota.titulo || nota.origen} ↗
                    </button>
                    <span className="nota-colores" role="group" aria-label="Color de la nota">
                      {COLORES.map((color) => (
                        <button
                          key={color}
                          className={`nota-color nota-color-${color}`}
                          aria-pressed={nota.color === color}
                          aria-label={`Poner la nota en ${color}`}
                          title={color}
                          onClick={() => onColor(nota, color)}
                        />
                      ))}
                    </span>
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
        </>
      )}
    </div>
  )
}
