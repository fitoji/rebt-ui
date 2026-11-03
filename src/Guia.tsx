import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, RefObject } from 'react'
import { gridToCsv, gridToMarkdown, gridToTsv, tableGrid } from './parse.ts'
import { AVISO_CSV, AVISO_COPIAR, AVISO_ERROR, AVISO_MARKDOWN, copiarAlPortapapeles, descargar } from './tablas.ts'
import InicioBoton from './InicioBoton.tsx'
import TemaBoton from './TemaBoton.tsx'
import { useTheme } from './useTheme.ts'
import type { Tema } from './useTheme.ts'
import { loadDocumento, loadIndice } from './guia/api.ts'
import { renderDocument } from './guia/markdown.ts'
import { officialPdfUrl, resolveGuiaUrl } from './guia/urls.ts'
import { CLAVE_GUIA, useFavoritos } from './favoritos.ts'
import type { Favoritos } from './favoritos.ts'
import BotonFavorito from './BotonFavorito.tsx'
import BotonNota, { useSeleccion } from './BotonNota.tsx'
import CajaNotas from './CajaNotas.tsx'
import SidebarGuia from './SidebarGuia.tsx'
import { aplicarResaltados, crearNota, COLOR_POR_DEFECTO } from './notas.ts'
import type { ControlNotas, Nota } from './notas.ts'
import type { DocumentoGuia, IndiceGuia } from './tipos.ts'
import BotonBarra from './BotonBarra.tsx'
import { useRevelar } from './hooks/useRevelar.ts'
import { SidebarInset } from '@/components/ui/sidebar.tsx'

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
    <div className="mx-auto my-[12vh] max-w-[36rem] px-[1rem] font-lectura" role="alert">
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

