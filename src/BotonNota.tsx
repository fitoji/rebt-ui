// El botón que aparece al seleccionar texto, para convertir la selección en una nota.
//
// Escucha el `mouseup` y el `keyup` del documento: con el ratón y también con el teclado
// (Mayús + flechas) se puede subrayar. Si la selección no cae dentro del texto que se
// está leyendo, no se hace nada.

import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { COLORES, COLOR_POR_DEFECTO, CONTEXTO } from './notas.ts'
import type { ColorNota, Seleccion } from './notas.ts'
import { escucharCambiosSeleccion } from './seleccion.ts'

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
    const alPulsarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSeleccion(null)
    }
    const dejarDeEscuchar = escucharCambiosSeleccion(document, leer)
    document.addEventListener('keydown', alPulsarEscape)
    return () => {
      dejarDeEscuchar()
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
  const arriba = seleccion.y > 56
  const guardarConTecla = (e: React.KeyboardEvent<HTMLButtonElement>, color: ColorNota) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onGuardar(seleccion, color)
  }
  return (
    <div
      className={`fixed z-40 flex -translate-x-1/2 items-center gap-[0.3rem] whitespace-nowrap rounded-[5px] bg-tinta px-[0.5rem] py-[0.25rem] font-sans text-[0.85rem] text-hoja shadow-[0_2px_10px_rgb(0_0_0/0.4)] hover:bg-neutro ${arriba ? '-translate-y-full' : ''}`}
      style={{
        left: `clamp(5rem, ${seleccion.x}px, calc(100vw - 5rem))`,
        top: arriba ? seleccion.y : Math.max(8, seleccion.y + 24),
      }}
    >
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => onGuardar(seleccion, COLOR_POR_DEFECTO)}
        onKeyDown={(e) => guardarConTecla(e, COLOR_POR_DEFECTO)}
      >
        ✎ Nota
      </button>
      {COLORES.map((color) => (
        <button
          key={color}
          type="button"
          className={`h-[0.7rem] w-[0.7rem] flex-none cursor-pointer rounded-full border border-linea p-0 ${
            color === 'verde'
              ? 'bg-nota-verde'
              : color === 'rojo'
                ? 'bg-nota-rojo'
                : 'bg-nota-amarillo'
          }`}
          title={`Guardar como nota ${color}`}
          aria-label={`Guardar como nota ${color}`}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => onGuardar(seleccion, color)}
          onKeyDown={(e) => guardarConTecla(e, color)}
        />
      ))}
    </div>
  )
}
