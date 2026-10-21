// Las notas: los trozos de texto que el usuario subraya para tenerlos a mano.
//
// La nota no guarda una posición en el DOM, sino **el texto y su contexto** (lo que hay
// antes y después). Un offset se rompe en cuanto el corpus se regenera; con el contexto, la
// nota sigue al texto aunque se mueva, y si el texto ya no está, la nota se avisa y se puede
// borrar.
//
// La persistencia es como la de los favoritos: `localStorage`, sin servidor ni cuenta.

import { useCallback, useState } from 'react'

export const CLAVE_NOTAS = 'rebt-notas'

/** Cuánto contexto se guarda a cada lado, para desambiguar un texto que se repite. */
export const CONTEXTO = 40

/** El color de un resaltado. Sirve para distinguir de un vistazo de qué es cada nota. */
export type ColorNota = 'amarillo' | 'verde' | 'rojo'

export const COLORES: ColorNota[] = ['amarillo', 'verde', 'rojo']

/** El color con el que se marca si no se elige otro. */
export const COLOR_POR_DEFECTO: ColorNota = 'amarillo'

export interface Nota {
  /** Id único de la nota. */
  id: string
  /** De qué viene: el id del documento de la guía o el del bloque del REBT. */
  origen: string
  /** De qué vista viene, para saber a dónde saltar. */
  vista: 'guia' | 'rebt'
  /** Cómo se llama ese documento o bloque, para poder leer la lista. */
  titulo: string
  /** El color del resaltado. */
  color: ColorNota
  /** El texto subrayado. */
  texto: string
  /** Hasta `CONTEXTO` caracteres antes del texto. */
  antes: string
  /** Hasta `CONTEXTO` caracteres después del texto. */
  despues: string
  /** Cuándo se creó (milisegundos). */
  creado: number
}

/* ------------------------------------------------------------------ persistencia */

/** Lee las notas guardadas. Un valor corrupto no puede romper la app. */
export function parseNotas(valor: string | null): Nota[] {
  if (!valor) return []
  try {
    const datos: unknown = JSON.parse(valor)
    if (!Array.isArray(datos)) return []
    return datos.filter((n): n is Nota => {
      if (typeof n !== 'object' || n === null) return false
      const nota = n as Partial<Nota>
      return (
        typeof nota.id === 'string' &&
        typeof nota.origen === 'string' &&
        typeof nota.texto === 'string' &&
        typeof nota.antes === 'string' &&
        typeof nota.despues === 'string' &&
        typeof nota.creado === 'number'
      )
    }).map((n) => ({
      ...n,
      // Las notas guardadas antes de que existieran la vista, el título y el color: se
      // deducen del id, porque los dos universos de ids no se cruzan (el REBT usa
      // minúsculas y la guía, mayúsculas), y el color es el de siempre.
      vista: n.vista ?? (n.origen[0] === n.origen[0]?.toLowerCase() ? 'rebt' : 'guia'),
      titulo: n.titulo ?? n.origen,
      color: n.color ?? COLOR_POR_DEFECTO,
    }))
  } catch {
    return []
  }
}

export function leerNotas(): Nota[] {
  try {
    return parseNotas(localStorage.getItem(CLAVE_NOTAS))
  } catch {
    return []
  }
}

export function guardarNotas(notas: Nota[]): void {
  try {
    localStorage.setItem(CLAVE_NOTAS, JSON.stringify(notas))
  } catch {
    // Modo privado o cuota llena: las notas viven solo en esta sesión.
  }
}

/* --------------------------------------------------------------------- el modelo */

