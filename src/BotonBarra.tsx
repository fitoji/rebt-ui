// El disparador de la barra lateral.
//
// En el móvil la barra es un cajón (lo hace shadcn con un `Sheet`), así que el botón
// tiene que estar fuera de ella: un disparador arriba a la derecha, como el "Índice" de
// antes.
//
// En el escritorio la barra es una columna fija: mientras está abierta se pliega desde
// su propio encabezado, pero cuando está plegada no queda nada visible, así que se
// deja un tirador en el borde izquierdo para poder volver a abrirla.

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar.tsx'

export default function BotonBarra() {
  const { open, isMobile } = useSidebar()

  if (isMobile) {
    return (
      <SidebarTrigger
        className="abrir-indice"
        aria-label="Abrir el índice"
        title="Abrir el índice"
      />
    )
  }

  if (open) return null

  return (
    <SidebarTrigger
      className="barra-plegada"
      aria-label="Abrir la barra lateral"
      title="Abrir la barra lateral (⌘B)"
    />
  )
}
