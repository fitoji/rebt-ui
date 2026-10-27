// Los avisos flotantes de /cuestionarios. El proyecto no tiene harness de DOM, así que
// lo que se puede fijar es lo que hace visible al aviso: los tokens de color de los tres
// bloques de tema, el contraste, un solo Toaster montado, y que la devolución salga por
// el aviso y no vuelva a quedar escrita en el cuerpo de la pregunta.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

const BLOQUES = [
  ['claro (:root)', ':root {'],
  ['oscuro manual', ':root[data-theme="dark"] {'],
  ['oscuro del sistema', '@media (prefers-color-scheme: dark)'],
] as const

/** El trozo de CSS desde una cabecera hasta su llave de cierre. */
function bloqueDelTema(css: string, cabecera: string): string {
  const desde = css.indexOf(cabecera)
  assert.notEqual(desde, -1, `no encuentro el bloque ${cabecera}`)
  const hasta = css.indexOf('}', desde)
  assert.notEqual(hasta, -1, `el bloque ${cabecera} no cierra`)
  return css.slice(desde, hasta)
}

function valor(bloque: string, token: string): string {
  const encontrado = bloque.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))
  assert.ok(encontrado, `falta ${token} en el bloque`)
  return encontrado[1] as string
}

function luminancia(hex: string): number {
  const canales = [0, 2, 4].map((indice) => parseInt(hex.slice(1 + indice, 3 + indice), 16) / 255)
  const lineal = canales.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * (lineal[0] as number) + 0.7152 * (lineal[1] as number) + 0.0722 * (lineal[2] as number)
}

function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number]
  return (claro + 0.05) / (oscuro + 0.05)
}

test('los filos de los avisos están en los tres bloques de tema', () => {
  const css = leer('../src/styles.css')
  for (const [, cabecera] of BLOQUES) {
    const bloque = bloqueDelTema(css, cabecera)
    for (const token of ['--aviso-exito', '--aviso-error']) valor(bloque, token)
  }
})

test('texto y filos de los avisos pasan el contraste mínimo en cada tema', () => {
  const css = leer('../src/styles.css')
  for (const [nombre, cabecera] of BLOQUES) {
    const bloque = bloqueDelTema(css, cabecera)
    const hoja = valor(bloque, '--hoja')
    const tinta = valor(bloque, '--tinta')
    const texto = contraste(tinta, hoja)
    assert.ok(texto >= 4.5, `${nombre}: texto tinta/hoja ${texto.toFixed(2)}:1`)
    // El filo es un indicador no textual: alcanza con 3:1.
    for (const filo of ['--aviso-exito', '--aviso-error']) {
      const ratio = contraste(valor(bloque, filo), hoja)
      assert.ok(ratio >= 3, `${nombre}: ${filo}/hoja ${ratio.toFixed(2)}:1`)
    }
  }
})

test('el Toaster se monta una sola vez dentro del provider de la barra', () => {
  const router = leer('../src/Router.tsx')
  assert.equal((router.match(/<Toaster\s*\/>/g) ?? []).length, 1)
  const montaje = router.indexOf('<Toaster')
  assert.ok(montaje > router.indexOf('<SidebarProvider>'))
  assert.ok(montaje < router.indexOf('</SidebarProvider>'))
})

test('la devolución de la pregunta sale por aviso y no queda escrita en el cuerpo', () => {
  const fuente = leer('../src/Cuestionarios.tsx')
  assert.ok(fuente.includes("toast.success('¡Correcto!')"))
  assert.ok(fuente.includes("toast.error('No es correcto. La respuesta correcta está marcada.')"))
  assert.equal(fuente.includes("{respuesta === pregunta.ans ? '¡Correcto!'"), false)
})