function GuiaInicio({
  indice,
  onInicio,
  theme,
  onToggleTheme,
}: {
  indice: IndiceGuia
  onInicio: () => void
  theme: Tema
  onToggleTheme: () => void
}) {
  const documentos = indice.documentos ?? []
  return (
    <div className="lamina px-[1.5rem] pt-[2.5rem] pb-[4rem]">
      <div className="mb-[1.6rem] flex items-baseline justify-between gap-[0.75rem] border-b border-linea pb-[0.6rem]">
        <InicioBoton onInicio={onInicio} />
        <TemaBoton tema={theme} onToggle={onToggleTheme} />
      </div>
      <h1 className="mt-0 mb-[0.4rem] text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.01em]">Guías técnicas</h1>
      <p className="mt-0 mb-[1.4rem] max-w-[38rem] font-lectura text-[1.05rem] leading-[1.55] text-tinta-2">
        Las {documentos.length} guías de aplicación del REBT publicadas por el Ministerio de
        Industria y Turismo, convertidas a texto buscable.
      </p>
      {(indice.total_paginas || indice.total_tablas) && (
        <dl className="cajetin mb-[1.6rem]">
          <div>
            <dt className="rotulo">Documentos</dt>
            <dd className="dato m-0 text-[0.95rem] text-tinta">{indice.total_documentos ?? documentos.length}</dd>
          </div>
          <div>
            <dt className="rotulo">Páginas</dt>
            <dd className="dato m-0 text-[0.95rem] text-tinta">{indice.total_paginas ?? '—'}</dd>
          </div>
          <div>
            <dt className="rotulo">Tablas</dt>
            <dd className="dato m-0 text-[0.95rem] text-tinta">{indice.total_tablas ?? '—'}</dd>
          </div>
        </dl>
      )}
      <p className="mt-0 max-w-[36rem] font-lectura text-[1rem] leading-[1.55] text-tinta-2">
        Elegí un documento en el índice, o filtralo por título o código. Cada tabla se puede
        copiar a hoja de cálculo, copiar como Markdown o descargar como CSV, y lo que subrayes
        queda guardado como nota.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- documento */

function GuiaDocumento({
  indice,
  id,
  nota,
  articulo,
  onSelect,
  onInicio,
  onVolver,
  theme,
  onToggleTheme,
  favoritos,
  notas,
  onVerNotas,
}: {
  indice: IndiceGuia
  id: string
  /** La nota a la que hay que llevar la vista, si viene de la página de notas. */
  nota?: string
  /** El artículo, compartido con la barra lateral para poder ir a una nota. */
  articulo: RefObject<HTMLElement>
  onSelect: (id: string) => void
  onInicio: () => void
  onVolver: () => void
  theme: Tema
  onToggleTheme: () => void
  favoritos: Favoritos
  notas: ControlNotas
  /** Abrir la página con todas las notas. */
  onVerNotas: () => void
}) {
  const [state, setState] = useState<EstadoDocumento>({ status: 'loading' })
  const [notasAbierto, setNotasAbierto] = useState(true)

  const documentos: DocumentoGuia[] = indice.documentos ?? []
  const doc = documentos.find((d) => d.id === id)
  const fuentePdf = doc?.fuente_pdf

  // Las notas de este documento, y el botón que aparece al seleccionar texto.
  const notasDoc = useMemo(
    () => notas.notas.filter((n) => n.origen === id),
    [notas.notas, id],
  )
  const { seleccion, limpiar } = useSeleccion(articulo)

  // El texto de la guía se inyecta como HTML y React no lo controla, así que los
  // resaltados se aplican directamente sobre el DOM, y se vuelven a aplicar si el
  // documento o las notas cambian.
  useEffect(() => {
    const contenedor = articulo.current
    if (!contenedor) return
    const marcas = aplicarResaltados(contenedor, notasDoc)
    // Si se viene de la página de notas, se lleva la vista al resaltado.
    if (!nota) return
    const mark = marcas.find((m) => m.dataset.nota === nota)
    if (!mark) return
    mark.scrollIntoView({ block: 'center' })
    mark.classList.add('nota-aviso')
  }, [state.status === 'ok' ? state.html : '', notasDoc, nota])

  // El texto de la guía que entra al scrollear. La clave es el HTML: cuando llega otro
  // documento hay otro texto y la cascada se prepara de nuevo.
  useRevelar(articulo, state.status === 'ok' ? state.html : '')

  /** Ir al resaltado de una nota. */
  const irANota = (nota: Nota) => {
    const mark = articulo.current?.querySelector(`mark.nota[data-nota="${nota.id}"]`)
    if (!(mark instanceof HTMLElement)) return
    mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
    mark.classList.remove('nota-aviso')
    // Un segundo pulso para que se vea a dónde se fue.
    void mark.offsetWidth
    mark.classList.add('nota-aviso')
  }

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

      if (accion === 'nota') {
        notas.agregar(
          crearNota('guia', id, doc?.titulo ?? id, gridToMarkdown(grid), '', '', Date.now(), COLOR_POR_DEFECTO, ['tablas']),
        )
        avisar(aviso, 'Agregada a notas')
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
    [id, notas, doc?.titulo],
  )

  if (state.status === 'loading') {
    return (
      <div className="lamina px-[1.5rem] pt-[2rem] pb-[4rem]" role="status">
        <span className="sr-only">Cargando la guía…</span>
        <div aria-hidden="true" className="medida">
          <span className="hueso mb-[1.4rem] block h-[2rem] w-[60%]" />
          {['96%', '100%', '92%', '98%', '88%', '74%', '97%', '91%', '99%', '56%'].map((ancho, i) => (
            <span key={i} className="hueso mb-[0.55rem] block h-[0.95rem]" style={{ width: ancho }} />
          ))}
        </div>
      </div>
    )
  }
  if (state.status === 'error') return <IndicadorError error={state.error} onReintentar={onVolver} />

  const meta = state.frontMatter ?? {}

  return (
    <div className="animate-vista-entra lamina px-[1.5rem] pt-[2rem] pb-[4rem]">
      <header className="mb-[1.6rem] border-b border-linea pb-[1.2rem]">
        <div className="flex flex-wrap items-center gap-[0.4rem_1rem]">
          <InicioBoton onInicio={onInicio} />
          <button
            className="py-[0.3rem] text-[0.95rem] text-neutro underline decoration-1 underline-offset-[0.2em] hover:text-fase"
            onClick={onVolver}
          >
            Índice de guías
          </button>
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
          <span className="ml-auto flex items-center gap-[0.5rem]">
            {pdf && (
              <a
                className="rounded-[4px] bg-neutro px-[0.9rem] py-[0.4rem] text-[0.9rem] text-hoja no-underline transition-[filter,transform] duration-200 ease-plano hover:-translate-y-px hover:brightness-[1.1]"
                href={pdf}
                target="_blank"
                rel="noreferrer noopener"
              >
                Ver PDF original
              </a>
            )}
            {/* Se puede marcar el documento mientras se lee, sin volver al índice. */}
            <BotonFavorito id={id} titulo={doc?.titulo ?? id} favoritos={favoritos} />
          </span>
        </div>

        {/* La ficha del documento: código, edición, revisión y páginas, en el mismo cajetín
            que el resto de la app. El código va primero porque es lo que se cita. */}
        <div className="mt-[1rem]">
          <dl className="cajetin">
            <div>
              <dt className="rotulo">Documento</dt>
              <dd className="dato m-0 truncate text-[0.82rem] text-neutro">{id}</dd>
            </div>
            <div>
              <dt className="rotulo">Edición</dt>
              <dd className="dato m-0 truncate text-[0.82rem] text-tinta">{meta.edicion ?? '—'}</dd>
            </div>
            <div>
              <dt className="rotulo">Revisión</dt>
              <dd className="dato m-0 truncate text-[0.82rem] text-tinta">{meta.revision ?? '—'}</dd>
            </div>
            <div>
              <dt className="rotulo">Páginas</dt>
              <dd className="dato m-0 text-[0.82rem] text-tinta">{doc?.paginas ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* El acordeón de notas va arriba del texto: es donde se llega al resaltado. Va en
          la misma columna de lectura que el artículo, no en todo el ancho de la lámina. */}
      <div className="medida">
        <CajaNotas
          notas={notasDoc}
          total={notas.notas.length}
          abierto={notasAbierto}
          onAlternar={() => setNotasAbierto((v) => !v)}
          onIr={irANota}
          onQuitar={(nota) => notas.quitar(nota.id)}
          onVerTodas={onVerNotas}
        />
      </div>

      {/* El HTML lo genera `guia/markdown.ts`, que escapa todo el texto y solo emite las
          etiquetas que él mismo construye; ningún href del corpus pasa sin pasar por
          `resolveGuiaUrl`. El corpus es contenido propio y estático. */}
      <article
        className="markdown lectura"
        ref={articulo}
        onClick={alPulsarTabla}
        dangerouslySetInnerHTML={{ __html: state.html }}
      />

      <BotonNota
        seleccion={seleccion}
        onGuardar={(sel, color) => {
          notas.agregar(
            crearNota(
              'guia',
              id,
              doc?.titulo ?? id,
              sel.texto,
              sel.antes,
              sel.despues,
              Date.now(),
              color,
            ),
          )
          limpiar()
        }}
      />

      <nav
        className="medida mt-[3rem] grid grid-cols-2 gap-[1rem] border-t border-linea pt-[1.5rem] max-[700px]:grid-cols-1"
        aria-label="Documentos anterior y siguiente"
      >
        {prev ? (
          <button
            className="flex flex-col gap-[0.25rem] rounded-[4px] border border-linea bg-hoja p-[0.8rem] text-left transition-[border-color,background-color,transform] duration-200 ease-plano hover:-translate-y-px hover:border-neutro hover:bg-neutro-fondo"
            onClick={() => onSelect(prev.id)}
          >
            <span className="rotulo">← Anterior</span>
            <span className="text-[1rem] leading-[1.25]">{prev.titulo}</span>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button
            className="flex flex-col items-end gap-[0.25rem] rounded-[4px] border border-linea bg-hoja p-[0.8rem] text-right transition-[border-color,background-color,transform] duration-200 ease-plano hover:-translate-y-px hover:border-neutro hover:bg-neutro-fondo"
            onClick={() => onSelect(next.id)}
          >
            <span className="rotulo">Siguiente →</span>
            <span className="text-[1rem] leading-[1.25]">{next.titulo}</span>
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
  nota,
  onSelect,
  onInicio,
  onVolver,
  onVerNotas,
  notas,
}: {
  id: string | null
  /** La nota a la que hay que llevar la vista, si viene de la página de notas. */
  nota?: string
  onSelect: (id: string) => void
  onInicio: () => void
  onVolver: () => void
  /** Abrir la página con todas las notas. */
  onVerNotas: () => void
  /** Las notas del usuario: las tiene el Router, para que las vistas las compartan. */
  notas: ControlNotas
}) {
  const [state, reload] = useIndice()
  const { theme, toggle } = useTheme()
  // Los favoritos viven en la raíz para que el índice y el documento compartan el estado:
  // marcar en el documento se ve al instante en el índice, y al revés.
  const favoritos = useFavoritos(CLAVE_GUIA)
  // Las notas las trae el Router: es el único que las tiene, así que la página con todas
  // las ve al día sin importar desde dónde se guardó una.
  // El cajón de la barra lateral, en el móvil.
  // El filtro del índice de la guía.
  const [query, setQuery] = useState('')
  // El artículo, para poder ir a una nota desde la barra lateral.
  const articulo = useRef<HTMLElement>(null)

  /** Ir a una nota: si es de este documento, al resaltado; si no, a su documento. */
  const irANota = useCallback(
    (nota: Nota) => {
      const mark = articulo.current?.querySelector(`mark.nota[data-nota="${nota.id}"]`)
      if (mark instanceof HTMLElement) {
        mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
        mark.classList.remove('nota-aviso')
        // Un segundo pulso para que se vea a dónde se fue.
        void mark.offsetWidth
        mark.classList.add('nota-aviso')
        return
      }
      // La nota es de otro documento: se abre.
      onSelect(nota.origen)
    },
    [onSelect],
  )

  if (state.status === 'loading') return <p className="mx-auto my-[12vh] max-w-[36rem] px-[1rem] font-lectura" role="status">Cargando el índice de la guía…</p>
  if (state.status === 'error') return <IndicadorError error={state.error} onReintentar={reload} />

  const documentos = state.indice.documentos ?? []
  // Las notas del documento abierto; y si no hay ninguno abierto, todas: desde la barra
  // lateral sirven para consultarlas.
  const notasVisibles = id ? notas.notas.filter((n) => n.origen === id) : notas.notas

  return (
    <>
      <SidebarGuia
        documentos={documentos}
        activo={id ?? undefined}
        onSelect={onSelect}
        query={query}
        setQuery={setQuery}
        onInicio={onInicio}
        theme={theme}
        onToggleTheme={toggle}
        favoritos={favoritos}
        notas={notasVisibles}
        totalNotas={notas.notas.length}
        onIrANota={irANota}
        onQuitarNota={(n) => notas.quitar(n.id)}
        onVerTodasNotas={onVerNotas}
      />
      <SidebarInset className="h-[100svh] overflow-hidden">
        <BotonBarra />
        <main className="min-h-0 flex-1 overflow-y-auto">
        {id ? (
          <GuiaDocumento
            indice={state.indice}
            id={id}
            nota={nota}
            articulo={articulo}
            onSelect={onSelect}
            onInicio={onInicio}
            onVolver={onVolver}
            theme={theme}
            onToggleTheme={toggle}
            favoritos={favoritos}
            notas={notas}
            onVerNotas={onVerNotas}
          />
        ) : (
          <GuiaInicio
            indice={state.indice}
            onInicio={onInicio}
            theme={theme}
            onToggleTheme={toggle}
          />
        )}
        </main>
      </SidebarInset>
    </>
  )
}
