// La barra lateral de la guía: el índice de los documentos, los favoritos y las notas.
//
// Es la misma idea que la del lector del REBT (que lista los bloques del reglamento),
// pero con el contenido de la guía: los 38 documentos y lo que el usuario marcó.

import { useMemo, useState } from 'react'
import { fold } from './parse.ts'
import type { Favoritos } from './favoritos.ts'
import type { DocumentoGuia } from './tipos.ts'
import type { Nota } from './notas.ts'
import BotonFavorito from './BotonFavorito.tsx'
import CajaNotas from './CajaNotas.tsx'
import InicioBoton from './InicioBoton.tsx'
import TemaBoton from './TemaBoton.tsx'
import type { Tema } from './useTheme.ts'

export default function SidebarGuia({
  documentos,
  activo,
  onSelect,
  query,
  setQuery,
  onInicio,
  theme,
  onToggleTheme,
  favoritos,
  notas,
  totalNotas,
  onIrANota,
  onQuitarNota,
  onVerTodasNotas,
}: {
  documentos: DocumentoGuia[]
  /** El documento que está abierto, si hay alguno. */
  activo?: string
  onSelect: (id: string) => void
  query: string
  setQuery: (query: string) => void
  onInicio: () => void
  theme: Tema
  onToggleTheme: () => void
  favoritos: Favoritos
  notas: Nota[]
  totalNotas: number
  onIrANota: (nota: Nota) => void
  onQuitarNota: (nota: Nota) => void
  onVerTodasNotas: () => void
}) {
  const [notasAbierto, setNotasAbierto] = useState(true)

  const q = query.trim()
  const visibles = useMemo(() => {
    if (q.length < 2) return documentos
    const needle = fold(q)
    return documentos.filter(
      (doc) => fold(doc.titulo).includes(needle) || fold(doc.id).includes(needle),
    )
  }, [documentos, q])

  const marcados = documentos.filter((doc) => favoritos.ids.includes(doc.id))

  const fila = (doc: DocumentoGuia) => (
    <li key={doc.id} className="item-fila">
      <button
        className="fila sin-num guia-fila"
        aria-current={activo === doc.id ? 'page' : undefined}
        onClick={() => onSelect(doc.id)}
      >
        {/* El título arriba y el código abajo: los ids de la guía son largos ("01-Indice-
            unidades-tematicas") y no entran al lado del título. */}
        <span className="tit">
          {doc.titulo}
          <span className="frag codigo-doc">{doc.id}</span>
        </span>
      </button>
      <BotonFavorito id={doc.id} titulo={doc.titulo} favoritos={favoritos} />
    </li>
  )

  return (
    <aside className="indice" aria-label="Índice de las guías">
      <div className="indice-cab">
        <div className="indice-cab-top">
          <p className="marca">Guías</p>
          <InicioBoton onInicio={onInicio} />
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
        </div>
        <p className="sub">
          Las {documentos.length} guías de aplicación del REBT
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por título o código…"
          aria-label="Filtrar documentos de la guía"
        />
      </div>

      <nav className="indice-lista">
        <CajaNotas
          notas={notas}
          total={totalNotas}
          abierto={notasAbierto}
          onAlternar={() => setNotasAbierto((v) => !v)}
          onIr={onIrANota}
          onQuitar={onQuitarNota}
          onVerTodas={onVerTodasNotas}
        />

        {marcados.length > 0 && (
          <section className="guia-favoritos">
            <h2>Favoritos ({marcados.length})</h2>
            <ul>{marcados.map(fila)}</ul>
          </section>
        )}
        <h2 className="indice-titulo">Documentos</h2>
        <ul>{visibles.map(fila)}</ul>
        {visibles.length === 0 && <p className="vacio">Ningún documento coincide con «{q}».</p>}
      </nav>
    </aside>
  )
}
