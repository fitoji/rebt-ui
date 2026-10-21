// Convierte el XML de la API de legislación consolidada del BOE en estructuras simples.
// Nota: se ha escrito contra la estructura documentada de la API (data > bloque > version > p/table);
// si el BOE cambia nombres de etiquetas, este es el único archivo que hay que tocar.

import type {
  Bloque,
  BloqueConContenido,
  Item,
  ItemKind,
  Rejilla,
  TituloPartido,
  Version,
} from './tipos.ts'

const tag = (el: Element): string => (el.localName || el.nodeName).toLowerCase()
const kids = (el: Element, name: string): Element[] =>
  Array.from(el.children).filter((c) => tag(c) === name)
const attrOrChild = (el: Element, name: string): string =>
  el.getAttribute(name) ?? kids(el, name)[0]?.textContent ?? ''

export const fold = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function formatDate(yyyymmdd: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(yyyymmdd || '')
  if (!m) return ''
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------- índice
export function parseIndex(doc: Document): Bloque[] {
  const code = doc.getElementsByTagName('code')[0]?.textContent
  if (code && code !== '200') {
    const text = doc.getElementsByTagName('text')[0]?.textContent || ''
    throw new Error(`La API del BOE respondió con el estado ${code}. ${text}`.trim())
  }
  const blocks = Array.from(doc.getElementsByTagName('bloque'))
    .map((b) => ({
      id: attrOrChild(b, 'id').trim(),
      titulo: attrOrChild(b, 'titulo').trim(),
      fecha: attrOrChild(b, 'fecha_actualizacion').trim(),
    }))
    .filter((b) => b.id)
  if (!blocks.length) throw new Error('El índice del BOE llegó vacío.')
  return blocks
}

// Separa "ITC-BT-19. Instalaciones interiores" en { itc: 'BT-19', nombre: 'Instalaciones interiores' }
const ITC_RE = /^(?:instrucci[óo]n t[ée]cnica complementaria\s+)?ITC[-\s]*BT[-\s]*0?(\d{1,2})\b[.\s:–-]*(.*)$/i
export function splitTitle(titulo: string): TituloPartido {
  const m = ITC_RE.exec(titulo)
  if (!m) return { itc: null, nombre: titulo }
  return { itc: `BT-${String(+m[1]).padStart(2, '0')}`, nombre: m[2] || titulo }
}

// ---------------------------------------------------------------- texto
export function inlineText(el: Element): string {
  const out: string[] = []
  const walk = (node: Node) => {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) out.push(n.nodeValue ?? '')
      else if (n.nodeType === 1) {
        const t = tag(n as Element)
        if (t === 'sup') out.push('^' + n.textContent)
        else if (t === 'sub') out.push('_' + n.textContent)
        else if (t === 'br') out.push(' ')
        else walk(n)
      }
    }
  }
  walk(el)
  return out.join('').replace(/[ \t ]+/g, ' ').trim()
}

// Rejilla rectangular con colspan/rowspan expandidos (para copiar a hoja de cálculo, CSV o Markdown)
export function tableGrid(table: Element): Rejilla {
  const rows = Array.from(table.getElementsByTagName('tr'))
  const grid: Rejilla = []
  const pending = new Map<string, string>()
  rows.forEach((tr, r) => {
    const row: string[] = []
    let c = 0
    const take = () => {
      while (pending.has(`${r},${c}`)) {
        row.push(pending.get(`${r},${c}`) ?? '')
        pending.delete(`${r},${c}`)
        c++
      }
    }
    for (const cell of Array.from(tr.children).filter((x) => ['td', 'th'].includes(tag(x)))) {
      take()
      const text = inlineText(cell)
      const cs = Math.max(1, parseInt(cell.getAttribute('colspan') || '1', 10) || 1)
      const rs = Math.max(1, parseInt(cell.getAttribute('rowspan') || '1', 10) || 1)
      for (let k = 0; k < cs; k++) {
        row.push(k === 0 ? text : '')
        for (let e = 1; e < rs; e++) pending.set(`${r + e},${c + k}`, k === 0 ? text : '')
      }
      c += cs
    }
    take()
    grid.push(row)
  })
  const width = Math.max(0, ...grid.map((r) => r.length))
  return grid.map((r) => r.concat(Array(width - r.length).fill('')))
}

export const gridToTsv = (g: Rejilla): string => g.map((r) => r.join('\t')).join('\n')
export const gridToCsv = (g: Rejilla): string =>
  g.map((r) => r.map((c) => (/[",\n;]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n')
export function gridToMarkdown(g: Rejilla): string {
  if (!g.length) return ''
  const esc = (s: string) => s.replace(/\|/g, '\\|')
  const line = (r: string[]) => `| ${r.map(esc).join(' | ')} |`
  return [line(g[0]), `|${g[0].map(() => '---').join('|')}|`, ...g.slice(1).map(line)].join('\n')
}

// ---------------------------------------------------------------- bloque
function paragraphKind(cls: string | null): ItemKind {
  const c = (cls || '').toLowerCase()
  if (/articulo/.test(c)) return 'art'
  if (/(titulo|capitulo|seccion|libro|anexo|centro)/.test(c)) return 'head'
  if (/(nota|pie)/.test(c)) return 'note'
  if (/(lista|sangr|apartado|_2|_3)/.test(c)) return 'indent'
  return 'body'
}

function collectItems(parent: Element, out: Item[] = []): Item[] {
  for (const el of Array.from(parent.children)) {
    const t = tag(el)
    if (t === 'p') {
      const text = inlineText(el)
      const hasImg = el.getElementsByTagName('img').length > 0
      if (text || hasImg) out.push({ kind: paragraphKind(el.getAttribute('class')), node: el, text })
    } else if (t === 'table') {
      const grid = tableGrid(el)
      out.push({ kind: 'table', node: el, grid, text: grid.flat().join(' ') })
    } else if (t === 'img') {
      out.push({ kind: 'img', node: el, text: el.getAttribute('alt') || '' })
    } else if (['blockquote', 'div', 'ul', 'ol', 'li'].includes(t)) {
      collectItems(el, out)
    }
  }
  return out
}

export function parseBlock(doc: Document, id: string): BloqueConContenido {
  const b = doc.getElementsByTagName('bloque')[0]
  if (!b) throw new Error(`El bloque ${id} llegó sin contenido.`)
  const vs = kids(b, 'version')
  const versions: Version[] = (vs.length ? vs : [b])
    .map((v) => {
      const items = collectItems(v)
      return {
        vigencia: v.getAttribute('fecha_vigencia') || '',
        publicacion: v.getAttribute('fecha_publicacion') || '',
        items,
        text: items.map((i) => i.text).join('\n'),
      }
    })
    .sort((a, z) => z.vigencia.localeCompare(a.vigencia)) // la vigente primero
  const current = versions[0]
  return {
    id,
    titulo: b.getAttribute('titulo') || '',
    versions,
    folded: fold(current.text),
  }
}
