// La página de notas: todas las guardadas, de las dos vistas, para poder leerlas enteras
// y saltar a cada una.

import { useMemo, useState } from 'react'
import InicioBoton from './InicioBoton.tsx'
import { COLORES, normalizaTag } from './notas.ts'
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

/** Lo que se está filtrando: nada, un color o una etiqueta. */
type Filtro = { tipo: 'todas' } | { tipo: 'color'; valor: ColorNota } | { tipo: 'tag'; valor: string }

export default function PaginaNotas({
  notas,
  onInicio,
  onIr,
  onQuitar,
  onColor,
  onEtiquetar,
  onDesetiquetar,
}: {
  notas: Nota[]
  onInicio: () => void
  /** Saltar al texto de la nota. */
  onIr: (nota: Nota) => void
  onQuitar: (nota: Nota) => void
  /** Cambiar el color del resaltado. */
  onColor: (nota: Nota, color: ColorNota) => void
  /** Poner una etiqueta. */
  onEtiquetar: (nota: Nota, tag: string) => void
  /** Quitar una etiqueta. */
  onDesetiquetar: (nota: Nota, tag: string) => void
}) {
  // De más reciente a más antigua.
  const ordenadas = useMemo(
    () => [...notas].sort((a, b) => b.creado - a.creado),
    [notas],
  )

  const [filtro, setFiltro] = useState<Filtro>({ tipo: 'todas' })
  // La nota que se está etiquetando ahora mismo, y el texto del campo.
  const [editando, setEditando] = useState<string | null>(null)
  const [texto, setTexto] = useState('')

  const conteos = useMemo(() => {
    const c: Record<ColorNota, number> = { amarillo: 0, verde: 0, rojo: 0 }
    for (const n of notas) c[n.color]++
    return c
  }, [notas])

  // Todas las etiquetas que hay, con cuántas notas tienen cada una.
  const etiquetas = useMemo(() => {
    const c = new Map<string, number>()
    for (const n of notas) for (const t of n.tags) c.set(t, (c.get(t) ?? 0) + 1)
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [notas])

  // Si se quita la última nota de una etiqueta, el filtro queda apuntando a una etiqueta
  // que ya no existe: se vuelve a "todas" en vez de dejar la lista vacía sin salida.
  const filtroVigente: Filtro =
    filtro.tipo === 'tag' && !etiquetas.some(([t]) => t === filtro.valor)
      ? { tipo: 'todas' }
      : filtro

  const visibles = useMemo(() => {
    if (filtroVigente.tipo === 'todas') return ordenadas
    if (filtroVigente.tipo === 'color') {
      return ordenadas.filter((n) => n.color === filtroVigente.valor)
    }
    return ordenadas.filter((n) => n.tags.includes(filtroVigente.valor))
  }, [ordenadas, filtroVigente])

  const alternarFiltro = (nuevo: Filtro) => {
    setFiltro((actual) =>
      actual.tipo === nuevo.tipo &&
      (actual.tipo === 'todas' ||
        (actual.tipo === 'color' && nuevo.tipo === 'color' && actual.valor === nuevo.valor) ||
        (actual.tipo === 'tag' && nuevo.tipo === 'tag' && actual.valor === nuevo.valor))
        ? { tipo: 'todas' }
        : nuevo,
    )
  }

  const guardarEtiqueta = (nota: Nota) => {
    const t = normalizaTag(texto)
    if (t) onEtiquetar(nota, t)
    setTexto('')
    setEditando(null)
  }

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
              className={filtro.tipo === 'todas' ? 'nota-ficha activa' : 'nota-ficha'}
              aria-pressed={filtro.tipo === 'todas'}
              onClick={() => alternarFiltro({ tipo: 'todas' })}
            >
              Todas ({notas.length})
            </button>
            {COLORES.map((color) => (
              <button
                key={color}
                className={
                  filtro.tipo === 'color' && filtro.valor === color ? 'nota-ficha activa' : 'nota-ficha'
                }
                aria-pressed={filtro.tipo === 'color' && filtro.valor === color}
                onClick={() => alternarFiltro({ tipo: 'color', valor: color })}
              >
                <span className={`nota-color nota-color-${color}`} aria-hidden="true" />
                {ETIQUETAS[color]} ({conteos[color]})
              </button>
            ))}
            {etiquetas.length > 0 && <span className="notas-filtro-separador" aria-hidden="true" />}
            {etiquetas.map(([tag, n]) => (
              <button
                key={tag}
                className={
                  filtro.tipo === 'tag' && filtro.valor === tag ? 'nota-ficha activa' : 'nota-ficha'
                }
                aria-pressed={filtro.tipo === 'tag' && filtro.valor === tag}
                onClick={() => alternarFiltro({ tipo: 'tag', valor: tag })}
                title={`Ver las notas con la etiqueta «${tag}»`}
              >
                #{tag} ({n})
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p className="vacio">
              {filtro.tipo === 'todas'
                ? 'No hay notas.'
                : filtro.tipo === 'color'
                  ? `No hay notas ${ETIQUETAS[filtro.valor].toLowerCase()}.`
                  : `No hay notas con la etiqueta «${filtro.valor}».`}
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

                  <div className="nota-tags">
                    {nota.tags.map((tag) => (
                      <span key={tag} className="nota-etiqueta">
                        <button onClick={() => alternarFiltro({ tipo: 'tag', valor: tag })} title="Ver las notas con esta etiqueta">
                          #{tag}
                        </button>
                        <button
                          onClick={() => onDesetiquetar(nota, tag)}
                          aria-label={`Quitar la etiqueta «${tag}»`}
                          title="Quitar la etiqueta"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {editando === nota.id ? (
                      <span className="nota-etiqueta-editando">
                        <input
                          autoFocus
                          value={texto}
                          list="notas-etiquetas"
                          placeholder="nombre de la etiqueta"
                          aria-label="Nombre de la etiqueta"
                          onChange={(e) => setTexto(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              guardarEtiqueta(nota)
                            }
                            if (e.key === 'Escape') {
                              setTexto('')
                              setEditando(null)
                            }
                          }}
                        />
                      </span>
                    ) : (
                      <button
                        className="nota-etiqueta-agregar"
                        onClick={() => {
                          setTexto('')
                          setEditando(nota.id)
                        }}
                      >
                        + etiqueta
                      </button>
                    )}
                  </div>

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

          {/* Las etiquetas que ya existen, para no escribir las mismas de dos maneras. */}
          <datalist id="notas-etiquetas">
            {etiquetas.map(([tag]) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </>
      )}
    </div>
  )
}
