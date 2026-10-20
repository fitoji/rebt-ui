import { useState } from 'react'
import { splitTitle } from './parse.js'
import InicioBoton from './InicioBoton.jsx'
import TemaBoton from './TemaBoton.jsx'
import Accordion from './Accordion.jsx'

function Row({ entry, active, onSelect, snippet, count }) {
  const { itc, nombre } = splitTitle(entry.titulo)
  return (
    <li>
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
        {count > 0 && <span className="cuenta" title={`${count} coincidencias`}>{count}</span>}
      </button>
    </li>
  )
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
}) {
  const [acordeonAbierto, setAcordeonAbierto] = useState('itcs') // ITCs abierto por defecto

  const toggleAcordeon = (clave) => {
    setAcordeonAbierto((actual) => (actual === clave ? null : clave))
  }

  // Clasificación:
  // - Preámbulo: id 'pr'
  // - Reglamento: ids que empiezan con 'a' (artículos)
  // - ITCs: el resto (Instrucciones Técnicas Complementarias)
  //   - Normales: ids que empiezan con 'i' o 'anx' (antes de 'da')
  //   - Disposiciones: ids 'da' a 're' (van al final)
  const preambulo = rows.filter((r) => r.entry.id === 'pr')
  const articulos = rows.filter((r) => r.entry.id.startsWith('a'))

  const itcNormal = rows.filter((r) => r.entry.id !== 'pr' && !r.entry.id.startsWith('a') && r.entry.id < 'da')
  const itcDisposicion = rows.filter((r) => r.entry.id !== 'pr' && !r.entry.id.startsWith('a') && r.entry.id >= 'da')
  const itcs = [...itcNormal, ...itcDisposicion]

  const renderRows = (list) =>
    list.map((r) => (
      <Row
        key={r.entry.id}
        entry={r.entry}
        active={r.entry.id === activeId}
        onSelect={onSelect}
        snippet={r.snippet}
        count={r.count}
      />
    ))

  return (
    <aside className="indice" aria-label="Índice del reglamento">
      <div className="indice-cab">
        <div className="indice-cab-top">
          <p className="marca">REBT</p>
          <InicioBoton onInicio={onInicio} />
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
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
              Descargando {progress.done} de {progress.total}
            </span>
          </div>
        )}
        {failed.length > 0 && (
          <p className="aviso">No se pudieron leer {failed.length} bloques; la búsqueda no los incluye.</p>
        )}
      </div>

      <nav className="indice-lista">
        {searching && rows.length === 0 && (
          <p className="vacio">
            Sin resultados para «{query}». {textReady ? 'Prueba con otra palabra.' : 'Busca también en el texto completo.'}
          </p>
        )}
        {searching ? (
          <ul>{renderRows(rows)}</ul>
        ) : (
          <>
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
              <ul className="accordion-list">{renderRows(itcs)}</ul>
            </Accordion>
          </>
        )}
      </nav>
    </aside>
  )
}
