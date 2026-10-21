import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { fold, gridToCsv, gridToMarkdown, gridToTsv, tableGrid } from './parse.ts'
import { AVISO_CSV, AVISO_COPIAR, AVISO_ERROR, AVISO_MARKDOWN, copiarAlPortapapeles, descargar } from './tablas.ts'
import InicioBoton from './InicioBoton.tsx'
import TemaBoton from './TemaBoton.tsx'
import { useTheme } from './useTheme.ts'
import type { Tema } from './useTheme.ts'
import { loadDocumento, loadIndice } from './guia/api.ts'
import { renderDocument } from './guia/markdown.ts'
import { officialPdfUrl, resolveGuiaUrl } from './guia/urls.ts'
import type { DocumentoGuia, IndiceGuia } from './tipos.ts'

/** El índice de la guía: cargando, cargado o con error. */
type EstadoIndice =
  | { status: 'loading' }
  | { status: 'ok'; indice: IndiceGuia }
  | { status: 'error'; error: Error }

/** Un documento de la guía, ya renderizado a HTML. */
type EstadoDocumento =
  | { status: 'loading' }
  | { status: 'ok'; frontMatter: Record<string, string>; html: string }
  | { status: 'error'; error: Error }

// El aviso de cada tabla se pinta en el HTML inyectado, que React no controla: se escribe
// directamente en el DOM y se borra a los 1,6 s, como en el lector del REBT.
const avisos = new WeakMap<Element, number>()

function avisar(span: Element | null | undefined, mensaje: string): void {
  if (!span) return
  span.textContent = mensaje
  window.clearTimeout(avisos.get(span))
  avisos.set(span, window.setTimeout(() => { span.textContent = '' }, 1600))
}

// El conversor nombra cada tabla (`<!-- tabla: ../tablas/BT-03_t01.csv -->`) y ese nombre es
// el del CSV del corpus. Si algún día faltara la marca, se cae al nombre por índice.
function nombreCsv(caja: HTMLElement, id: string): string {
  const nombre = caja.dataset.csv
  if (nombre) return nombre
  const n = Number(caja.dataset.tabla ?? 0)
  return `${id}_t${String(n).padStart(2, '0')}.csv`
}

function useIndice(): [EstadoIndice, () => void] {
  const [state, setState] = useState<EstadoIndice>({ status: 'loading' })

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    loadIndice().then(
      (indice) => setState({ status: 'ok', indice }),
      (error: Error) => setState({ status: 'error', error }),
    )
  }, [])

  useEffect(reload, [reload])
  return [state, reload]
}

function IndicadorError({ error, onReintentar }: { error: Error; onReintentar: () => void }) {
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

function GuiaIndice({
  indice,
  onSelect,
  onInicio,
  theme,
  onToggleTheme,
}: {
  indice: IndiceGuia
  onSelect: (id: string) => void
  onInicio: () => void
  theme: Tema
  onToggleTheme: () => void
}) {
  const [query, setQuery] = useState('')

  const documentos: DocumentoGuia[] = indice.documentos ?? []
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
          <div className="guia-cab-acciones">
            <InicioBoton onInicio={onInicio} />
            <TemaBoton tema={theme} onToggle={onToggleTheme} />
          </div>
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

function GuiaDocumento({
  indice,
  id,
  onSelect,
  onInicio,
  onVolver,
  theme,
  onToggleTheme,
}: {
  indice: IndiceGuia
  id: string
  onSelect: (id: string) => void
  onInicio: () => void
  onVolver: () => void
  theme: Tema
  onToggleTheme: () => void
}) {
  const [state, setState] = useState<EstadoDocumento>({ status: 'loading' })

  const documentos: DocumentoGuia[] = indice.documentos ?? []
  const doc = documentos.find((d) => d.id === id)
  const fuentePdf = doc?.fuente_pdf

  // El renderer llama a `resolveUrl(href, kind)`, así que aquí hay que ligar el documento:
  // sin esto, `resolveGuiaUrl` recibiría el `kind` en lugar de `{ fuentePdf }` y descartaría
  // todos los enlaces a página del PDF oficial.
  const resolveUrl = useMemo(
    () => (href: string, _kind: 'link' | 'image') => resolveGuiaUrl(href, { fuentePdf }),
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
      (error: Error) => vivo && setState({ status: 'error', error }),
    )
    return () => {
      vivo = false
    }
  }, [id, resolveUrl])

  const at = documentos.findIndex((d) => d.id === id)
  const prev = documentos[at - 1]
  const next = documentos[at + 1]
  const pdf = officialPdfUrl(doc)

  // Las tablas de la guía se inyectan como HTML (el renderer del corpus escapa el texto y
  // solo emite las etiquetas que él mismo construye), así que React no les pone manejadores.
  // Un único `onClick` en el artículo cubre los tres botones: el clic sube desde el HTML
  // inyectado hasta el artículo, y de ahí lo recoge React.
  const alPulsarTabla = useCallback(
    async (evento: MouseEvent<HTMLElement>) => {
      const objetivo = evento.target as Element | null
      const boton = objetivo?.closest<HTMLElement>('button[data-accion]')
      const caja = boton?.closest<HTMLElement>('[data-tabla]')
      const tabla = caja?.querySelector('table')
      if (!boton || !caja || !tabla) return

      const grid = tableGrid(tabla)
      const aviso = caja.querySelector('[data-aviso]')
      const accion = boton.dataset.accion

      if (accion === 'csv') {
        descargar(nombreCsv(caja, id), gridToCsv(grid), 'text/csv')
        avisar(aviso, AVISO_CSV)
        return
      }

      const texto = accion === 'markdown' ? gridToMarkdown(grid) : gridToTsv(grid)
      try {
        await copiarAlPortapapeles(texto)
        avisar(aviso, accion === 'markdown' ? AVISO_MARKDOWN : AVISO_COPIAR)
      } catch {
        avisar(aviso, AVISO_ERROR)
      }
    },
    [id],
  )

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
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
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

      {/* El HTML lo genera `guia/markdown.ts`, que escapa todo el texto y solo emite las
          etiquetas que él mismo construye; ningún href del corpus pasa sin pasar por
          `resolveGuiaUrl`. El corpus es contenido propio y estático. */}
      <article
        className="markdown"
        onClick={alPulsarTabla}
        dangerouslySetInnerHTML={{ __html: state.html }}
      />

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

export default function Guia({
  id,
  onSelect,
  onInicio,
  onVolver,
}: {
  id: string | null
  onSelect: (id: string) => void
  onInicio: () => void
  onVolver: () => void
}) {
  const [state, reload] = useIndice()
  const { theme, toggle } = useTheme()

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
          theme={theme}
          onToggleTheme={toggle}
        />
      ) : (
        <GuiaIndice
          indice={state.indice}
          onSelect={onSelect}
          onInicio={onInicio}
          theme={theme}
          onToggleTheme={toggle}
        />
      )}
    </div>
  )
}
