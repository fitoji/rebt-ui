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
export default function Landing({ onIr }: { onIr: (destino: string) => void }) {
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
        <p className="m-0 text-[0.95rem] tracking-[0.14em] text-tinta-2 uppercase">Reglamento Electrotécnico para Baja Tensión</p>
        <h1 className="mt-[0.4rem] mb-0 text-[clamp(4rem,13vw,9rem)] font-semibold leading-[0.92] tracking-[0.02em]">
          REBT
          <span className="mt-[0.7rem] block font-serif text-[clamp(1.05rem,2.4vw,1.5rem)] font-normal tracking-normal text-tinta-2">
            Baja tensión, leído y consultado
          </span>
        </h1>

        <div className="mt-[clamp(2rem,6vh,3.5rem)] grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-[1rem] text-left">
          <button
            className="flex flex-col gap-[0.6rem] rounded-[8px] border border-linea bg-hoja py-[1.4rem] pr-[1.5rem] pb-[1.2rem] pl-[1.5rem] text-left transition-[border-color,transform] duration-150 ease hover:-translate-y-[2px] hover:border-neutro"
            onClick={() => onIr('rebt')}
          >
            <span className="text-[1.65rem] font-semibold leading-[1.1]">Leer el REBT</span>
            <span className="flex-1 font-serif text-[1.02rem] leading-[1.5] text-tinta-2">
              El reglamento completo desde el BOE, con las tablas como tablas, buscador en el
              texto y selector de redacciones.
            </span>
            <span className="border-t border-linea pt-[0.6rem] text-[0.95rem] font-medium text-neutro">Texto del reglamento →</span>
          </button>

          <button
            className="flex flex-col gap-[0.6rem] rounded-[8px] border border-linea bg-hoja py-[1.4rem] pr-[1.5rem] pb-[1.2rem] pl-[1.5rem] text-left transition-[border-color,transform] duration-150 ease hover:-translate-y-[2px] hover:border-neutro"
            onClick={() => onIr('guia')}
          >
            <span className="text-[1.65rem] font-semibold leading-[1.1]">Guía técnica</span>
            <span className="flex-1 font-serif text-[1.02rem] leading-[1.5] text-tinta-2">
              Las guías de aplicación publicadas por el ministerio, convertidas a texto buscable
              para saltar directo a la instrucción que te interesa.
            </span>
            <span className="border-t border-linea pt-[0.6rem] text-[0.95rem] font-medium text-neutro">Guías de aplicación →</span>
          </button>
        </div>

        {totales && (
          <p className="mt-[2rem] mb-0 text-[0.95rem] text-tinta-2">
            {totales.total_documentos} documentos · {totales.total_paginas} páginas ·{' '}
            {totales.total_tablas} tablas
          </p>
        )}
      </main>

      <footer className="border-t border-linea py-[1.1rem] px-[1.5rem] text-center text-[0.85rem] text-tinta-2">{FUENTE}</footer>
    </div>
  )
}
