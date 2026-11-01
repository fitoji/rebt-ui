import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

/**
 * Acordeón simple para la barra lateral del REBT.
 * Props:
 *   title    — texto del encabezado
 *   open     — booleano que controla si está expandido
 *   onToggle — callback al hacer clic
 *   children — contenido a mostrar/ocultar
 *   variante — 'sub' es el acordeón de dentro de otro (las disposiciones, dentro de las ITC)
 */
interface Props {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
  variante?: 'normal' | 'sub'
}

export default function Accordion({ title, open, onToggle, children, variante = 'normal' }: Props) {
  const sub = variante === 'sub'
  // El contenido no se desmonta al plegar: la fila se anima de `0fr` a `1fr` y la lista
  // sigue ahí para poder medir el alto sin trucos. `inert` la saca del foco y del lector
  // de pantalla mientras está cerrada, para que el estado plegado siga siendo el real.
  const plegado = open ? {} : ({ inert: '', 'aria-hidden': true } as const)

  return (
    <div className="mb-[0.25rem]">
      <button
        className={[
          'flex w-full items-center gap-[0.45rem] rounded-[4px] border text-left font-sans cursor-pointer',
          'transition-colors duration-150 ease-plano motion-reduce:transition-none',
          sub
            ? 'border-transparent bg-transparent px-[0.6rem] py-[0.35rem] text-[0.85rem] font-medium text-tinta-2 hover:border-linea hover:bg-plano'
            : 'border-linea bg-neutro-fondo px-[0.6rem] py-[0.5rem] text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-neutro hover:bg-linea',
          // Abierto, el de arriba cierra contra el contenido: solo se redondean las
          // esquinas superiores. El de dentro no: es una lista plana.
          !sub && open ? 'rounded-t-[4px] rounded-b-none' : '',
        ].join(' ')}
        onClick={onToggle}
        aria-expanded={open}
        type="button"
      >
        {/* La flecha gira sobre sí misma: el mismo icono cuenta si está abierto o
            cerrado, sin cambiar de dibujo. */}
        <ChevronRight
          aria-hidden="true"
          className={`size-3.5 flex-none transition-transform duration-200 ease-plano motion-reduce:transition-none ${open ? 'rotate-90' : ''}`}
        />
        <span className="flex-1">{title}</span>
      </button>
      <div
        className="acordeon"
        data-abierto={open ? 'true' : 'false'}
      >
        <div {...plegado}>
          <div
            className={
              sub
                ? 'border-0 p-0 pb-[0.3rem]'
                : 'rounded-b-[4px] border border-linea border-t-0 bg-hoja'
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
