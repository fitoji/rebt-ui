// Diálogo de confirmación para cambiar de test a mitad de una ronda.
//
// Se monta sobre el contenido de los cuestionarios y avisa de que cambiar borra el
// avance. Usa el primitivo Dialog de Radix para que el foco, Escape y el cierre al
// pulsar el fondo vengan resueltos de fábrica.

import { Dialog as DialogPrimitive } from 'radix-ui'

interface Props {
  /** Cerrar y no cambiar (Escape, clic fuera, «Seguir con este»). */
  onCancelar: () => void
  /** Cambiar al test elegido. */
  onConfirmar: () => void
  nombreActual: string
  nombreSiguiente: string
  /** Dónde estaba la ronda, p. ej. «Pregunta 3 de 10». */
  avance: string
}

export default function DialogoCambioTest({
  onCancelar,
  onConfirmar,
  nombreActual,
  nombreSiguiente,
  avance,
}: Props) {
  return (
    <DialogPrimitive.Root open onOpenChange={(abierto) => !abierto && onCancelar()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs motion-reduce:animate-none! data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(evento) => {
            // El foco arranca en «Seguir con este»: la opción segura.
            evento.preventDefault()
            document.getElementById('cambio-test-cancelar')?.focus()
          }}
          className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-linea bg-hoja p-5 text-tinta shadow-lg motion-reduce:animate-none! data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
        >
          <DialogPrimitive.Title className="m-0 text-xl font-semibold">
            ¿Cambiar de test?
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 mb-0 font-serif leading-[1.5] text-tinta-2">
            Vas a empezar «{nombreSiguiente}». Si cambias, perderás el avance de «
            {nombreActual}»: llevas {avance}.
          </DialogPrimitive.Description>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              id="cambio-test-cancelar"
              type="button"
              onClick={onCancelar}
              className="rounded-md border border-linea bg-plano px-4 py-2 font-semibold text-tinta hover:border-neutro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro"
            >
              Seguir con este
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              className="rounded-md bg-neutro px-4 py-2 font-semibold text-hoja hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro"
            >
              Cambiar de test
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
