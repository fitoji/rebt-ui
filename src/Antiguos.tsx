// El archivo de normas anteriores: qué regía antes del REBT de 2002, en una tabla.
//
// No es una lista de PDFs. La fila de arriba es el reglamento vigente —y lleva al lector
// de dentro de la app— y debajo está el que reemplazó. Eso es lo que ninguna copia suelta
// del BOE puede dar: la norma vieja y la nueva, una debajo de la otra, en el mismo sitio.
//
// Debajo de la tabla va aparte el juego de instrucciones complementarias del 73, que es un
// solo documento más las doce órdenes que lo modificaron: no son normas independientes y
// en la tabla de arriba se leerían como si lo fueran.
//
// Lo que esta página NO hace: leer el texto viejo. Las normas anteriores a 2002 no están
// consolidadas en el BOE, así que no hay XML que parsear; hay escaneo de la Gaceta. Se
// enlaza al PDF oficial y se dice que se abre aparte.

import { ArrowUpRight } from 'lucide-react'
import InicioBoton from './InicioBoton.tsx'
import TemaBoton from './TemaBoton.tsx'
import { INSTRUCCIONES, NORMAS } from './antiguos.ts'
import { useTheme } from './useTheme.ts'

export default function Antiguos({ onInicio }: { onInicio: () => void }) {
  const { theme, toggle } = useTheme()

  return (
    <div className="animate-vista-entra lamina px-[1.5rem] pt-[2rem] pb-[4rem]">
      <header className="mb-[1.6rem] flex items-baseline justify-between gap-[0.75rem] border-b border-linea pb-[0.6rem]">
        <InicioBoton onInicio={onInicio} />
        <TemaBoton tema={theme} onToggle={toggle} />
      </header>

      <h1 className="mt-0 mb-[0.4rem] text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.01em]">
        REBT anteriores
      </h1>
      <p className="mt-0 mb-[1.6rem] max-w-[42rem] font-lectura text-[1.05rem] leading-[1.55] text-tinta-2">
        Las normas que rigieron antes del reglamento vigente. Las que el BOE digitalizó se
        leen acá, con el texto tal como se publicó ese día; las de 1973 y 1974 existen solo
        como escaneo de la Gaceta, y para esas queda el PDF oficial. El reglamento actual se
        lee en el lector.
      </p>

      <table className="tabla-archivo">
        <caption className="sr-only">
          Reglamentos electrotécnicos para baja tensión anteriores al vigente
        </caption>
        <thead>
          <tr>
            <th scope="col">Año</th>
            <th scope="col">Referencia</th>
            <th scope="col">Título</th>
            <th scope="col">Estado</th>
            <th scope="col">Texto</th>
          </tr>
        </thead>
        <tbody>
          {NORMAS.map((norma) => (
            <tr key={norma.id} data-estado={norma.estado}>
              <td className="dato tabular-nums">{norma.anio}</td>
              <td className="dato whitespace-nowrap">{norma.referencia}</td>
              <td>
                <span className="block text-tinta">{norma.titulo}</span>
                <span className="dato mt-[0.2rem] block text-[0.78rem] text-tinta-2">
                  BOE {norma.boe}
                  {norma.paginas !== '—' && ` · págs. ${norma.paginas}`}
                </span>
                <span className="mt-[0.15rem] block text-[0.85rem] text-tinta-2">{norma.nota}</span>
              </td>
              <td>
                <span className={`estado estado--${norma.estado}`}>
                  {norma.estado === 'vigente' ? 'Vigente' : 'Derogada'}
                </span>
              </td>
              <td>
                {norma.pdf === null ? (
                  <a className="enlace-externo" href="#/rebt">
                    Leer
                    <span className="sr-only"> el reglamento vigente</span>
                  </a>
                ) : norma.diario ? (
                  <a
                    className="enlace-externo"
                    href={`#/antiguos/${encodeURIComponent(norma.id)}`}
                    title={`Leer ${norma.referencia} en el lector`}
                  >
                    Leer
                    <span className="sr-only"> {norma.referencia}</span>
                  </a>
                ) : (
                  <a
                    className="enlace-externo"
                    href={norma.pdf}
                    target="_blank"
                    rel="noreferrer"
                    title={`${norma.referencia} en el BOE (se abre en otra pestaña)`}
                  >
                    PDF
                    <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                    <span className="sr-only"> de {norma.referencia}, en el BOE, se abre en otra pestaña</span>
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-[1.2rem] mb-0 max-w-[42rem] text-[0.85rem] text-tinta-2">
        Fuente: Boletín Oficial del Estado. Los títulos son literales; las fechas y las
        páginas salen del registro del BOE.
      </p>

      {/* Las instrucciones del reglamento de 1973. Van aparte de la tabla porque no son
          normas independientes: son un solo documento de 22 páginas más las órdenes que lo
          fueron tocando. */}
      <section className="mt-[2.4rem]">
        <h2 className="mt-0 mb-[0.4rem] text-[1.5rem] font-semibold leading-[1.15]">
          Las instrucciones complementarias (MI BT)
        </h2>
        <p className="mt-0 mb-[1.1rem] max-w-[42rem] font-lectura text-[1rem] leading-[1.55] text-tinta-2">
          El reglamento de 1973 no traía sus instrucciones repartidas: se aprobaron todas
          juntas en una sola orden, a diferencia de las ITC-BT del 2002, que viven cada una
          en su bloque. Después recibieron {INSTRUCCIONES.length - 1} modificaciones hasta
          1998 —la MI BT 026 sola recibió cuatro—, y una instalación de esa época se juzga
          con la redacción que estaba en vigor entonces.
        </p>

        <ol className="lista-instrucciones">
          {INSTRUCCIONES.map((instruccion) => (
            <li key={instruccion.id} data-base={instruccion.base ? '' : undefined}>
              <span className="dato text-[0.8rem] whitespace-nowrap text-tinta-2">
                {instruccion.fecha}
              </span>
              <span>
                <span className="dato block text-[0.82rem] text-tinta">{instruccion.referencia}</span>
                <span className="mt-[0.1rem] block text-[0.88rem] leading-[1.4] text-tinta-2">
                  {instruccion.titulo}
                </span>
              </span>
              {instruccion.diario ? (
                <a
                  className="enlace-externo text-[0.85rem]"
                  href={`#/antiguos/${encodeURIComponent(instruccion.id)}`}
                  title={`Leer ${instruccion.referencia} en el lector`}
                >
                  Leer
                  <span className="sr-only"> {instruccion.referencia}</span>
                </a>
              ) : (
                <a
                  className="enlace-externo text-[0.85rem]"
                  href={instruccion.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${instruccion.referencia} en el BOE (se abre en otra pestaña)`}
                >
                  {instruccion.base ? 'PDF' : 'Ver'}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                  <span className="sr-only">
                    {instruccion.referencia} en el BOE, se abre en otra pestaña
                  </span>
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
