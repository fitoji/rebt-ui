import type { Tema } from './useTheme.ts'

/**
 * Botón de alternar modo claro/oscuro. Se coloca en cualquier header de la app.
 * Icono: ☀️ (light) / 🌙 (dark).
 */
export default function TemaBoton({ tema, onToggle }: { tema: Tema; onToggle: () => void }) {
  return (
    <button
      className="tema-boton"
      onClick={onToggle}
      aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {tema === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
