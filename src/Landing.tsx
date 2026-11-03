import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { loadIndice } from './guia/api.ts'
import type { IndiceGuia } from './tipos.ts'
import { useTheme } from './useTheme.ts'
import TemaBoton from './TemaBoton.tsx'

const REPOSITORIO = 'https://github.com/fitoji/rebt-ui'

/** Los datos del pie: lo que un lector necesita para comprobar la fuente, llevarse el
 *  código o devolver una corrección. Cuatro campos cortos, como los de un cajetín. */
const DATOS = [
  { rotulo: 'Licencia', valor: 'MIT', href: `${REPOSITORIO}/blob/main/LICENSE` },
  { rotulo: 'Código', valor: 'GitHub', href: REPOSITORIO },
  { rotulo: 'Errores', valor: 'Informar', href: `${REPOSITORIO}/issues` },
  { rotulo: 'Fuente', valor: 'BOE', href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099' },
] as const

/** Las puertas de entrada, en el orden en que se leen: primero el reglamento —lo que dice
 *  hoy, lo que cambió y lo que reemplazó—, después las herramientas para estudiarlo. */
const ACCESOS = [
  {
    href: '#/rebt',
    titulo: 'Leer el REBT',
    descripcion: 'El reglamento vigente del BOE, con tablas reales, buscador y selector de redacción.',
  },
  {
    href: '#/cambios',
    titulo: 'Cambios del REBT',
    descripcion: 'Qué artículo o instrucción cambió cada norma desde 2002, y cuándo.',
  },
  {
    href: '#/antiguos',
    titulo: 'REBT anteriores',
    descripcion: 'El reglamento de 1973 y sus instrucciones, para consultar lo que regía antes del 2002.',
  },
  {
    href: '#/guia',
    titulo: 'Guía técnica',
    descripcion: 'Las 38 guías del ministerio en texto buscable, con acceso directo por instrucción.',
  },
  {
    href: '#/cuestionarios',
    titulo: 'Cuestionarios Tests',
    descripcion: 'Practica con los cuestionarios del REBT incluidos en la aplicación.',
  },
] as const

/**
 * La lámina de entrada: los dos lectores del corpus, los cuestionarios y el cajetín con
 * las cifras del material.
 *
 * El cajetín es lo último: si `indice.json` no carga, la lámina sigue sirviendo las tres
 * entradas y las cifras quedan en guion.
 */
export default function Landing() {
  const [totales, setTotales] = useState<IndiceGuia | null>(null)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    let vivo = true
    loadIndice().then(
      (indice) => vivo && setTotales(indice),
      () => {}, // sin cifras, pero la landing funciona igual
    )
    return () => {
      vivo = false
    }
  }, [])

  const cifra = (valor: number | undefined) => (valor === undefined ? '—' : String(valor))

  return (
    <div className="landing relative flex min-h-full w-full flex-col overflow-hidden">
      {/* El dibujo de la lámina: la topografía del corpus, al 14 % y sólo en la esquina
          superior derecha. Es una referencia, no un fondo. */}
      <div className="landing-topo" aria-hidden="true" />

      {/* El botón de tema cae justo sobre la mancha más oscura del fondo: le doy
          su propia superficie para que el icono no dependa del dibujo. */}
      <div className="absolute right-4 top-4 z-10 rounded-[6px] bg-plano/80 p-[3px] max-[700px]:right-3 max-[700px]:top-3">
        <TemaBoton tema={theme} onToggle={toggle} />
      </div>

      <main className="relative z-10 mx-auto flex w-[min(60rem,_100%_-_3rem)] flex-1 flex-col justify-center py-[clamp(2.25rem,7vh,5rem)] pb-[2.5rem] max-[700px]:w-[min(60rem,_100%_-_2rem)]">
        <h1 className="mt-0 mb-0 text-[clamp(3.6rem,11vw,7rem)] font-semibold leading-[0.9] tracking-[0.01em]">
          REBT
        </h1>
        <p className="mt-[0.9rem] mb-0 max-w-[46rem] font-lectura text-[clamp(1.05rem,2.2vw,1.4rem)] leading-[1.45] text-tinta-2">
          Reglamento electrotécnico para baja tensión: el texto vigente, los cambios que lo
          modificaron y las normas que reemplazó.
        </p>

        <nav className="relative mt-[clamp(1.6rem,5vh,3rem)]" aria-label="Secciones">
          {ACCESOS.map((acceso, i) => (
            <a
              key={acceso.href}
              href={acceso.href}
              className="acceso animate-vista-entra"
              style={{ animationDelay: `${60 + i * 55}ms` }}
            >
              <span className="acceso__cuerpo min-w-0">
                <span className="block text-[1.4rem] font-semibold leading-[1.15]">
                  {acceso.titulo}
                </span>
                <span className="mt-[0.15rem] block max-w-[46ch] font-lectura text-[1rem] leading-[1.45] text-tinta-2">
                  {acceso.descripcion}
                </span>
              </span>
              <ArrowRight aria-hidden="true" className="acceso__flecha size-5" strokeWidth={1.75} />
            </a>
          ))}
        </nav>

        {/* El cajetín: las cifras del corpus como los campos de una lámina técnica. */}
        <dl className="cajetin mt-[clamp(1.4rem,4vh,2.2rem)] animate-vista-entra" style={{ animationDelay: '240ms' }}>
          <div>
            <dt className="rotulo">Norma</dt>
            <dd className="dato m-0 text-[0.95rem] text-tinta">RD 842/2002</dd>
          </div>
          <div>
            <dt className="rotulo">Documentos</dt>
            <dd className="dato m-0 text-[0.95rem] text-tinta">{cifra(totales?.total_documentos)}</dd>
          </div>
          <div>
            <dt className="rotulo">Páginas</dt>
            <dd className="dato m-0 text-[0.95rem] text-tinta">{cifra(totales?.total_paginas)}</dd>
          </div>
          <div>
            <dt className="rotulo">Tablas</dt>
            <dd className="dato m-0 text-[0.95rem] text-tinta">{cifra(totales?.total_tablas)}</dd>
          </div>
        </dl>
      </main>

      <footer className="pie relative z-10">
        <div className="pie__placa">
          <div className="pie__firma">
            <img
              src="/logo.svg"
              alt=""
              width={34}
              height={34}
              className="size-[34px] shrink-0"
            />
            <div className="min-w-0">
              <p className="m-0 flex flex-wrap items-baseline gap-x-[0.5rem] gap-y-[0.15rem]">
                <span className="text-[1.05rem] font-semibold leading-none">REBT</span>
                <span className="rotulo">código abierto</span>
              </p>
              <p className="m-0 mt-[0.4rem] max-w-[58ch] text-[0.85rem] leading-[1.45] text-tinta-2">
                Lector del reglamento del BOE y de las guías técnicas del Ministerio. Código y
                correcciones, en abierto.
              </p>
            </div>
          </div>

          <dl className="pie__datos">
            {DATOS.map((dato) => (
              <div key={dato.rotulo} className="pie__celda">
                <dt className="rotulo">{dato.rotulo}</dt>
                <dd className="m-0">
                  <a
                    className="pie__enlace dato"
                    href={dato.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {dato.valor}
                    <ArrowUpRight aria-hidden="true" className="pie__flecha size-3.5" strokeWidth={1.75} />
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </dd>
              </div>
            ))}
          </dl>

          {/* La última fila del cajetín: la letra pequeña, dentro de la placa. */}
          <div className="pie__nota">
            <p className="m-0">© 2026 fitoji</p>
            <p className="m-0">Sin cuentas ni servidor: tus notas y favoritos viven en este navegador.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
