// Acciones de las tablas, compartidas por el lector del REBT (`render.jsx`) y por las
// tablas de la guía (`Guia.jsx`). Las dos vistas ofrecen lo mismo:
//
//   - copiar la rejilla como hoja de cálculo (TSV, para pegar en Excel/Sheets/LibreOffice),
//   - copiarla como Markdown,
//   - descargar el CSV.
//
// La conversión de rejilla a texto vive en `parse.js` (`gridToTsv`, `gridToMarkdown`,
// `gridToCsv`); aquí solo el pegado en el portapapeles y la descarga del archivo.

export const AVISO_COPIAR = 'Copiada para hoja de cálculo'
export const AVISO_MARKDOWN = 'Markdown copiado'
export const AVISO_CSV = 'CSV descargado'
export const AVISO_ERROR = 'No se pudo copiar'

/** Pega texto en el portapapeles. Lanza si el navegador lo denies. */
export async function copiarAlPortapapeles(texto) {
  await navigator.clipboard.writeText(texto)
}

/**
 * Descarga `texto` como archivo `nombre`.
 * El anchor se cuelga del `body` y se retira enseguida: si no, algunos navegadores
 * ignoran el clic y no descarga nada.
 */
export function descargar(nombre, texto, tipo) {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }))
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre })
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revocar la URL en el mismo tick puede cancelar la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
