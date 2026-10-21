// La política de caché del proxy hacia el BOE, y el ETag que la hace barata.
//
// El BOE no manda ETag, Last-Modified ni Cache-Control: su respuesta no se puede
// revalidar, así que el navegador solo tiene dos opciones, bajar el XML entero otra vez
// o servir una copia vieja a ciegas durante horas. El proxy calcula su propio ETag a
// partir del cuerpo, y con eso el navegador revalida con un 304 barato: un bloque son
// 28 KB y un 304 son unos 200 bytes.
//
// El REBT consolidado cambia unas pocas veces al año (77 de sus 98 bloques no se tocan
// desde 2002), así que la ventana larga no es un riesgo: es la realidad.

/**
 * Un día de "fresco" y hasta una semana de "stale".
 *
 * - Fresco (1 día): el navegador no pregunta nada, responde de su caché.
 * - Stale (hasta 1 semana): el navegador responde **al instante** con la copia vieja y
 *   revalida en segundo plano. Como el revalidar es un 304, no cuesta tráfico.
 * - Si la revalidación falla (sin red, BOE caído), la copia vieja sigue sirviéndose
 *   una semana en vez de dejar al usuario en blanco.
 */
export const CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800'

/** ETag por hash del cuerpo: `"<16 hex>"`. Estable para el mismo cuerpo. */
export async function etagDe(body: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', body)
  const hex = Array.from(new Uint8Array(digest).slice(0, 8), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
  return `"${hex}"`
}

/** ¿El ETag que manda el cliente sigue siendo el del cuerpo? */
export function coincide(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false
  return ifNoneMatch
    .split(',')
    .some((t) => {
      const valor = t.trim()
      return valor === etag || valor === `W/${etag}`
    })
}
