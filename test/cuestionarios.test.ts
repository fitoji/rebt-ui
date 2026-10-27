import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cuestionarioCargado,
  entradasDesdeGuardado,
  interpretarTeclaCuestionario,
  prepararCuestionarios,
  quitarCargadoPorId,
} from '../src/cuestionarios.ts'

const pregunta = {
  id: 1,
  question: '¿Cuál es la respuesta correcta?',
  option1: 'Primera',
  option2: 'Segunda',
  option3: 'Tercera',
  option4: 'Cuarta',
  option5: '',
  ans: 2,
  asignatura: 'REBT',
  tema: 'ITC-BT 01-05',
}

test('prepara cuestionarios desde JSON válidos y ordena sus nombres', () => {
  const result = prepararCuestionarios({
    '../data-json/rebt_itc_1-5_c.json': [pregunta],
    '../data-json/rebt_itc_1-5.json': [pregunta],
  })

  assert.deepEqual(result.map(({ id, nombre, preguntas }) => ({ id, nombre, total: preguntas.length })), [
    { id: 'rebt_itc_1-5.json', nombre: 'REBT ITC 1-5', total: 1 },
    { id: 'rebt_itc_1-5_c.json', nombre: 'REBT ITC 1-5 C', total: 1 },
  ])
})

test('omite archivos con preguntas incompletas sin descartar los cuestionarios válidos', () => {
  const result = prepararCuestionarios({
    '../data-json/rebt_itc_1-5.json': [pregunta],
    '../data-json/invalido.json': [{ ...pregunta, ans: 5, option5: '' }],
    '../data-json/vacio.json': [],
  })

  assert.deepEqual(result.map(({ id }) => id), ['rebt_itc_1-5.json'])
})

test('las teclas numéricas eligen una opción visible y descartan opciones inexistentes', () => {
  assert.deepEqual(interpretarTeclaCuestionario('1', 'Digit1', false, 4), {
    tipo: 'responder',
    opcion: 1,
  })
  assert.deepEqual(interpretarTeclaCuestionario('4', 'Digit4', false, 4), {
    tipo: 'responder',
    opcion: 4,
  })
  assert.equal(interpretarTeclaCuestionario('5', 'Digit5', false, 4), null)
  assert.equal(interpretarTeclaCuestionario('0', 'Digit0', false, 4), null)
})

test('Espacio avanza solo después de elegir una respuesta', () => {
  assert.equal(interpretarTeclaCuestionario(' ', 'Space', false, 4), null)
  assert.deepEqual(interpretarTeclaCuestionario(' ', 'Space', true, 4), { tipo: 'avanzar' })
  assert.equal(interpretarTeclaCuestionario('Enter', 'Enter', true, 4), null)
})

test('un JSON soltado se convierte en un cuestionario usable o se rechaza', () => {
  const cargado = cuestionarioCargado('mis-test.json', [pregunta])
  assert.equal(cargado?.id, 'carga:mis-test.json')
  assert.equal(cargado?.preguntas.length, 1)

  assert.equal(cuestionarioCargado('malo.json', { no: 'es una lista' }), null)
  assert.equal(cuestionarioCargado('vacio.json', []), null)
  assert.equal(
    cuestionarioCargado('incompleto.json', [{ ...pregunta, ans: 5, option5: '' }]),
    null,
  )
})

test('de lo guardado en localStorage solo se recuperan entradas que siguen siendo cuestionarios válidos', () => {
  const valida = JSON.stringify([{ nombre: 'mio.json', contenido: [pregunta] }])
  assert.deepEqual(
    entradasDesdeGuardado(valida).map((entrada) => entrada.nombre),
    ['mio.json'],
  )

  assert.equal(entradasDesdeGuardado(null).length, 0)
  assert.equal(entradasDesdeGuardado('no es json').length, 0)
  assert.equal(entradasDesdeGuardado('{"nombre":"suelto"}').length, 0)
  assert.equal(entradasDesdeGuardado(JSON.stringify([])).length, 0)

  // Entradas corruptas o de contenido inválido se descartan sin tirar el resto.
  assert.deepEqual(
    entradasDesdeGuardado(
      JSON.stringify([
        { nombre: 'vacio.json', contenido: [] },
        { contenido: [pregunta] },
        { nombre: 'bueno.json', contenido: [pregunta] },
      ]),
    ).map((entrada) => entrada.nombre),
    ['bueno.json'],
  )
})

test('quitar un cuestionario cargado por id solo borra esa entrada', () => {
  const entradas = [
    { nombre: 'mio.json', contenido: [pregunta] },
    { nombre: 'otro.json', contenido: [pregunta] },
  ]

  assert.deepEqual(
    quitarCargadoPorId(entradas, 'carga:otro.json').map((entrada) => entrada.nombre),
    ['mio.json'],
  )
  // Un id que no corresponde a ninguna entrada no tira nada.
  assert.equal(quitarCargadoPorId(entradas, 'carga:no-existe.json').length, 2)
  assert.equal(quitarCargadoPorId(entradas, 'rebt_itc_1-5.json').length, 2)
})
