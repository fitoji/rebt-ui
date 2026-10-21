// Servidor BOE simulado para desarrollar sin conexión: npm run mock  (y en otra terminal npm run dev:mock)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data')

http
  .createServer(async (req, res) => {
    const m = new URL(req.url ?? '/', 'http://x').pathname.match(/\/texto\/(indice|bloque\/([^/]+))$/)
    if (!m) return res.writeHead(404).end('not found')
    const id = m[2] ?? ''
    const file = m[1] === 'indice' ? 'indice.xml' : `bloque_${path.basename(decodeURIComponent(id))}.xml`
    try {
      const body = await readFile(path.join(dir, file))
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' }).end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  .listen(8787, () => console.log('BOE simulado en http://localhost:8787'))
