import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { getBlock, NORMA_ID } from './api.ts'
import BarraProgreso from './BarraProgreso.tsx'
import { useRevelar } from './hooks/useRevelar.ts'
import { formatDate, gridToMarkdown, splitTitle } from './parse.ts'
import { Highlight, Item } from './render.tsx'
import BotonNota, { useSeleccion } from './BotonNota.tsx'
import { aplicarResaltados, crearNota, COLOR_POR_DEFECTO } from './notas.ts'
import type { ControlNotas } from './notas.ts'
import type { Bloque, BloqueConContenido } from './tipos.ts'

/** El bloque del BOE: cargando, cargado o con error. */
type EstadoBloque =
  | { status: 'loading' }
  | { status: 'ok'; data: BloqueConContenido }
  | { status: 'error'; error: Error }

function useBlock(id: string, attempt: number, norma: string): EstadoBloque {
  const [state, setState] = useState<EstadoBloque>({ status: 'loading' })
  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    getBlock(id, norma).then(
      (data) => live && setState({ status: 'ok', data }),
      (error: Error) => live && setState({ status: 'error', error }),
    )
    return () => {
      live = false
    }
  }, [id, attempt, norma])
  return state
}

/** Líneas del ancho de la columna de lectura: el hueco que va a llenar el texto. */
const ESQUELETO = ['92%', '100%', '96%', '88%', '98%', '93%', '70%', '97%', '94%', '86%', '99%', '62%']

function EsqueletoTexto() {
  return (
    <div role="status" aria-label="Cargando el texto" className="medida">
      <span className="sr-only">Cargando el texto…</span>
      {ESQUELETO.map((ancho, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="hueso mb-[0.55rem] block h-[0.95rem]"
          style={{ width: ancho }}
        />
      ))}
    </div>
  )
}

interface ReaderProps {
  entry: Bloque
  prev?: Bloque
  next?: Bloque
  onSelect: (id: string) => void
  highlight: string
  /** Las notas del usuario, para poder subrayar este bloque. */
  notas: ControlNotas
  /** El artículo, para resaltar el texto y para ir a una nota. Lo comparte con la barra. */
  articulo: RefObject<HTMLElement>
  /** La nota a la que hay que llevar la vista, si viene de la página de notas. */
  nota?: string
  /** La norma del BOE que se está leyendo. Por defecto, el REBT. */
  normaId?: string
  /**
   * Si el lector deja subrayar. Las notas se guardan por bloque (`origen`) y las normas
   * comparten los mismos ids (`a1`, `ci`, `pr`…), así que en otro documento una nota del
   * REBT caería sobre un texto distinto. Hasta que la nota guarde de qué norma es, ahí no
   * se subraya.
   */
  conNotas?: boolean
}

