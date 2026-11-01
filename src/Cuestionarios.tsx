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
        className="group flex min-h-[8.5rem] w-full flex-col items-start justify-between gap-6 rounded-[4px] border border-linea bg-hoja p-5 text-left text-tinta transition-[border-color,transform,background-color] duration-200 ease-plano hover:-translate-y-0.5 hover:border-neutro hover:bg-neutro-fondo/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro"
      >
        <span className="text-xl font-semibold leading-[1.2]">{item.nombre}</span>
        <span className="flex w-full items-end justify-between gap-3 border-t border-linea pt-3">
          <span className="font-serif text-[0.95rem] leading-[1.4] text-tinta-2">
            <span className="dato text-tinta">{item.preguntas.length}</span> preguntas · {item.preguntas[0]?.tema}
          </span>
          <span
            aria-hidden="true"
            className="text-[1.15rem] leading-none text-tinta-2 transition-transform duration-200 ease-plano group-hover:translate-x-1 group-hover:text-neutro"
          >
            →
          </span>
        </span>
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
            <section aria-labelledby="cuestionarios-heading" className="animate-vista-entra">
              <h1 id="cuestionarios-heading" className="mb-2 mt-0 text-[clamp(2.5rem,8vw,4rem)] font-semibold leading-[1] tracking-[-0.015em]">
                Cuestionarios Tests
              </h1>
              <p className="mb-8 mt-0 max-w-[46ch] font-serif text-lg leading-[1.5] text-tinta-2">
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
                        <h2 className="rotulo mb-3 mt-0">Tests de la app</h2>
                      )}
                      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-3 p-0">
                        {cuestionarios.map(tarjeta)}
                      </ul>
                    </>
                  )}

                  {propios.length > 0 && (
                    <>
                      <h2 className="rotulo my-6 flex items-center gap-4">
                        <span className="h-px flex-1 bg-linea" aria-hidden="true" />
                        Cargados desde tu equipo ({propios.length})
                        <span className="h-px flex-1 bg-linea" aria-hidden="true" />
                      </h2>
                      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-3 p-0">
                        {propios.map(tarjeta)}
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <p role="status" className="rounded-[4px] border border-linea bg-hoja p-5 text-tinta-2">
                  No hay cuestionarios válidos en la carpeta data-json. Arrastra un .json para cargar el tuyo.
                </p>
              )}
            </section>
          ) : finalizado ? (
            <section aria-labelledby="resultado-heading" className="animate-vista-entra rounded-[4px] border border-linea bg-hoja p-6 md:p-8">
              <p className="rotulo mb-2 mt-0">{cuestionario.nombre}</p>
              <h1 id="resultado-heading" className="mb-4 mt-0 text-3xl font-semibold tracking-[-0.01em]">Cuestionario completado</h1>

              {/* El resultado como ficha: las tres cifras de la ronda, en el mismo orden
                  y con la misma retícula que el resto de los datos de la app. */}
              <dl className="cajetin mb-6">
                <div>
                  <dt className="rotulo">Correctas</dt>
                  <dd className="m-0 text-[1.6rem] font-semibold leading-none text-[var(--aviso-exito)]">
                    <span key={`ok-${aciertos}`} className="dato inline-block animate-marca-cuenta">{aciertos}</span>
                    <span className="dato text-[0.9rem] font-normal text-tinta-2"> / {preguntas.length}</span>
                  </dd>
                </div>
                <div>
                  <dt className="rotulo">Falladas</dt>
                  <dd className="m-0 text-[1.6rem] font-semibold leading-none text-[var(--aviso-error)]">
                    <span className="dato">{falladas.length}</span>
                  </dd>
                </div>
                <div>
                  <dt className="rotulo">Tiempo</dt>
                  <dd className="dato m-0 text-[1.6rem] font-semibold leading-none text-tinta tabular-nums">
                    {minutosTranscurridos}:{segundosTranscurridos}
                  </dd>
                </div>
                <div>
                  <dt className="rotulo">Acierto</dt>
                  <dd className="dato m-0 text-[1.6rem] font-semibold leading-none text-tinta">
                    {preguntas.length > 0 ? Math.round((aciertos / preguntas.length) * 100) : 0}
                    <span className="text-[0.9rem] font-normal text-tinta-2"> %</span>
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-3">
                {falladas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => reiniciar(falladas)}
                    className="rounded-[4px] bg-neutro px-4 py-2 font-semibold text-hoja transition-[filter,transform] duration-200 ease-plano hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro"
                  >
                    Repetir solo las incorrectas ({falladas.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => reiniciar(cuestionario.preguntas)}
                  className={
                    falladas.length > 0
                      ? 'rounded-[4px] border border-linea bg-plano px-4 py-2 font-semibold text-tinta transition-[border-color,background-color] duration-200 ease-plano hover:border-neutro hover:bg-neutro-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro'
                      : 'rounded-[4px] bg-neutro px-4 py-2 font-semibold text-hoja transition-[filter,transform] duration-200 ease-plano hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro'
                  }
                >
                  Repetir cuestionario
                </button>
                <button type="button" onClick={volverALista} className="rounded-[4px] border border-linea bg-plano px-4 py-2 font-semibold text-tinta transition-[border-color,background-color] duration-200 ease-plano hover:border-neutro hover:bg-neutro-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro">
                  Elegir otro test
                </button>
              </div>
            </section>
          ) : pregunta ? (
            <div className="animate-vista-entra grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
              <section aria-labelledby="pregunta-heading" className="min-w-0">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="rotulo mb-[0.3rem] mt-0">{cuestionario.nombre} · {pregunta.tema}</p>
                    <p className="m-0 text-[0.95rem] font-medium text-tinta-2">
                      Pregunta <span className="dato text-tinta">{indice + 1}</span> de{' '}
                      <span className="dato text-tinta">{preguntas.length}</span>
                    </p>
                  </div>
                  <span className="dato text-[0.9rem] font-semibold text-tinta-2">{Math.round(progreso)}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Progreso del cuestionario"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progreso)}
                  className="mb-6 h-[6px] overflow-hidden rounded-[3px] bg-[var(--linea)]"
                >
                  <div
                    className="h-full rounded-[3px] bg-neutro transition-[width] duration-300 ease-plano"
                    style={{ width: `${progreso}%` }}
                  />
                </div>

                <div className="rounded-[4px] border border-linea bg-hoja p-5 md:p-8">
                  <h1 id="pregunta-heading" className="mb-6 mt-0 text-2xl font-semibold leading-snug text-balance">{pregunta.question}</h1>
                  <div className="grid gap-2">
                    {opciones.map(({ numero, texto }, indiceOpcion) => {
                      const esCorrecta = numero === pregunta.ans
                      const esSeleccionada = numero === respuesta
                      const revelada = respuesta !== null
                      const estilo = !revelada
                        ? 'border-linea hover:border-neutro hover:bg-neutro-fondo/40'
                        : esCorrecta
                          ? 'border-[var(--aviso-exito)] bg-tierra-a/10'
                          : esSeleccionada
                            ? 'border-[var(--aviso-error)] bg-[var(--aviso-error)]/20'
                            : 'border-linea opacity-70'

                      return (
                        <button
                          key={numero}
                          type="button"
                          disabled={revelada}
                          aria-pressed={esSeleccionada}
                          aria-keyshortcuts={String(indiceOpcion + 1)}
                          onClick={() => responder(numero)}
                          className={`relative overflow-hidden rounded-[4px] border bg-plano py-3 pl-4 pr-4 text-left text-tinta transition-[border-color,background-color,opacity,transform] duration-200 ease-plano focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro disabled:cursor-default ${estilo}`}
                        >
                          {/* La marca de la respuesta: entra desde arriba, como la del
                              índice. Verde si es la correcta, roja si era la elegida. */}
                          <span
                            aria-hidden="true"
                            className={[
                              'absolute inset-y-0 left-0 w-[3px] origin-top transition-transform duration-300 ease-plano',
                              revelada && esCorrecta
                                ? 'scale-y-100 bg-tierra-a'
                                : revelada && esSeleccionada
                                  ? 'scale-y-100 bg-[var(--aviso-error)]'
                                  : 'scale-y-0 bg-neutro',
                            ].join(' ')}
                          />
                          <span className="dato mr-[0.6rem] inline-flex size-[1.35rem] items-center justify-center rounded-[3px] border border-linea bg-hoja align-[-0.15em] text-[0.72rem] font-semibold text-tinta-2">
                            {String.fromCharCode(64 + numero)}
                          </span>
                          {texto}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-4">
                    {/* El botón está siempre: deshabilitado mientras no hay respuesta, para
                        que el bloque no cambie de alto y el siguiente paso se vea venir. */}
                    <button type="button" aria-keyshortcuts="Space" onClick={avanzar} disabled={respuesta === null} className="rounded-[4px] bg-neutro px-4 py-2 font-semibold text-hoja transition-[filter,transform,opacity] duration-200 ease-plano hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutro disabled:pointer-events-none disabled:opacity-45 disabled:hover:translate-y-0">
                      {indice === preguntas.length - 1 ? 'Ver resultado' : 'Siguiente pregunta'}
                    </button>
                  </div>
                </div>

                <aside aria-labelledby="atajos-heading" className="mt-4 rounded-[4px] border border-linea bg-hoja p-4 md:p-5">
                  <h2 id="atajos-heading" className="rotulo mb-3 mt-0">Atajos de teclado</h2>
                  <ul className="m-0 grid list-none gap-2 p-0 text-sm text-tinta-2">
                    <li className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1" aria-hidden="true">
                        {opciones.map(({ numero }) => (
                          <kbd key={numero} className="dato rounded-[3px] border border-linea bg-plano px-2 py-0.5 text-[0.72rem] font-semibold text-tinta shadow-[0_1px_0_var(--linea)]">{String(numero)}</kbd>
                        ))}
                      </span>
                      <span className="sr-only">Teclas {opciones[0]?.numero} a {opciones[opciones.length - 1]?.numero}</span>
                      <span>Elegir una respuesta</span>
                    </li>
                    <li className="flex flex-wrap items-center gap-2">
                      <kbd aria-hidden="true" className="dato rounded-[3px] border border-linea bg-plano px-2 py-0.5 text-[0.72rem] font-semibold text-tinta shadow-[0_1px_0_var(--linea)]">Espacio</kbd>
                      <span>Avanzar a la siguiente pregunta después de responder</span>
                    </li>
                  </ul>
                </aside>
              </section>

              <aside aria-label="Estado de la ronda" className="order-first grid gap-3 rounded-[4px] border border-linea bg-hoja p-4 md:order-none md:sticky md:top-4 md:p-5">
                <div>
                  <p className="rotulo m-0">Tiempo en curso</p>
                  <p className="dato m-0 text-3xl font-semibold leading-none text-tinta">
                    {minutosTranscurridos}:{segundosTranscurridos}
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="rounded-[3px] border border-[var(--aviso-exito)] bg-tierra-a/10 px-3 py-2">
                    <p className="rotulo m-0 mb-[0.15rem]">Correctas</p>
                    <p className="m-0 text-2xl font-semibold leading-tight text-[var(--aviso-exito)]">
                      <span key={`aciertos-${aciertos}`} className="dato inline-block animate-marca-cuenta">{aciertos}</span>
                    </p>
                  </div>
                  <div className="rounded-[3px] border border-[var(--aviso-error)] bg-[var(--aviso-error)]/10 px-3 py-2">
                    <p className="rotulo m-0 mb-[0.15rem]">Equivocadas</p>
                    <p className="m-0 text-2xl font-semibold leading-tight text-[var(--aviso-error)]">
                      <span key={`falladas-${falladas.length}`} className="dato inline-block animate-marca-cuenta">{falladas.length}</span>
                    </p>
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
