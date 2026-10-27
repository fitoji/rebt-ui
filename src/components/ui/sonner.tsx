import type { CSSProperties } from 'react'
import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'

/** El aviso flotante de la app (sonner), pintado con los tokens del proyecto.
 *
 *  Los colores van por `style` y no por clases: sonner inyecta su hoja al final del
 *  `<head>` cuando monta, así que una clase nuestra perdería el empate. Una variable
 *  inline gana siempre, y como apunta a `--hoja` y `--tinta`, el aviso sigue el tema
 *  activo sin que haya que pasarle `theme`. */
export function Toaster(props: ToasterProps) {
  const tokens = {
    '--normal-bg': 'var(--hoja)',
    '--normal-text': 'var(--tinta)',
    '--normal-border': 'var(--linea)',
    '--border-radius': 'var(--radius-lg)',
  } as CSSProperties

  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      // Una respuesta a la vez: no tiene sentido apilar avisos del mismo cuestionario.
      visibleToasts={1}
      style={tokens}
      toastOptions={{
        classNames: {
          toast: 'group toast border border-linea bg-hoja text-tinta shadow-lg',
          // El filo izquierdo es lo que hace de "bien" o "mal" de un vistazo.
          success: 'border-l-4! border-l-(--aviso-exito)!',
          error: 'border-l-4! border-l-(--aviso-error)!',
          title: 'font-semibold',
          description: 'text-tinta-2',
          actionButton: 'bg-neutro text-hoja',
          cancelButton: 'bg-plano text-tinta-2',
        },
      }}
      {...props}
    />
  )
}
