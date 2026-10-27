import type { Tema } from './useTheme.ts'
import { Moon, Sun } from 'lucide-react'

/**
 * Botón de alternar modo claro/oscuro. Se coloca en cualquier header de la app.
 * El icono indica el tema al que se puede cambiar.
 */
export default function TemaBoton({ tema, onToggle }: { tema: Tema; onToggle: () => void }) {
  return (
    <button
      className="inline-flex items-center justify-center p-[0.3rem] bg-transparent border border-linea rounded-[4px] text-[1.05rem] leading-none hover:bg-neutro-fondo hover:border-neutro"
      onClick={onToggle}
      aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {tema === 'dark' ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
    </button>
  )
}
