/**
 * Cloudflare Pages Function — proxy /boe-api → boe.es
 * Simula el proxy de vite.config.js en producción.
 */
export async function onRequest({ request }) {
  const url = new URL(request.url)

  if (url.pathname.startsWith('/boe-api')) {
    const apiPath = url.pathname.replace(/^\/boe-api/, '/datosabiertos/api')
    const apiUrl = `https://www.boe.es${apiPath}${url.search}`

    try {
      const response = await fetch(apiUrl, {
        headers: {
          ...Object.fromEntries(request.headers),
          'Accept': request.headers.get('Accept') || 'application/json',
        },
      })

      const body = await response.arrayBuffer()

      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy error', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // Recurso estático normal
  return fetch(request)
}
