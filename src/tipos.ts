// Los tipos del dominio, en un solo sitio. El resto de los módulos los importa de aquí en
// vez de redeclararlos: si la forma de un bloque o de un documento cambia, se ve en un
// único archivo y no en veinte.

// ------------------------------------------------------------------ reglamento (BOE)

/** Un bloque del reglamento consolidado: el preámbulo, un reglamento o una ITC-BT. */
export interface Bloque {
  id: string
  titulo: string
  fecha: string
}

/** Un bloque con su contenido ya parseado: las versiones que el BOE guarda para él. */
export interface BloqueConContenido {
  id: string
  titulo: string
  versions: Version[]
  /** El texto de la versión vigente, normalizado para buscar sin tildes ni mayúsculas. */
  folded: string
}

/** Una redacción del BOE. La vigente es la primera. */
export interface Version {
  vigencia: string
  publicacion: string
  items: Item[]
  /** Todo el texto de la versión, para buscar y para el índice de coincidencias. */
  text: string
}

export type ItemKind = 'table' | 'img' | 'art' | 'head' | 'note' | 'indent' | 'body'

/** Un bloque de contenido: un párrafo, una tabla o una figura. */
export interface Item {
  kind: ItemKind
  /** El nodo del DOM del que sale el texto. */
  node: Element
  text: string
  /** Solo en las tablas: la rejilla rectangular, lista para copiar o exportar. */
  grid?: Rejilla
}

/** Rejilla rectangular de una tabla: filas de celdas de texto. */
export type Rejilla = string[][]

/** Cómo se traduce el título de un bloque a su número de ITC y su nombre. */
export interface TituloPartido {
  itc: string | null
  nombre: string
}

/** Una fila del índice: el bloque y, si hay búsqueda, las coincidencias. */
export interface Fila {
  entry: Bloque
  count?: number
  snippet?: string
}

// ------------------------------------------------------------------ guía (corpus)

/** Un documento del índice de la guía (`guia_rebt/indice.json`). */
export interface DocumentoGuia {
  id: string
  titulo: string
  /** Ruta del `.md` dentro del corpus, relativa a `guia_rebt/`. */
  md?: string
  paginas?: number
  tablas?: number
  imgs?: string[]
  edicion?: string
  revision?: string
  sha256?: string
  /** URL del PDF oficial en el Ministerio. */
  fuente_pdf?: string
}

/** El índice completo de la guía. */
export interface IndiceGuia {
  fuente?: string
  convertido?: string
  documentos: DocumentoGuia[]
  total_documentos?: number
  total_paginas?: number
  total_tablas?: number
  total_imgs?: number
}

// ------------------------------------------------------------------ rutas y estado

/** La ruta de la app, tal como la devuelve `parseRoute`. */
export type Ruta =
  | { name: 'landing' }
  | { name: 'guia'; id: string | null }
  | { name: 'rebt'; id: string | null }
