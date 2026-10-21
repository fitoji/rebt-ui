import assert from 'node:assert/strict'
import test from 'node:test'
import { alternaFavoritos, parseFavoritos } from '../src/favoritos.ts'

// Los favoritos viven en localStorage. Lo que se testea es la lógica de leer y de
// alternar, que es lo que puede salir mal: un valor corrupto no puede romper la app.

test('lee una lista de favoritos guardada', () => {
  assert.deepEqual(parseFavoritos('["ib-19","ib-40"]'), ['ib-19', 'ib-40'])
  assert.deepEqual(parseFavoritos('[]'), [])
})

test('un valor corrupto o ausente deja la lista vacía', () => {
  assert.deepEqual(parseFavoritos(null), [])
  assert.deepEqual(parseFavoritos(''), [])
  assert.deepEqual(parseFavoritos('{no es json'), [])
  assert.deepEqual(parseFavoritos('{"a":1}'), [])
  assert.deepEqual(parseFavoritos('"un texto"'), [])
})

test('deja pasar solo los ids que son cadenas', () => {
  assert.deepEqual(parseFavoritos('["ib-19", 42, null, "", "ib-40"]'), ['ib-19', 'ib-40'])
})

test('alternar agrega si no está y quita si está', () => {
  assert.deepEqual(alternaFavoritos([], 'ib-19'), ['ib-19'])
  assert.deepEqual(alternaFavoritos(['ib-19'], 'ib-40'), ['ib-19', 'ib-40'])
  assert.deepEqual(alternaFavoritos(['ib-19', 'ib-40'], 'ib-19'), ['ib-40'])
  assert.deepEqual(alternaFavoritos(['ib-19'], 'ib-19'), [])
})

test('alternar no duplica un favorito que ya estaba', () => {
  const una = alternaFavoritos(['ib-19'], 'ib-40')
  const otra = alternaFavoritos(una, 'ib-40')
  assert.deepEqual(otra, ['ib-19'])
})
