import { useMemo, useState } from 'react'
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
          'relative w-full border-0 bg-transparent py-[0.45rem] pr-[1.1rem] pl-[1.3rem] text-left leading-[1.3] hover:bg-plano',
          itc ? 'grid grid-cols-[3.4rem_1fr_auto] gap-[0.5rem]' : 'grid grid-cols-[1fr_auto] gap-[0.5rem]',
          active ? 'bg-plano font-medium' : '',
        ].join(' ')}
        aria-current={active ? 'page' : undefined}
        onClick={() => onSelect(entry.id)}
      >
        {/* La franja del conductor de protección: la única marca decorativa. */}
        {active && (
          <span className="absolute inset-y-0 left-0 w-[6px] bg-[repeating-linear-gradient(135deg,var(--tierra-a)_0_5px,var(--tierra-b)_5px_10px)]" />
        )}
        {itc && <span className="whitespace-nowrap tabular-nums text-tinta-2">{itc}</span>}
        <span>
          {nombre}
          {snippet && (
            <span className="mt-[0.15rem] block text-[0.88rem] text-tinta-2">{snippet}</span>
          )}
        </span>
        {(count ?? 0) > 0 && (
          <span
            className={[
              'self-start rounded-[9px] bg-neutro-fondo px-[0.4rem] py-0 text-[0.85rem] tabular-nums text-neutro',
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

interface SidebarProps {
  rows: Fila[]
  searching: boolean
  activeId?: string
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

  const toggleAcordeon = (clave: string) => {
    setAcordeonAbierto((actual) => (actual === clave ? null : clave))
  }

  // Clasificación en los cuatro grupos de la sidebar. Los ids del BOE dicen a qué
  // grupo pertenece cada bloque (ver `indice.ts`).
  const { preambulo, articulos, disposiciones, itcs } = agruparBloques(rows)

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
          <p className="m-0 text-[1.9rem] font-semibold leading-none tracking-[0.02em]">REBT</p>
          <InicioBoton onInicio={onInicio} />
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
          <SidebarTrigger className="alternar-barra" />
        </div>
        <p className="mt-[0.25rem] mb-[0.9rem] text-[0.95rem] text-tinta-2">Reglamento electrotécnico para baja tensión</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: caída de tensión…"
          aria-label="Buscar en el reglamento"
          className="w-full rounded-[4px] border border-linea bg-plano py-[0.55rem] px-[0.7rem] placeholder:text-tinta-2"
        />
        {query.trim().length >= 3 && !textReady && !progress && (
          <button
            className="mt-[0.6rem] w-full whitespace-nowrap rounded-[4px] border border-linea bg-neutro-fondo py-[0.5rem] px-[0.7rem] text-left text-neutro"
            onClick={onIndexAll}
          >
            Buscar contenido
          </button>
        )}
        {progress && (
          <div className="mt-[0.7rem] text-[0.9rem] text-tinta-2" role="status">
            <div className="mb-[0.3rem] h-[6px] overflow-hidden rounded-[3px] bg-plano">
              <i className="block h-full bg-[repeating-linear-gradient(135deg,var(--tierra-a)_0_6px,var(--tierra-b)_6px_12px)]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <span>
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
          <ul className="m-0 list-none p-0">{renderRows(rows)}</ul>
        ) : (
          <>
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
          </>
        )}
        </nav>
      </SidebarContent>
    </SidebarUI>
  )
}
