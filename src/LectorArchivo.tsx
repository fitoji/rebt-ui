// El lector de las normas del archivo: el reglamento de 1973, sus instrucciones y la
// modificación de 1985.
//
// Ninguna está consolidada, así que el texto sale del diario del BOE (ver `diario.ts`).
// La barra lateral las lista todas —normas arriba, instrucciones abajo— para poder pasar
// de la orden de 1973 a la de 1998 sin volver a la tabla.
//
// Tres de las dieciséis no tienen texto digitalizado: todo 1973 y 1974 existe solo como
// PDF escaneado. Para esas la vista lo dice y ofrece el documento, en vez de un lector
// vacío.

import { ArrowUpRight } from 'lucide-react'
import BotonBarra from './BotonBarra.tsx'
import InicioBoton from './InicioBoton.tsx'
import LectorDiario from './LectorDiario.tsx'
import TemaBoton from './TemaBoton.tsx'
import { INSTRUCCIONES, NORMAS } from './antiguos.ts'
import { useTheme } from './useTheme.ts'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar.tsx'

export default function LectorArchivo({
  id,
  onNavigate,
}: {
  /** El id BOE de la norma o de la instrucción. */
  id: string
  onNavigate: (destino: string) => void
}) {
  const { theme, toggle } = useTheme()

  const norma = NORMAS.find((n) => n.id === id)
  const instruccion = INSTRUCCIONES.find((i) => i.id === id)
  // Las dos listas guardan el mismo dato con nombres distintos: las normas usan `boe` y
  // `pdf`, las instrucciones `fecha` y `url`. Se normaliza acá una sola vez.
  const actual = norma
    ? {
        id: norma.id,
        referencia: norma.referencia,
        titulo: norma.titulo,
        fecha: norma.boe,
        url: norma.pdf ?? '',
        diario: norma.diario,
      }
    : instruccion
      ? {
          id: instruccion.id,
          referencia: instruccion.referencia,
          titulo: instruccion.titulo,
          fecha: instruccion.fecha,
          url: instruccion.url,
          diario: instruccion.diario,
        }
      : null

  return (
    <>
      <SidebarUI
        collapsible="offcanvas"
        className="min-h-0 border-r border-linea"
        aria-label="Normas del archivo"
      >
        <SidebarHeader className="border-b border-linea px-[1.1rem] pt-[1.1rem] pb-[0.9rem]">
          <div className="flex items-baseline justify-between gap-[0.75rem]">
            <p className="m-0 text-[1.15rem] font-semibold leading-none">REBT anteriores</p>
            <TemaBoton tema={theme} onToggle={toggle} />
            <SidebarTrigger className="alternar-barra" />
          </div>
          <div className="mt-[0.5rem] flex items-baseline justify-between gap-[0.5rem]">
            <InicioBoton onInicio={() => onNavigate('')} />
            <button
              className="border-0 bg-transparent p-0 text-[0.9rem] text-neutro hover:underline"
              onClick={() => onNavigate('antiguos')}
            >
              La tabla
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto pt-[0.4rem] pb-[2rem]">
          <p className="rotulo mx-[1.1rem] mt-[0.9rem] mb-[0.4rem]">Normas</p>
          <ul className="m-0 list-none p-0">
            {NORMAS.map((n) => (
              <li key={n.id} className="border-b border-linea">
                <button
                  className={[
                    'fila-indice block w-full border-0 bg-transparent px-[1.3rem] py-[0.5rem] text-left leading-[1.3] hover:bg-plano',
                    n.id === id ? 'text-neutro' : '',
                    n.diario || n.pdf === null ? '' : 'text-tinta-2',
                  ].join(' ')}
                  aria-current={n.id === id ? 'page' : undefined}
                  onClick={() =>
                    n.pdf === null
                      ? onNavigate('rebt')
                      : onNavigate(`antiguos/${encodeURIComponent(n.id)}`)
                  }
                >
                  <span className="dato block text-[0.78rem] text-tinta-2">{n.referencia}</span>
                  <span className="block text-[0.95rem] leading-[1.25]">
                    {n.pdf === null ? 'Reglamento vigente' : n.anio}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="rotulo mx-[1.1rem] mt-[1.2rem] mb-[0.4rem]">Instrucciones del 73</p>
          <ul className="m-0 list-none p-0">
            {INSTRUCCIONES.map((i) => (
              <li key={i.id} className="border-b border-linea">
                <button
                  className={[
                    'fila-indice block w-full border-0 bg-transparent px-[1.3rem] py-[0.5rem] text-left leading-[1.3] hover:bg-plano',
                    i.id === id ? 'text-neutro' : '',
                  ].join(' ')}
                  aria-current={i.id === id ? 'page' : undefined}
                  onClick={() => onNavigate(`antiguos/${encodeURIComponent(i.id)}`)}
                >
                  <span className="dato block text-[0.78rem] text-tinta-2">{i.fecha}</span>
                  <span className="block text-[0.95rem] leading-[1.25]">
                    {i.base ? 'MI BT · el conjunto' : i.referencia}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SidebarContent>
      </SidebarUI>

      <SidebarInset className="h-[100svh] overflow-hidden">
        <BotonBarra />

        {!actual && (
          <div className="pantalla error" role="alert">
            <h1>Ese documento no está en el archivo</h1>
            <p>El identificador «{id}» no corresponde a ninguna de las normas del archivo.</p>
            <button onClick={() => onNavigate('antiguos')}>Ver la tabla</button>
          </div>
        )}

        {actual && actual.diario && (
          <LectorDiario
            id={actual.id}
            referencia={actual.referencia}
            titulo={actual.titulo}
            fecha={actual.fecha}
            url={actual.url}
          />
        )}

        {actual && !actual.diario && (
          <div className="lamina px-[1.5rem] pt-[2.5rem] pb-[4rem]">
            <h1 className="mt-0 mb-[0.4rem] text-[1.9rem] font-semibold leading-[1.05] tracking-[-0.01em]">
              {actual.referencia}
            </h1>
            <p className="mt-0 mb-[1rem] max-w-[46rem] font-lectura text-[1.05rem] leading-[1.55] text-tinta-2">
              {actual.titulo}
            </p>
            <p className="mt-0 mb-[1.2rem] max-w-[46rem] text-[0.95rem] text-tinta-2">
              El BOE no digitalizó este documento como texto: existe solo como escaneo de la
              Gaceta. Se abre en otra pestaña.
            </p>
            <a className="enlace-externo text-[0.95rem]" href={actual.url} target="_blank" rel="noreferrer">
              Abrir el documento en el BOE
              <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </div>
        )}
      </SidebarInset>
    </>
  )
}
