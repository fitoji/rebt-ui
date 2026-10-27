import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cuestionarioCargado,
  entradasDesdeGuardado,
  interpretarTeclaCuestionario,
  prepararCuestionarios,
  quitarCargadoPorId,
  type Cuestionario,
  type EntradaCargada,
  type PreguntaTest,
} from './cuestionarios.ts'
import { useTheme } from './useTheme.ts'
import SidebarCuestionarios from './SidebarCuestionarios.tsx'
import DialogoCambioTest from './DialogoCambioTest.tsx'
import ZonaCarga from './ZonaCarga.tsx'
import BotonBarra from './BotonBarra.tsx'
import { SidebarInset } from '@/components/ui/sidebar.tsx'
import { toast } from 'sonner'

const archivos = import.meta.glob('../data-json/*.json', { eager: true, import: 'default' })
const cuestionarios = prepararCuestionarios(archivos)

// Los cuestionarios que el usuario carga con la zona de arrastre se guardan aquí.
const CLAVE_CARGADOS = 'rebt-cuestionarios-cargados'

interface Props {
  onInicio: () => void
}

export default function Cuestionarios({ onInicio }: Props) {
  const [cuestionario, setCuestionario] = useState<Cuestionario | null>(null)
  // Preguntas de la ronda activa: el cuestionario completo o solo las falladas al repetir.
  const [preguntas, setPreguntas] = useState<PreguntaTest[]>([])
  const [falladas, setFalladas] = useState<PreguntaTest[]>([])
  const [indice, setIndice] = useState(0)
  const [respuesta, setRespuesta] = useState<number | null>(null)
  const [aciertos, setAciertos] = useState(0)
  const [finalizado, setFinalizado] = useState(false)
  const [segundos, setSegundos] = useState(0)
  // Test elegido a mitad de una ronda, esperando confirmación en el diálogo.
  const [cambioPendiente, setCambioPendiente] = useState<Cuestionario | null>(null)
  // Cuestionarios que el usuario cargó con la zona de arrastre. Se guardan en
  // localStorage para que sigan al volver a entrar; si el navegador no lo permite,
  // siguen en memoria durante la sesión.
  const [cargados, setCargados] = useState<EntradaCargada[]>(() => {
    try {
      return entradasDesdeGuardado(localStorage.getItem(CLAVE_CARGADOS))
    } catch {
      return []
    }
  })
  const propios = useMemo(
    () =>
      cargados.flatMap((entrada) => {
        const cargado = cuestionarioCargado(entrada.nombre, entrada.contenido)
        return cargado ? [cargado] : []
      }),
    [cargados],
  )
  const { theme, toggle } = useTheme()

  const reiniciar = (lista: PreguntaTest[]) => {
    setPreguntas(lista)
    setFalladas([])
    setIndice(0)
    setRespuesta(null)
    setAciertos(0)
    setFinalizado(false)
    setSegundos(0)
  }

  const elegirCuestionario = (seleccionado: Cuestionario) => {
    // El aviso es de la ronda anterior: si sobrevive al cambio de test, queda hablando
    // de una pregunta que ya no está en pantalla.
    toast.dismiss()
    setCuestionario(seleccionado)
    reiniciar(seleccionado.preguntas)
  }

  // Cambiar de test desde la barra lateral. Si la ronda ya avanzó, se pide
  // confirmación: cambiar borra el avance.
  const hayAvance = !finalizado && (indice > 0 || respuesta !== null)

  const seleccionarPorId = (id: string) => {
    const seleccionado =
      cuestionarios.find((item) => item.id === id) ?? propios.find((item) => item.id === id)
    if (!seleccionado) return
    if (seleccionado.id === cuestionario?.id) {
      // El test activo no se reinicia con un clic accidental: eso se hace desde el resultado.
      if (finalizado) elegirCuestionario(seleccionado)
      return
    }
    if (cuestionario && hayAvance) {
      setCambioPendiente(seleccionado)
      return
    }
    elegirCuestionario(seleccionado)
  }

  // Validar y guardar un archivo soltado en la zona de carga. El prefijo en el id
  // evita chocar con los que ya vienen de data-json (mismo nombre de archivo).
  const agregarCuestionario = useCallback((nombre: string, contenido: unknown): boolean => {
    if (!cuestionarioCargado(nombre, contenido)) return false
    setCargados((anteriores) => [
      ...anteriores.filter((entrada) => entrada.nombre !== nombre),
      { nombre, contenido },
    ])
    return true
  }, [])

  // Quitar un test cargado desde la papelera de la barra lateral. Se saca de la
  // lista y el efecto de guardado lo borra de localStorage. Si era el test activo,
  // la ronda sigue en memoria: solo desaparece de la selección.
  const quitarCargado = useCallback((id: string) => {
    setCargados((anteriores) => quitarCargadoPorId(anteriores, id))
  }, [])

  const responder = useCallback((opcion: number) => {
    if (!cuestionario || respuesta !== null) return
    const actual = preguntas[indice]
    setRespuesta(opcion)
    if (!actual) return
    if (actual.ans === opcion) {
      setAciertos((total) => total + 1)
      toast.success('¡Correcto!')
    } else {
      setFalladas((anteriores) => [...anteriores, actual])
      toast.error('No es correcto. La respuesta correcta está marcada.')
    }
  }, [cuestionario, indice, preguntas, respuesta])

  const avanzar = useCallback(() => {
    if (!cuestionario) return
    // El aviso es la devolución de la pregunta que se acaba de responder: si queda en
    // pantalla mientras se lee la siguiente, miente.
    toast.dismiss()
    if (indice === preguntas.length - 1) {
      setFinalizado(true)
      return
    }
    setIndice((actual) => actual + 1)
    setRespuesta(null)
  }, [cuestionario, indice, preguntas.length])

  const volverALista = () => {
    toast.dismiss()
    setCuestionario(null)
    reiniciar([])
  }

  const pregunta = preguntas[indice]
  const progreso = preguntas.length > 0 ? ((indice + 1) / preguntas.length) * 100 : 0
  const opciones = useMemo(() => {
    if (!pregunta) return []
    return [1, 2, 3, 4, 5].flatMap((numero) => {
      const texto = pregunta[`option${numero}` as 'option1' | 'option2' | 'option3' | 'option4' | 'option5']
      return texto?.trim() ? [{ numero, texto }] : []
    })
  }, [pregunta])

  useEffect(() => {
    // Con el diálogo de cambio de test abierto las teclas no responden: se mira el
    // diálogo, no la pregunta.
    if (!cuestionario || !pregunta || finalizado || cambioPendiente) return

    const escucharTeclas = (evento: KeyboardEvent) => {
      const destino = evento.target
      if (
        destino instanceof HTMLElement &&
        (destino.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName))
      ) return
      if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.repeat) return

      const accion = interpretarTeclaCuestionario(
        evento.key,
        evento.code,
        respuesta !== null,
        opciones.length,
      )
      if (!accion) return

      evento.preventDefault()
      if (accion.tipo === 'responder') {
        const opcion = opciones[accion.opcion - 1]
        if (opcion) responder(opcion.numero)
      } else {
        avanzar()
      }
    }

    window.addEventListener('keydown', escucharTeclas)
    return () => window.removeEventListener('keydown', escucharTeclas)
  }, [avanzar, cambioPendiente, cuestionario, finalizado, opciones, pregunta, responder, respuesta])

  // El cronómetro corre mientras dura la ronda y se detiene al ver el resultado
  // (y mientras el diálogo de cambio de test está abierto).
  useEffect(() => {
    if (!cuestionario || finalizado || cambioPendiente) return
    const id = window.setInterval(() => setSegundos((total) => total + 1), 1000)
    return () => window.clearInterval(id)
  }, [cambioPendiente, cuestionario, finalizado])

  // Guardar los cuestionarios cargados. Si localStorage falla (modo privado,
  // cuota llena), los tests siguen en memoria sin romper la sesión.
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_CARGADOS, JSON.stringify(cargados))
    } catch {
      // sin persistencia disponible
    }
  }, [cargados])

  const minutosTranscurridos = Math.floor(segundos / 60)
  const segundosTranscurridos = String(segundos % 60).padStart(2, '0')

  // La card de un cuestionario en la lista de la página: la misma para los de la
  // app y para los cargados por el usuario.
  const tarjeta = (item: Cuestionario) => (
    <li key={item.id}>
      <button
        type="button"
        onClick={() => elegirCuestionario(item)}
        className="flex min-h-36 w-full flex-col items-start justify-between gap-6 rounded-lg border border-linea bg-hoja p-5 text-left text-tinta transition-[border-color,transform] duration-150 ease motion-reduce:transition-none hover:-translate-y-0.5 hover:border-neutro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro"
      >
        <span className="text-xl font-semibold">{item.nombre}</span>
        <span className="font-serif text-tinta-2">{item.preguntas.length} preguntas · {item.preguntas[0]?.tema}</span>
      </button>
    </li>
  )

  return (
    <>
      <SidebarCuestionarios
        cuestionarios={cuestionarios}
        cargados={propios}
        activo={cuestionario?.id}
        onSelect={seleccionarPorId}
        onQuitar={quitarCargado}
        onInicio={onInicio}
        theme={theme}
        onToggleTheme={toggle}
      />
      <SidebarInset className="h-[100svh] overflow-hidden text-tinta">
        <BotonBarra />
        <div className="mx-auto min-h-0 w-[min(64rem,_100%_-_3rem)] flex-1 overflow-y-auto py-[clamp(2rem,7vh,4rem)] max-[700px]:w-[min(64rem,_100%_-_2rem)]">
          <button
            type="button"
            onClick={onInicio}
            className="mb-6 rounded-md border border-linea bg-hoja px-4 py-2 text-sm text-tinta transition-colors hover:border-neutro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro"
          >
            Volver al inicio
          </button>

          {!cuestionario ? (
            <section aria-labelledby="cuestionarios-heading">
              <h1 id="cuestionarios-heading" className="mb-2 mt-0 text-[clamp(2.5rem,8vw,4rem)] font-semibold leading-[1]">
                Cuestionarios Tests
              </h1>
              <p className="mb-8 mt-0 font-serif text-lg text-tinta-2">
                Elige un cuestionario para empezar. Cada test contiene preguntas de opción múltiple.
              </p>
              <div className="mb-6">
                <ZonaCarga onCargar={agregarCuestionario} />
              </div>
              {cuestionarios.length + propios.length > 0 ? (
                <>
                  {cuestionarios.length > 0 && (
                    <>
                      {propios.length > 0 && (
                        <h2 className="mb-3 mt-0 text-sm font-semibold text-tinta-2">Tests de la app</h2>
                      )}
                      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-4 p-0">
                        {cuestionarios.map(tarjeta)}
                      </ul>
                    </>
                  )}

                  {propios.length > 0 && (
                    <>
                      <h2 className="my-6 flex items-center gap-4 text-sm font-semibold text-tinta-2">
                        <span className="h-px flex-1 bg-linea" aria-hidden="true" />
                        Cargados desde tu equipo ({propios.length})
                        <span className="h-px flex-1 bg-linea" aria-hidden="true" />
                      </h2>
                      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-4 p-0">
                        {propios.map(tarjeta)}
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <p role="status" className="rounded-lg border border-linea bg-hoja p-5 text-tinta-2">
                  No hay cuestionarios válidos en la carpeta data-json. Arrastra un .json para cargar el tuyo.
                </p>
              )}
            </section>
          ) : finalizado ? (
            <section aria-labelledby="resultado-heading" className="rounded-lg border border-linea bg-hoja p-6 md:p-8">
              <p className="mb-2 mt-0 text-sm text-tinta-2">{cuestionario.nombre}</p>
              <h1 id="resultado-heading" className="mb-3 mt-0 text-3xl font-semibold">Cuestionario completado</h1>
              <p className="mb-6 mt-0 font-serif text-xl text-tinta-2" aria-live="polite">
                Resultado: {aciertos} de {preguntas.length} respuestas correctas · Tiempo total:{' '}
                <span className="font-mono tabular-nums">{minutosTranscurridos}:{segundosTranscurridos}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {falladas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => reiniciar(falladas)}
                    className="rounded-md bg-neutro px-4 py-2 font-semibold text-hoja hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro"
                  >
                    Repetir solo las incorrectas ({falladas.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => reiniciar(cuestionario.preguntas)}
                  className={
                    falladas.length > 0
                      ? 'rounded-md border border-linea bg-plano px-4 py-2 font-semibold text-tinta hover:border-neutro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro'
                      : 'rounded-md bg-neutro px-4 py-2 font-semibold text-hoja hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro'
                  }
                >
                  Repetir cuestionario
                </button>
                <button type="button" onClick={volverALista} className="rounded-md border border-linea bg-plano px-4 py-2 font-semibold text-tinta hover:border-neutro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro">
                  Elegir otro test
                </button>
              </div>
            </section>
          ) : pregunta ? (
            <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
              <section aria-labelledby="pregunta-heading" className="min-w-0">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="mb-1 mt-0 text-sm text-tinta-2">{cuestionario.nombre} · {pregunta.tema}</p>
                    <p className="m-0 text-sm font-medium text-tinta-2">Pregunta {indice + 1} de {preguntas.length}</p>
                  </div>
                  <span className="text-sm font-semibold text-tinta-2">{Math.round(progreso)}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Progreso del cuestionario"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progreso)}
                  className="mb-6 h-2 overflow-hidden rounded-full bg-[var(--linea)]"
                >
                  <div className="h-full bg-neutro transition-[width] duration-200" style={{ width: `${progreso}%` }} />
                </div>

                <div className="rounded-lg border border-linea bg-hoja p-5 md:p-8">
                  <h1 id="pregunta-heading" className="mb-6 mt-0 text-2xl font-semibold leading-snug">{pregunta.question}</h1>
                  <div className="grid gap-3">
                    {opciones.map(({ numero, texto }, indiceOpcion) => {
                      const esCorrecta = numero === pregunta.ans
                      const esSeleccionada = numero === respuesta
                      const estilo = respuesta === null
                        ? 'border-linea hover:border-neutro'
                        : esCorrecta
                          ? 'border-tierra-a bg-tierra-a/10'
                          : esSeleccionada
                            ? 'border-[var(--nota-rojo)] bg-[var(--nota-rojo)]/20'
                            : 'border-linea opacity-70'

                      return (
                        <button
                          key={numero}
                          type="button"
                          disabled={respuesta !== null}
                          aria-pressed={esSeleccionada}
                          aria-keyshortcuts={String(indiceOpcion + 1)}
                          onClick={() => responder(numero)}
                          className={`rounded-md border bg-plano px-4 py-3 text-left text-tinta transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro disabled:cursor-default ${estilo}`}
                        >
                          <span className="mr-2 font-semibold">{String.fromCharCode(64 + numero)}.</span>{texto}
                        </button>
                      )
                    })}
                  </div>

                  {respuesta !== null && (
                    <div className="mt-5 flex flex-wrap items-center justify-end gap-4">
                      <button type="button" aria-keyshortcuts="Space" onClick={avanzar} className="rounded-md bg-neutro px-4 py-2 font-semibold text-hoja hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro">
                        {indice === preguntas.length - 1 ? 'Ver resultado' : 'Siguiente pregunta'}
                      </button>
                    </div>
                  )}
                </div>

                <aside aria-labelledby="atajos-heading" className="mt-4 rounded-lg border border-linea bg-hoja p-4 md:p-5">
                  <h2 id="atajos-heading" className="mb-3 mt-0 text-sm font-semibold">Atajos de teclado</h2>
                  <ul className="m-0 grid list-none gap-2 p-0 text-sm text-tinta-2">
                    <li className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1" aria-hidden="true">
                        {opciones.map(({ numero }) => (
                          <kbd key={numero} className="rounded-md border border-linea bg-plano px-2 py-0.5 font-mono text-xs font-semibold text-tinta">{String(numero)}</kbd>
                        ))}
                      </span>
                      <span className="sr-only">Teclas {opciones[0]?.numero} a {opciones[opciones.length - 1]?.numero}</span>
                      <span>Elegir una respuesta</span>
                    </li>
                    <li className="flex flex-wrap items-center gap-2">
                      <kbd aria-hidden="true" className="rounded-md border border-linea bg-plano px-2 py-0.5 font-mono text-xs font-semibold text-tinta">Espacio</kbd>
                      <span>Avanzar a la siguiente pregunta después de responder</span>
                    </li>
                  </ul>
                </aside>
              </section>

              <aside aria-label="Estado de la ronda" className="order-first grid gap-3 rounded-lg border border-linea bg-hoja p-4 md:order-none md:sticky md:top-4 md:p-5">
                <div>
                  <p className="m-0 text-xs font-medium text-tinta-2">Tiempo en curso</p>
                  <p className="m-0 font-mono text-3xl font-semibold leading-none tabular-nums text-tinta">
                    {minutosTranscurridos}:{segundosTranscurridos}
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-md border border-tierra-a bg-tierra-a/10 px-3 py-2">
                    <p className="m-0 text-xs font-medium text-tinta-2">Correctas</p>
                    <p className="m-0 text-2xl font-semibold leading-tight text-tierra-a">{aciertos}</p>
                  </div>
                  <div className="rounded-md border border-[var(--nota-rojo)] bg-[var(--nota-rojo)]/10 px-3 py-2">
                    <p className="m-0 text-xs font-medium text-tinta-2">Equivocadas</p>
                    <p className="m-0 text-2xl font-semibold leading-tight text-[var(--nota-rojo)]">{falladas.length}</p>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </SidebarInset>

      {cambioPendiente && cuestionario && (
        <DialogoCambioTest
          nombreActual={cuestionario.nombre}
          nombreSiguiente={cambioPendiente.nombre}
          avance={`Pregunta ${indice + 1} de ${preguntas.length}`}
          onCancelar={() => setCambioPendiente(null)}
          onConfirmar={() => {
            const siguiente = cambioPendiente
            setCambioPendiente(null)
            if (siguiente) elegirCuestionario(siguiente)
          }}
        />
      )}
    </>
  )
}
