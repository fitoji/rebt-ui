import { useEffect, useRef, useState } from 'react'
import { getBlock, NORMA_ID } from './api.ts'
import { formatDate, splitTitle } from './parse.ts'
import { Highlight, Item } from './render.tsx'
import type { Bloque, BloqueConContenido } from './tipos.ts'

/** El bloque del BOE: cargando, cargado o con error. */
type EstadoBloque =
  | { status: 'loading' }
  | { status: 'ok'; data: BloqueConContenido }
  | { status: 'error'; error: Error }

function useBlock(id: string, attempt: number): EstadoBloque {
  const [state, setState] = useState<EstadoBloque>({ status: 'loading' })
  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    getBlock(id).then(
      (data) => live && setState({ status: 'ok', data }),
      (error: Error) => live && setState({ status: 'error', error }),
    )
    return () => {
      live = false
    }
  }, [id, attempt])
  return state
}

interface ReaderProps {
  entry: Bloque
  prev?: Bloque
  next?: Bloque
  onSelect: (id: string) => void
  highlight: string
}

export default function Reader({ entry, prev, next, onSelect, highlight }: ReaderProps) {
  const [attempt, setAttempt] = useState(0)
  const estado = useBlock(entry.id, attempt)
  const [versionIdx, setVersionIdx] = useState(0)
  const top = useRef<HTMLElement | null>(null)

  useEffect(() => setVersionIdx(0), [entry.id])

  // Al abrir desde una búsqueda, lleva la vista a la primera coincidencia
  useEffect(() => {
    if (estado.status !== 'ok') return
    const first = highlight.length >= 3 && top.current?.querySelector('mark')
    if (first) first.scrollIntoView({ block: 'center' })
    else top.current?.scrollTo?.(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.status, entry.id, versionIdx])

  const { itc, nombre } = splitTitle(entry.titulo)
  const versiones = estado.status === 'ok' ? estado.data.versions : []
  const version = versiones[versionIdx]
  let tableCount = 0

  return (
    <main className="lector" ref={top} tabIndex={-1}>
      <header className="cabecera">
        <h1>
          {itc && <span className="itc">ITC-{itc}</span>}
          {nombre}
        </h1>
        <div className="meta">
          {version?.vigencia && (
            <label className="version">
              {versiones.length > 1 ? (
                <>
                  <span>Versión</span>
                  <select value={versionIdx} onChange={(e) => setVersionIdx(+e.target.value)}>
                    {versiones.map((v, i) => (
                      <option key={v.vigencia + i} value={i}>
                        Vigente desde {formatDate(v.vigencia)}
                        {i === 0 ? ' (actual)' : ''}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <span>Vigente desde {formatDate(version.vigencia)}</span>
              )}
            </label>
          )}
          <a
            href={`https://www.boe.es/buscar/act.php?id=${NORMA_ID}#${encodeURIComponent(entry.id)}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir en boe.es
          </a>
        </div>
      </header>

      {estado.status === 'loading' && <p className="estado" role="status">Cargando el texto…</p>}
      {estado.status === 'error' && (
        <div className="estado error" role="alert">
          <p>No se pudo cargar este bloque.</p>
          <p>{estado.error.message}</p>
          <button onClick={() => setAttempt((n) => n + 1)}>Reintentar</button>
        </div>
      )}

      {estado.status === 'ok' && (
        <Highlight.Provider value={highlight}>
          <article className="texto">
            {version.items.length === 0 && <p className="estado">Este bloque no tiene texto.</p>}
            {version.items.map((item, i) => (
              <Item
                key={i}
                item={item}
                tableName={`${itc ? 'ITC-' + itc : entry.id}_t${String(
                  item.kind === 'table' ? ++tableCount : tableCount,
                ).padStart(2, '0')}`}
              />
            ))}
          </article>
        </Highlight.Provider>
      )}

      <nav className="pasos" aria-label="Bloque anterior y siguiente">
        {prev ? (
          <button onClick={() => onSelect(prev.id)}>
            <small>Anterior</small>
            {splitTitle(prev.titulo).itc ? `ITC-${splitTitle(prev.titulo).itc}. ` : ''}
            {splitTitle(prev.titulo).nombre}
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button onClick={() => onSelect(next.id)} className="sig">
            <small>Siguiente</small>
            {splitTitle(next.titulo).itc ? `ITC-${splitTitle(next.titulo).itc}. ` : ''}
            {splitTitle(next.titulo).nombre}
          </button>
        )}
      </nav>
    </main>
  )
}
