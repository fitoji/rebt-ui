// La barra lateral de los cuestionarios: la lista de todos los tests disponibles.
//
// Mismo esquema que la barra de la guía y la del lector: encabezado con el control
// de tema y el tirador, y debajo las filas para cambiar de test desde cualquier
// pantalla del cuestionario.

import InicioBoton from './InicioBoton.tsx'
import TemaBoton from './TemaBoton.tsx'
import { Trash2 } from 'lucide-react'
import type { Tema } from './useTheme.ts'
import type { Cuestionario } from './cuestionarios.ts'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar.tsx'

export default function SidebarCuestionarios({
  cuestionarios,
  cargados,
  activo,
  onSelect,
  onQuitar,
  onInicio,
  theme,
  onToggleTheme,
}: {
  /** Los que vienen con la app (data-json). */
  cuestionarios: Cuestionario[]
  /** Los que el usuario cargó con la zona de arrastre. */
  cargados: Cuestionario[]
  /** El test que se está rindiendo, si hay alguno. */
  activo?: string
  onSelect: (id: string) => void
  /** Quita un test cargado por el usuario (los de la app no se pueden quitar). */
  onQuitar: (id: string) => void
  onInicio: () => void
  theme: Tema
  onToggleTheme: () => void
}) {
  // conQuitar = es un test cargado: lleva la papelera al costado de la fila.
  const fila = (item: Cuestionario, conQuitar = false) => (
    <li key={item.id} className={conQuitar ? 'relative' : undefined}>
      <button
        className={[
          'relative flex w-full items-start gap-[0.5rem] border-0 bg-transparent py-[0.45rem] text-left leading-[1.3] hover:bg-plano',
          conQuitar ? 'pr-[2.2rem] pl-[1.3rem]' : 'pr-[1.1rem] pl-[1.3rem]',
          activo === item.id ? 'bg-plano font-medium' : '',
        ].join(' ')}
        aria-current={activo === item.id ? 'page' : undefined}
        onClick={() => onSelect(item.id)}
      >
        <span className="min-w-0">
          {item.nombre}
          <span className="mt-[0.15rem] block text-[0.88rem] tabular-nums text-tinta-2">
            {item.preguntas.length} preguntas
          </span>
        </span>
      </button>
      {conQuitar && (
        /* Hermano de la fila, nunca anidado dentro: un button dentro de otro
           button es HTML inválido. Mismo patrón que la estrella de favoritos. */
        <button
          type="button"
          aria-label={`Quitar ${item.nombre}`}
          title={`Quitar ${item.nombre}`}
          onClick={() => onQuitar(item.id)}
          className="absolute top-[0.35rem] right-[0.4rem] cursor-pointer rounded-[4px] border-0 bg-transparent px-[0.2rem] py-0 text-[0.95rem] leading-[1.4] opacity-40 transition-[opacity,color] duration-150 ease hover:text-[var(--nota-rojo)] hover:opacity-100 focus-visible:outline-2 focus-visible:outline-fase focus-visible:outline-offset-1"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      )}
    </li>
  )

  const total = cuestionarios.length + cargados.length

  return (
    <SidebarUI collapsible="offcanvas" className="min-h-0 border-r border-linea" aria-label="Cuestionarios disponibles">
      <SidebarHeader className="border-b border-linea px-[1.1rem] pt-[1.1rem] pb-[0.9rem]">
        <div className="flex items-baseline justify-between gap-[0.75rem]">
          <p className="m-0 text-[1.9rem] font-semibold leading-none tracking-[0.02em]">Tests</p>
          <InicioBoton onInicio={onInicio} />
          <TemaBoton tema={theme} onToggle={onToggleTheme} />
          <SidebarTrigger className="alternar-barra" />
        </div>
        <p className="mt-[0.25rem] mb-0 text-[0.95rem] text-tinta-2">
          {total} cuestionarios disponibles
        </p>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto pt-[0.4rem] pb-[2rem]">
        <nav>
          {cargados.length > 0 && (
            <h2 className="mx-[1.1rem] mt-[1.1rem] mb-[0.3rem] text-[0.95rem] font-semibold text-fase">
              De la app
            </h2>
          )}
          <ul className="m-0 list-none p-0">
            {cuestionarios.map((item) => fila(item))}
          </ul>

          {cargados.length > 0 && (
            <>
              <hr className="mx-[1.1rem] mt-[1.2rem] mb-0 border-t border-linea" />
              <h2 className="mx-[1.1rem] mt-[0.9rem] mb-[0.3rem] text-[0.95rem] font-semibold text-fase">
                Cargados ({cargados.length})
              </h2>
              <ul className="m-0 list-none p-0">
                {cargados.map((item) => fila(item, true))}
              </ul>
            </>
          )}

          {total === 0 && (
            <p className="mx-[1.1rem] my-[1rem] text-tinta-2">
              No hay cuestionarios válidos en la carpeta data-json.
            </p>
          )}
        </nav>
      </SidebarContent>
    </SidebarUI>
  )
}
