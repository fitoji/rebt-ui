import assert from 'node:assert/strict'
import test from 'node:test'
import { parseRoute } from '../src/route.ts'

test('sin hash o con hash vacío se muestra la landing', () => {
  for (const hash of ['', '#', '#/', '#//']) {
    assert.deepEqual(parseRoute(hash), { name: 'landing' }, `hash ${JSON.stringify(hash)}`)
  }
})

test('las rutas de la guía', () => {
  assert.deepEqual(parseRoute('#/guia'), { name: 'guia', id: null })
  assert.deepEqual(parseRoute('#/guia/'), { name: 'guia', id: null })
  assert.deepEqual(parseRoute('#/guia/BT-19'), { name: 'guia', id: 'BT-19' })
  assert.deepEqual(parseRoute('#/guia/BT-Anexo-2'), { name: 'guia', id: 'BT-Anexo-2' })
})

test('las rutas del lector', () => {
  assert.deepEqual(parseRoute('#/rebt'), { name: 'rebt', id: null })
  assert.deepEqual(parseRoute('#/rebt/i01'), { name: 'rebt', id: 'i01' })
})

test('los enlaces profundos antiguos del lector siguen funcionando', () => {
  // El README ya publicaba `#/{id}`; añadir la landing no puede romperlos.
  assert.deepEqual(parseRoute('#/i01'), { name: 'rebt', id: 'i01' })
  assert.deepEqual(parseRoute('#/anx'), { name: 'rebt', id: 'anx' })
  assert.deepEqual(parseRoute('#/a1'), { name: 'rebt', id: 'a1' })
  assert.deepEqual(parseRoute('#/pr'), { name: 'rebt', id: 'pr' })
})

test('un id codificado se decodifica', () => {
  assert.deepEqual(parseRoute('#/guia/00-Introduccion'), { name: 'guia', id: '00-Introduccion' })
  assert.deepEqual(parseRoute('#/guia/ZZ-Nota-interpretacion-separacion-galvanica'), {
    name: 'guia',
    id: 'ZZ-Nota-interpretacion-separacion-galvanica',
  })
})

test('un hash roto no deja la app en blanco', () => {
  assert.deepEqual(parseRoute('#/%E0%A4%A'), { name: 'rebt', id: '%E0%A4%A' })
  assert.deepEqual(parseRoute(undefined), { name: 'landing' })
  assert.deepEqual(parseRoute(null), { name: 'landing' })
})

test('la página de todas las notas', () => {
  assert.deepEqual(parseRoute('#/notas'), { name: 'notas' })
})

test('una nota puede ir en la ruta, para saltar a ella desde la página', () => {
  // Es lo que hace el enlace «Ir al texto» de la página de notas.
  assert.deepEqual(parseRoute('#/guia/BT-19?nota=abc-123'), {
    name: 'guia',
    id: 'BT-19',
    nota: 'abc-123',
  })
  assert.deepEqual(parseRoute('#/rebt/ib-19?nota=abc-123'), {
    name: 'rebt',
    id: 'ib-19',
    nota: 'abc-123',
  })
  // Y sin nota, la ruta es la de siempre.
  assert.deepEqual(parseRoute('#/guia/BT-19'), { name: 'guia', id: 'BT-19' })
})
