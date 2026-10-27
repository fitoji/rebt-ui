import { useEffect, useState } from 'react'
import { loadIndice } from './guia/api.ts'
import type { IndiceGuia } from './tipos.ts'

const FUENTE =
  'Ministerio de Industria y Turismo · Reglamento Electrotécnico para Baja Tensión (RD 842/2002)'

/**
 * Pantalla de entrada. Los dos destinos que pidió el proyecto: el lector del reglamento
 * (texto del BOE) y la Guía Técnica de aplicación (corpus de `guia_rebt/`).
 *
 * Las cifras del corpus son un extra: si `indice.json` no carga, la landing sigue sirviendo
 * los dos botones.
 */
export default function Landing() {
  const [totales, setTotales] = useState<IndiceGuia | null>(null)

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

  return (
    <div className="flex min-h-full w-full flex-col bg-plano bg-[radial-gradient(120%_90%_at_50%_-10%,var(--neutro-fondo)_0%,transparent_60%)]">
      <main className="w-[min(64rem,_100%_-_3rem)] flex-1 mx-auto py-[clamp(2.5rem,9vh,6rem)] pb-[3rem] text-center max-[700px]:w-[min(64rem,_100%_-_2rem)]">
        <h1 className="mt-0 mb-0 text-[clamp(4rem,13vw,9rem)] font-semibold leading-[0.92] tracking-[0.02em]">REBT</h1>
        <p className="mt-[0.7rem] mb-0 font-serif text-[clamp(1.05rem,2.4vw,1.5rem)] leading-[1.4] text-tinta-2">
          Reglamento electrotécnico para baja tensión, para leer y consultar.
        </p>

        <div className="mt-[clamp(2rem,6vh,3.5rem)] grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-[1rem] text-left">
          <a
            href="#/rebt"
            aria-labelledby="rebt-title"
            aria-describedby="rebt-description"
            className="flex flex-col gap-[0.6rem] rounded-[8px] border border-linea bg-hoja py-[1.4rem] pr-[1.5rem] pb-[1.2rem] pl-[1.5rem] text-left text-inherit no-underline transition-[border-color,transform] duration-150 ease motion-reduce:transition-none hover:-translate-y-[2px] hover:border-neutro"
          >
            <span id="rebt-title" className="text-[1.65rem] font-semibold leading-[1.1]">Leer el REBT</span>
            <span id="rebt-description" className="font-serif text-[1.02rem] leading-[1.5] text-tinta-2">
              El reglamento del BOE, con tablas, buscador y selector de redacciones.
            </span>
          </a>

          <a
            href="#/guia"
            aria-labelledby="guia-title"
            aria-describedby="guia-description"
            className="flex flex-col gap-[0.6rem] rounded-[8px] border border-linea bg-hoja py-[1.4rem] pr-[1.5rem] pb-[1.2rem] pl-[1.5rem] text-left text-inherit no-underline transition-[border-color,transform] duration-150 ease motion-reduce:transition-none hover:-translate-y-[2px] hover:border-neutro"
          >
            <span id="guia-title" className="text-[1.65rem] font-semibold leading-[1.1]">Guía técnica</span>
            <span id="guia-description" className="font-serif text-[1.02rem] leading-[1.5] text-tinta-2">
              Guías del ministerio en texto buscable, con acceso directo por instrucción.
            </span>
          </a>
        </div>

        {totales && (
          <p className="mt-[2rem] mb-0 text-[0.95rem] text-tinta-2">
            {totales.total_documentos} documentos, {totales.total_paginas} páginas y {totales.total_tablas} tablas
          </p>
        )}
      </main>

      <footer className="border-t border-linea py-[1.1rem] px-[1.5rem] text-center text-[0.85rem] text-tinta-2">{FUENTE}</footer>
    </div>
  )
}
