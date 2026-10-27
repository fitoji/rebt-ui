// Zona de carga de cuestionarios por arrastrar y soltar.
//
// Port del FileDropZone del proyecto json-view: un dropzone que acepta archivos
// .json del equipo, los lee y se los entrega a la pantalla de cuestionarios para
// que entren en la lista de tests disponibles (solo en el navegador; no se guardan
// en ningún sitio). El clic también sirve: el input de archivo está oculto dentro
// de la etiqueta.

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { CheckCircle2, CircleAlert, FileJson, Loader2 } from 'lucide-react'

// MIME que los navegadores suelen reportar para .json, más la extensión: al
// arrastrar un archivo local el tipo viene vacío o genérico.
const MIME_ACEPTADOS = ['application/json', 'text/json', 'application/x-json', 'text/plain']

const esAceptado = (archivo: File) =>
  Boolean(archivo) &&
  (MIME_ACEPTADOS.includes(archivo.type.toLowerCase()) || /\.json$/i.test(archivo.name))

type Estado = 'idle' | 'loading' | 'error' | 'success'

const REVELAR_SPINNER_MS = 150
const OCULTAR_EXITO_MS = 2500

function leerJson(archivo: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = (evento) => {
      try {
        resolve(JSON.parse(String(evento.target?.result ?? '')))
      } catch {
        reject(new Error('JSON inválido'))
      }
    }
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'))
    lector.readAsText(archivo)
  })
}

export default function ZonaCarga({
  onCargar,
  disabled = false,
}: {
  /** Acepta el contenido parseado y devuelve false si no es un cuestionario válido. */
  onCargar: (nombre: string, contenido: unknown) => boolean
  disabled?: boolean
}) {
  const [arrastrando, setArrastrando] = useState(false)
  const [estado, setEstado] = useState<Estado>('idle')
  const [mensaje, setMensaje] = useState('')
  const [detalle, setDetalle] = useState('')
  const [conSpinner, setConSpinner] = useState(false)

  const temporizadores = useRef<number[]>([])
  const limpiarTemporizadores = () => {
    temporizadores.current.forEach((id) => window.clearTimeout(id))
    temporizadores.current = []
  }
  useEffect(() => limpiarTemporizadores, [])

  const fallar = (texto: string) => {
    limpiarTemporizadores()
    setConSpinner(false)
    setMensaje('No se pudo cargar')
    setDetalle(texto)
    setEstado('error')
  }

  const procesar = async (archivos: File[]) => {
    if (disabled || archivos.length === 0) return
    const admitidos = archivos.filter(esAceptado)
    if (admitidos.length === 0) {
      fallar('Solo se admiten archivos .json')
      return
    }

    limpiarTemporizadores()
    setEstado('loading')
    setConSpinner(false)
    // El spinner solo se muestra si la lectura se demora: en local casi nunca.
    temporizadores.current.push(
      window.setTimeout(() => setConSpinner(true), REVELAR_SPINNER_MS),
    )

    let cargados = 0
    const invalidos: string[] = []
    for (const archivo of admitidos) {
      try {
        const contenido = await leerJson(archivo)
        if (onCargar(archivo.name, contenido)) cargados += 1
        else invalidos.push(archivo.name)
      } catch {
        invalidos.push(archivo.name)
      }
    }

    limpiarTemporizadores()
    setConSpinner(false)

    if (cargados === 0) {
      setMensaje('No se pudo cargar')
      setDetalle(
        invalidos.length === 1
          ? '«' + invalidos[0] + '» no es un cuestionario JSON válido'
          : invalidos.length + ' archivos no son cuestionarios JSON válidos',
      )
      setEstado('error')
      return
    }

    setMensaje(
      cargados === 1 ? 'Cuestionario cargado' : cargados + ' cuestionarios cargados',
    )
    setDetalle(
      invalidos.length > 0
        ? invalidos.length + ' archivos omitidos por no ser válidos'
        : 'Listos para practicar',
    )
    setEstado('success')
    temporizadores.current.push(
      window.setTimeout(() => setEstado('idle'), OCULTAR_EXITO_MS),
    )
  }

  const alSoltar = (evento: DragEvent) => {
    evento.preventDefault()
    setArrastrando(false)
    void procesar(Array.from(evento.dataTransfer?.files ?? []))
  }

  const alElegir = (evento: ChangeEvent<HTMLInputElement>) => {
    void procesar(Array.from(evento.target.files ?? []))
    evento.target.value = ''
  }

  const cargando = estado === 'loading'
  const error = estado === 'error'
  const exito = estado === 'success'

  return (
    <label
      className={[
        'relative flex w-full cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center outline-none',
        'border-linea bg-hoja transition-[background-color,border-color] duration-150 ease motion-reduce:transition-none',
        'hover:border-neutro hover:bg-neutro-fondo/40',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-neutro',
        arrastrando ? 'border-neutro bg-neutro-fondo shadow-sm' : '',
        error ? 'border-[var(--nota-rojo)] bg-[var(--nota-rojo)]/5' : '',
        exito ? 'border-tierra-a bg-tierra-a/10' : '',
        disabled ? 'cursor-not-allowed opacity-55' : '',
      ].filter(Boolean).join(' ')}
      aria-disabled={disabled || undefined}
      onDragOver={(evento) => {
        evento.preventDefault()
        if (!disabled) setArrastrando(true)
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={alSoltar}
    >
      <input
        type="file"
        accept=".json,application/json"
        multiple
        disabled={disabled}
        aria-describedby="zona-carga-ayuda"
        aria-invalid={error || undefined}
        className="sr-only"
        onChange={alElegir}
      />

      <span
        className={[
          'flex size-12 items-center justify-center rounded-lg bg-plano text-tinta-2 transition-transform duration-150 ease motion-reduce:transition-none',
          arrastrando ? 'scale-110' : '',
          error ? 'text-[var(--nota-rojo)]' : '',
          exito ? 'text-tierra-a' : '',
        ].filter(Boolean).join(' ')}
        aria-hidden="true"
      >
        {cargando && conSpinner ? (
          <Loader2 className="size-6 animate-spin" />
        ) : error ? (
          <CircleAlert className="size-6" />
        ) : exito ? (
          <CheckCircle2 className="size-6" />
        ) : (
          <FileJson className="size-6" />
        )}
      </span>

      <span className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-tinta">
          {arrastrando
            ? 'Soltá para cargar'
            : cargando
              ? 'Leyendo archivo…'
              : error
                ? 'No se pudo cargar'
                : exito
                  ? mensaje
                  : 'Arrastrá tus cuestionarios .json acá'}
        </span>
        <span
          id="zona-carga-ayuda"
          role="status"
          aria-live="polite"
          className={['text-xs', error ? 'text-[var(--nota-rojo)]' : 'text-tinta-2'].join(' ')}
        >
          {arrastrando
            ? 'Se cargarán como cuestionarios nuevos'
            : cargando
              ? 'Casi listo…'
              : error
                ? detalle
                : exito
                  ? detalle
                  : 'o hacé clic para elegirlos desde tu equipo'}
        </span>
      </span>

      <span className="font-mono text-[11px] tracking-tight text-tinta-2" aria-hidden="true">
        .json
      </span>
    </label>
  )
}
