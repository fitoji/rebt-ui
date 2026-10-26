import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { getBlock, NORMA_ID } from './api.ts'
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
  /** Las notas del usuario, para poder subrayar este bloque. */
  notas: ControlNotas
  /** El artículo, para resaltar el texto y para ir a una nota. Lo comparte con la barra. */
  articulo: RefObject<HTMLElement>
  /** La nota a la que hay que llevar la vista, si viene de la página de notas. */
  nota?: string
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
}: ReaderProps) {
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

  // Las notas de este bloque y el botón que aparece al seleccionar texto.
  const notasDoc = useMemo(
    () => notas.notas.filter((n) => n.origen === entry.id),
    [notas.notas, entry.id],
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

  return (
    <main
      className="overflow-y-auto px-[clamp(1.1rem,4vw,3.5rem)] pt-[2.2rem] pb-[4rem] outline-none max-[860px]:pt-[3.2rem] [&>*]:mx-auto [&>*]:max-w-[70rem]"
      ref={top}
      tabIndex={-1}
    >
      <header className="mb-[2rem] border-b border-linea pb-[1.1rem]">
        <h1 className="m-0 max-w-[24ch] text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.1] text-balance">
          {itc && (
            <span className="mb-[0.35rem] block text-[1.05rem] font-medium tabular-nums text-fase">
              ITC-{itc}
            </span>
          )}
          {nombre}
        </h1>
        <div className="mt-[0.9rem] flex flex-wrap items-center gap-[0.6rem_1.6rem] text-tinta-2">
          {version?.vigencia && (
            <label className="flex items-center gap-[0.5rem]">
              {versiones.length > 1 ? (
                <>
                  <span>Versión</span>
                  <select
                    className="rounded-[4px] border border-linea bg-hoja py-[0.25rem] px-[0.4rem]"
                    value={versionIdx}
                    onChange={(e) => setVersionIdx(+e.target.value)}
                  >
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
            className="text-neutro"
            href={`https://www.boe.es/buscar/act.php?id=${NORMA_ID}#${encodeURIComponent(entry.id)}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir en boe.es
          </a>
        </div>
      </header>

      {estado.status === 'loading' && <p className="font-serif text-tinta-2" role="status">Cargando el texto…</p>}
      {estado.status === 'error' && (
        <div className="border-l-4 border-fase bg-hoja py-[1rem] px-[1.2rem] font-serif text-tinta-2" role="alert">
          <p>No se pudo cargar este bloque.</p>
          <p>{estado.error.message}</p>
          <button
            className="rounded-[4px] border border-linea bg-neutro-fondo py-[0.4rem] px-[0.9rem]"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {estado.status === 'ok' && (
        <Highlight.Provider value={highlight}>
          <article className="texto font-serif text-[1.0625rem] leading-[1.7]" ref={articulo} key={version.vigencia}>
            {version.items.length === 0 && <p className="font-serif text-tinta-2">Este bloque no tiene texto.</p>}
            {version.items.map((item, i) => (
              <Item
                key={i}
                item={item}
                tableName={`${itc ? 'ITC-' + itc : entry.id}_t${String(
                  item.kind === 'table' ? ++tableCount : tableCount,
                ).padStart(2, '0')}`}
                onAgregarNota={(grid, _name) => {
                  notas.agregar(
                    crearNota('rebt', entry.id, entry.titulo, gridToMarkdown(grid), '', '', Date.now(), COLOR_POR_DEFECTO, ['tablas']),
                  )
                }}
              />
            ))}
          </article>
        </Highlight.Provider>
      )}

      <BotonNota
        seleccion={seleccion}
        onGuardar={(sel, color) => {
          notas.agregar(
            crearNota('rebt', entry.id, entry.titulo, sel.texto, sel.antes, sel.despues, Date.now(), color),
          )
          limpiar()
        }}
      />

      <nav
        className="mt-[3rem] flex justify-between gap-[1rem] border-t border-linea pt-[1.2rem] max-[860px]:flex-col"
        aria-label="Bloque anterior y siguiente"
      >
        {prev ? (
          <button
            className="max-w-[24rem] rounded-[4px] border border-linea bg-hoja py-[0.6rem] px-[0.9rem] text-left leading-[1.3] hover:border-neutro max-[860px]:max-w-none"
            onClick={() => onSelect(prev.id)}
          >
            <small className="block text-tinta-2">Anterior</small>
            {splitTitle(prev.titulo).itc ? `ITC-${splitTitle(prev.titulo).itc}. ` : ''}
            {splitTitle(prev.titulo).nombre}
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button
            onClick={() => onSelect(next.id)}
            className="ml-auto max-w-[24rem] rounded-[4px] border border-linea bg-hoja py-[0.6rem] px-[0.9rem] text-right leading-[1.3] hover:border-neutro max-[860px]:max-w-none"
          >
            <small className="block text-tinta-2">Siguiente</small>
            {splitTitle(next.titulo).itc ? `ITC-${splitTitle(next.titulo).itc}. ` : ''}
            {splitTitle(next.titulo).nombre}
          </button>
        )}
      </nav>
    </main>
  )
}
