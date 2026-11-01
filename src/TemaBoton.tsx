import type { Tema } from './useTheme.ts'
import { Moon, Sun } from 'lucide-react'

/**
 * Botón de alternar modo claro/oscuro. Se coloca en cualquier header de la app.
 * El icono indica el tema al que se puede cambiar.
 */
export default function TemaBoton({ tema, onToggle }: { tema: Tema; onToggle: () => void }) {
  return (
    <button
      className="inline-flex items-center justify-center rounded-[3px] border border-linea bg-transparent p-[0.3rem] text-[1.05rem] leading-none transition-colors duration-150 ease-plano hover:border-neutro hover:bg-neutro-fondo"
      onClick={onToggle}
      aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {tema === 'dark' ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
    </button>
  )
}