export default function Reader({
  entry,
  prev,
  next,
  onSelect,
  highlight,
  notas,
  articulo,
  nota,
  normaId = NORMA_ID,
  conNotas = true,
}: ReaderProps) {
  const [attempt, setAttempt] = useState(0)
  const estado = useBlock(entry.id, attempt, normaId)
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

  // Las notas de este bloque y el botón que aparece al seleccionar texto.
  const notasDoc = useMemo(
    () => (conNotas ? notas.notas.filter((n) => n.origen === entry.id) : []),
    [notas.notas, entry.id, conNotas],
  )
  const { seleccion, limpiar } = useSeleccion(articulo)

  // El texto del lector lo renderiza React, a diferencia del de la guía. Para poder
  // resaltarlo sin que React se entere, el artículo se re-monta al cambiar de redacción
  // (`key`): así nunca hay que reconciliar un texto que le partimos al envolverlo.
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
  }, [notasDoc, version?.vigencia, nota])

  // El texto que entra al scrollear. Se ata al artículo: al cambiar de bloque o de
  // redacción hay otro texto y la cascada se prepara de nuevo desde cero.
  useRevelar(articulo, version?.vigencia)

  return (
    <main
      className="lector animate-vista-entra overflow-y-auto px-[clamp(1.1rem,4vw,3.5rem)] pt-[2.2rem] pb-[4rem] outline-none max-[860px]:pt-[3.2rem]"
      ref={top}
      tabIndex={-1}
    >
      <header className="lamina mb-[2rem] border-b border-linea pb-[1.25rem]">
        <h1 className="m-0 max-w-[24ch] text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-balance">
          {nombre}
        </h1>

        {/* La ficha del bloque: el cajetín de la cabecera de una lámina, con los mismos
            campos y el mismo orden en todos los bloques del reglamento. Ocupa el ancho de
            la lámina, no el de la prosa: es el marco, no el texto. */}
        <dl className="cajetin mt-[1.1rem]">
          <div>
            <dt className="rotulo">{itc ? 'Código' : 'Documento'}</dt>
            <dd className="dato m-0 text-[0.85rem] text-neutro">{itc ? `ITC-${itc}` : 'REBT'}</dd>
          </div>
          {version?.vigencia && (
            <div>
              <dt className="rotulo">{versiones.length > 1 ? 'Redacción' : 'Vigente desde'}</dt>
              <dd className="m-0">
                {versiones.length > 1 ? (
                  <select
                    className="dato max-w-full rounded-[3px] border border-linea bg-hoja py-[0.1rem] pr-[1.2rem] pl-[0.3rem] text-[0.82rem] transition-colors duration-150 ease-plano hover:border-neutro focus:border-neutro"
                    value={versionIdx}
                    onChange={(e) => setVersionIdx(+e.target.value)}
                  >
                    {versiones.map((v, i) => (
                      <option key={v.vigencia + i} value={i}>
                        {formatDate(v.vigencia)}
                        {i === 0 ? ' · actual' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="dato text-[0.85rem] text-tinta">{formatDate(version.vigencia)}</span>
                )}
              </dd>
            </div>
          )}
          <div>
            <dt className="rotulo">Texto oficial</dt>
            <dd className="m-0">
              <a
                className="group inline-flex items-center gap-[0.25rem] text-[0.85rem] text-neutro underline decoration-1 underline-offset-[0.2em] hover:text-fase"
                href={`https://www.boe.es/buscar/act.php?id=${normaId}#${encodeURIComponent(entry.id)}`}
                target="_blank"
                rel="noreferrer"
              >
                boe.es
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-3.5 transition-transform duration-200 ease-plano group-hover:-translate-y-px group-hover:translate-x-px"
                />
              </a>
            </dd>
          </div>
        </dl>
      </header>

      {estado.status === 'loading' && <EsqueletoTexto />}
      {estado.status === 'error' && (
        <div className="medida rounded-[4px] border border-linea bg-hoja py-[1rem] px-[1.2rem]" role="alert">
          <p className="rotulo mt-0 mb-[0.4rem] text-fase">Error de lectura</p>
          <p className="mt-0 mb-[0.35rem] font-lectura text-[1.05rem] text-tinta">No se pudo cargar este bloque.</p>
          <p className="mt-0 mb-[0.9rem] font-lectura text-[0.95rem] text-tinta-2">{estado.error.message}</p>
          <button
            className="rounded-[4px] border border-linea bg-neutro-fondo py-[0.4rem] px-[0.9rem] transition-colors duration-150 ease-plano hover:border-neutro"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {estado.status === 'ok' && (
        <Highlight.Provider value={highlight}>
          <article className="texto lectura lamina" ref={articulo} key={version.vigencia}>
            {version.items.length === 0 && <p className="text-tinta-2">Este bloque no tiene texto.</p>}
            {version.items.map((item, i) => (
              <Item
                key={i}
                item={item}
                tableName={`${itc ? 'ITC-' + itc : entry.id}_t${String(
                  item.kind === 'table' ? ++tableCount : tableCount,
                ).padStart(2, '0')}`}
                onAgregarNota={(grid, _name) => {
                  if (!conNotas) return
                  notas.agregar(
                    crearNota('rebt', entry.id, entry.titulo, gridToMarkdown(grid), '', '', Date.now(), COLOR_POR_DEFECTO, ['tablas']),
                  )
                }}
              />
            ))}
          </article>
        </Highlight.Provider>
      )}

      {conNotas && <BotonNota
        seleccion={seleccion}
        onGuardar={(sel, color) => {
          notas.agregar(
            crearNota('rebt', entry.id, entry.titulo, sel.texto, sel.antes, sel.despues, Date.now(), color),
          )
          limpiar()
        }}
      />}

      <nav
        className="lamina mt-[3rem] flex justify-between gap-[1rem] border-t border-linea pt-[1.2rem] max-[860px]:flex-col"
        aria-label="Bloque anterior y siguiente"
      >
        {prev ? (
          <button
            className="group max-w-[24rem] rounded-[4px] border border-linea bg-hoja py-[0.6rem] px-[0.9rem] text-left leading-[1.3] transition-[border-color,background-color,transform] duration-200 ease-plano hover:-translate-y-[1px] hover:border-neutro hover:bg-neutro-fondo max-[860px]:max-w-none"
            onClick={() => onSelect(prev.id)}
          >
            <small className="rotulo mb-[0.15rem] block">Anterior</small>
            {splitTitle(prev.titulo).itc ? `ITC-${splitTitle(prev.titulo).itc}. ` : ''}
            {splitTitle(prev.titulo).nombre}
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button
            onClick={() => onSelect(next.id)}
            className="group ml-auto max-w-[24rem] rounded-[4px] border border-linea bg-hoja py-[0.6rem] px-[0.9rem] text-right leading-[1.3] transition-[border-color,background-color,transform] duration-200 ease-plano hover:-translate-y-[1px] hover:border-neutro hover:bg-neutro-fondo max-[860px]:max-w-none"
          >
            <small className="rotulo mb-[0.15rem] block">Siguiente</small>
            {splitTitle(next.titulo).itc ? `ITC-${splitTitle(next.titulo).itc}. ` : ''}
            {splitTitle(next.titulo).nombre}
          </button>
        )}
      </nav>

      <BarraProgreso desplazador={top} />
    </main>
  )
}
