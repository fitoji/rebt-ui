import assert from 'node:assert/strict'
import test from 'node:test'
import { CONTEXTO, crearNota, notasDe, parseNotas } from '../src/notas.ts'
import type { Nota } from '../src/notas.ts'

// Las notas se guardan en localStorage. Lo que se testea es la lógica de leer, de crear y
// de filtrar: un valor corrupto no puede romper la app.

const NOTA: Nota = {
  id: 'BT-19-abc-1',
  origen: 'BT-19',
  texto: 'un trozo de texto',
  antes: 'lo que hay antes ',
  despues: ' lo que hay después',
  creado: 1_700_000_000_000,
}

test('lee una lista de notas guardada', () => {
  assert.deepEqual(parseNotas(JSON.stringify([NOTA])), [NOTA])
  assert.deepEqual(parseNotas('[]'), [])
})

test('un valor corrupto o ausente deja la lista vacía', () => {
  assert.deepEqual(parseNotas(null), [])
  assert.deepEqual(parseNotas(''), [])
  assert.deepEqual(parseNotas('{no es json'), [])
  assert.deepEqual(parseNotas('{"a":1}'), [])
  assert.deepEqual(parseNotas('"un texto"'), [])
})

test('descarta las notas que les falta algún campo', () => {
  const notas = parseNotas(
    JSON.stringify([NOTA, { id: 'x', origen: 'BT-19' }, { ...NOTA, texto: 42 }, null]),
  )
  assert.deepEqual(notas, [NOTA])
})

test('crear una nota guarda el contexto recortado', () => {
  // El contexto no puede ser infinito: si no, la nota pesa lo que el documento.
  const largo = 'x'.repeat(200)
  const nota = crearNota('BT-19', 'el texto', largo, largo, 1_700_000_000_000)
  assert.equal(nota.origen, 'BT-19')
  assert.equal(nota.texto, 'el texto')
  assert.equal(nota.antes.length, CONTEXTO)
  assert.equal(nota.despues.length, CONTEXTO)
  assert.equal(nota.creado, 1_700_000_000_000)
})

test('dos notas no comparten id', () => {
  const a = crearNota('BT-19', 'texto', '', '', 1_700_000_000_000)
  const b = crearNota('BT-19', 'texto', '', '', 1_700_000_000_000)
  assert.notEqual(a.id, b.id)
})

test('las notas se filtran por el documento de origen', () => {
  const otra: Nota = { ...NOTA, id: 'ib-19-abc-2', origen: 'ib-19' }
  assert.deepEqual(
    notasDe([NOTA, otra], 'BT-19').map((n) => n.id),
    ['BT-19-abc-1'],
  )
  assert.deepEqual(notasDe([NOTA, otra], 'ib-19').map((n) => n.id), ['ib-19-abc-2'])
  assert.deepEqual(notasDe([NOTA, otra], 'no-existe'), [])
})
