import { useCallback, useEffect, useMemo, useState } from 'react'
import { fold } from './parse.js'
import InicioBoton from './InicioBoton.jsx'
import { loadDocumento, loadIndice } from './guia/api.js'
import { renderDocument } from './guia/markdown.js'
import { officialPdfUrl, resolveGuiaUrl } from './guia/urls.js'

function useIndice() {
  const [state, setState] = useState({ status: 'loading' })

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    loadIndice().then(
      (indice) => setState({ status: 'ok', indice }),
      (error) => setState({ status: 'error', error }),
    )
  }, [])

  useEffect(reload, [reload])
  return [state, reload]
}

function IndicadorError({ error, onReintentar }) {
  return (
    <div className="pantalla error" role="alert">
      <h1>No se pudo leer el índice de la guía</h1>
      <p>{error.message}</p>
      <p>
        La guía se sirve desde <code>/guia/</code>. Si estás en desarrollo, comprueba que el
        servidor de Vite está en marcha; si acabas de regenerar el corpus, reintenta.
      </p>
      <button onClick={onReintentar}>Reintentar</button>
    </div>
  )
}

/* ------------------------------------------------------------------ índice */

function GuiaIndice({ indice, onSelect, onInicio }) {
  const [query, setQuery] = useState('')

  const documentos = indice.documentos ?? []
  const q = query.trim()
  const rows = useMemo(() => {
    if (q.length < 2) return documentos.map((doc) => ({ doc }))
    const needle = fold(q)
    return documentos
      .filter((doc) => fold(doc.titulo).includes(needle) || fold(doc.id).includes(needle))
      .map((doc) => ({ doc }))
  }, [documentos, q])

  return (
    <div className="guia-indice">
      <header className="guia-cab">
        <div className="guia-cab-top">
          <h1 className="marca">Guías técnicas</h1>
          <InicioBoton onInicio={onInicio} />
        </div>
        <p className="sub">
          Las {documentos.length} guías de aplicación del REBT publicadas por el Ministerio de
          Industria y Turismo, convertidas a texto buscable.
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por título o código…"
          aria-label="Filtrar documentos de la guía"
        />
      </header>

      <div className="guia-lista">
        <p className="guia-cuenta" role="status">
          {rows.length === documentos.length
            ? `${documentos.length} documentos`
            : `${rows.length} de ${documentos.length} documentos`}
        </p>
        <ul>
          {rows.map(({ doc }) => (
            <li key={doc.id}>
              <button className="guia-item" onClick={() => onSelect(doc.id)}>
                <span className="guia-item-titulo">{doc.titulo}</span>
                <span className="guia-item-meta">
                  <span className="codigo">{doc.id}</span>
                  {doc.paginas ? <span>{doc.paginas} pág.</span> : null}
                  {doc.tablas ? <span>{doc.tablas} tablas</span> : null}
                  {doc.imgs?.length ? <span>{doc.imgs.length} figs.</span> : null}
                  {doc.edicion ? <span>{doc.edicion}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {rows.length === 0 && <p className="guia-vacio">Ningún documento coincide con «{q}».</p>}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- documento */

function GuiaDocumento({ indice, id, onSelect, onInicio, onVolver }) {
  const [state, setState] = useState({ status: 'loading' })

  const documentos = indice.documentos ?? []
  const doc = documentos.find((d) => d.id === id)
  const fuentePdf = doc?.fuente_pdf

  // El renderer llama a `resolveUrl(href, kind)`, así que aquí hay que ligar el documento:
  // sin esto, `resolveGuiaUrl` recibiría el `kind` en lugar de `{ fuentePdf }` y descartaría
  // todos los enlaces a página del PDF oficial.
  const resolveUrl = useMemo(
    () => (href, kind) => resolveGuiaUrl(href, { fuentePdf }),
    [fuentePdf],
  )

  useEffect(() => {
    let vivo = true
    setState({ status: 'loading' })
    loadDocumento(id).then(
      (src) => {
        if (!vivo) return
        setState({ status: 'ok', ...renderDocument(src, { resolveUrl }) })
      },
      (error) => vivo && setState({ status: 'error', error }),
    )
    return () => {
      vivo = false
    }
  }, [id, resolveUrl])

  const at = documentos.findIndex((d) => d.id === id)
  const prev = documentos[at - 1]
  const next = documentos[at + 1]
  const pdf = officialPdfUrl(doc)

  if (state.status === 'loading') return <p className="pantalla" role="status">Cargando la guía…</p>
  if (state.status === 'error') return <IndicadorError error={state.error} onReintentar={onVolver} />

  const meta = state.frontMatter ?? {}

  return (
    <div className="guia-doc">
      <header className="guia-doc-cab">
        <div className="guia-doc-nav">
          <InicioBoton onInicio={onInicio} />
          <button className="volver" onClick={onVolver}>
            Índice de guías
          </button>
        </div>
        <div className="guia-doc-meta">
          <span className="codigo">{id}</span>
          {meta.edicion ? <span>Edición {meta.edicion}</span> : null}
          {meta.revision ? <span>Rev. {meta.revision}</span> : null}
          {doc?.paginas ? <span>{doc.paginas} pág.</span> : null}
        </div>
        {pdf && (
          <a className="boton boton-pdf" href={pdf} target="_blank" rel="noreferrer noopener">
            Ver PDF original
          </a>
        )}
      </header>

      {/* El HTML lo genera `guia/markdown.js`, que escapa todo el texto y solo emite las
          etiquetas que él mismo construye; ningún href del corpus pasa sin pasar por
          `resolveGuiaUrl`. El corpus es contenido propio y estático. */}
      <article className="markdown" dangerouslySetInnerHTML={{ __html: state.html }} />

      <nav className="guia-nav" aria-label="Documentos anterior y siguiente">
        {prev ? (
          <button onClick={() => onSelect(prev.id)}>
            <span className="guia-nav-dir">← Anterior</span>
            <span className="guia-nav-titulo">{prev.titulo}</span>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button onClick={() => onSelect(next.id)}>
            <span className="guia-nav-dir">Siguiente →</span>
            <span className="guia-nav-titulo">{next.titulo}</span>
          </button>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}

/* --------------------------------------------------------------------- raíz */

export default function Guia({ id, onSelect, onInicio, onVolver }) {
  const [state, reload] = useIndice()

  if (state.status === 'loading') return <p className="pantalla" role="status">Cargando el índice de la guía…</p>
  if (state.status === 'error') return <IndicadorError error={state.error} onReintentar={reload} />

  return (
    <div className="app app-guia">
      {id ? (
        <GuiaDocumento
          indice={state.indice}
          id={id}
          onSelect={onSelect}
          onInicio={onInicio}
          onVolver={onVolver}
        />
      ) : (
        <GuiaIndice indice={state.indice} onSelect={onSelect} onInicio={onInicio} />
      )}
    </div>
  )
}
