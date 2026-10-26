/** Conecta el cambio táctil de selección y los eventos tradicionales de escritorio. */
export function escucharCambiosSeleccion(
  eventos: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  leer: () => void,
  programar: (callback: () => void, demora: number) => ReturnType<typeof setTimeout> = setTimeout,
  cancelar: (id: ReturnType<typeof setTimeout>) => void = clearTimeout,
): () => void {
  let pendiente: ReturnType<typeof setTimeout> | undefined
  const agendar = (demora: number) => {
    if (pendiente !== undefined) cancelar(pendiente)
    pendiente = programar(() => {
      pendiente = undefined
      leer()
    }, demora)
  }
  const alSoltar = () => agendar(0)
  const alCambiarSeleccion = () => agendar(120)

  eventos.addEventListener('mouseup', alSoltar)
  eventos.addEventListener('keyup', alSoltar)
  eventos.addEventListener('selectionchange', alCambiarSeleccion)

  return () => {
    if (pendiente !== undefined) cancelar(pendiente)
    eventos.removeEventListener('mouseup', alSoltar)
    eventos.removeEventListener('keyup', alSoltar)
    eventos.removeEventListener('selectionchange', alCambiarSeleccion)
  }
}
