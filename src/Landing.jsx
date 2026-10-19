import { useEffect, useState } from 'react'
import { loadIndice } from './guia/api.js'

const FUENTE =
  'Ministerio de Industria y Turismo · Reglamento Electrotécnico para Baja Tensión (RD 842/2002)'

/**
 * Pantalla de entrada. Los dos destinos que pidió el proyecto: el lector del reglamento
 * (texto del BOE) y la Guía Técnica de aplicación (corpus de `guia_rebt/`).
 *
 * Las cifras del corpus son un extra: si `indice.json` no carga, la landing sigue sirviendo
 * los dos botones.
 */
export default function Landing({ onIr }) {
  const [totales, setTotales] = useState(null)

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
    <div className="landing">
      <main className="landing-cuerpo">
        <p className="landing-antetitulo">Reglamento Electrotécnico para Baja Tensión</p>
        <h1 className="landing-titulo">
          REBT
          <span className="landing-sub">Baja tensión, leído y consultado</span>
        </h1>

        <div className="landing-acciones">
          <button className="landing-boton" onClick={() => onIr('rebt')}>
            <span className="landing-boton-titulo">Leer el REBT</span>
            <span className="landing-boton-texto">
              El reglamento completo desde el BOE, con las tablas como tablas, buscador en el
              texto y selector de redacciones.
            </span>
            <span className="landing-boton-pie">Texto del reglamento →</span>
          </button>

          <button className="landing-boton" onClick={() => onIr('guia')}>
            <span className="landing-boton-titulo">Guía técnica</span>
            <span className="landing-boton-texto">
              Las guías de aplicación publicadas por el ministerio, convertidas a texto buscable
              para saltar directo a la instrucción que te interesa.
            </span>
            <span className="landing-boton-pie">Guías de aplicación →</span>
          </button>
        </div>

        {totales && (
          <p className="landing-cifras">
            {totales.total_documentos} documentos · {totales.total_paginas} páginas ·{' '}
            {totales.total_tablas} tablas
          </p>
        )}
      </main>

      <footer className="landing-pie">{FUENTE}</footer>
    </div>
  )
}
