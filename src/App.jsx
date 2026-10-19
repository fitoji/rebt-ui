import { useCallback, useEffect, useMemo, useState } from 'react'
import { getIndex, loadAll, peekBlock } from './api.js'
import { fold, splitTitle } from './parse.js'
import Reader from './Reader.jsx'
import Sidebar from './Sidebar.jsx'

function snippetOf(text, needle) {
  const f = fold(text)
  const i = f.indexOf(needle)
  if (i < 0 || f.length !== text.length) return ''
  const a = Math.max(0, i - 50)
  const b = Math.min(text.length, i + needle.length + 70)
  return (a > 0 ? '…' : '') + text.slice(a, b).replace(/\s+/g, ' ') + (b < text.length ? '…' : '')
}

function countOf(folded, needle) {
  let n = 0
  for (let i = folded.indexOf(needle); i !== -1; i = folded.indexOf(needle, i + needle.length)) n++
  return n
}

export default function App({ docId, onNavigate }) {
  const [index, setIndex] = useState({ status: 'loading' })
  const [activeId, setActiveId] = useState(docId ?? '')
  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const [progress, setProgress] = useState(null)
  const [textReady, setTextReady] = useState(false)
  const [failed, setFailed] = useState([])

  const loadIndex = useCallback(() => {
    setIndex({ status: 'loading' })
    getIndex().then(
      (blocks) => setIndex({ status: 'ok', blocks }),
      (error) => setIndex({ status: 'error', error }),
    )
  }, [])
  useEffect(loadIndex, [loadIndex])

  useEffect(() => setActiveId(docId ?? ''), [docId])

  const blocks = index.blocks ?? []
  const active = blocks.find((b) => b.id === activeId) ?? blocks[0]
  const at = active ? blocks.indexOf(active) : -1

  const select = useCallback(
    (id) => {
      setNavOpen(false)
      onNavigate(`rebt/${encodeURIComponent(id)}`)
    },
    [onNavigate],
  )

  const indexAll = useCallback(async () => {
    setProgress({ done: 0, total: blocks.length })
    const bad = await loadAll(
      blocks.map((b) => b.id),
      { onProgress: (done) => setProgress({ done, total: blocks.length }) },
    )
    setFailed(bad)
    setProgress(null)
    setTextReady(true)
  }, [blocks])

  const q = query.trim()
  const searching = q.length >= 3
  const rows = useMemo(() => {
    if (!searching) return blocks.map((entry) => ({ entry }))
    const needle = fold(q)
    if (textReady) {
      return blocks
        .map((entry) => {
          const b = peekBlock(entry.id)
          const inTitle = fold(entry.titulo).includes(needle)
          const count = b ? countOf(b.folded, needle) : 0
          if (!inTitle && !count) return null
          return {
            entry,
            count,
            snippet: count ? snippetOf(b.versions[0].text, needle) : '',
          }
        })
        .filter(Boolean)
    }
    return blocks.filter((e) => fold(e.titulo).includes(needle)).map((entry) => ({ entry }))
  }, [blocks, q, searching, textReady])

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
    <div className={'app' + (navOpen ? ' nav-abierta' : '')}>
      <button className="abrir-indice" onClick={() => setNavOpen((v) => !v)} aria-expanded={navOpen}>
        Índice
      </button>
      <Sidebar
        blocks={blocks}
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
      />
      {active && (
        <Reader
          key={active.id}
          entry={active}
          prev={blocks[at - 1]}
          next={blocks[at + 1]}
          onSelect={select}
          highlight={searching ? q : ''}
        />
      )}
    </div>
  )
}
