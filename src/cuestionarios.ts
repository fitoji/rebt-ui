export interface PreguntaTest {
  id: number | string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  option5?: string
  ans: number
  asignatura: string
  tema: string
}

export interface Cuestionario {
  id: string
  nombre: string
  preguntas: PreguntaTest[]
}

export type AccionTeclaCuestionario =
  | { tipo: 'responder'; opcion: number }
  | { tipo: 'avanzar' }

export function interpretarTeclaCuestionario(
  tecla: string,
  codigo: string,
  respondida: boolean,
  cantidadOpciones: number,
): AccionTeclaCuestionario | null {
  if (respondida) {
    return codigo === 'Space' || tecla === ' ' ? { tipo: 'avanzar' } : null
  }

  if (!/^[1-5]$/.test(tecla)) return null
  const opcion = Number(tecla)
  return opcion <= cantidadOpciones ? { tipo: 'responder', opcion } : null
}

function esPreguntaTest(valor: unknown): valor is PreguntaTest {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false
  const pregunta = valor as Record<string, unknown>
  if (
    (typeof pregunta.id !== 'number' && typeof pregunta.id !== 'string') ||
    typeof pregunta.question !== 'string' || !pregunta.question.trim() ||
    typeof pregunta.ans !== 'number' || !Number.isInteger(pregunta.ans) ||
    pregunta.ans < 1 || pregunta.ans > 5 ||
    typeof pregunta.asignatura !== 'string' || typeof pregunta.tema !== 'string'
  ) return false

  const opciones = [pregunta.option1, pregunta.option2, pregunta.option3, pregunta.option4, pregunta.option5]
  if (opciones.slice(0, 4).some((opcion) => typeof opcion !== 'string')) return false
  if (pregunta.option5 !== undefined && typeof pregunta.option5 !== 'string') return false
  const respuestaCorrecta = opciones[pregunta.ans - 1]
  return typeof respuestaCorrecta === 'string' && Boolean(respuestaCorrecta.trim())
}

/** Convierte los módulos JSON estáticos en una lista segura y ordenada para la interfaz. */
export function prepararCuestionarios(archivos: Record<string, unknown>): Cuestionario[] {
  return Object.entries(archivos)
    .flatMap(([ruta, contenido]) => {
      if (!Array.isArray(contenido) || contenido.length === 0 || !contenido.every(esPreguntaTest)) return []
      const id = ruta.split('/').pop() ?? ruta
      const nombre = id.replace(/\.json$/i, '').replace(/_/g, ' ').toLocaleUpperCase('es')
      return [{ id, nombre, preguntas: contenido }]
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }))
}

/**
 * Convierte un JSON que el usuario soltó en la zona de carga a un cuestionario
 * usable, o devuelve null si el contenido no es un cuestionario válido.
 *
 * El id lleva el prefijo `carga:` para no chocar con los que ya vienen de
 * data-json cuando el archivo se llama igual que uno incluido.
 */
export function cuestionarioCargado(nombre: string, contenido: unknown): Cuestionario | null {
  const [nuevo] = prepararCuestionarios({ [nombre]: contenido })
  return nuevo ? { ...nuevo, id: `carga:${nuevo.id}` } : null
}

/** Un cuestionario tal y como se guardó en localStorage: su archivo de origen. */
export interface EntradaCargada {
  nombre: string
  contenido: unknown
}

/**
 * Reconstruye las entradas guardadas en localStorage a partir de su texto.
 * Cualquier cosa que no sea un array de `{ nombre, contenido }` con un
 * cuestionario válido se descarta, sin tirar las entradas buenas de al lado.
 */
export function entradasDesdeGuardado(crudo: string | null): EntradaCargada[] {
  if (!crudo) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(crudo)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.flatMap((entrada) => {
    if (!entrada || typeof entrada !== 'object') return []
    const { nombre, contenido } = entrada as { nombre?: unknown; contenido?: unknown }
    if (typeof nombre !== 'string' || !cuestionarioCargado(nombre, contenido)) return []
    return [{ nombre, contenido }]
  })
}

/**
 * Quita la entrada guardada que corresponde al cuestionario con ese id (el de
 * `cuestionarioCargado`, con prefijo `carga:`). Las demás quedan intactas y un
 * id que no corresponde a ninguna devuelven la lista sin cambios.
 */
export function quitarCargadoPorId(cargados: EntradaCargada[], id: string): EntradaCargada[] {
  return cargados.filter(
    (entrada) => cuestionarioCargado(entrada.nombre, entrada.contenido)?.id !== id,
  )
}
