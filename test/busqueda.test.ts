import assert from 'node:assert/strict'
import test from 'node:test'
import { buscarEnBloques, countOf, normaliza } from '../src/busqueda.ts'
import type { Bloque, BloqueConContenido } from '../src/tipos.ts'

// La búsqueda es progresiva: `obtener` devuelve el bloque si ya está descargado y
// `undefined` si todavía no. Estos tests fijan justamente ese comportamiento.

const BLOQUES: Bloque[] = [
  { id: 'a1', titulo: 'Artículo 1', fecha: '20020918' },
  { id: 'ib-19', titulo: 'ITC-BT-19', fecha: '20020918' },
  { id: 'pr', titulo: 'Preámbulo sobre protecciones', fecha: '20020918' },
]

const bloque = (id: string, texto: string): BloqueConContenido => ({
  id,
  titulo: '',
  versions: [{ vigencia: '', publicacion: '', items: [], text: texto }],
  folded: normaliza(texto),
})

const TITULOS = BLOQUES.map((b) => normaliza(b.titulo))

test('la normalización quita tildes y baja a minúsculas', () => {
  assert.equal(normaliza('Aislamiento ELÉCTRICO'), 'aislamiento electrico')
})

test('cuenta las apariciones de un texto normalizado', () => {
  assert.equal(countOf('cable de cobre y cable de aluminio', 'cable'), 2)
  assert.equal(countOf('nada que ver', 'cable'), 0)
})

test('busca en el título aunque el bloque todavía no esté descargado', () => {
  // El título está siempre disponible: por eso hay resultados desde el primer bloque.
  const filas = buscarEnBloques(BLOQUES, 'protecciones', TITULOS, () => undefined)
  assert.deepEqual(
    filas.map((f) => f.entry.id),
    ['pr'],
  )
})

test('busca en el texto de los bloques que ya están descargados', () => {
  const descargados = new Map([
    ['a1', bloque('a1', 'el cable de cobreprotectedo')],
    ['ib-19', bloque('ib-19', 'instalaciones electricas')],
  ])
  const filas = buscarEnBloques(BLOQUES, 'cobre', TITULOS, (id) => descargados.get(id))
  assert.deepEqual(
    filas.map((f) => f.entry.id),
    ['a1'],
  )
  assert.equal(filas[0].count, 1)
})

test('los resultados crecen a medida que llegan los bloques', () => {
  // El corazón de la búsqueda progresiva: con un bloque indexado hay un resultado; al
  // llegar el segundo, aparece el otro. No hay que esperar a que terminen los 98.
  const descargados = new Map<string, BloqueConContenido>()
  const buscar = () => buscarEnBloques(BLOQUES, 'cobre', TITULOS, (id) => descargados.get(id))

  assert.deepEqual(buscar(), [])

  descargados.set('a1', bloque('a1', 'un cable de cobre'))
  assert.deepEqual(
    buscar().map((f) => f.entry.id),
    ['a1'],
  )

  descargados.set('ib-19', bloque('ib-19', 'otro cable de cobre, otra vez de cobre'))
  const filas = buscar()
  assert.deepEqual(
    filas.map((f) => f.entry.id),
    ['a1', 'ib-19'],
  )
  assert.equal(filas[1].count, 2)
})

test('el fragmento muestra el texto alrededor de la coincidencia', () => {
  const descargados = new Map([['a1', bloque('a1', 'antes de todo el texto, un cable de cobre, y después')]])
  const filas = buscarEnBloques(BLOQUES, 'cobre', TITULOS, (id) => descargados.get(id))
  assert.match(filas[0].snippet ?? '', /cable de cobre/)
})
