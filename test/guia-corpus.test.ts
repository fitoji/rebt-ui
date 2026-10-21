import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { resolveCorpusPath } from '../vite/guia-corpus.ts'

const ROOT = path.resolve(process.cwd(), 'guia_rebt')

test('resuelve las rutas que el visor necesita', () => {
  assert.equal(resolveCorpusPath('/indice.json'), path.join(ROOT, 'indice.json'))
  assert.equal(resolveCorpusPath('/md/BT-19.md'), path.join(ROOT, 'md', 'BT-19.md'))
  assert.equal(resolveCorpusPath('/imgs/BT-19_p07_i01.png'), path.join(ROOT, 'imgs', 'BT-19_p07_i01.png'))
})

test('ignora query string y fragmento', () => {
  assert.equal(resolveCorpusPath('/md/BT-19.md?v=2'), path.join(ROOT, 'md', 'BT-19.md'))
  assert.equal(resolveCorpusPath('/md/BT-19.md#page=5'), path.join(ROOT, 'md', 'BT-19.md'))
})

test('rechaza path traversal con segmentos', () => {
  const attacks = [
    '/../package.json',
    '/md/../../package.json',
    '/md/../../../etc/passwd',
    '/imgs/../../../../etc/shadow',
    '/./md/BT-19.md',
    '/md/./BT-19.md',
    '/md//BT-19.md',
    '/md/subdir/',
  ]
  for (const attack of attacks) {
    assert.equal(resolveCorpusPath(attack), null, `debería rechazar ${attack}`)
  }
})

test('rechaza traversal codificado en percent-encoding', () => {
  for (const attack of ['/%2e%2e/package.json', '/md/%2e%2e%2f%2e%2e%2fpackage.json', '/..%2fpackage.json']) {
    assert.equal(resolveCorpusPath(attack), null, `debería rechazar ${attack}`)
  }
})

test('rechaza byte nulo y percent-encoding inválido', () => {
  assert.equal(resolveCorpusPath('/md/BT-19.md%00.png'), null)
  assert.equal(resolveCorpusPath('/md/%zz.md'), null)
})

test('rechaza lo que no está expuesto', () => {
  // `pdf/` son 12 MB y está en .gitignore; `tablas/` no lo usa el visor.
  assert.equal(resolveCorpusPath('/pdf/BT-19.pdf'), null)
  assert.equal(resolveCorpusPath('/tablas/BT-19_t01.csv'), null)
  assert.equal(resolveCorpusPath('/convert_guia_to_markdown.py'), null)
  assert.equal(resolveCorpusPath('/README.md'), null)
})

test('devuelve null para un archivo que no existe', () => {
  assert.equal(resolveCorpusPath('/md/BT-99.md'), null)
})

test('no sirve archivos fuera del corpus aunque existan', () => {
  // La raíz por defecto es guia_rebt/, pero aun así se comprueba el resultado final.
  assert.equal(resolveCorpusPath('/index.html'), null)
  assert.equal(resolveCorpusPath('/src/App.jsx'), null)
})
