// El texto de una disposición del diario oficial, con su cabecera y el enlace al original.
//
// Lo usan las dos vistas que leen normas no consolidadas: los cambios del reglamento
// (`LectorNorma`) y el archivo (`LectorArchivo`). La cabecera repite lo que hace falta
// saber —qué documento es, cuándo se publicó y que no está consolidado— y el enlace al
// BOE va siempre a la vista, porque el texto de acá es el que salió ese día, no el que
// rige hoy.

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import BarraProgreso from './BarraProgreso.tsx'
import { getDiario } from './diario.ts'
import { useRevelar } from './hooks/useRevelar.ts'
import { Item } from './render.tsx'
import type { BloqueConContenido } from './tipos.ts'

type Estado =
  | { status: 'loading' }
  | { status: 'ok'; doc: BloqueConContenido }
  | { status: 'error'; error: Error }

export default function LectorDiario({
  id,
  referencia,
  titulo,
  fecha,
  url,
}: {
  id: string
  /** Cómo se cita: «RD 244/2019». */
  referencia: string
  /** El título oficial completo. */
  titulo: string
  /** Publicación en el BOE, dd-mm-aaaa. */
  fecha: string
  url: string
}) {
  const [estado, setEstado] = useState<Estado>({ status: 'loading' })
  /** Sube con cada documento cargado: es la señal para que el revelado se arme de nuevo. */
  const [carga, setCarga] = useState(0)
  const articulo = useRef<HTMLElement>(null)
  const desplazador = useRef<HTMLElement>(null)

  useEffect(() => {
    let vivo = true
    setEstado({ status: 'loading' })
    getDiario(id).then(
      (doc) => {
        if (!vivo) return
        setEstado({ status: 'ok', doc })
        setCarga((n) => n + 1)
      },
      (error: Error) => vivo && setEstado({ status: 'error', error }),
    )
    return () => {
      vivo = false
    }
  }, [id])

  // El texto entra al scrollear, igual que en el lector del reglamento: el artículo es el
  // contenedor que se observa, y el scroller se descubre solo.
  useRevelar(articulo, carga)

  return (
    <main
      className="lector animate-vista-entra overflow-y-auto px-[clamp(1.1rem,4vw,3.5rem)] pt-[2.2rem] pb-[4rem] outline-none max-[860px]:pt-[3.2rem]"
      ref={desplazador}
      tabIndex={-1}
    >
      <header className="lamina mb-[2rem] border-b border-linea pb-[1.25rem]">
        <h1 className="m-0 max-w-[26ch] text-[clamp(1.6rem,3vw,2.3rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-balance">
          {referencia}
        </h1>
        <p className="mt-[0.6rem] mb-0 max-w-[52rem] font-lectura text-[1rem] leading-[1.5] text-tinta-2">
          {titulo}
        </p>
        <p className="mt-[0.8rem] mb-0 flex flex-wrap items-baseline gap-x-[0.6rem] text-[0.85rem] text-tinta-2">
          <span>
            Texto original publicado en el BOE el {fecha}. No está consolidado: lo que sigue es
            el documento tal como salió, sin los cambios posteriores.
          </span>
          <a className="enlace-externo" href={url} target="_blank" rel="noreferrer">
            Ver en el BOE
            <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </p>
      </header>

      {estado.status === 'loading' && (
        <p className="medida" role="status">
          Cargando el texto del BOE…
        </p>
      )}

      {estado.status === 'error' && (
        <div className="medida rounded-[4px] border border-linea bg-hoja py-[1rem] px-[1.2rem]" role="alert">
          <p className="rotulo mt-0 mb-[0.4rem] text-fase">No se puede leer acá</p>
          <p className="mt-0 mb-[0.9rem] text-[0.95rem] text-tinta-2">{estado.error.message}</p>
          <a className="enlace-externo" href={url} target="_blank" rel="noreferrer">
            Abrir el documento en el BOE
            <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </div>
      )}

      {estado.status === 'ok' && (
        <article className="texto lectura lamina" ref={articulo} key={estado.doc.id}>
          {estado.doc.versions[0]?.items.map((item, i) => (
            <Item key={i} item={item} tableName={`${referencia}_t${String(i).padStart(2, '0')}`} />
          ))}
        </article>
      )}

      <BarraProgreso desplazador={desplazador} />
    </main>
  )
}
