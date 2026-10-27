import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getIndex, loadAll, peekBlock } from './api.ts'
import { buscarEnBloques, normaliza } from './busqueda.ts'
import BotonBarra from './BotonBarra.tsx'
import type { Nota } from './notas.ts'
import type { ControlNotas } from './notas.ts'
import { SidebarInset } from '@/components/ui/sidebar.tsx'
import Reader from './Reader.tsx'
import Sidebar from './Sidebar.tsx'
import { useTheme } from './useTheme.ts'
import type { Bloque, Fila } from './tipos.ts'

/** El índice del BOE: cargando, cargado o con error. */
type EstadoIndice =
  | { status: 'loading' }
  | { status: 'ok'; blocks: Bloque[] }
  | { status: 'error'; error: Error }

interface AppProps {
  docId?: string
  /** La nota a la que hay que llevar la vista, si viene de la página de notas. */
  nota?: string
  onNavigate: (destino: string) => void
  /** Las notas del usuario: las tiene el Router, para que las vistas las compartan. */
  notas: ControlNotas
}

export default function App({ docId, nota, onNavigate, notas }: AppProps) {
  const [index, setIndex] = useState<EstadoIndice>({ status: 'loading' })
  const [activeId, setActiveId] = useState(docId ?? '')
  const [query, setQuery] = useState('')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [textReady, setTextReady] = useState(false)
  /** Cuántos bloques van descargados. Es la señal de que hay texto nuevo que buscar. */
  const [indexados, setIndexados] = useState(0)
  const [failed, setFailed] = useState<string[]>([])
  const { theme, toggle } = useTheme()
  // El artículo: la barra lateral muestra las notas y el lector las aplica sobre el
  // texto. Las notas las tiene el Router, que es el padre de los dos.
  const articulo = useRef<HTMLElement>(null)

  const loadIndex = useCallback(() => {
    setIndex({ status: 'loading' })
    getIndex().then(
      (blocks) => setIndex({ status: 'ok', blocks }),
      (error: Error) => setIndex({ status: 'error', error }),
    )
  }, [])
  useEffect(loadIndex, [loadIndex])

  useEffect(() => setActiveId(docId ?? ''), [docId])

  const blocks = index.status === 'ok' ? index.blocks : []
  const active = blocks.find((b) => b.id === activeId) ?? blocks[0]
  const at = active ? blocks.indexOf(active) : -1

  const select = useCallback(
    (id: string) => {
      onNavigate(`rebt/${encodeURIComponent(id)}`)
    },
    [onNavigate],
  )

  const indexAll = useCallback(async () => {
    setProgress({ done: 0, total: blocks.length })
    const bad = await loadAll(
      blocks.map((b) => b.id),
      {
        onProgress: (done: number) => {
          setProgress({ done, total: blocks.length })
          // Cada bloque que llega dispara un recálculo de la búsqueda: los resultados
          // aparecen mientras se indexa, no al final. El primero tarda ~200 ms, así que
          // el usuario ve coincidencias casi enseguida en vez de esperar 5,6 s a ciegas.
          setIndexados(done)
        },
      },
    )
    setFailed(bad)
    setProgress(null)
    setTextReady(true)
  }, [blocks])

  const q = query.trim()
  const searching = q.length >= 3
  // Los títulos normalizados se calculan una vez: normalizar 98 títulos en cada
  // recálculo de la búsqueda es trabajo de más.
  const titulos = useMemo(() => blocks.map((b) => normaliza(b.titulo)), [blocks])
  const rows = useMemo<Fila[]>(() => {
    if (!searching) return blocks.map((entry) => ({ entry }))
    return buscarEnBloques(blocks, q, titulos, peekBlock)
    // `indexados` no se usa dentro del memo: es la señal de que han llegado bloques
    // nuevos. Sin él, el memo no se recalcularía y los resultados no aparecerían solos.
  }, [blocks, titulos, q, searching, indexados])

  // Las notas del bloque que se está leyendo, para la barra lateral.
  const notasDelBloque = useMemo(
    () => (active ? notas.notas.filter((n) => n.origen === active.id) : []),
    [notas.notas, active],
  )

  /** Ir al resaltado de una nota: el artículo es el del lector. */
  const irANota = useCallback((nota: Nota) => {
    const mark = articulo.current?.querySelector(`mark.nota[data-nota="${nota.id}"]`)
    if (!(mark instanceof HTMLElement)) return
    mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
    mark.classList.remove('nota-aviso')
    // Un segundo pulso para que se vea a dónde se fue.
    void mark.offsetWidth
    mark.classList.add('nota-aviso')
  }, [])

  if (index.status === 'loading') return <p className="pantalla" role="status">Cargando el índice del BOE…</p>
  if (index.status === 'error') {
    return (
      <div className="pantalla error" role="alert">
        <h1>No se pudo leer el índice</h1>
        <p>{index.error.message}</p>
        <p>
          Comprueba que ejecutas la app con <code>npm run dev</code> (el proxy de Vite es lo que permite
          llamar al BOE desde el navegador) y que tienes conexión.
        </p>
        <button onClick={loadIndex}>Reintentar</button>
      </div>
    )
  }

  return (
    <>
      <Sidebar
        rows={rows}
        searching={searching}
        activeId={active?.id}
        onSelect={select}
        query={query}
        setQuery={setQuery}
        textReady={textReady}
        progress={progress}
        onIndexAll={indexAll}
        failed={failed}
        onInicio={() => onNavigate('')}
        theme={theme}
        onToggleTheme={toggle}
        notas={notasDelBloque}
        totalNotas={notas.notas.length}
        onIrANota={irANota}
        onQuitarNota={(nota: Nota) => notas.quitar(nota.id)}
        onVerTodasNotas={() => onNavigate('notas')}
      />
      <SidebarInset className="h-[100svh] overflow-hidden">
        <BotonBarra />
        {active && (
          <Reader
            key={active.id}
            entry={active}
            prev={blocks[at - 1]}
            next={blocks[at + 1]}
            onSelect={select}
            highlight={searching ? q : ''}
            notas={notas}
            articulo={articulo}
            nota={nota}
          />
        )}
      </SidebarInset>
    </>
  )
}
