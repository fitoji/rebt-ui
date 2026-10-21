import type { ReactNode } from 'react'

/**
 * Acordeón simple para la sidebar del REBT.
 * Props:
 *   title    — texto del encabezado
 *   open     — booleano que controla si está expandido
 *   onToggle — callback al hacer clic
 *   children — contenido a mostrar/ocultar
 */
interface Props {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

export default function Accordion({ title, open, onToggle, children }: Props) {
  return (
    <div className="accordion">
      <button
        className={`accordion-toggle${open ? ' abierto' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
        type="button"
      >
        <span className="accordion-icon">{open ? '▼' : '▶'}</span>
        <span className="accordion-title">{title}</span>
      </button>
      {open && <div className="accordion-content">{children}</div>}
    </div>
  )
}
