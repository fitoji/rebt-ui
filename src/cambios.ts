// Los cambios que recibió el REBT vigente desde 2002.
//
// La fuente es el propio BOE: `legislacion-consolidada/id/BOE-A-2002-18099/analisis`
// devuelve un bloque `<posteriores>` con cada norma que lo tocó, qué artículo o ITC
// modificó y el id de esa norma. De cada id se resolvió el título y la fecha contra
// `/metadatos` —o contra `/diario_boe/xml.php` cuando la norma no está consolidada, que es
// el caso de las resoluciones, las sentencias y lo más reciente—.
//
// `texto` y `titulo` son literales del BOE. `texto` dice qué se cambió, no lo que el
// cambio dice: para eso hay que abrir la norma. `PRODUCT.md` prohíbe resumir el texto
// normativo, y acá no hace falta: la relación ya viene redactada por el BOE.
//
// Ojo con esto: el texto consolidado del reglamento que sirve `/texto` es siempre el
// vigente. Esta tabla es lo que permite saber por qué el artículo que estás leyendo dice
// lo que dice.

export interface Cambio {
  id: string
  /** Cómo se cita la norma que hizo el cambio. */
  referencia: string
  /** Título completo del BOE, literal. */
  titulo: string
  /** Publicación en el BOE, dd-mm-aaaa. */
  fecha: string
  anio: number
  /** La relación que declara el BOE, sin interpretar. */
  relacion: 'SE MODIFICA' | 'SE ACTUALIZA' | 'SE DEROGA' | 'SE DECLARA'
  /** Literal del BOE: qué artículo, ITC o apéndice tocó. */
  texto: string
  url: string
}

