// La barra lateral de la guía: el índice de los documentos, los favoritos y las notas.
//
// Es la misma idea que la del lector del REBT (que lista los bloques del reglamento),
// pero con el contenido de la guía: los 38 documentos y lo que el usuario marcó.

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { fold } from './parse.ts'
import type { Favoritos } from './favoritos.ts'
import type { DocumentoGuia } from './tipos.ts'
import type { Nota } from './notas.ts'
import BotonFavorito from './BotonFavorito.tsx'
import CajaNotas from './CajaNotas.tsx'
import InicioBoton from './InicioBoton.tsx'
import TemaBoton from './TemaBoton.tsx'
import type { Tema } from './useTheme.ts'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar.tsx'

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

  const fila = (doc: DocumentoGuia, enFavoritos = false) => {
    const activoEste = activo === doc.id
    return (
      <li key={doc.id} className="relative">
        <button
          className={[
            'fila-indice relative flex w-full items-start gap-[0.5rem] border-0 bg-transparent py-[0.45rem] text-left leading-[1.3] hover:bg-plano',
            enFavoritos ? 'pr-[2.2rem] pl-[1.3rem]' : 'pr-[1.1rem] pl-[1.3rem]',
          ].join(' ')}
          aria-current={activoEste ? 'page' : undefined}
          onClick={() => onSelect(doc.id)}
        >
          {/* La misma franja que en el lector del reglamento: una sola marca de posición
              en toda la app. */}
          {activoEste && (
            <span className="franja-activa absolute inset-y-0 left-0 w-[6px] bg-[repeating-linear-gradient(135deg,var(--tierra-a)_0_5px,var(--tierra-b)_5px_10px)]" />
          )}
          {/* El título arriba y el código abajo: los ids de la guía son largos ("01-Indice-
              unidades-tematicas") y no entran al lado del título. */}
          <span className={['min-w-0 pr-[1.6rem]', enFavoritos ? 'text-[0.95rem]' : ''].join(' ')}>
            {doc.titulo}
            <span className="dato mt-[0.2rem] block truncate text-[0.75rem] text-tinta-2">
              {doc.id}
            </span>
          </span>
        </button>
        <BotonFavorito id={doc.id} titulo={doc.titulo} favoritos={favoritos} className="absolute top-[0.3rem] right-[0.4rem]" />
      </li>
    )
  }

  return (
    <SidebarUI collapsible="offcanvas" className="min-h-0 border-r border-linea" aria-label="Índice de las guías">
      <SidebarHeader className="border-b border-linea px-[1.1rem] pt-[1.1rem] pb-[0.9rem]">
        <div className="flex items-baseline justify-between gap-[0.75rem]">
          <p className="m-0 text-[1.9rem] font-semibold leading-none tracking-[0.05em]">Guías</p>
          <InicioBoton onInicio={onInicio} />
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
          <SidebarTrigger className="alternar-barra" />
        </div>
        <p className="mt-[0.25rem] mb-[0.9rem] text-[0.95rem] text-tinta-2">
          Las {documentos.length} guías de aplicación del REBT
        </p>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-[0.6rem] top-1/2 size-3.5 -translate-y-1/2 text-tinta-2" strokeWidth={1.75} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por título o código…"
            aria-label="Filtrar documentos de la guía"
            className="w-full rounded-[4px] border border-linea bg-plano py-[0.55rem] pr-[0.7rem] pl-[2rem] placeholder:text-tinta-2 transition-colors duration-150 ease-plano focus:border-neutro focus:bg-hoja"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto pt-[0.4rem] pb-[2rem]">
        <nav>
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
          <section className="mt-[1.2rem] mb-[1.4rem]">
            <h2 className="rotulo mx-[1.1rem] mt-0 mb-[0.35rem] text-fase">Favoritos ({marcados.length})</h2>
            <ul className="m-0 list-none p-0">{marcados.map((d) => fila(d, true))}</ul>
          </section>
        )}
        <h2 className="rotulo mx-[1.1rem] mt-[1.1rem] mb-[0.35rem] text-fase">
          Documentos
        </h2>
        <ul className="m-0 list-none p-0">{visibles.map((d) => fila(d))}</ul>
        {visibles.length === 0 && (
          <p className="mx-[1.1rem] my-[1rem] text-tinta-2">Ningún documento coincide con «{q}».</p>
        )}
        </nav>
      </SidebarContent>
    </SidebarUI>
  )
}
