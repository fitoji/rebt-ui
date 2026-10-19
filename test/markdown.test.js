import assert from 'node:assert/strict'
import test from 'node:test'
import { parseFrontMatter, renderDocument } from '../src/guia/markdown.js'
import { resolveGuiaUrl } from '../src/guia/urls.js'

// resolveUrl de mentira: no toca el disco, solo deja ver qué href pide el renderer.
const keep = (href) => (href.startsWith('/guia/') || href.startsWith('https://') ? href : null)

test('el renderer pasa el tipo del href como segundo argumento', () => {
  // Contrato con `guia/urls.js`: recibe (href, 'link' | 'image'). Si el renderer no lo
  // pasara, `resolveGuiaUrl` recibiría el tipo donde espera `{ fuentePdf }` y descartaría
  // los enlaces al PDF oficial sin avisar.
  const vistos = []
  renderDocument('![a](/guia/imgs/x.png) y [b](/guia/md/y.md)', {
    resolveUrl: (href, kind) => {
      vistos.push([href, kind])
      return keep(href)
    },
  })
  assert.deepEqual(vistos, [
    ['/guia/imgs/x.png', 'image'],
    ['/guia/md/y.md', 'link'],
  ])
})

test('los enlaces a página del PDF sobreviven cuando el resolver va ligado al documento', () => {
  // Este es el camino que usa la app: ligar `resolveGuiaUrl` con el `fuente_pdf` del
  // documento. Si el enlace se pierde, el "ver en el PDF" del corpus desaparece en silencio.
  const PDF = 'https://industria.gob.es/x/guia_bt_19_feb09R2.pdf'
  const ligado = (href) => resolveGuiaUrl(href, { fuentePdf: PDF })

  const src = '> Figura en la pág. 7 del PDF original: [ver en el PDF](../pdf/BT-19.pdf#page=7)'
  const { html } = renderDocument(src, { resolveUrl: ligado })
  assert.match(html, /<a href="https:\/\/industria\.gob\.es\/x\/guia_bt_19_feb09R2\.pdf#page=7">/)
})

