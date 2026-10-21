// Renderer de Markdown para el corpus de `guia_rebt/`.
//
// No es un Markdown genérico: implementa el subconjunto que el corpus usa de verdad, medido
// sobre los 38 documentos. Lo que no aparece, no se soporta, y esa es la decisión:
//
//   - Las celdas de tabla son TEXTO LITERAL. En el corpus `(**)`, `(*)` y `Método de
//     instalación*` son notas al pie y asteriscos del PDF, nunca énfasis. Si se interpretara
//     `**` como negrita, dos notas al pie de la misma fila se emparejarían y se
//     negritaría media fila de tabla.
//   - Los asteriscos y guiones bajos sueltos no se convierten en cursiva: `_ACTIVOS_` es
//     énfasis del PDF, no sintaxis de Markdown, y emparejar `_` es igual de frágil.
//   - El corpus no tiene código en línea ni vallas ni HTML crudo, así que no hay que
//     escapar ni sanear HTML: solo texto.
//   - Las tablas vienen como rejilla rectangular expandida, con muchas celdas vacías y
//     cabeceras multinivel conservadas como filas consecutivas. Se rellenan a la anchura
//     de la tabla y se pintan tal cual.
//
// Lo único que se interpreta en línea son enlaces `[texto](url)` e imágenes `![alt](url)`,
// y siempre a través de `resolveUrl`, que es quien decide si un href llega al DOM.

const ESCAPES: Record<string, string | undefined> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}
const escapeHtml = (s: string): string => s.replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c)

const RE_HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const RE_HR = /^(?:-{3,}|\*{3,}|_{3,})\s*$/
const RE_LIST = /^-\s+(.*)$/
const RE_TABLE_SEP = /^\|(?:\s*:?-+:?\s*\|)+$/
const RE_COMMENT = /^<!--[\s\S]*?-->$/
const RE_TABLA_COMMENT = /^<!--\s*tabla:\s*(\S+)\s*-->$/

/** Cómo se resuelve un href del corpus: el visor decide si llega al DOM o no. */
export type ResolverUrl = (href: string, kind: 'link' | 'image') => string | null

/** Estado que se lleva el renderizado de un documento. */
interface Ctx {
  resolveUrl?: ResolverUrl
  /** Cuántas tablas se han emitido: cada una lleva su número. */
  tablas: number
  /** El nombre del CSV del corpus que anuncia la marca del conversor, si la hay. */
  csvPendiente: string | null
}

/**
 * Separa el front-matter (`---` … `---`) del cuerpo.
 * Devuelve los metadatos como strings; el visor los usa para el título, la edición y el PDF.
 */
export function parseFrontMatter(src: string): { data: Record<string, string>; body: string } {
  const lines = src.split('\n')
  if (lines[0]?.trim() !== '---') return { data: {}, body: src }

  let end = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i
      break
    }
  }
  if (end === -1) return { data: {}, body: src }

  const data: Record<string, string> = {}
  for (const line of lines.slice(1, end)) {
    const at = line.indexOf(':')
    if (at === -1) continue
    const key = line.slice(0, at).trim()
    if (!key) continue
    let value = line.slice(at + 1).trim()
    if (value.length > 1 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  return { data, body: lines.slice(end + 1).join('\n') }
}

/** Busca `[etiqueta](destino)` terminando en `start`. Devuelve null si no cierra bien. */
function matchLink(text: string, start: number): { label: string; href: string; end: number } | null {
  let depth = 1
  let i = start + 1
  while (i < text.length) {
    if (text[i] === '[') depth++
    else if (text[i] === ']') {
      depth--
      if (depth === 0) break
    }
    i++
  }
  if (depth !== 0 || text[i] !== ']' || text[i + 1] !== '(') return null

  let parens = 1
  let j = i + 2
  while (j < text.length) {
    if (text[j] === '(') parens++
    else if (text[j] === ')') {
      parens--
      if (parens === 0) break
    }
    j++
  }
  if (parens !== 0) return null

  return { label: text.slice(start + 1, i), href: text.slice(i + 2, j).trim(), end: j + 1 }
}

function safeHref(href: string, ctx: Ctx, kind: 'link' | 'image'): string | null {
  const resolved = ctx.resolveUrl ? ctx.resolveUrl(href, kind) : href
  if (!resolved || typeof resolved !== 'string') return null
  // Cinturón y tirantes: aunque resolveUrl diga que sí, ningún esquema peligroso pasa.
  if (/^\s*(javascript|data|vbscript):/i.test(resolved)) return null
  return resolved
}

/** Contenido en línea: solo enlaces e imágenes, todo el resto escapado como texto. */
function inline(text: string, ctx: Ctx): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const ch = text[i]

    if (ch === '!' && text[i + 1] === '[') {
      const m = matchLink(text, i + 1)
      if (m) {
        const src = safeHref(m.href, ctx, 'image')
        out += src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(m.label)}">` : escapeHtml(m.label)
        i = m.end
        continue
      }
    }

    if (ch === '[') {
      const m = matchLink(text, i)
      if (m) {
        const href = safeHref(m.href, ctx, 'link')
        out += href ? `<a href="${escapeHtml(href)}">${inline(m.label, ctx)}</a>` : escapeHtml(m.label)
        i = m.end
        continue
      }
    }

    out += ESCAPES[ch] ?? ch
    i++
  }
  return out
}

