/**
 * Cloudflare Worker — sirve la app REBT + proxy /boe-api → boe.es
 */
export default {
  async fetch(request, env) {
    let url
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

        const headers = new Headers()
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json')
        headers.set('Access-Control-Allow-Origin', '*')
        headers.set('Cache-Control', 'public, max-age=3600')

        return new Response(body, { status: response.status, headers })
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Proxy error', detail: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Servir archivos estáticos
    return env.ASSETS.fetch(request)
  },
}
