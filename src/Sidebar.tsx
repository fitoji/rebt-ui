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
    <li className="item-fila">
      <button
        className={'fila' + (active ? ' activa' : '') + (itc ? '' : ' sin-num')}
        aria-current={active ? 'page' : undefined}
        onClick={() => onSelect(entry.id)}
      >
        {itc && <span className="num">{itc}</span>}
        <span className="tit">
          {nombre}
          {snippet && <span className="frag">{snippet}</span>}
        </span>
        {(count ?? 0) > 0 && <span className="cuenta" title={`${count} coincidencias`}>{count}</span>}
      </button>
      {/* La estrella es hermana de la fila, no hija: un botón dentro de otro botón es
          HTML inválido y hace que el clic nunca llegue al que está debajo. */}
      {conEstrella && <BotonFavorito id={entry.id} titulo={entry.titulo} favoritos={favoritos} />}
    </li>
  )
}

interface SidebarProps {
  blocks: Bloque[]
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
  blocks,
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
    <SidebarUI collapsible="offcanvas" className="indice" aria-label="Índice del reglamento">
      <SidebarHeader className="indice-cab">
        <div className="indice-cab-top">
          <p className="marca">REBT</p>
          <InicioBoton onInicio={onInicio} />
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
          <SidebarTrigger className="alternar-barra" />
        </div>
        <p className="sub">Reglamento electrotécnico para baja tensión</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: caída de tensión…"
          aria-label="Buscar en el reglamento"
        />
        {query.trim().length >= 3 && !textReady && !progress && (
          <button className="indexar" onClick={onIndexAll}>
            Buscar también en el texto de los {blocks.length} bloques
          </button>
        )}
        {progress && (
          <div className="progreso" role="status">
            <div className="barra">
              <i style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <span>
              Indexando {progress.done} de {progress.total}
            </span>
          </div>
        )}
        {failed.length > 0 && (
          <p className="aviso">No se pudieron leer {failed.length} bloques; la búsqueda no los incluye.</p>
        )}
      </SidebarHeader>

      <SidebarContent className="indice-lista">
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
          <p className="vacio">
            Sin resultados para «{query}».{' '}
            {progress
              ? 'Se sigue buscando en el texto completo…'
              : textReady
                ? 'Prueba con otra palabra.'
                : 'Busca también en el texto completo.'}
          </p>
        )}
        {searching ? (
          <ul>{renderRows(rows)}</ul>
        ) : (
          <>
            <Accordion
              title={favoritos.ids.length ? `Favoritos (${favoritos.ids.length})` : 'Favoritos'}
              open={favoritosAbierto}
              onToggle={() => setFavoritosAbierto((v) => !v)}
            >
              {filasFavoritas.length > 0 ? (
                <ul className="accordion-list">{renderRows(filasFavoritas, true)}</ul>
              ) : (
                <p className="vacio">
                  Marcá con la estrella las ITC que uses más y van a aparecer aquí.
                </p>
              )}
            </Accordion>

            <Accordion
              title="Preámbulo"
              open={acordeonAbierto === 'preambulo'}
              onToggle={() => toggleAcordeon('preambulo')}
            >
              <ul className="accordion-list">{renderRows(preambulo)}</ul>
            </Accordion>

            <Accordion
              title="Reglamento"
              open={acordeonAbierto === 'reglamento'}
              onToggle={() => toggleAcordeon('reglamento')}
            >
              <ul className="accordion-list">{renderRows(articulos)}</ul>
            </Accordion>

            <Accordion
              title="Instrucciones Técnicas Complementarias"
              open={acordeonAbierto === 'itcs'}
              onToggle={() => toggleAcordeon('itcs')}
            >
              <ul className="accordion-list">{renderRows(itcs, true)}</ul>
              {/* Las disposiciones van debajo, plegadas: son lo accesorio. */}
              <div className="accordion-sub">
                <Accordion
                  title={`Disposiciones (${disposiciones.length})`}
                  open={disposicionesAbierto}
                  onToggle={() => setDisposicionesAbierto((v) => !v)}
                >
                  <ul className="accordion-list">{renderRows(disposiciones, true)}</ul>
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
