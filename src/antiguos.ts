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
    nota: 'Derogado por el RD 842/2002; estuvo vigente hasta el 18 de septiembre de 2003. Sus instrucciones complementarias van aparte, más abajo.',
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

/**
 * Las instrucciones técnicas del reglamento de 1973: las MI BT.
 *
 * Se aprobaron todas juntas en una sola orden —a diferencia del reglamento de 2002, cuyas
 * ITC-BT viven cada una en su bloque dentro del lector—, así que no hay un documento por
 * instrucción que enlazar: hay uno solo, de 22 páginas, y debajo la historia de cómo se
 * fueron tocando.
 *
 * Doce órdenes entre 1974 y 1998, casi todas sobre la MI BT 026 —que se adaptó al progreso
 * técnico cinco veces— y la 044. Un técnico que consulta una instalación de 1985 necesita
 * saber cuál de estas estaba en vigor, no solo el reglamento.
 *
 * Los títulos son literales del BOE, erratas incluidas: la orden de 1984 dice «Reglamento
 * Electrónico para Baja Tensión». Se copia como está.
 */
export interface Instruccion {
  id: string
  /** 'MI BT' para el juego completo; la fecha de la orden para las modificaciones. */
  referencia: string
  fecha: string
  anio: number
  titulo: string
  url: string
  /** La orden que aprobó el conjunto, no una modificación. */
  base?: boolean
}

/** El conjunto primero, y debajo las modificaciones en orden cronológico. */
export const INSTRUCCIONES: Instruccion[] = [
  {
    id: 'BOE-A-1973-1828',
    referencia: 'MI BT',
    fecha: '27-12-1973',
    anio: 1973,
    titulo:
      'Orden de 31 de octubre de 1973 por la que se aprueban las instrucciones complementarias denominadas Instrucciones MI BT, con arreglo a lo dispuesto en el Reglamento Electrotécnico para Baja Tensión.',
    url: 'https://www.boe.es/boe/dias/1973/12/27/pdfs/A25065-25086.pdf',
    base: true,
  },
  {
    id: 'BOE-A-1974-630',
    referencia: 'Orden 06-04-1974',
    fecha: '15-04-1974',
    anio: 1974,
    titulo:
      'Orden de 6 de abril de 1974 por la que se dictan normas sobre las instrucciones complementarias del Reglamento Electrotécnico de Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1974-630',
  },
  {
    id: 'BOE-A-1978-908',
    referencia: 'Orden 19-12-1977',
    fecha: '13-01-1978',
    anio: 1977,
    titulo:
      'Orden de 19 de diciembre de 1977 por la que se modifica la Instrucción Complementaria MI.BT.025 del vigente Reglamento Electrotécnico para Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1978-908',
  },
  {
    id: 'BOE-A-1978-2423',
    referencia: 'Orden 19-12-1977',
    fecha: '26-01-1978',
    anio: 1977,
    titulo:
      'Orden de 19 de diciembre de 1977 sobre modificación parcial y ampliación de las instrucciones complementarias MI. BT. 004, 007 y 017, anexas al vigente Reglamento Electrotécnico para Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1978-2423',
  },
  {
    id: 'BOE-A-1980-17300',
    referencia: 'Orden 28-07-1980',
    fecha: '13-08-1980',
    anio: 1980,
    titulo:
      'Orden de 28 de julio de 1980 por la que se modifica la instrucción MI BT 040 en lo que se refiere a la concesión a Entidades del título de Instalador autorizado.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1980-17300',
  },
  {
    id: 'BOE-A-1980-22505',
    referencia: 'Orden 30-09-1980',
    fecha: '17-10-1980',
    anio: 1980,
    titulo:
      'Orden de 30 de septiembre de 1980 por la que se dispone que las Normas UNE que se citan sean consideradas como de obligado cumplimiento, incluyéndolas en la Instrucción MI BT 044 del Reglamento Electrotécnico para Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1980-22505',
  },
  {
    id: 'BOE-A-1982-14071',
    referencia: 'Orden 05-06-1982',
    fecha: '12-06-1982',
    anio: 1982,
    titulo:
      'Orden de 5 de junio de 1982 por la que se dispone la inclusión de las normas UNE que se relacionan en la instrucción MI-BT-044 del Reglamento Electrotécnico para Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1982-14071',
  },
  {
    id: 'BOE-A-1983-20494',
    referencia: 'Orden 11-07-1983',
    fecha: '22-07-1983',
    anio: 1983,
    titulo:
      'Orden de 11 de julio de 1983 por la que se modifican las instrucciones técnicas complementarias MI BT 008 y MI BT 044 del Reglamento Electrotécnico para Baja Tensión y se declaran de obligado cumplimiento diversas normas UNE relativas al empleo de material eléctrico en atmósferas potencialmente explosivas y al alumbrado de emergencia.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1983-20494',
  },
  {
    id: 'BOE-A-1984-12548',
    referencia: 'Orden 05-04-1984',
    fecha: '04-06-1984',
    anio: 1984,
    titulo:
      'Orden de 5 de abril de 1984 por la que se modifican las Instrucciones Técnicas Complementarias MI BT 025 y MI BT 044 del Reglamento Electrónico para Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1984-12548',
  },
  {
    id: 'BOE-A-1988-1577',
    referencia: 'Orden 13-01-1988',
    fecha: '26-01-1988',
    anio: 1988,
    titulo:
      'Orden de 13 de enero de 1988 por la que se modifica la Instrucción Complementaria MI BT 026 del Reglamento Electrotécnico para Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1988-1577',
  },
  {
    id: 'BOE-A-1992-18501',
    referencia: 'Orden 24-07-1992',
    fecha: '04-08-1992',
    anio: 1992,
    titulo:
      'Orden de 24 de julio de 1992 por la que se adapta al progreso técnico la instrucción complementaria del Reglamento Electrotécnico para Baja Tensión MIBTO26.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1992-18501',
  },
  {
    id: 'BOE-A-1995-18268',
    referencia: 'Orden 18-07-1995',
    fecha: '28-07-1995',
    anio: 1995,
    titulo:
      'Orden de 18 de julio de 1995 por la que se adapta al progreso técnico la instrucción técnica complementaria MIBT 026 del Reglamento Electrotécnico para Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1995-18268',
  },
  {
    id: 'BOE-A-1998-19107',
    referencia: 'Orden 29-07-1998',
    fecha: '07-08-1998',
    anio: 1998,
    titulo:
      'Orden de 29 de julio de 1998 por la que se adapta al progreso técnico la instrucción complementaria MIBT 026 del Reglamento Electrotécnico para Baja Tensión.',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-1998-19107',
  },
]
