import assert from 'node:assert/strict'
import test from 'node:test'
import { gridToCsv, gridToMarkdown, gridToTsv } from '../src/parse.js'

// El contenido que se copia o se descarga sale de estas tres conversiones, que comparten
// el lector del REBT y las tablas de la guía. Aquí queda fijado el formato exacto.

const REJILLA = [
  ['Método', 'Aislamiento'],
  ['A1', '3x PVC'],
]

test('la rejilla se copia como TSV para pegar en una hoja de cálculo', () => {
  assert.equal(gridToTsv(REJILLA), 'Método\tAislamiento\nA1\t3x PVC')
})

test('la rejilla se copia como Markdown', () => {
  assert.equal(
    gridToMarkdown(REJILLA),
    ['| Método | Aislamiento |', '|---|---|', '| A1 | 3x PVC |'].join('\n'),
  )
})

test('la rejilla se descarga como CSV', () => {
  assert.equal(gridToCsv(REJILLA), 'Método,Aislamiento\nA1,3x PVC')
})

test('el CSV entrecomilla las celdas con comas, comillas o punto y coma', () => {
  // Sin entrecomillar, Excel abriría la fila partida en columnas de más.
  const grid = [['A', 'B'], ['x, y', 'z"w'], ['p; q', 'r']]
  assert.equal(gridToCsv(grid), 'A,B\n"x, y","z""w"\n"p; q",r')
})
