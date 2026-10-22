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
        className="hidden max-[860px]:fixed max-[860px]:top-[0.6rem] max-[860px]:right-[0.8rem] max-[860px]:z-4 max-[860px]:block max-[860px]:rounded-[4px] max-[860px]:border max-[860px]:border-linea max-[860px]:bg-hoja max-[860px]:py-[0.35rem] max-[860px]:px-[0.8rem]"
        aria-label="Abrir el índice"
        title="Abrir el índice"
      />
    )
  }

  if (open) return null

  return (
    <SidebarTrigger
      className="fixed top-[0.6rem] left-[0.6rem] z-20 grid size-[1.9rem] place-items-center rounded-[4px] border border-linea bg-hoja p-0 text-tinta hover:border-neutro hover:bg-neutro-fondo"
      aria-label="Abrir la barra lateral"
      title="Abrir la barra lateral (⌘B)"
    />
  )
}