test('separa el front-matter del cuerpo', () => {
  const { data, body } = parseFrontMatter(
    ['---', 'guia: BT-19', 'titulo: BT-19. Instalaciones interiores', 'edicion: feb 09', 'paginas: 26', '---', '', '# BT-19', ''].join('\n'),
  )
  assert.equal(data.guia, 'BT-19')
  assert.equal(data.paginas, '26')
  assert.match(body, /^# BT-19/m)
})

test('un documento sin front-matter deja el cuerpo intacto', () => {
  const { data, body } = parseFrontMatter('# Hola\n\ntexto')
  assert.deepEqual(data, {})
  assert.equal(body, '# Hola\n\ntexto')
})

test('renderiza encabezados con su nivel real', () => {
  assert.equal(renderDocument('# BT-19. Título', { resolveUrl: keep }).html, '<h1>BT-19. Título</h1>')
  assert.equal(renderDocument('### 0. ÍNDICE', { resolveUrl: keep }).html, '<h3>0. ÍNDICE</h3>')
  assert.equal(renderDocument('#### 2.2.1 Sección', { resolveUrl: keep }).html, '<h4>2.2.1 Sección</h4>')
})

test('renderiza párrafos juntando líneas blandas', () => {
  const { html } = renderDocument('primera línea\nsegunda línea\n\notro párrafo', { resolveUrl: keep })
  assert.equal(html, '<p>primera línea segunda línea</p>\n<p>otro párrafo</p>')
})

test('renderiza listas', () => {
  const { html } = renderDocument('- uno\n- dos\n- tres', { resolveUrl: keep })
  assert.equal(html, '<ul>\n<li>uno</li>\n<li>dos</li>\n<li>tres</li>\n</ul>')
})

test('une blockquotes consecutivos en uno solo', () => {
  // Caso real de BT-Anexo-2: la nota de página ilegible ocupa dos líneas con ">".
  const src = '> La tabla de esta página no se puede extraer\n> como texto: se ve la imagen.'
  const { html } = renderDocument(src, { resolveUrl: keep })
  assert.equal(html, '<blockquote>\n<p>La tabla de esta página no se puede extraer como texto: se ve la imagen.</p>\n</blockquote>')
})

test('procesa enlaces dentro de un blockquote', () => {
  const src = '> Figura en la pág. 1 del PDF original: [ver en el PDF](/guia/pdf/BT-Anexo-2.pdf#page=1)'
  const { html } = renderDocument(src, { resolveUrl: keep })
  assert.match(html, /<a href="\/guia\/pdf\/BT-Anexo-2\.pdf#page=1">ver en el PDF<\/a>/)
})

test('renderiza la regla horizontal ---', () => {
  const { html } = renderDocument('antes\n\n---\n\ndespués', { resolveUrl: keep })
  assert.equal(html, '<p>antes</p>\n<hr>\n<p>después</p>')
})

test('reescribe el href de las imágenes al corpus servido', () => {
  const src = '![figura pág 7](/guia/imgs/BT-19_p07_i01.png)'
  const { html } = renderDocument(src, { resolveUrl: keep })
  assert.equal(html, '<p><img src="/guia/imgs/BT-19_p07_i01.png" alt="figura pág 7"></p>')
})

test('descarta imágenes y enlaces que resolveUrl rechaza', () => {
  // El corpus es de fiar, pero un href con javascript: no debe llegar al DOM.
  const drop = () => null
  assert.equal(renderDocument('[clic](javascript:alert(1))', { resolveUrl: drop }).html, '<p>clic</p>')
  assert.equal(renderDocument('![alt](javascript:alert(1))', { resolveUrl: drop }).html, '<p>alt</p>')
})

test('renderiza una tabla pipe con celdas vacías', () => {
  // Cabecera real de BT-19: 13 columnas, casi todas vacías porque la rejilla viene expandida.
  const src = ['| Método | Aislamiento |  |  |', '|---|---|---|---|', '| A1 |  | 3x PVC |  |', '| B1 | 2x PVC |  |  |'].join('\n')
  const { html } = renderDocument(src, { resolveUrl: keep })
  assert.equal(
    html,
    [
      '<div class="tabla-scroll">',
      '<table>',
      '<thead>',
      '<tr><th>Método</th><th>Aislamiento</th><th></th><th></th></tr>',
      '</thead>',
      '<tbody>',
      '<tr><td>A1</td><td></td><td>3x PVC</td><td></td></tr>',
      '<tr><td>B1</td><td>2x PVC</td><td></td><td></td></tr>',
      '</tbody>',
      '</table>',
      '</div>',
    ].join('\n'),
  )
})

test('las celdas de tabla son texto literal: (**) es nota al pie, no negrita', () => {
  // Si dos marcadores (**) de la misma fila se emparejaran, se boldearía media fila.
  const src = ['| x |  | SI |  |', '|---|---|---|---|', '| a |  | NO (**) |  |', '| b | (**) |  | (**) |  |'].join('\n')
  const { html } = renderDocument(src, { resolveUrl: keep })
  assert.match(html, /<td>NO \(\*\*\)<\/td>/)
  // La fila con dos marcadores NO puede generar negrita: no hay ni un <strong>.
  assert.equal(/<strong>|<b>/.test(html), false)
  assert.equal((html.match(/\(\*\*\)/g) ?? []).length, 3)
})

test('una tabla no se confunde con un párrafo que empieza por barra', () => {
  const src = '| esto no es tabla\n\npárrafo'
  const { html } = renderDocument(src, { resolveUrl: keep })
  assert.equal(html, '<p>| esto no es tabla</p>\n<p>párrafo</p>')
})

test('descarta los comentarios <!-- tabla: … -->', () => {
  const src = 'Texto\n\n<!-- tabla: ../tablas/BT-19_t01.csv -->\n\nMás texto'
  const { html } = renderDocument(src, { resolveUrl: keep })
  assert.equal(html, '<p>Texto</p>\n<p>Más texto</p>')
})

test('escapa el HTML del texto', () => {
  const { html } = renderDocument('cosas <b> & "comillas"', { resolveUrl: keep })
  assert.equal(html, '<p>cosas &lt;b&gt; &amp; &quot;comillas&quot;</p>')
})

test('deja los asteriscos y guiones bajos literales', () => {
  // En el corpus `_TEXTO_` es énfasis del PDF, no cursiva de Markdown, y `(*)` es nota al pie.
  const { html } = renderDocument('_INSTALACIONES INTERIORES._ y Cable (*)', { resolveUrl: keep })
  assert.equal(html, '<p>_INSTALACIONES INTERIORES._ y Cable (*)</p>')
})

test('un pipe suelto dentro de un párrafo no rompe nada', () => {
  const { html } = renderDocument('una | dos', { resolveUrl: keep })
  assert.equal(html, '<p>una | dos</p>')
})
