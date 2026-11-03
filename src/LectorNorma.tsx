// El lector de las normas que modificaron el REBT.
//
// Mismo formato que el lector del reglamento —bloque a bloque, con la barra lateral y el
// progreso—, pero la barra lateral no muestra el índice de la norma: muestra las otras
// normas. Estás leyendo el RD 244/2019 y al lado tenés el 298/2021 para comparar.
//
// Cinco de las once no están consolidadas en el BOE: no hay XML con bloques ni versiones.
// Pero sí está su texto en el diario del día en que se publicaron, así que se parsea ese
// HTML (`diario.ts`) y se dibuja con el mismo componente de párrafos. Se leen igual; lo
// que no hay es índice ni navegación por bloques, porque son un documento y no una norma
// consolidada. El enlace al texto original queda siempre a la vista.

import { useCallback, useEffect, useRef, useState } from 'react'
import { getIndex } from './api.ts'
import BotonBarra from './BotonBarra.tsx'
import InicioBoton from './InicioBoton.tsx'
import LectorDiario from './LectorDiario.tsx'
import Reader from './Reader.tsx'
import TemaBoton from './TemaBoton.tsx'
import { CAMBIOS } from './cambios.ts'
import type { ControlNotas } from './notas.ts'
import type { Bloque } from './tipos.ts'
import { useTheme } from './useTheme.ts'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar.tsx'

type EstadoIndice =
  | { status: 'loading' }
  | { status: 'ok'; blocks: Bloque[] }
  | { status: 'error'; error: Error }


export default function LectorNorma({
  norma,
  bloque,
  onNavigate,
  notas,
}: {
  /** El id BOE de la norma, tal como aparece en `#/cambios/<norma>`. */
  norma: string
  /** El bloque pedido por la ruta, si hay uno. */
  bloque: string | null
  onNavigate: (destino: string) => void
  notas: ControlNotas
}) {
  const actual = CAMBIOS.find((c) => c.id === norma)
  const [index, setIndex] = useState<EstadoIndice>({ status: 'loading' })
  const { theme, toggle } = useTheme()
  const articulo = useRef<HTMLElement>(null)

  const cargar = useCallback(() => {
    if (!actual?.consolidada) return
    setIndex({ status: 'loading' })
    getIndex(norma).then(
      (blocks) => setIndex({ status: 'ok', blocks }),
      (error: Error) => setIndex({ status: 'error', error }),
    )
  }, [norma, actual?.consolidada])

  useEffect(cargar, [cargar])


  const blocks = index.status === 'ok' ? index.blocks : []
  const active = blocks.find((b) => b.id === bloque) ?? blocks[0]
  const at = active ? blocks.indexOf(active) : -1

  const select = useCallback(
    (id: string) => onNavigate(`cambios/${encodeURIComponent(norma)}/${encodeURIComponent(id)}`),
    [onNavigate, norma],
  )

  return (
    <>
      <SidebarUI collapsible="offcanvas" className="min-h-0 border-r border-linea" aria-label="Normas que modificaron el reglamento">
        <SidebarHeader className="border-b border-linea px-[1.1rem] pt-[1.1rem] pb-[0.9rem]">
          <div className="flex items-baseline justify-between gap-[0.75rem]">
            <p className="m-0 text-[1.15rem] font-semibold leading-none">Cambios del REBT</p>
            <TemaBoton tema={theme} onToggle={toggle} />
            <SidebarTrigger className="alternar-barra" />
          </div>
          <div className="mt-[0.5rem] flex items-baseline justify-between gap-[0.5rem]">
            <InicioBoton onInicio={() => onNavigate('')} />
            <button
              className="border-0 bg-transparent p-0 text-[0.9rem] text-neutro hover:underline"
              onClick={() => onNavigate('cambios')}
            >
              La lista
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto pt-[0.4rem] pb-[2rem]">
          <ul className="m-0 list-none p-0">
            {CAMBIOS.map((cambio) => {
              const abierta = cambio.id === norma
              const contenido = (
                <>
                  <span className="dato whitespace-nowrap text-[0.78rem] text-tinta-2">{cambio.fecha}</span>
                  <span className="block text-[0.95rem] leading-[1.25]">{cambio.referencia}</span>
                </>
              )
              return (
                <li key={cambio.id} className="border-b border-linea">
                  <button
                    className={[
                      'fila-indice block w-full border-0 bg-transparent px-[1.3rem] py-[0.5rem] text-left leading-[1.3] hover:bg-plano',
                      abierta ? 'text-neutro' : '',
                    ].join(' ')}
                    aria-current={abierta ? 'page' : undefined}
                    onClick={() => onNavigate(`cambios/${encodeURIComponent(cambio.id)}`)}
                  >
                    {contenido}
                  </button>
                </li>
              )
            })}
          </ul>
        </SidebarContent>
      </SidebarUI>

      <SidebarInset className="h-[100svh] overflow-hidden">
        <BotonBarra />
        {!actual && (
          <div className="pantalla error" role="alert">
            <h1>Esa norma no está en la lista</h1>
            <p>El identificador «{norma}» no corresponde a ninguna de las que modificaron el reglamento.</p>
            <button onClick={() => onNavigate('cambios')}>Ver todas</button>
          </div>
        )}

        {actual && !actual.consolidada && (
          <LectorDiario
            id={actual.id}
            referencia={actual.referencia}
            titulo={actual.titulo}
            fecha={actual.fecha}
            url={actual.url}
          />
        )}

        {actual?.consolidada && index.status === 'loading' && (
          <p className="pantalla" role="status">
            Cargando {actual.referencia}…
          </p>
        )}

        {actual?.consolidada && index.status === 'error' && (
          <div className="pantalla error" role="alert">
            <h1>No se pudo leer {actual.referencia}</h1>
            <p>{index.error.message}</p>
            <button onClick={cargar}>Reintentar</button>
          </div>
        )}

        {actual?.consolidada && index.status === 'ok' && active && (
          <Reader
            key={`${norma}/${active.id}`}
            entry={active}
            prev={blocks[at - 1]}
            next={blocks[at + 1]}
            onSelect={select}
            highlight=""
            notas={notas}
            articulo={articulo}
            normaId={norma}
            conNotas={false}
          />
        )}
      </SidebarInset>
    </>
  )
}