/** Del más reciente al más viejo: así se lee un historial de cambios. */
export const CAMBIOS: Cambio[] = [
  {
    id: 'BOE-A-2025-17507',
    referencia: 'RD 770/2025',
    titulo:
      'Real Decreto 770/2025, de 2 de septiembre, por el que se modifican diversas normas reglamentarias en materia de seguridad industrial en lo relativo al régimen de contratación de los profesionales habilitados.',
    fecha: '03-09-2025',
    anio: 2025,
    relacion: 'SE MODIFICA',
    texto: 'el apéndice I.1 de la ITC-BT-03, por Real Decreto 770/2025, de 2 de septiembre',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-17507',
  },
  {
    id: 'BOE-A-2025-6773',
    referencia: 'Resolución 20-03-2025',
    titulo:
      'Resolución de 20 de marzo de 2025, de la Dirección General de Estrategia Industrial y de la Pequeña y Mediana Empresa, por la que se actualiza el listado de normas de la instrucción técnica complementaria ITC BT-02 del Reglamento electrotécnico para baja tensión, aprobado por el Real Decreto 842/2002, de 2 de agosto.',
    fecha: '03-04-2025',
    anio: 2025,
    relacion: 'SE ACTUALIZA',
    texto: 'la ITC-BT-02, por Resolución de 20 de marzo de 2025',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-6773',
  },
  {
    id: 'BOE-A-2023-7056',
    referencia: 'RD 145/2023',
    titulo:
      'Real Decreto 145/2023, de 28 de febrero, por el que se modifican diversas normas reglamentarias en materia de seguridad industrial para su adaptación al principio de reconocimiento mutuo.',
    fecha: '18-03-2023',
    anio: 2023,
    relacion: 'SE MODIFICA',
    texto:
      ', con efectos desde el 1 de julio de 2023, el art. 25, por Real Decreto 145/2023, de 28 de febrero',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-7056',
  },
  {
    id: 'BOE-A-2022-9848',
    referencia: 'RD 450/2022',
    titulo:
      'Real Decreto 450/2022, de 14 de junio, por el que se modifica el Código Técnico de la Edificación, aprobado por el Real Decreto 314/2006, de 17 de marzo.',
    fecha: '15-06-2022',
    anio: 2022,
    relacion: 'SE MODIFICA',
    texto:
      'la ITC BT-52, en la redacción dada por el Real Decreto 1053/2014, de 12 de diciembre, por Real Decreto 450/2022, de 14 de junio',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2022-9848',
  },
  {
    id: 'BOE-A-2021-6879',
    referencia: 'RD 298/2021',
    titulo:
      'Real Decreto 298/2021, de 27 de abril, por el que se modifican diversas normas reglamentarias en materia de seguridad industrial.',
    fecha: '28-04-2021',
    anio: 2021,
    relacion: 'SE MODIFICA',
    texto: 'el art. 2.2 y la ITC-BT-03, por Real Decreto 298/2021, de 27 de abril',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-6879',
  },
  {
    id: 'BOE-A-2020-6472',
    referencia: 'RD 542/2020',
    titulo:
      'Real Decreto 542/2020, de 26 de mayo, por el que se modifican y derogan diferentes disposiciones en materia de calidad y seguridad industrial.',
    fecha: '20-06-2020',
    anio: 2020,
    relacion: 'SE MODIFICA',
    texto:
      'el art. 14, la ITC-BT-04 y en la redacción dada por el Real Decreto 1053/2014, de 12 de diciembre, la ITC-BT-52, por Real Decreto 542/2020, de 26 de mayo',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-6472',
  },
  {
    id: 'BOE-A-2020-612',
    referencia: 'Resolución 09-01-2020',
    titulo:
      'Resolución de 9 de enero de 2020, de la Dirección General de Industria y de la Pequeña y Mediana Empresa, por la que se actualiza el listado de normas de la instrucción técnica complementaria ITC-BT-02 del Reglamento electrotécnico para baja tensión, aprobado por el Real Decreto 842/2002, de 2 de agosto.',
    fecha: '16-01-2020',
    anio: 2020,
    relacion: 'SE ACTUALIZA',
    texto: 'la ITC-BT-02, por Resolución de 9 de enero de 2020',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2020-612',
  },
  {
    id: 'BOE-A-2019-5089',
    referencia: 'RD 244/2019',
    titulo:
      'Real Decreto 244/2019, de 5 de abril, por el que se regulan las condiciones administrativas, técnicas y económicas del autoconsumo de energía eléctrica.',
    fecha: '06-04-2019',
    anio: 2019,
    relacion: 'SE DEROGA',
    texto:
      'y SE MODIFICA lo indicado de la ITC-BT-40 del Reglamento, por Real Decreto 244/2019, de 5 de abril',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2019-5089',
  },
  {
    id: 'BOE-A-2014-13681',
    referencia: 'RD 1053/2014',
    titulo:
      'Real Decreto 1053/2014, de 12 de diciembre, por el que se aprueba una nueva Instrucción Técnica Complementaria (ITC) BT 52 "Instalaciones con fines especiales. Infraestructura para la recarga de vehículos eléctricos", del Reglamento electrotécnico para baja tensión, aprobado por Real Decreto 842/2002, de 2 de agosto, y se modifican otras instrucciones técnicas complementarias del mismo.',
    fecha: '31-12-2014',
    anio: 2014,
    relacion: 'SE MODIFICA',
    texto:
      ', con efectos de 30 de junio de 2015, las ITC BT-02, BT-04, BT-05, BT-10, BT-16 y BT-25, y SE AÑADE la BT-52, por Real Decreto 1053/2014, de 12 de diciembre',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2014-13681',
  },
  {
    id: 'BOE-A-2010-8190',
    referencia: 'RD 560/2010',
    titulo:
      'Real Decreto 560/2010, de 7 de mayo, por el que se modifican diversas normas reglamentarias en materia de seguridad industrial para adecuarlas a la Ley 17/2009, de 23 de noviembre, sobre el libre acceso a las actividades de servicios y su ejercicio, y a la Ley 25/2009, de 22 de diciembre, de modificación de diversas leyes para su adaptación a la Ley sobre el libre acceso a las actividades de servicios y su ejercicio.',
    fecha: '22-05-2010',
    anio: 2010,
    relacion: 'SE MODIFICA',
    texto:
      'el art. 22, la ITC BT03, SE SUSTITUYE lo indicado y SE AÑADEN las disposiciones adicionales 1 a 4, por Real Decreto 560/2010, de 7 de mayo',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2010-8190',
  },
  {
    id: 'BOE-A-2004-6072',
    referencia: 'Sentencia TS 17-02-2004',
    titulo:
      'Sentencia de 17 de febrero de 2004, de la Sala Tercera del Tribunal Supremo, por la que se anula el inciso 4.2.c.2 de la ITC-BT-03 anexa al Reglamento Electrónico para baja tensión, aprobado por Real Decreto 842/2002, de 2 de agosto.',
    fecha: '05-04-2004',
    anio: 2004,
    relacion: 'SE DECLARA',
    texto:
      'la nulidad del inciso 4.2.c.2 de la ITC BT-03 anexa, por Sentencia del TS de 17 de febrero de 2004',
    url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2004-6072',
  },
]

/**
 * `fecha_actualizacion` de `/metadatos` del RD 842/2002, en dd-mm-aaaa. Dice cuándo tocó
 * el BOE el texto consolidado por última vez, que no es lo mismo que la fecha del último
 * cambio: se consulta a mano cuando se agrega un cambio a esta tabla.
 */
export const ACTUALIZADO = '18-12-2025'
