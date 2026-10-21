import assert from 'node:assert/strict'
import test from 'node:test'
import { agruparBloques } from '../src/indice.ts'
import type { Bloque, Fila } from '../src/tipos.ts'

// La clasificación de la sidebar. Si un bloque cae en el grupo equivocado, desaparece de
// la vista: por eso está testeada.

const fila = (id: string, titulo = id): Fila => ({
  entry: { id, titulo, fecha: '20020918' } as Bloque,
})

const IDS = [
  'pr',
  'au',
  'da',
  'da-2',
  'da-3',
  'da-4',
  'dt',
  'dt-2',
  'dt-3',
  'dd',
  'df',
  'df-2',
  'df-3',
  'fi',
  're',
  'a1',
  'a2',
  'a1-2',
  'a2-11',
  'id',
  'ib',
  'ib-2',
  'ib-52',
  'ir',
]

test('cada bloque cae en un grupo, y en el suyo', () => {
  const g = agruparBloques(IDS.map((id) => fila(id)))

  assert.deepEqual(
    g.preambulo.map((f) => f.entry.id),
    ['pr'],
  )
  // Los artículos del Reglamento, incluido el "Artículo único" (au).
  assert.deepEqual(
    g.articulos.map((f) => f.entry.id),
    ['au', 'a1', 'a2', 'a1-2', 'a2-11'],
  )
  // Las disposiciones, con sus numerales.
  assert.deepEqual(
    g.disposiciones.map((f) => f.entry.id),
    ['da', 'da-2', 'da-3', 'da-4', 'dt', 'dt-2', 'dt-3', 'dd', 'df', 'df-2', 'df-3', 'fi', 're'],
  )
  // Las ITC y los dos bloques de encabezado y cierre.
  assert.deepEqual(
    g.itcs.map((f) => f.entry.id),
    ['id', 'ib', 'ib-2', 'ib-52', 'ir'],
  )
})

test('no se pierde ningún bloque', () => {
  const g = agruparBloques(IDS.map((id) => fila(id)))
  const todos = [...g.preambulo, ...g.articulos, ...g.disposiciones, ...g.itcs]
  assert.equal(todos.length, IDS.length)
})

test('las ITC no se confunden con las disposiciones por el prefijo', () => {
  // 'ib-19' es una ITC y 'da-2' una disposición: la comparación es por el id completo,
  // no por el prefijo suelto.
  const g = agruparBloques([fila('ib-19'), fila('da-2'), fila('dt-2'), fila('ir')])
  assert.deepEqual(
    g.disposiciones.map((f) => f.entry.id),
    ['da-2', 'dt-2'],
  )
  assert.deepEqual(
    g.itcs.map((f) => f.entry.id),
    ['ib-19', 'ir'],
  )
})

test('un índice vacío no rompe nada', () => {
  const g = agruparBloques([])
  assert.deepEqual(g.preambulo, [])
  assert.deepEqual(g.articulos, [])
  assert.deepEqual(g.disposiciones, [])
  assert.deepEqual(g.itcs, [])
})
