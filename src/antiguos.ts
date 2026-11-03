// Las normas que rigieron antes del REBT vigente. Los datos no se escriben acá a mano:
// salen del BOE y se verificaron contra su API.
//
//   metadatos y relaciones → /datosabiertos/api/boe/sumario/{AAAAMMDD}
//   título, páginas y PDF  → /diario_boe/xml.php?id={BOE-A-...}
//
// Las normas anteriores a 2002 no están en la colección consolidada —esa solo incluye lo
// que el BOE tiene digitalizado como texto— así que de ellas no hay XML que parsear: hay
// escaneo de la Gaceta. Por eso esta página enlaza al PDF oficial y no intenta leerlas
// con `parse.ts`. El `boeId` queda guardado para cuando exista ese lector.
//
// Los títulos son los del BOE, literales. No se resumen ni se corrigen: `PRODUCT.md` lo
// prohíbe, y en una norma derogada el texto exacto es la prueba de lo que decía.

export interface Norma {
  /** Identificador estable para la fila. */
  id: string
  /** Cómo se cita en obra: es la columna por la que se busca. */
  referencia: string
  anio: number
  titulo: string
  estado: 'vigente' | 'derogada'
  /** Publicación en el BOE, dd-mm-aaaa, y las páginas de la Gaceta. */
  boe: string
  paginas: string
  /** PDF oficial. `null` es el reglamento vigente: se lee dentro de la app. */
  pdf: string | null
  boeId: string
  /** La relación que declara el propio BOE, no una interpretación. */
  nota: string
}

/** La vigente arriba; debajo, el reglamento que reemplazó, sus instrucciones y la
 *  modificación que tuvo. Ese orden se lee mejor que el cronológico puro: primero lo que
 *  un técnico viene a buscar. */
export const NORMAS: Norma[] = [
  {
    id: 'rd-842-2002',
    referencia: 'RD 842/2002',
    anio: 2002,
    titulo:
      'Real Decreto 842/2002, de 2 de agosto, por el que se aprueba el Reglamento electrotécnico para baja tensión.',
    estado: 'vigente',
    boe: '18-09-2002',
    paginas: '—',
    pdf: null,
    boeId: 'BOE-A-2002-18099',
    nota: 'Vigente desde el 18 de septiembre de 2003.',
  },
  {
    id: 'rd-2413-1973',
    referencia: 'RD 2413/1973',
    anio: 1973,
    titulo:
      'Decreto 2413/1973, de 20 de septiembre, por el que se aprueba el Reglamento Electrotécnico para Baja Tensión.',
    estado: 'derogada',
    boe: '09-10-1973',
    paginas: '19482-19486',
    pdf: 'https://www.boe.es/boe/dias/1973/10/09/pdfs/A19482-19486.pdf',
    boeId: 'BOE-A-1973-1397',
    nota: 'Derogado por el RD 842/2002; estuvo vigente hasta el 18 de septiembre de 2003.',
  },
  {
    id: 'orden-31-10-1973',
    referencia: 'Orden 31-10-1973',
    anio: 1973,
    titulo:
      'Orden de 31 de octubre de 1973 por la que se aprueban las instrucciones complementarias denominadas Instrucciones MI BT, con arreglo a lo dispuesto en el Reglamento Electrotécnico para Baja Tensión.',
    estado: 'derogada',
    boe: '27-12-1973',
    paginas: '25065-25086',
    pdf: 'https://www.boe.es/boe/dias/1973/12/27/pdfs/A25065-25086.pdf',
    boeId: 'BOE-A-1973-1828',
    nota: 'Las instrucciones complementarias del reglamento de 1973.',
  },
  {
    id: 'rd-2295-1985',
    referencia: 'RD 2295/1985',
    anio: 1985,
    titulo:
      'Real Decreto 2295/1985, de 9 de octubre, por el que se adiciona un nuevo párrafo al artículo 2 del Reglamento Electrotécnico para Baja Tensión, aprobado por Decreto 2413/1973, de 20 de septiembre.',
    estado: 'derogada',
    boe: '12-12-1985',
    paginas: '39186',
    pdf: 'https://www.boe.es/boe/dias/1985/12/12/pdfs/A39186-39186.pdf',
    boeId: 'BOE-A-1985-25822',
    nota: 'Añadió un párrafo al artículo 2 del reglamento de 1973.',
  },
]