/** Crea una nota a partir del texto subrayado y de su contexto. */
export function crearNota(
  vista: 'guia' | 'rebt',
  origen: string,
  titulo: string,
  texto: string,
  antes: string,
  despues: string,
  ahora: number,
  color: ColorNota = COLOR_POR_DEFECTO,
): Nota {
  return {
    // El azar va en el id porque dos notas pueden guardarse en el mismo milisegundo.
    id: `${origen}-${ahora.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    origen,
    vista,
    titulo,
    color,
    texto,
    antes: antes.slice(-CONTEXTO),
    despues: despues.slice(0, CONTEXTO),
    creado: ahora,
  }
}

/** Las notas de un documento o bloque. */
export function notasDe(notas: Nota[], origen: string): Nota[] {
  return notas.filter((n) => n.origen === origen)
}

/* ------------------------------------------------------------------ el DOM */

/** Una selección sobre el texto, con su contexto y dónde dibujarla. */
export interface Seleccion {
  texto: string
  antes: string
  despues: string
  /** Dónde poner el botón, en coordenadas de la ventana. */
  x: number
  y: number
}

/** Los nodos de texto del contenedor, en orden de lectura. */
function nodosDeTexto(contenedor: Element): Text[] {
  const nodos: Text[] = []
  const recorrer = (n: Node) => {
    for (const hijo of Array.from(n.childNodes)) {
      if (hijo.nodeType === 3) nodos.push(hijo as Text)
      else if (hijo.nodeType === 1) {
        // Los resaltados que ya pusimos no cuentan: son nuestros, no del documento.
        if ((hijo as Element).tagName !== 'MARK') recorrer(hijo)
      }
    }
  }
  recorrer(contenedor)
  return nodos
}

/** El texto del contenedor junto con la posición de cada nodo en ese texto. */
function textoPlano(contenedor: Element): { texto: string; nodos: Text[]; inicio: number[] } {
  const nodos = nodosDeTexto(contenedor)
  let texto = ''
  const inicio: number[] = []
  for (const nodo of nodos) {
    inicio.push(texto.length)
    texto += nodo.data
  }
  return { texto, nodos, inicio }
}

/** Convierte un rango de caracteres del texto plano en un rango del DOM. */
function rangoDeCaracteres(
  desde: number,
  hasta: number,
  nodos: Text[],
  inicio: number[],
): Range | null {
  let nodoDesde: Text | null = null
  let nodoHasta: Text | null = null
  let offDesde = 0
  let offHasta = 0
  for (let i = 0; i < nodos.length; i++) {
    const nodo = nodos[i]
    const largo = nodo.data.length
    if (nodoDesde === null && desde >= inicio[i] && desde < inicio[i] + largo) {
      nodoDesde = nodo
      offDesde = desde - inicio[i]
    }
    if (nodoHasta === null && hasta > inicio[i] && hasta <= inicio[i] + largo) {
      nodoHasta = nodo
      offHasta = hasta - inicio[i]
    }
  }
  if (!nodoDesde || !nodoHasta) return null
  const rango = document.createRange()
  rango.setStart(nodoDesde, offDesde)
  rango.setEnd(nodoHasta, offHasta)
  return rango
}

/**
 * Busca el texto de la nota en el contenedor y devuelve el rango que corresponde.
 * Si el texto aparece varias veces, se elige la aparición cuyo contexto coincide.
 */
export function hallarRango(contenedor: Element, nota: Nota): Range | null {
  const { texto, nodos, inicio } = textoPlano(contenedor)
  if (!nota.texto) return null

  let desde = texto.indexOf(nota.texto)
  while (desde !== -1) {
    const hasta = desde + nota.texto.length
    const previo = texto.slice(Math.max(0, desde - CONTEXTO), desde)
    const posterior = texto.slice(hasta, hasta + CONTEXTO)
    if (previo.endsWith(nota.antes) && posterior.startsWith(nota.despues)) {
      return rangoDeCaracteres(desde, hasta, nodos, inicio)
    }
    desde = texto.indexOf(nota.texto, desde + 1)
  }
  return null
}

/**
 * Envuelve el texto de la nota en un `<mark>`, para que se vea resaltado.
 * Devuelve el `<mark>` creado, o null si el texto ya no está.
 */
export function resaltar(contenedor: Element, nota: Nota): HTMLElement | null {
  const rango = hallarRango(contenedor, nota)
  if (!rango) return null
  const mark = document.createElement('mark')
  mark.className = `nota nota-${nota.color}`
  mark.dataset.nota = nota.id
  mark.title = nota.texto
  mark.appendChild(rango.extractContents())
  rango.insertNode(mark)
  return mark
}

/** Quita los resaltados que ya se pusieron, dejando el texto como estaba. */
export function limpiarResaltados(contenedor: Element): void {
  for (const mark of Array.from(contenedor.querySelectorAll('mark.nota'))) {
    const padre = mark.parentNode
    if (!padre) continue
    while (mark.firstChild) padre.insertBefore(mark.firstChild, mark)
    padre.removeChild(mark)
    padre.normalize()
  }
}

/** Aplica los resaltados de las notas, quitando los anteriores. */
export function aplicarResaltados(contenedor: Element, notas: Nota[]): HTMLElement[] {
  limpiarResaltados(contenedor)
  const hechos: HTMLElement[] = []
  for (const nota of notas) {
    const mark = resaltar(contenedor, nota)
    if (mark) hechos.push(mark)
  }
  return hechos
}

/* ---------------------------------------------------------------------- el hook */

/** El control de las notas: la lista y las operaciones. */
export interface ControlNotas {
  notas: Nota[]
  agregar: (nota: Nota) => void
  quitar: (id: string) => void
  /** Cambiar el color de una nota. */
  color: (id: string, color: ColorNota) => void
}

/** Las notas del navegador, con las operaciones de agregar, quitar y recolorear. */
export function useNotas(): ControlNotas {
  const [notas, setNotas] = useState<Nota[]>(leerNotas)

  const agregar = useCallback((nota: Nota) => {
    setNotas((actual) => {
      const siguiente = [...actual, nota]
      guardarNotas(siguiente)
      return siguiente
    })
  }, [])

  const quitar = useCallback((id: string) => {
    setNotas((actual) => {
      const siguiente = actual.filter((n) => n.id !== id)
      guardarNotas(siguiente)
      return siguiente
    })
  }, [])

  const color = useCallback((id: string, tono: ColorNota) => {
    setNotas((actual) => {
      const siguiente = actual.map((n) => (n.id === id ? { ...n, color: tono } : n))
      guardarNotas(siguiente)
      return siguiente
    })
  }, [])

  return { notas, agregar, quitar, color }
}
