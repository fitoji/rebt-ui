import assert from 'node:assert/strict'
import test from 'node:test'
import { CACHE_CONTROL, coincide, etagDe } from '../worker/cache.ts'

// La política de caché del proxy hacia el BOE. Lo que se fija acá es el contrato que
// hace que volver a la app no baje 2,17 MB otra vez.

test('la caché declara un día de fresco y hasta una semana de stale', () => {
  assert.match(CACHE_CONTROL, /public/)
  assert.match(CACHE_CONTROL, /max-age=86400/)
  assert.match(CACHE_CONTROL, /stale-while-revalidate=604800/)
})

test('el ETag es estable para el mismo cuerpo y cambia si el cuerpo cambia', async () => {
  const xml = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer
  const a = await etagDe(xml('<xml>igual</xml>'))
  const b = await etagDe(xml('<xml>igual</xml>'))
  const c = await etagDe(xml('<xml>otro</xml>'))
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.match(a, /^"[0-9a-f]{16}"$/)
})

test('el If-None-Match del cliente se reconoce solo si coincide', () => {
  const etag = '"abc123"'
  assert.equal(coincide(`"abc123"`, etag), true)
  // El prefijo W/ es la forma débil de un ETag: también vale.
  assert.equal(coincide(`W/"abc123"`, etag), true)
  // Puede venir en una lista.
  assert.equal(coincide(`"otro", "abc123"`, etag), true)
  assert.equal(coincide('"otro"', etag), false)
  assert.equal(coincide(null, etag), false)
  assert.equal(coincide('', etag), false)
})
