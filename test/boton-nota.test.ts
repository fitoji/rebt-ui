import assert from 'node:assert/strict'
import test from 'node:test'
import { escucharCambiosSeleccion } from '../src/seleccion.ts'

test('detecta selecciones táctiles y lee enseguida al soltar con mouse o teclado', () => {
  const eventos = new EventTarget()
  const tareas: { callback: () => void; delay: number; cancelada: boolean }[] = []
  let lecturas = 0
  const limpiar = escucharCambiosSeleccion(
    eventos,
    () => lecturas++,
    (callback, delay) => {
      const tarea = { callback, delay, cancelada: false }
      tareas.push(tarea)
      return tarea as unknown as ReturnType<typeof setTimeout>
    },
    (handle) => {
      ;(handle as unknown as { cancelada: boolean }).cancelada = true
    },
  )

  eventos.dispatchEvent(new Event('selectionchange'))
  eventos.dispatchEvent(new Event('selectionchange'))
  assert.equal(tareas[0].delay, 120)
  assert.equal(tareas[0].cancelada, true)
  assert.equal(tareas[1].cancelada, false)
  tareas[1].callback()
  assert.equal(lecturas, 1)

  eventos.dispatchEvent(new Event('mouseup'))
  assert.equal(tareas[2].delay, 0)
  tareas[2].callback()
  assert.equal(lecturas, 2)

  eventos.dispatchEvent(new Event('keyup'))
  assert.equal(tareas[3].delay, 0)
  limpiar()
})
