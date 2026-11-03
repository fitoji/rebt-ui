import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { loadIndice } from './guia/api.ts'
import type { IndiceGuia } from './tipos.ts'
import { useTheme } from './useTheme.ts'
import TemaBoton from './TemaBoton.tsx'

const FUENTE =
  'Ministerio de Industria y Turismo · Reglamento Electrotécnico para Baja Tensión (RD 842/2002)'

/** Las tres puertas de entrada, en el orden en que se leen. */
const ACCESOS = [
  {
    href: '#/rebt',
    titulo: 'Leer el REBT',
    descripcion: 'El reglamento del BOE, con tablas, buscador y selector de redacciones.',
  },
  {
    href: '#/antiguos',
    titulo: 'REBT anteriores',
    descripcion: 'Las normas que rigieron antes del 2002, con su texto en el BOE.',
  },
  {
    href: '#/guia',
    titulo: 'Guía técnica',
    descripcion: 'Las guías del ministerio en texto buscable, con acceso directo por instrucción.',
  },
  {
    href: '#/cuestionarios',
    titulo: 'Cuestionarios Tests',
    descripcion: 'Practica con cuestionarios del REBT incluidos en la aplicación.',
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
          Reglamento electrotécnico para baja tensión, para leer y consultar.
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

      <footer className="relative z-10 border-t border-linea py-[1.1rem] px-[1.5rem] text-center text-[0.85rem] text-tinta-2">
        {FUENTE}
        <span aria-hidden="true"> · </span>
        <a href="#/antiguos" className="text-neutro transition-colors duration-150 ease-plano hover:underline">
          REBT anteriores
        </a>
      </footer>
    </div>
  )
}
