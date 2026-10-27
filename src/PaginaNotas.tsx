// La página de notas: todas las guardadas, de las dos vistas, para poder leerlas enteras
// y saltar a cada una.

import { useMemo, useRef, useState } from 'react'
import InicioBoton from './InicioBoton.tsx'
import { COLORES, crearArchivoNotas, normalizaTag, parseArchivoNotas } from './notas.ts'
import type { ColorNota, Nota } from './notas.ts'
import { AVISO_COPIAR, AVISO_ERROR, AVISO_MARKDOWN, AVISO_CSV, copiarAlPortapapeles, descargar } from './tablas.ts'
import { gridToCsv, gridToMarkdown, gridToTsv } from './parse.ts'
import { useTheme } from './useTheme.ts'

/** Detecta si el texto de una nota es una tabla en Markdown y la parsea. */
function parsearTablaMarkdown(texto: string): { header: string[]; rows: string[][] } | null {
  const lineas = texto.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  if (lineas.length < 2) return null
  if (!lineas[0].startsWith('|')) return null
  // La segunda línea es el separador (---).
  if (!/^\|[\s:|-]+\|$/.test(lineas[1])) return null
  const parsearFila = (l: string) =>
    l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  const header = parsearFila(lineas[0])
  const rows = lineas.slice(2).map(parsearFila)
  return { header, rows }
}
function cuando(creado: number): string {
  const dias = Math.floor((Date.now() - creado) / 86_400_000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  return new Date(creado).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Cómo se llaman los colores en el filtro, en plural. */
const ETIQUETAS: Record<ColorNota, string> = {
  amarillo: 'Amarillas',
  verde: 'Verdes',
  rojo: 'Rojas',
}

/** Lo que se está filtrando: nada, un color o una etiqueta. */
type Filtro = { tipo: 'todas' } | { tipo: 'color'; valor: ColorNota } | { tipo: 'tag'; valor: string }

export default function PaginaNotas({
  notas,
  onInicio,
  onIr,
  onQuitar,
  onColor,
  onEtiquetar,
  onDesetiquetar,
  onCombinar,
}: {
  notas: Nota[]
  onInicio: () => void
  /** Saltar al texto de la nota. */
  onIr: (nota: Nota) => void
  onQuitar: (nota: Nota) => void
  /** Cambiar el color del resaltado. */
  onColor: (nota: Nota, color: ColorNota) => void
  /** Poner una etiqueta. */
  onEtiquetar: (nota: Nota, tag: string) => void
  /** Quitar una etiqueta. */
  onDesetiquetar: (nota: Nota, tag: string) => void
  /** Combinar un archivo importado sin sobrescribir notas que ya existen. */
  onCombinar: (importadas: Nota[]) => { agregadas: number; duplicadas: number }
}) {
  // Esta vista no tiene botón de tema, pero el hook es el que escribe `data-theme` en
  // <html>: sin él, entrar directo a `#/notas` dejaba la página con el tema del sistema
  // en vez del que eligió el usuario.
  useTheme()

  // De más reciente a más antigua.
  const ordenadas = useMemo(
    () => [...notas].sort((a, b) => b.creado - a.creado),
    [notas],
  )

  const [filtro, setFiltro] = useState<Filtro>({ tipo: 'todas' })
  // La nota que se está etiquetando ahora mismo, y el texto del campo.
  const [editando, setEditando] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [avisoTabla, setAvisoTabla] = useState<{ id: string; msg: string } | null>(null)
  const [avisoArchivo, setAvisoArchivo] = useState('')
  const archivoRef = useRef<HTMLInputElement>(null)

  const importarArchivo = async (input: HTMLInputElement) => {
    const archivo = input.files?.[0]
    if (!archivo) return
    try {
      const importadas = parseArchivoNotas(await archivo.text())
      const resultado = onCombinar(importadas)
      setAvisoArchivo(`${resultado.agregadas} agregadas; ${resultado.duplicadas} ya existían.`)
    } catch (error) {
      setAvisoArchivo(error instanceof Error ? error.message : 'No se pudo leer el archivo de notas.')
    } finally {
      input.value = ''
    }
  }

  const conteos = useMemo(() => {
    const c: Record<ColorNota, number> = { amarillo: 0, verde: 0, rojo: 0 }
    for (const n of notas) c[n.color]++
    return c
  }, [notas])

  // Todas las etiquetas que hay, con cuántas notas tienen cada una.
  const etiquetas = useMemo(() => {
    const c = new Map<string, number>()
    for (const n of notas) for (const t of n.tags) c.set(t, (c.get(t) ?? 0) + 1)
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [notas])

  // Si se quita la última nota de una etiqueta, el filtro queda apuntando a una etiqueta
  // que ya no existe: se vuelve a "todas" en vez de dejar la lista vacía sin salida.
  const filtroVigente: Filtro =
    filtro.tipo === 'tag' && !etiquetas.some(([t]) => t === filtro.valor)
      ? { tipo: 'todas' }
      : filtro

  const visibles = useMemo(() => {
    if (filtroVigente.tipo === 'todas') return ordenadas
    if (filtroVigente.tipo === 'color') {
      return ordenadas.filter((n) => n.color === filtroVigente.valor)
    }
    return ordenadas.filter((n) => n.tags.includes(filtroVigente.valor))
  }, [ordenadas, filtroVigente])

  const alternarFiltro = (nuevo: Filtro) => {
    setFiltro((actual) =>
      actual.tipo === nuevo.tipo &&
      (actual.tipo === 'todas' ||
        (actual.tipo === 'color' && nuevo.tipo === 'color' && actual.valor === nuevo.valor) ||
        (actual.tipo === 'tag' && nuevo.tipo === 'tag' && actual.valor === nuevo.valor))
        ? { tipo: 'todas' }
        : nuevo,
    )
  }

  const guardarEtiqueta = (nota: Nota) => {
    const t = normalizaTag(texto)
    if (t) onEtiquetar(nota, t)
    setTexto('')
    setEditando(null)
  }

  return (
    <div className="mx-auto w-full max-w-[52rem] px-[1.5rem] pt-[2rem] pb-[4rem]">
      <header className="border-b border-linea pb-[1.2rem]">
        <div className="mr-auto flex items-baseline gap-[1rem]">
          <InicioBoton onInicio={onInicio} />
        </div>
        <h1 className="mt-[0.6rem] mb-[0.3rem] text-[2.2rem] font-semibold leading-none tracking-[0.02em]">Notas</h1>
        <p className="m-0 text-[0.95rem] text-tinta-2">
          {notas.length === 0
            ? 'Todavía no hay ninguna.'
            : `${notas.length} ${notas.length === 1 ? 'nota guardada' : 'notas guardadas'} en este navegador.`}
        </p>
        <div className="mt-[0.8rem] flex flex-wrap items-center gap-[0.5rem]">
          <button
            className="cursor-pointer rounded-[4px] border border-linea bg-hoja px-[0.7rem] py-[0.35rem] text-[0.9rem] text-tinta-2 hover:border-neutro hover:text-neutro disabled:cursor-not-allowed disabled:opacity-50"
            disabled={notas.length === 0}
            onClick={() => descargar('rebt-ui-notas.json', crearArchivoNotas(notas), 'application/json;charset=utf-8')}
          >
            Descargar notas
          </button>
          <button
            className="cursor-pointer rounded-[4px] border border-linea bg-hoja px-[0.7rem] py-[0.35rem] text-[0.9rem] text-tinta-2 hover:border-neutro hover:text-neutro"
            onClick={() => archivoRef.current?.click()}
          >
            Importar y combinar
          </button>
          <input
            ref={archivoRef}
            className="sr-only"
            type="file"
            accept=".json,application/json"
            aria-label="Seleccionar archivo de notas para combinar"
            onChange={(event) => void importarArchivo(event.currentTarget)}
          />
          <span role="status" className="text-[0.85rem] text-neutro">{avisoArchivo}</span>
        </div>
      </header>

      {notas.length === 0 ? (
        <p className="mx-[1.1rem] my-[1rem] text-tinta-2">
          Subrayá un trozo del texto de una guía o de un bloque del reglamento y guardalo como
          nota: aparecerá acá.
        </p>
      ) : (
        <>
          <div className="mt-[1.2rem] mb-0 flex flex-wrap gap-[0.4rem]" role="group" aria-label="Filtrar las notas por color">
            <button
              className={[
                'inline-flex cursor-pointer items-center gap-[0.35rem] rounded-[999px] border border-linea bg-hoja py-[0.25rem] px-[0.6rem] text-[0.85rem] text-tinta-2 hover:border-neutro hover:text-tinta',
                filtro.tipo === 'todas' ? 'border-neutro bg-plano text-tinta' : '',
              ].join(' ')}
              aria-pressed={filtro.tipo === 'todas'}
              onClick={() => alternarFiltro({ tipo: 'todas' })}
            >
              Todas ({notas.length})
            </button>
            {COLORES.map((color) => (
              <button
                key={color}
                className={[
                  'inline-flex cursor-pointer items-center gap-[0.35rem] rounded-[999px] border border-linea bg-hoja py-[0.25rem] px-[0.6rem] text-[0.85rem] text-tinta-2 hover:border-neutro hover:text-tinta',
                  filtro.tipo === 'color' && filtro.valor === color ? 'border-neutro bg-plano text-tinta' : '',
                ].join(' ')}
                aria-pressed={filtro.tipo === 'color' && filtro.valor === color}
                onClick={() => alternarFiltro({ tipo: 'color', valor: color })}
              >
                <span
                  className={`h-[0.7rem] w-[0.7rem] flex-none rounded-full border border-linea ${
                    color === 'verde' ? 'bg-nota-verde' : color === 'rojo' ? 'bg-nota-rojo' : 'bg-nota-amarillo'
                  }`}
                  aria-hidden="true"
                />
                {ETIQUETAS[color]} ({conteos[color]})
              </button>
            ))}
            {etiquetas.length > 0 && <span className="mx-[0.2rem] h-[1.2rem] w-px bg-linea" aria-hidden="true" />}
            {etiquetas.map(([tag, n]) => (
              <button
                key={tag}
                className={[
                  'inline-flex cursor-pointer items-center gap-[0.35rem] rounded-[999px] border border-linea bg-hoja py-[0.25rem] px-[0.6rem] text-[0.85rem] text-tinta-2 hover:border-neutro hover:text-tinta',
                  filtro.tipo === 'tag' && filtro.valor === tag ? 'border-neutro bg-plano text-tinta' : '',
                ].join(' ')}
                aria-pressed={filtro.tipo === 'tag' && filtro.valor === tag}
                onClick={() => alternarFiltro({ tipo: 'tag', valor: tag })}
                title={`Ver las notas con la etiqueta «${tag}»`}
              >
                #{tag} ({n})
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p className="mx-[1.1rem] my-[1rem] text-tinta-2">
              {filtro.tipo === 'todas'
                ? 'No hay notas.'
                : filtro.tipo === 'color'
                  ? `No hay notas ${ETIQUETAS[filtro.valor].toLowerCase()}.`
                  : `No hay notas con la etiqueta «${filtro.valor}».`}
            </p>
          ) : (
            <ul className="mt-[1.4rem] mb-0 list-none p-0">
              {visibles.map((nota) => (
                <li
                  key={nota.id}
                  className="mb-[1rem] rounded-[6px] border border-linea bg-hoja py-[0.9rem] px-[1rem]"
                >
                  {(() => {
                    const tabla = parsearTablaMarkdown(nota.texto)
                    if (!tabla) {
                      return (
                        <blockquote className="mt-0 mb-[0.5rem] font-serif text-[1.1rem] leading-[1.45]">
                          {nota.texto}
                        </blockquote>
                      )
                    }
                    return (
                      <div className="mt-0 mb-[0.5rem] overflow-x-auto rounded-[4px] border border-linea">
                        <div className="flex flex-wrap items-center gap-[0.3rem_0.4rem] border-b border-linea bg-plano px-[0.6rem] py-[0.3rem]">
                          <button
                            className="rounded-[4px] border border-linea bg-hoja px-[0.6rem] py-[0.2rem] text-[0.85rem] text-tinta-2 hover:border-neutro hover:text-neutro"
                            onClick={async () => {
                              const grid = [tabla.header, ...tabla.rows]
                              try {
                                await copiarAlPortapapeles(gridToTsv(grid))
                                setAvisoTabla({ id: nota.id, msg: AVISO_COPIAR })
                              } catch {
                                setAvisoTabla({ id: nota.id, msg: AVISO_ERROR })
                              }
                              window.setTimeout(() => setAvisoTabla(null), 1600)
                            }}
                          >
                            Copiar
                          </button>
                          <button
                            className="rounded-[4px] border border-linea bg-hoja px-[0.6rem] py-[0.2rem] text-[0.85rem] text-tinta-2 hover:border-neutro hover:text-neutro"
                            onClick={async () => {
                              const grid = [tabla.header, ...tabla.rows]
                              try {
                                await copiarAlPortapapeles(gridToMarkdown(grid))
                                setAvisoTabla({ id: nota.id, msg: AVISO_MARKDOWN })
                              } catch {
                                setAvisoTabla({ id: nota.id, msg: AVISO_ERROR })
                              }
                              window.setTimeout(() => setAvisoTabla(null), 1600)
                            }}
                          >
                            Markdown
                          </button>
                          <button
                            className="rounded-[4px] border border-linea bg-hoja px-[0.6rem] py-[0.2rem] text-[0.85rem] text-tinta-2 hover:border-neutro hover:text-neutro"
                            onClick={() => {
                              const grid = [tabla.header, ...tabla.rows]
                              descargar(`${nota.titulo || nota.origen}.csv`, gridToCsv(grid), 'text/csv')
                              setAvisoTabla({ id: nota.id, msg: AVISO_CSV })
                              window.setTimeout(() => setAvisoTabla(null), 1600)
                            }}
                          >
                            Descargar CSV
                          </button>
                          <span role="status" className="ml-[0.4rem] text-[0.85rem] text-neutro">
                            {avisoTabla?.id === nota.id ? avisoTabla.msg : ''}
                          </span>
                        </div>
                        <table className="w-full border-collapse text-[0.9rem]">
                          <thead>
                            <tr>
                              {tabla.header.map((c, i) => (
                                <th key={i} className="border-b border-linea bg-plano px-[0.6rem] py-[0.4rem] text-left font-semibold text-tinta">
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tabla.rows.map((fila, r) => (
                              <tr key={r}>
                                {fila.map((c, i) => (
                                  <td key={i} className="border-b border-linea px-[0.6rem] py-[0.4rem] text-tinta-2">
                                    {c}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })()}
                {(nota.antes || nota.despues) && (
                  <p className="mt-0 mb-[0.6rem] text-[0.85rem] leading-[1.5] text-tinta-2">
                    {nota.antes && <span className="nota-antes">…{nota.antes}</span>}
                    <mark className="nota bg-transparent font-semibold">{nota.texto}</mark>
                    {nota.despues && <span className="nota-despues">{nota.despues}…</span>}
                  </p>
                )}
                <div className="mt-0 mb-[0.6rem] flex flex-wrap items-center gap-[0.3rem]">
                    {nota.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-[0.15rem] rounded-[999px] border border-linea bg-plano py-[0.05rem] pr-[0.15rem] pl-[0.4rem] text-[0.8rem] text-tinta-2"
                      >
                        <button
                          className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit hover:text-fase hover:underline"
                          onClick={() => alternarFiltro({ tipo: 'tag', valor: tag })}
                          title="Ver las notas con esta etiqueta"
                        >
                          #{tag}
                        </button>
                        <button
                          className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit hover:text-fase hover:underline"
                          onClick={() => onDesetiquetar(nota, tag)}
                          aria-label={`Quitar la etiqueta «${tag}»`}
                          title="Quitar la etiqueta"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {editando === nota.id ? (
                      <span className="inline-flex items-center">
                        <input
                          className="w-[11rem] rounded-[999px] border border-neutro bg-hoja px-[0.45rem] py-[0.15rem] font-inherit text-[0.8rem] text-tinta"
                          autoFocus
                          value={texto}
                          list="notas-etiquetas"
                          placeholder="nombre de la etiqueta"
                          aria-label="Nombre de la etiqueta"
                          onChange={(e) => setTexto(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              guardarEtiqueta(nota)
                            }
                            if (e.key === 'Escape') {
                              setTexto('')
                              setEditando(null)
                            }
                          }}
                        />
                      </span>
                    ) : (
                      <button
                        className="cursor-pointer rounded-[999px] border border-dashed border-linea bg-transparent px-[0.5rem] py-[0.1rem] text-[0.8rem] text-tinta-2 hover:border-neutro hover:text-fase"
                        onClick={() => {
                          setTexto('')
                          setEditando(nota.id)
                        }}
                      >
                        + etiqueta
                      </button>
                    )}
                  </div>

                  <footer className="flex items-center gap-[0.6rem] border-t border-linea pt-[0.5rem]">
                    <button
                      className="min-w-0 flex-1 cursor-pointer overflow-hidden border-0 bg-transparent p-0 text-left text-[0.9rem] text-ellipsis whitespace-nowrap text-neutro hover:text-fase hover:underline"
                      onClick={() => onIr(nota)}
                      title="Ir al texto"
                    >
                      {nota.titulo || nota.origen} ↗
                    </button>
                    <span className="flex flex-none gap-[0.2rem]" role="group" aria-label="Color de la nota">
                      {COLORES.map((color) => (
                        <button
                          key={color}
                          className={`h-[0.85rem] w-[0.85rem] flex-none cursor-pointer rounded-full border border-linea p-0 aria-pressed:outline-2 aria-pressed:outline-tinta aria-pressed:outline-offset-1 ${
                            color === 'verde' ? 'bg-nota-verde' : color === 'rojo' ? 'bg-nota-rojo' : 'bg-nota-amarillo'
                          }`}
                          aria-pressed={nota.color === color}
                          aria-label={`Poner la nota en ${color}`}
                          title={color}
                          onClick={() => onColor(nota, color)}
                        />
                      ))}
                    </span>
                    <span className="flex-none text-[0.8rem] text-tinta-2">{cuando(nota.creado)}</span>
                    <button
                      className="flex-none cursor-pointer rounded-[4px] border-0 bg-transparent px-[0.35rem] py-0 text-[1rem] leading-[1.2] text-tinta-2 hover:bg-plano hover:text-fase"
                      onClick={() => onQuitar(nota)}
                      aria-label={`Quitar la nota «${nota.texto}»`}
                      title="Quitar la nota"
                    >
                      ×
                    </button>
                  </footer>
                </li>
              ))}
            </ul>
          )}

          {/* Las etiquetas que ya existen, para no escribir las mismas de dos maneras. */}
          <datalist id="notas-etiquetas">
            {etiquetas.map(([tag]) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </>
      )}
    </div>
  )
}
