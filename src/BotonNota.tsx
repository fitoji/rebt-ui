// El botón que aparece al seleccionar texto, para convertir la selección en una nota.
//
// Escucha el `mouseup` y el `keyup` del documento: con el ratón y también con el teclado
// (Mayús + flechas) se puede subrayar. Si la selección no cae dentro del texto que se
// está leyendo, no se hace nada.

import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { COLORES, COLOR_POR_DEFECTO, CONTEXTO } from './notas.ts'
import type { ColorNota, Seleccion } from './notas.ts'

/** El texto que hay alrededor de la selección, para poder reubicarla más tarde. */
function contextoDe(texto: string, desde: number, hasta: number): { antes: string; despues: string } {
  return {
    antes: texto.slice(Math.max(0, desde - CONTEXTO), desde),
    despues: texto.slice(hasta, hasta + CONTEXTO),
  }
}

export function useSeleccion(texto: RefObject<HTMLElement>): {
  seleccion: Seleccion | null
  limpiar: () => void
} {
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null)

  const leer = useCallback(() => {
    const contenedor = texto.current
    if (!contenedor) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSeleccion(null)
      return
    }
    const rango = sel.getRangeAt(0)
    // La selección tiene que estar dentro del texto que se está leyendo.
    if (!contenedor.contains(rango.commonAncestorContainer)) {
      setSeleccion(null)
      return
    }
    const trozo = sel.toString().replace(/\s+/g, ' ').trim()
    if (!trozo) {
      setSeleccion(null)
      return
    }

    // El contexto se saca del texto que hay alrededor en el DOM, no del rango: si el
    //Selection abarca varios nodos, el rango no da el texto previo.
    const previo = contenedor.textContent ?? ''
    const desde = Math.max(0, previo.indexOf(trozo))
    const hasta = desde + trozo.length
    const { antes, despues } = contextoDe(previo, desde, hasta)

    const caja = rango.getBoundingClientRect()
    setSeleccion({
      texto: trozo,
      antes,
      despues,
      x: caja.left + caja.width / 2,
      y: caja.top - 8,
    })
  }, [texto])

  useEffect(() => {
    const alSoltar = () => {
      // Un tick de margen: al soltar el ratón, la selección todavía no está asentada.
      window.setTimeout(leer, 0)
    }
    const alPulsarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSeleccion(null)
    }
    document.addEventListener('mouseup', alSoltar)
    document.addEventListener('keyup', alSoltar)
    document.addEventListener('keydown', alPulsarEscape)
    return () => {
      document.removeEventListener('mouseup', alSoltar)
      document.removeEventListener('keyup', alSoltar)
      document.removeEventListener('keydown', alPulsarEscape)
    }
  }, [leer])

  const limpiar = useCallback(() => {
    setSeleccion(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  return { seleccion, limpiar }
}

/** El botón flotante que aparece junto a la selección. */
export default function BotonNota({
  seleccion,
  onGuardar,
}: {
  seleccion: Seleccion | null
  onGuardar: (seleccion: Seleccion, color: ColorNota) => void
}) {
  if (!seleccion) return null
  return (
    <div
      className="fixed z-40 flex -translate-x-1/2 -translate-y-full items-center gap-[0.3rem] whitespace-nowrap rounded-[5px] bg-tinta px-[0.5rem] py-[0.25rem] font-sans text-[0.85rem] text-hoja shadow-[0_2px_10px_rgb(0_0_0/0.4)] hover:bg-neutro"
      style={{ left: seleccion.x, top: seleccion.y }}
      // `mousedown` en lugar de `click`: si no, el clic borra la selección antes de
      // llegar al botón, y no hay forma de saber qué se submarcó.
      onMouseDown={(e) => {
        e.preventDefault()
        onGuardar(seleccion, COLOR_POR_DEFECTO)
      }}
    >
      <span className="cursor-pointer">✎ Nota</span>
      {COLORES.map((color) => (
        <button
          key={color}
          className={`h-[0.7rem] w-[0.7rem] flex-none cursor-pointer rounded-full border border-linea p-0 ${
            color === 'verde'
              ? 'bg-nota-verde'
              : color === 'rojo'
                ? 'bg-nota-rojo'
                : 'bg-nota-amarillo'
          }`}
          title={`Guardar como nota ${color}`}
          aria-label={`Guardar como nota ${color}`}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onGuardar(seleccion, color)
          }}
        />
      ))}
    </div>
  )
}
