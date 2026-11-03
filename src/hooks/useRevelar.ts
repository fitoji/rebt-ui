import { useEffect } from 'react'
import type { RefObject } from 'react'

/**
 * El texto que entra al hacer scroll.
 *
 * Se monta el texto y, en el mismo golpe de vista, cada bloque que está por debajo del
 * borde de la ventana se marca como `espera`; el resto se queda como está. Así nada
 * parpadea en la primera pantalla y nada queda oculto si el script no llega a correr.
 *
 * A partir de ahí un `IntersectionObserver` los va soltando de a tandas cortas: los
 * bloques que entran juntos se escalonan apenas lo necesario para que se lea como una
 * cascada y no como un salto simultáneo.
 *
 * Un bloque que se salta de golpe —al ir a una coincidencia de búsqueda o a una nota—
 * nunca llega a intersecar, así que quedaría escondido para siempre. Por eso el mismo
 * scroll que alimenta al observador comprueba si alguno quedó por encima de la vista y
 * lo suelta sin ceremonia.
 */
export function useRevelar(
  contenedor: RefObject<HTMLElement>,
  clave: string | number | undefined,
): void {
  useEffect(() => {
    const raiz = contenedor.current
    if (!raiz) return
    // Con movimiento reducido el texto aparece ya puesto: no hay estado que esconder.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const bloques = Array.from(raiz.children).filter(
      (n): n is HTMLElement => n instanceof HTMLElement,
    )
    if (bloques.length === 0) return

    const scroller = hallarScroller(raiz)
    const borde = window.innerHeight
    const pendientes = new Set<HTMLElement>()

    for (const bloque of bloques) {
      // Lo que ya se ve (o está a medio entrar) no se toca.
      if (bloque.getBoundingClientRect().top < borde - 24) continue
      bloque.dataset.entra = 'espera'
      pendientes.add(bloque)
    }
    if (pendientes.size === 0) return

    let tanda = 0
    let anterior = 0
    let frame = 0

    const soltar = (el: HTMLElement, retardo: number) => {
      if (!pendientes.delete(el)) return
      observador.unobserve(el)
      el.style.transitionDelay = `${retardo}ms`
      el.dataset.entra = 'dentro'
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        const dentro = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (dentro.length === 0) return

        // La cascada se reinicia cuando la tanda anterior ya pasó; si no, un scroll
        // continuo acumularía retardos y el texto llegaría tarde.
        const ahora = performance.now()
        if (ahora - anterior > 260) tanda = 0
        anterior = ahora

        dentro.forEach((entrada, i) => {
          soltar(entrada.target as HTMLElement, Math.min(i + tanda, 4) * 35)
        })
        tanda += dentro.length
      },
      // El margen inferior arranca la animación cuando el bloque asoma por el último
      // tramo de la pantalla: el texto se ve entrar desde abajo, ya cerca del borde, y
      // para cuando el lector llega a él ya está asentado.
      { root: scroller, rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
    )

    for (const bloque of pendientes) observador.observe(bloque)

    /** Los que quedaron por encima de la vista, sin animación: ya no se ven entrar. */
    const rescatar = () => {
      frame = 0
      if (pendientes.size === 0) return
      const arriba = scroller
        ? scroller.getBoundingClientRect().top
        : 0
      for (const el of Array.from(pendientes)) {
        if (el.getBoundingClientRect().bottom < arriba + 8) soltar(el, 0)
      }
    }

    const alScrollear = () => {
      if (!frame && pendientes.size > 0) frame = requestAnimationFrame(rescatar)
    }

    const desplazador: HTMLElement | Window = scroller ?? window
    desplazador.addEventListener('scroll', alScrollear, { passive: true })

    return () => {
      desplazador.removeEventListener('scroll', alScrollear)
      if (frame) cancelAnimationFrame(frame)
      observador.disconnect()
    }
    // `clave` es el texto del documento: al cambiar de bloque, la guía o el corpus, se
    // vuelve a preparar todo desde cero.
  }, [contenedor, clave])
}

/** El contenedor que scrollea de verdad: el `main` de la vista, no la ventana. */
export function hallarScroller(desde: Element | null): HTMLElement | null {
  let nodo: Element | null = desde
  while (nodo) {
    if (nodo instanceof HTMLElement) {
      const estilo = getComputedStyle(nodo)
      if (/(auto|scroll)/.test(estilo.overflowY)) return nodo
    }
    nodo = nodo.parentElement
  }
  return null
}
