import { useEffect, useRef, useState } from 'react'
import { getBlock, NORMA_ID } from './api.js'
import { formatDate, splitTitle } from './parse.js'
import { Highlight, Item } from './render.jsx'

function useBlock(id, attempt) {
  const [state, setState] = useState({ status: 'loading' })
  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    getBlock(id).then(
      (data) => live && setState({ status: 'ok', data }),
      (error) => live && setState({ status: 'error', error }),
    )
    return () => {
      live = false
    }
  }, [id, attempt])
  return state
}

export default function Reader({ entry, prev, next, onSelect, highlight }) {
  const [attempt, setAttempt] = useState(0)
  const { status, data, error } = useBlock(entry.id, attempt)
  const [versionIdx, setVersionIdx] = useState(0)
  const top = useRef(null)

  useEffect(() => setVersionIdx(0), [entry.id])

  // Al abrir desde una búsqueda, lleva la vista a la primera coincidencia
  useEffect(() => {
    if (status !== 'ok') return
    const first = highlight.length >= 3 && top.current?.querySelector('mark')
    if (first) first.scrollIntoView({ block: 'center' })
    else top.current?.scrollTo?.(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, entry.id, versionIdx])

  const { itc, nombre } = splitTitle(entry.titulo)
  const version = data?.versions[versionIdx]
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
              {data.versions.length > 1 ? (
                <>
                  <span>Versión</span>
                  <select value={versionIdx} onChange={(e) => setVersionIdx(+e.target.value)}>
                    {data.versions.map((v, i) => (
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

      {status === 'loading' && <p className="estado" role="status">Cargando el texto…</p>}
      {status === 'error' && (
        <div className="estado error" role="alert">
          <p>No se pudo cargar este bloque.</p>
          <p>{error.message}</p>
          <button onClick={() => setAttempt((n) => n + 1)}>Reintentar</button>
        </div>
      )}

      {status === 'ok' && (
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
