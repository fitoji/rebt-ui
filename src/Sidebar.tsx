import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { splitTitle } from './parse.ts'
import { agruparBloques } from './indice.ts'
import { CLAVE_REBT, useFavoritos } from './favoritos.ts'
import type { Favoritos } from './favoritos.ts'
import BotonFavorito from './BotonFavorito.tsx'
import CajaNotas from './CajaNotas.tsx'
import type { Nota } from './notas.ts'
import InicioBoton from './InicioBoton.tsx'
import TemaBoton from './TemaBoton.tsx'
import Accordion from './Accordion.tsx'
import type { Tema } from './useTheme.ts'
import type { Bloque, Fila } from './tipos.ts'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar.tsx'

interface RowProps {
  entry: Bloque
  active: boolean
  onSelect: (id: string) => void
  snippet?: string
  count?: number
  /** Si la fila lleva estrella para marcarla como favorita. */
  conEstrella?: boolean
  favoritos: Favoritos
}

function Row({ entry, active, onSelect, snippet, count, conEstrella, favoritos }: RowProps) {
  const { itc, nombre } = splitTitle(entry.titulo)
  return (
    <li className="relative">
      <button
        className={[
          'fila-indice relative w-full border-0 bg-transparent py-[0.45rem] pr-[1.1rem] pl-[1.3rem] text-left leading-[1.3] hover:bg-plano',
          itc ? 'grid grid-cols-[3.4rem_1fr_auto] gap-[0.5rem]' : 'grid grid-cols-[1fr_auto] gap-[0.5rem]',
        ].join(' ')}
        aria-current={active ? 'page' : undefined}
        onClick={() => onSelect(entry.id)}
      >
        {itc && <span className="dato whitespace-nowrap text-[0.82rem] text-tinta-2">{itc}</span>}
        <span>
          {nombre}
          {snippet && (
            <span className="mt-[0.15rem] block text-[0.88rem] text-tinta-2">{snippet}</span>
          )}
        </span>
        {(count ?? 0) > 0 && (
          <span
            className={[
              'dato self-start rounded-[3px] bg-neutro-fondo px-[0.4rem] text-[0.78rem] leading-[1.5] text-neutro',
              conEstrella ? 'mr-[1.2rem]' : '',
            ].join(' ')}
            title={`${count} coincidencias`}
          >
            {count}
          </span>
        )}
      </button>
      {/* La estrella es hermana de la fila, no hija: un botón dentro de otro botón es
          HTML inválido y hace que el clic nunca llegue al que está debajo. */}
      {conEstrella && (
        <BotonFavorito
          id={entry.id}
          titulo={entry.titulo}
          favoritos={favoritos}
          className="absolute top-[0.3rem] right-[0.4rem]"
        />
      )}
    </li>
  )
}

/** La franja de la fila activa, dibujada una sola vez para toda la lista.
 *  Viaja con `transform`, así que no recompone la lista al cambiar de bloque. */
function MarcaIndice({ marca, animar }: { marca: { top: number; alto: number } | null; animar: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="marca-indice"
      data-animar={animar ? 'true' : 'false'}
      style={
        marca
          ? { transform: `translateY(${marca.top}px)`, height: marca.alto, opacity: 1 }
          : { opacity: 0 }
      }
    />
  )
}

interface SidebarProps {
  rows: Fila[]
  searching: boolean
  activeId?: string
  /** El bloque viene de la ruta. En la entrada sin bloque, la lista arranca en las ITC. */
  bloqueEnRuta?: boolean
  onSelect: (id: string) => void
  query: string
  setQuery: (query: string) => void
  textReady: boolean
  progress: { done: number; total: number } | null
  onIndexAll: () => void
  failed: string[]
  onInicio: () => void
  theme: Tema
  onToggleTheme: () => void
  /** Las notas del bloque que se está leyendo. */
  notas: Nota[]
  /** Cuántas hay en total, en las dos vistas. */
  totalNotas: number
  /** Ir al resaltado de una nota. */
  onIrANota: (nota: Nota) => void
  /** Borrar una nota. */
  onQuitarNota: (nota: Nota) => void
  /** Abrir la página con todas las notas. */
  onVerTodasNotas: () => void
}