function cells(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

/**
 * Nombre del CSV del corpus para la tabla que anuncia el conversor.
 * El conversor emite `<!-- tabla: ../tablas/BT-03_t01.csv -->` justo antes de cada tabla.
 * Se queda solo el nombre del archivo: una ruta en el atributo `download` es ruido.
 */
function nombreCsv(ref: string): string | null {
  const base = ref.split('/').pop() ?? ''
  const limpio = base.replace(/[^A-Za-z0-9._-]/g, '')
  if (!limpio) return null
  return limpio.toLowerCase().endsWith('.csv') ? limpio : `${limpio}.csv`
}

function renderTable(header: string[], rows: string[][], ctx: Ctx, csv: string | null): string {
  const width = Math.max(1, header.length, ...rows.map((r) => r.length))
  const pad = (row: string[]): string[] =>
    row.length >= width ? row : [...row, ...new Array(width - row.length).fill('')]
  const cell = (tag: string, value: string): string => `<${tag}>${escapeHtml(value)}</${tag}>`

  const head = `<tr>${pad(header).map((c) => cell('th', c)).join('')}</tr>`
  const body = rows.map((r) => `<tr>${pad(r).map((c) => cell('td', c)).join('')}</tr>`)

  ctx.tablas += 1

  return [
    `<div class="tabla-guia" data-tabla="${ctx.tablas}"${csv ? ` data-csv="${escapeHtml(csv)}"` : ''}>`,
    // Las mismas tres acciones que las tablas del lector del REBT. Los manejadores no
    // viven aquí: el HTML se inyecta entero, así que `Guia.jsx` atiende el clic que sube
    // desde el botón hasta el artículo.
    '<div class="tabla-acciones">',
    '<button type="button" data-accion="copiar">Copiar</button>',
    '<button type="button" data-accion="markdown">Markdown</button>',
    '<button type="button" data-accion="csv">Descargar CSV</button>',
    '<span role="status" class="tabla-aviso" data-aviso></span>',
    '</div>',
    '<div class="tabla-scroll">',
    '<table>',
    '<thead>',
    head,
    '</thead>',
    '<tbody>',
    ...body,
    '</tbody>',
    '</table>',
    '</div>',
    '</div>',
  ].join('\n')
}

/** ¿La línea en `i` abre otro bloque? Si es así, el párrafo anterior tiene que terminar ahí. */
function startsBlock(lines: string[], i: number): boolean {
  const line = lines[i]
  const trimmed = line.trim()
  if (!trimmed) return true
  if (RE_HEADING.test(line) || RE_HR.test(trimmed) || RE_COMMENT.test(trimmed)) return true
  if (line.startsWith('>') || RE_LIST.test(line)) return true
  if (line.startsWith('|') && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1].trim())) return true
  return false
}

function renderBlocks(lines: string[], ctx: Ctx): string {
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) {
      i++
      continue
    }

    // Los comentarios `<!-- tabla: … -->` son marcas del conversor, no contenido. Pero el
    // conversor emite una justo antes de cada tabla, con el nombre del CSV del corpus
    // (`../tablas/BT-03_t01.csv`): ese nombre es el que se usa al descargar la tabla.
    if (RE_COMMENT.test(trimmed)) {
      const marca = trimmed.match(RE_TABLA_COMMENT)
      ctx.csvPendiente = marca ? nombreCsv(marca[1]) : null
      i++
      continue
    }

    // A partir de aquí el bloque ya no es la tabla que anunciaba la marca.
    const csv = ctx.csvPendiente
    ctx.csvPendiente = null

    const heading = line.match(RE_HEADING)
    if (heading) {
      const level = heading[1].length
      out.push(`<h${level}>${inline(heading[2], ctx)}</h${level}>`)
      i++
      continue
    }

    if (RE_HR.test(trimmed)) {
      out.push('<hr>')
      i++
      continue
    }

    if (line.startsWith('|') && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1].trim())) {
      const header = cells(line)
      i += 2 // cabecera + separador
      const rows = []
      while (i < lines.length && lines[i].startsWith('|') && lines[i].trim()) {
        rows.push(cells(lines[i]))
        i++
      }
      out.push(renderTable(header, rows, ctx, csv))
      continue
    }

    if (line.startsWith('>')) {
      const inner = []
      while (i < lines.length && lines[i].startsWith('>')) {
        inner.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote>\n${renderBlocks(inner, ctx)}\n</blockquote>`)
      continue
    }

    const item = line.match(RE_LIST)
    if (item) {
      const items = []
      while (i < lines.length) {
        const next = lines[i].match(RE_LIST)
        if (!next) break
        items.push(next[1])
        i++
      }
      out.push(`<ul>\n${items.map((t) => `<li>${inline(t, ctx)}</li>`).join('\n')}\n</ul>`)
      continue
    }

    const paragraph = []
    while (i < lines.length && !startsBlock(lines, i)) {
      paragraph.push(lines[i].trim())
      i++
    }
    out.push(`<p>${inline(paragraph.join(' '), ctx)}</p>`)
  }

  return out.join('\n')
}

/**
 * Convierte un documento del corpus en HTML.
 * @param src texto del .md tal cual está en guia_rebt/md/
 * @param opts cómo se resuelven los href del corpus
 */
export function renderDocument(
  src: string,
  { resolveUrl }: { resolveUrl?: ResolverUrl } = {},
): { frontMatter: Record<string, string>; html: string } {
  const { data, body } = parseFrontMatter(src)
  return {
    frontMatter: data,
    html: renderBlocks(body.split('\n'), { resolveUrl, tablas: 0, csvPendiente: null }),
  }
}
