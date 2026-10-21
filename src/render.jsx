import { createContext, useContext, useState } from 'react'
import { fold, gridToCsv, gridToMarkdown, gridToTsv } from './parse.js'
import { AVISO_COPIAR, AVISO_ERROR, AVISO_MARKDOWN, copiarAlPortapapeles, descargar } from './tablas.js'

// Texto a resaltar (lo que la persona está buscando)
export const Highlight = createContext('')

const tag = (n) => (n.localName || n.nodeName).toLowerCase()

function Marked({ text }) {
  const q = useContext(Highlight)
  if (q.length < 3) return text
  const f = fold(text)
  const needle = fold(q)
  if (f.length !== text.length || !f.includes(needle)) return text
  const parts = []
  let from = 0
  for (let i = f.indexOf(needle); i !== -1; i = f.indexOf(needle, from)) {
    parts.push(text.slice(from, i), <mark key={i}>{text.slice(i, i + needle.length)}</mark>)
    from = i + needle.length
  }
  parts.push(text.slice(from))
  return parts
}

function boeSrc(src) {
  if (!src) return ''
  return /^https?:/.test(src) ? src : `https://www.boe.es${src.startsWith('/') ? '' : '/'}${src}`
}

export function Inline({ node }) {
  return Array.from(node.childNodes).map((n, i) => {
    if (n.nodeType === 3) return <Marked key={i} text={n.nodeValue} />
    if (n.nodeType !== 1) return null
    switch (tag(n)) {
      case 'sup':
        return <sup key={i}><Inline node={n} /></sup>
      case 'sub':
        return <sub key={i}><Inline node={n} /></sub>
      case 'i':
      case 'em':
        return <em key={i}><Inline node={n} /></em>
      case 'b':
      case 'strong':
        return <strong key={i}><Inline node={n} /></strong>
      case 'br':
        return <br key={i} />
      case 'img':
        return <Figure key={i} node={n} />
      default:
        return <Inline key={i} node={n} />
    }
  })
}

// Las fórmulas del reglamento vienen como imágenes alojadas en boe.es
export function Figure({ node }) {
  return (
    <img
      className="figura"
      src={boeSrc(node.getAttribute('src'))}
      alt={node.getAttribute('alt') || 'Figura del reglamento'}
      loading="lazy"
    />
  )
}

function TableNode({ node }) {
  const t = tag(node)
  const children = () =>
    Array.from(node.children).map((c, i) => <TableNode key={i} node={c} />)
  switch (t) {
    case 'thead':
      return <thead>{children()}</thead>
    case 'tbody':
      return <tbody>{children()}</tbody>
    case 'tfoot':
      return <tfoot>{children()}</tfoot>
    case 'tr':
      return <tr>{children()}</tr>
    case 'caption':
      return <caption><Inline node={node} /></caption>
    case 'th':
    case 'td': {
      const Cell = t
      return (
        <Cell
          colSpan={parseInt(node.getAttribute('colspan') || '1', 10) || 1}
          rowSpan={parseInt(node.getAttribute('rowspan') || '1', 10) || 1}
        >
          <Inline node={node} />
        </Cell>
      )
    }
    default:
      return null
  }
}

export function Table({ item, name }) {
  const [done, setDone] = useState('')
  const flash = (msg) => {
    setDone(msg)
    setTimeout(() => setDone(''), 1600)
  }
  const copy = async (text, msg) => {
    try {
      await copiarAlPortapapeles(text)
      flash(msg)
    } catch {
      flash(AVISO_ERROR)
    }
  }
  return (
    <figure className="tabla">
      <div className="tabla-acciones">
        <button onClick={() => copy(gridToTsv(item.grid), AVISO_COPIAR)}>
          Copiar
        </button>
        <button onClick={() => copy(gridToMarkdown(item.grid), AVISO_MARKDOWN)}>
          Markdown
        </button>
        <button onClick={() => descargar(`${name}.csv`, gridToCsv(item.grid), 'text/csv')}>
          Descargar CSV
        </button>
        <span role="status" className="tabla-aviso">{done}</span>
      </div>
      <div className="tabla-scroll" tabIndex={0}>
        <table>
          {Array.from(item.node.children).map((c, i) => (
            <TableNode key={i} node={c} />
          ))}
        </table>
      </div>
    </figure>
  )
}

export function Item({ item, tableName }) {
  if (item.kind === 'table') return <Table item={item} name={tableName} />
  if (item.kind === 'img') return <Figure node={item.node} />
  const body = <Inline node={item.node} />
  switch (item.kind) {
    case 'art':
      return <h3 className="art">{body}</h3>
    case 'head':
      return <h2 className="cap">{body}</h2>
    case 'note':
      return <p className="nota">{body}</p>
    case 'indent':
      return <p className="sangria">{body}</p>
    default:
      return <p>{body}</p>
  }
}
