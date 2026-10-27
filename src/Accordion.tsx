import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

/**
 * Acordeón simple para la sidebar del REBT.
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
  return (
    <div className="mb-[0.25rem]">
      <button
        className={[
          'flex w-full items-center gap-[0.4rem] rounded-[4px] border text-left font-sans cursor-pointer',
          'transition-colors duration-150 ease motion-reduce:transition-none',
          sub
            ? 'border-transparent bg-transparent px-[0.6rem] py-[0.35rem] text-[0.85rem] font-medium text-tinta-2 hover:border-linea hover:bg-plano'
            : 'border-linea bg-neutro-fondo px-[0.6rem] py-[0.5rem] text-[0.9rem] font-semibold text-neutro hover:bg-linea',
          // Abierto, el de arriba cierra contra el contenido: solo se redondean las
          // esquinas superiores. El de dentro no: es una lista plana.
          !sub && open ? 'rounded-t-[4px] rounded-b-none' : '',
        ].join(' ')}
        onClick={onToggle}
        aria-expanded={open}
        type="button"
      >
        <span aria-hidden="true" className="flex-none text-tinta-2">
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </span>
        <span className="flex-1">{title}</span>
      </button>
      {open && (
        <div
          className={
            sub
              ? 'border-0 p-0 pb-[0.3rem]'
              : 'rounded-b-[4px] border border-linea border-t-0 bg-hoja'
          }
        >
          {children}
        </div>
      )}
    </div>
  )
}
