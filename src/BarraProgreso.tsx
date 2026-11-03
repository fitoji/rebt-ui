import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { RefObject } from 'react'

interface BarraProgresoProps {
  /**
   * El contenedor que scrollea la lámina. La barra se monta fuera de él, colgada del
   * `body`: cualquier `transform` del contenedor —la entrada de la vista lo deja puesto—
   * lo convertiría en el bloque contenedor de un `position: fixed` y la barra se iría
   * con el texto al bajar.
   */
  desplazador: RefObject<HTMLElement | null>
}

/**
 * La barra de progreso de lectura.
 *
 * Vive en el borde derecho de la lámina y ocupa el sitio de la barra del navegador, que
 * en estas vistas no aporta nada: dice cuánto se leyó, no cuánto se puede arrastrar. La
 * vía queda siempre dibujada y la franja avanza hasta el punto de lectura; sólo marcha
 * mientras hay scroll. La cifra aparece al moverse y se retira al parar, para no dejar un
 * número encima del texto.
 *
 * Se escribe sobre el DOM a mano (una variable CSS y un texto) y no por estado de React:
 * el scroll pasa sesenta veces por segundo y volver a renderizar el lector en cada frame
 * costaría más que la propia lectura.
 */
export default function BarraProgreso({ desplazador }: BarraProgresoProps) {
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const barra = raiz.current
    if (!barra) return
    const scroller = desplazador.current
    if (!scroller) return

    const cifra = barra.querySelector<HTMLElement>('[data-cifra]')
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let destino = 0
    let pintado = -1
    let frame = 0
    let quieto = 0

    const medir = () => {
      const recorrido = scroller.scrollHeight - scroller.clientHeight
      destino = recorrido > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / recorrido)) : 0
      // Por debajo de un píxel de diferencia no vale la pena seguir animando.
      if (Math.abs(destino - pintado) > 0.0008 && !frame) frame = requestAnimationFrame(paso)
    }

    const paso = () => {
      frame = 0
      // Una interpolación corta: el relleno sigue al scroll de cerca pero se asienta
      // con un poco de inercia al soltar la rueda.
      const siguiente =
        reducir || pintado < 0 ? destino : pintado + (destino - pintado) * 0.22
      const valor = Math.abs(siguiente - destino) < 0.0008 ? destino : siguiente
      pintado = valor
      barra.style.setProperty('--p', valor.toFixed(4))
      if (cifra) cifra.textContent = `${Math.round(valor * 100)}%`
      if (valor !== destino) frame = requestAnimationFrame(paso)
    }

    const alScrollear = () => {
      barra.dataset.activo = 'true'
      window.clearTimeout(quieto)
      quieto = window.setTimeout(() => {
        delete barra.dataset.activo
      }, 1200)
      medir()
    }

    // El texto llega después del esqueleto: cuando cambia el alto de la lámina hay que
    // volver a medir o el porcentaje se queda hablando del documento anterior.
    const cambios = new MutationObserver(medir)
    cambios.observe(scroller, { childList: true, subtree: true })

    const tamaño = new ResizeObserver(medir)
    tamaño.observe(scroller)

    scroller.addEventListener('scroll', alScrollear, { passive: true })
    medir()

    return () => {
      scroller.removeEventListener('scroll', alScrollear)
      window.clearTimeout(quieto)
      cambios.disconnect()
      tamaño.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [desplazador])

  // Fuera del contenedor que scrollea y del árbol de la vista: la barra pertenece al
  // borde de la ventana, no a la lámina.
  return createPortal(
    <div className="progreso" ref={raiz} role="presentation" aria-hidden="true">
      <span className="progreso__hilo" />
      <span className="progreso__via" />
      <span className="progreso__cifra" data-cifra>
        0%
      </span>
    </div>,
    document.body,
  )
}
