// Los cambios del REBT vigente, del más reciente al más viejo.
//
// La pregunta que contesta: «este artículo dice esto, ¿siempre dijo esto?». El lector
// muestra el texto consolidado —o sea, el de hoy— y no hay forma de saber desde ahí si el
// requisito cambió en 2015 o en 2025. Esta tabla es esa respuesta: la norma que lo cambió,
// la fecha y qué instrucción tocó.
//
// Los títulos y los textos son del BOE; las relaciones también. Nada está redactado acá.

import { ArrowUpRight } from 'lucide-react'
import InicioBoton from './InicioBoton.tsx'
import TemaBoton from './TemaBoton.tsx'
import { ACTUALIZADO, CAMBIOS } from './cambios.ts'
import { useTheme } from './useTheme.ts'

/** El sufijo del chip según la relación que declara el BOE. */
const CLASE: Record<string, string> = {
  'SE MODIFICA': 'modifica',
  'SE ACTUALIZA': 'actualiza',
  'SE DEROGA': 'deroga',
  'SE DECLARA': 'declara',
}

export default function Cambios({ onInicio }: { onInicio: () => void }) {
  const { theme, toggle } = useTheme()

  return (
    <div className="animate-vista-entra lamina px-[1.5rem] pt-[2rem] pb-[4rem]">
      <header className="mb-[1.6rem] flex items-baseline justify-between gap-[0.75rem] border-b border-linea pb-[0.6rem]">
        <InicioBoton onInicio={onInicio} />
        <TemaBoton tema={theme} onToggle={toggle} />
      </header>

      <h1 className="mt-0 mb-[0.4rem] text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.01em]">
        Cambios del REBT
      </h1>
      <p className="mt-0 mb-[1.6rem] max-w-[42rem] font-lectura text-[1.05rem] leading-[1.55] text-tinta-2">
        Lo que el reglamento vigente fue cambiando desde 2002: {CAMBIOS.length} normas que
        modificaron, actualizaron o anularon algún artículo o instrucción. El lector siempre
        muestra el texto de hoy; esto dice desde cuándo dice lo que dice.
      </p>

      <table className="tabla-archivo">
        <caption className="sr-only">
          Normas que modificaron el Reglamento electrotécnico para baja tensión desde su
          aprobación
        </caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Norma</th>
            <th scope="col">Cambio</th>
            <th scope="col">Boletín</th>
          </tr>
        </thead>
        <tbody>
          {CAMBIOS.map((cambio) => (
            <tr key={cambio.id}>
              <td className="dato whitespace-nowrap tabular-nums">{cambio.fecha}</td>
              <td>
                <span className="dato block whitespace-nowrap text-tinta">{cambio.referencia}</span>
                <span className="mt-[0.2rem] block text-[0.85rem] leading-[1.4] text-tinta-2">
                  {cambio.titulo}
                </span>
              </td>
              <td>
                <span className={`estado estado--${CLASE[cambio.relacion] ?? 'modifica'}`}>
                  {cambio.relacion}
                </span>
                <span className="mt-[0.3rem] block text-[0.9rem] text-tinta-2">
                  {cambio.texto.replace(/^[\s,]+/, '')}
                </span>
              </td>
              <td>
                <a
                  className="enlace-externo"
                  href={cambio.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${cambio.referencia} en el BOE (se abre en otra pestaña)`}
                >
                  Ver
                  <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                  <span className="sr-only">
                    {cambio.referencia} en el BOE, se abre en otra pestaña
                  </span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-[1.2rem] mb-0 max-w-[42rem] text-[0.85rem] text-tinta-2">
        Fuente: Boletín Oficial del Estado. Texto consolidado actualizado por última vez el{' '}
        {ACTUALIZADO}. Los títulos, las relaciones y los cambios son literales del BOE.
      </p>
    </div>
  )
}