export default function Sidebar({
  rows,
  searching,
  activeId,
  bloqueEnRuta,
  onSelect,
  query,
  setQuery,
  textReady,
  progress,
  onIndexAll,
  failed,
  onInicio,
  theme,
  onToggleTheme,
  notas,
  totalNotas,
  onIrANota,
  onQuitarNota,
  onVerTodasNotas,
}: SidebarProps) {
  const [acordeonAbierto, setAcordeonAbierto] = useState<string | null>('itcs') // ITCs abierto por defecto
  // Los favoritos tienen su propio estado: se quiere tenerlos a la vista mientras se
  // navega por las ITC, no en lugar de ellas.
  const [favoritosAbierto, setFavoritosAbierto] = useState(true)
  // Las notas también: son el motivo por el que se está leyendo.
  const [notasAbierto, setNotasAbierto] = useState(true)
  // Las disposiciones son lo accesorio: van plegadas, y se abren cuando se buscan.
  const [disposicionesAbierto, setDisposicionesAbierto] = useState(false)
  const favoritos = useFavoritos(CLAVE_REBT)

  // La franja del conductor de protección: una sola marca para toda la lista, que viaja
  // de la fila anterior a la nueva en vez de apagarse y encenderse. Se mide la fila
  // activa y se coloca encima; si la fila está dentro de un grupo plegado, no hay marca.
  const marcaRef = useRef<HTMLDivElement>(null)
  const [marca, setMarca] = useState<{ top: number; alto: number } | null>(null)
  const [animar, setAnimar] = useState(false)

  useLayoutEffect(() => {
    const c = marcaRef.current
    if (!c) return
    const medir = () => {
      const fila = c.querySelector<HTMLElement>('[aria-current="page"]')
      if (!fila || fila.closest('[inert]')) {
        setMarca(null)
        return
      }
      const caja = c.getBoundingClientRect()
      const f = fila.getBoundingClientRect()
      setMarca({ top: f.top - caja.top, alto: f.height })
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(c)
    return () => observador.disconnect()
  }, [activeId, rows, searching, acordeonAbierto, favoritosAbierto, disposicionesAbierto, notasAbierto])

  // El primer trazo no se anima: la marca ya está donde toca, no viaja desde la esquina.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimar(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const toggleAcordeon = (clave: string) => {
    setAcordeonAbierto((actual) => (actual === clave ? null : clave))
  }

  // Clasificación en los cuatro grupos de la sidebar. Los ids del BOE dicen a qué
  // grupo pertenece cada bloque (ver `indice.ts`).
  const { preambulo, articulos, disposiciones, itcs } = agruparBloques(rows)

  // El índice sigue al texto: al abrir un bloque se abre el grupo que lo contiene, para
  // que la marca de posición no quede escondida dentro de un acordeón cerrado. Solo actúa
  // cuando el bloque viene de la ruta (en la entrada sin bloque, la lista arranca en las
  // ITC) y cuando cambia el bloque abierto; plegar a mano sigue siendo cosa del usuario.
  useEffect(() => {
    if (!activeId || !bloqueEnRuta) return
    const contiene = (lista: Fila[]) => lista.some((r) => r.entry.id === activeId)
    if (contiene(disposiciones)) {
      setAcordeonAbierto('itcs')
      setDisposicionesAbierto(true)
    } else if (contiene(itcs)) {
      setAcordeonAbierto('itcs')
    } else if (contiene(articulos)) {
      setAcordeonAbierto('reglamento')
    } else if (contiene(preambulo)) {
      setAcordeonAbierto('preambulo')
    }
  }, [activeId, bloqueEnRuta, rows])

  const renderRows = (list: Fila[], conEstrella = false) =>
    list.map((r) => (
      <Row
        key={r.entry.id}
        entry={r.entry}
        active={r.entry.id === activeId}
        onSelect={onSelect}
        snippet={r.snippet}
        count={r.count}
        conEstrella={conEstrella}
        favoritos={favoritos}
      />
    ))

  // Los favoritos se listan aunque no haya búsqueda: para eso están.
  const filasFavoritas = useMemo(
    () => rows.filter((r) => favoritos.ids.includes(r.entry.id)),
    [rows, favoritos.ids],
  )

  return (
    <SidebarUI collapsible="offcanvas" className="min-h-0 border-r border-linea" aria-label="Índice del reglamento">
      <SidebarHeader className="border-b border-linea px-[1.1rem] pt-[1.1rem] pb-[0.9rem]">
        <div className="flex items-baseline justify-between gap-[0.75rem]">
          <p className="m-0 text-[1.9rem] font-semibold leading-none tracking-[0.05em]">REBT</p>
          <InicioBoton onInicio={onInicio} />
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
          <SidebarTrigger className="alternar-barra" />
        </div>
        <p className="mt-[0.25rem] mb-[0.9rem] text-[0.95rem] text-tinta-2">Reglamento electrotécnico para baja tensión</p>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-[0.6rem] top-1/2 size-3.5 -translate-y-1/2 text-tinta-2" strokeWidth={1.75} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: caída de tensión…"
            aria-label="Buscar en el reglamento"
            className="w-full rounded-[4px] border border-linea bg-plano py-[0.55rem] pr-[0.7rem] pl-[2rem] placeholder:text-tinta-2 transition-colors duration-150 ease-plano focus:border-neutro focus:bg-hoja"
          />
        </div>
        {query.trim().length >= 3 && !textReady && !progress && (
          <button
            className="mt-[0.6rem] w-full whitespace-nowrap rounded-[4px] border border-linea bg-neutro-fondo py-[0.5rem] px-[0.7rem] text-left text-neutro transition-colors duration-150 ease-plano hover:border-neutro"
            onClick={onIndexAll}
          >
            Buscar contenido
          </button>
        )}
        {progress && (
          <div className="mt-[0.7rem] text-[0.9rem] text-tinta-2" role="status">
            <div className="mb-[0.35rem] h-[6px] overflow-hidden rounded-[3px] bg-plano">
              <i
                className="raya-tierra block h-full"
                style={{ width: `${(progress.done / progress.total) * 100}%`, transition: 'width 0.3s var(--ease-plano)' }}
              />
            </div>
            <span className="dato text-[0.78rem]">
              Indexando {progress.done} de {progress.total}
            </span>
          </div>
        )}
        {failed.length > 0 && (
          <p className="mt-[0.6rem] mb-0 text-[0.9rem] text-fase">No se pudieron leer {failed.length} bloques; la búsqueda no los incluye.</p>
        )}
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto pt-[0.4rem] pb-[2rem]">
        <nav>
        {/* El archivo de normas anteriores y el historial de cambios, debajo del buscador
            y antes de las notas: se llega a ellos desde el reglamento, no al revés. Son
            enlaces y no botones porque cambian de ruta, no de bloque. */}
        <div className="mx-[1.1rem] mt-[0.9rem] mb-[0.6rem] border-b border-linea pb-[0.8rem]">
          <p className="rotulo mt-0 mb-[0.35rem]">Normativa</p>
          <ul className="m-0 list-none p-0">
            <li>
              <a
                href="#/cambios"
                className="text-[0.98rem] text-neutro transition-colors duration-150 ease-plano hover:underline"
              >
                Cambios del REBT
              </a>
            </li>
            <li>
              <a
                href="#/antiguos"
                className="text-[0.98rem] text-neutro transition-colors duration-150 ease-plano hover:underline"
              >
                REBT anteriores
              </a>
            </li>
          </ul>
        </div>
        {/* Las notas están siempre a la vista: se leen mientras se está leyendo. */}
        <CajaNotas
          notas={notas}
          total={totalNotas}
          abierto={notasAbierto}
          onAlternar={() => setNotasAbierto((v) => !v)}
          onIr={onIrANota}
          onQuitar={onQuitarNota}
          onVerTodas={onVerTodasNotas}
        />

        {searching && rows.length === 0 && (
          <p className="mx-[1.1rem] my-[1rem] text-tinta-2">
            Sin resultados para «{query}».{' '}
            {progress
              ? 'Se sigue buscando en el texto completo…'
              : textReady
                ? 'Prueba con otra palabra.'
                : 'Busca también en el texto completo.'}
          </p>
        )}
        {searching ? (
          <div className="relative" ref={marcaRef}>
            <MarcaIndice marca={marca} animar={animar} />
            <ul className="m-0 list-none p-0">{renderRows(rows)}</ul>
          </div>
        ) : (
          <div className="relative" ref={marcaRef}>
            <MarcaIndice marca={marca} animar={animar} />
            <Accordion
              title={favoritos.ids.length ? `Favoritos (${favoritos.ids.length})` : 'Favoritos'}
              open={favoritosAbierto}
              onToggle={() => setFavoritosAbierto((v) => !v)}
            >
              {filasFavoritas.length > 0 ? (
                <ul className="m-0 list-none p-0">{renderRows(filasFavoritas, true)}</ul>
              ) : (
                <p className="mx-[1.1rem] my-[1rem] text-tinta-2">
                  Marcá con la estrella las ITC que uses más y van a aparecer aquí.
                </p>
              )}
            </Accordion>

            <Accordion
              title="Preámbulo"
              open={acordeonAbierto === 'preambulo'}
              onToggle={() => toggleAcordeon('preambulo')}
            >
              <ul className="m-0 list-none p-0">{renderRows(preambulo)}</ul>
            </Accordion>

            <Accordion
              title="Reglamento"
              open={acordeonAbierto === 'reglamento'}
              onToggle={() => toggleAcordeon('reglamento')}
            >
              <ul className="m-0 list-none p-0">{renderRows(articulos)}</ul>
            </Accordion>

            <Accordion
              title="Instrucciones Técnicas Complementarias"
              open={acordeonAbierto === 'itcs'}
              onToggle={() => toggleAcordeon('itcs')}
            >
              <ul className="m-0 list-none p-0">{renderRows(itcs, true)}</ul>
              {/* Las disposiciones van debajo, plegadas: son lo accesorio. */}
              <div className="mt-[0.3rem]">
                <Accordion
                  title={`Disposiciones (${disposiciones.length})`}
                  open={disposicionesAbierto}
                  onToggle={() => setDisposicionesAbierto((v) => !v)}
                  variante="sub"
                >
                  <ul className="m-0 list-none p-0">{renderRows(disposiciones, true)}</ul>
                </Accordion>
              </div>
            </Accordion>
          </div>
        )}
        </nav>
      </SidebarContent>
    </SidebarUI>
  )
}
