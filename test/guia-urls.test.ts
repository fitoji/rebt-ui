import assert from 'node:assert/strict'
import test from 'node:test'
import { officialPdfUrl, resolveGuiaUrl } from '../src/guia/urls.ts'

const PDF = 'https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalacionesindustriales/baja-tension/Documents/bt/guia_bt_19_feb09R2.pdf'

test('las imágenes del corpus se sirven desde /guia/imgs', () => {
  assert.equal(resolveGuiaUrl('../imgs/BT-19_p07_i01.png'), '/guia/imgs/BT-19_p07_i01.png')
})

test('los enlaces a página del PDF apuntan al PDF oficial y conservan el ancla', () => {
  // 65 de estos enlaces en el corpus. Sin esto irían a un pdf/ que no se publica.
  assert.equal(resolveGuiaUrl('../pdf/BT-19.pdf#page=7', { fuentePdf: PDF }), PDF + '#page=7')
  assert.equal(resolveGuiaUrl('../pdf/BT-Anexo-2.pdf#page=1', { fuentePdf: PDF }), PDF + '#page=1')
})

test('un enlace a PDF sin ancla también se resuelve', () => {
  assert.equal(resolveGuiaUrl('../pdf/BT-19.pdf', { fuentePdf: PDF }), PDF)
})

test('sin fuente_pdf conocida, el enlace a PDF no se inventa', () => {
  assert.equal(resolveGuiaUrl('../pdf/BT-19.pdf#page=7'), null)
})

test('los CSV no se enlazan: las tablas ya vienen dentro del Markdown', () => {
  assert.equal(resolveGuiaUrl('../tablas/BT-19_t01.csv'), null)
})

test('las URLs absolutas que ya son https se dejan como están', () => {
  assert.equal(resolveGuiaUrl('https://www.boe.es/x', {}), 'https://www.boe.es/x')
})

test('cualquier otra cosa se descarta', () => {
  // En particular, nada de javascript: llega al DOM.
  for (const href of ['javascript:alert(1)', 'data:text/html,<script>', '/otra/cosa', '', 'vbscript:x']) {
    assert.equal(resolveGuiaUrl(href, { fuentePdf: PDF }), null, `debería descartar ${href}`)
  }
})

test('el PDF oficial sale solo si es una URL http(s)', () => {
  assert.equal(officialPdfUrl({ fuente_pdf: PDF }), PDF)
  assert.equal(officialPdfUrl({ fuente_pdf: 'javascript:alert(1)' }), null)
  assert.equal(officialPdfUrl({}), null)
  assert.equal(officialPdfUrl(null), null)
})
