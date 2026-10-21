/**
 * Cloudflare Worker — sirve la app REBT + proxy /boe-api → boe.es
 */
import { CACHE_CONTROL, coincide, etagDe } from './cache.ts'

interface Env {
  /** Los estáticos que publica wrangler (`assets = { directory = "dist" }`). */
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let url: URL
    try {
      url = new URL(request.url)
    } catch {
      return new Response('Invalid URL', { status: 400 })
    }

    // Proxy /boe-api → boe.es
    if (url.pathname.startsWith('/boe-api')) {
      const apiPath = url.pathname.replace(/^\/boe-api/, '/datosabiertos/api')
      const apiUrl = `https://www.boe.es${apiPath}${url.search}`

      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': request.headers.get('Accept') || 'application/xml',
            'User-Agent': 'REBT-Viewer/1.0',
          },
        })

        const body = await response.arrayBuffer()
        const etag = await etagDe(body)

        // El cliente ya tiene este contenido: no hay que mandarle el cuerpo otra vez.
        if (coincide(request.headers.get('If-None-Match'), etag)) {
          return new Response(null, {
            status: 304,
            headers: {
              ETag: etag,
              'Cache-Control': CACHE_CONTROL,
              Vary: 'Accept',
              'Access-Control-Allow-Origin': '*',
            },
          })
        }

        const headers = new Headers()
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json')
        headers.set('Access-Control-Allow-Origin', '*')
        headers.set('Cache-Control', CACHE_CONTROL)
        // La respuesta del BOE varía según el `Accept`; sin esto la caché podría
        // servirle un XML a quien pidió JSON.
        headers.set('Vary', 'Accept')
        headers.set('ETag', etag)

        return new Response(body, { status: response.status, headers })
      } catch (err) {
        const detalle = err instanceof Error ? err.message : String(err)
        return new Response(JSON.stringify({ error: 'Proxy error', detail: detalle }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Servir archivos estáticos
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
