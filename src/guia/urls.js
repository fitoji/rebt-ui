// El corpus está escrito con rutas relativas a `guia_rebt/` (`../imgs/…`, `../pdf/…`), pero en
// la web los documentos se sirven desde `/guia/`. Además `guia_rebt/pdf/` no se versiona (está en
// .gitignore y pesa 12 MB), así que los enlaces a página del PDF se apuntan a la URL oficial
// que publica Ministerio de Industria y Turismo, conservando el fragmento `#page=`.

const ABSOLUTE = /^https?:\/\//i

/**
 * Traduce un href del `.md` a algo que se pueda abrir en el navegador.
 * @param {string} href href tal cual aparece en el Markdown
 * @param {{fuentePdf?: string}} doc documento que contiene el enlace
 * @returns {string|null} href final, o null si no se puede enlazar
 */
export function resolveGuiaUrl(href, { fuentePdf } = {}) {
  if (!href) return null

  if (href.startsWith('../imgs/')) return '/guia/' + href.slice('../'.length)
  if (href.startsWith('../tablas/')) return null // el visor no publica los CSV

  if (href.startsWith('../pdf/')) {
    if (!fuentePdf) return null
    // El corpus ancla páginas del PDF: `../pdf/BT-19.pdf#page=7`.
    const at = href.indexOf('#')
    const fragment = at === -1 ? '' : href.slice(at)
    return fuentePdf + fragment
  }

  if (ABSOLUTE.test(href)) return href
  return null
}

/** Enlace de página del PDF oficial, sin ancla: es el botón "ver PDF original". */
export function officialPdfUrl(doc) {
  return doc?.fuente_pdf && ABSOLUTE.test(doc.fuente_pdf) ? doc.fuente_pdf : null
}
