import fs from 'node:fs'
import path from 'node:path'

// `guia_rebt/` vive en la raíz del repo, fuera de `publicDir`, así que Vite no lo sirve.
// Este plugin lo publica en `/guia/*` durante `dev`, `preview` y lo copia a `dist/guia/`
// en `build`.
//
// Solo se expone lo que el visor necesita: el índice, los .md y las imágenes. `pdf/` queda
// fuera a propósito (son descargas de 12 MB y además están en .gitignore), igual que `tablas/`
// (el visor no enlaza los CSV: las tablas ya vienen dentro del Markdown).

const EXPOSED = ['indice.json', 'md', 'imgs']

const MIME = {
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

export const corpusRoot = () => path.resolve(process.cwd(), 'guia_rebt')

// El corpus no cambia de forma mientras el servidor está vivo, así que la raíz real se
// resuelve una vez y se reutiliza en cada petición.
let realRootCache = null
const realRoot = () => (realRootCache ??= fs.realpathSync(corpusRoot()))

/**
 * Traduce la URL de una petición a una ruta absoluta dentro del corpus.
 * Devuelve `null` si la ruta no es publicable, en particular si intenta salir del corpus
 * (`../`, rutas absolutas, bytes nulos, symlinks que salen). Es el único punto por el que
 * pasa todo acceso al disco, así que todas las comprobaciones están aquí.
 */
export function resolveCorpusPath(urlPath, root = corpusRoot()) {
  let decoded
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  } catch {
    return null // percent-encoding inválido
  }
  if (decoded.includes('\0')) return null

  const segments = decoded.replace(/\\/g, '/').replace(/^\/+/, '').split('/')
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return null
  if (!EXPOSED.includes(segments[0])) return null

  const abs = path.resolve(root, ...segments)
  if (abs !== root && !abs.startsWith(root + path.sep)) return null

  // Los segmentos ya están limpios, pero un symlink dentro del corpus podría apuntar
  // fuera. Resolvemos la ruta real y repetimos la comprobación de contención.
  // Si no existe, `realpathSync` lanza y devolvemos null: el middleware responde 404.
  let real
  try {
    real = fs.realpathSync(abs)
  } catch {
    return null
  }
  const root2 = realRoot()
  if (real !== root2 && !real.startsWith(root2 + path.sep)) return null

  return abs
}

function serveFile(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  const abs = resolveCorpusPath(req.url ?? '/')
  if (!abs) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  let stat
  try {
    stat = fs.statSync(abs)
  } catch {
    res.statusCode = 404
    res.end('Not found')
    return
  }
  if (!stat.isFile()) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  res.setHeader('Content-Type', MIME[path.extname(abs).toLowerCase()] ?? 'application/octet-stream')
  res.setHeader('Content-Length', stat.size)
  // El corpus se regenera con el conversor; en desarrollo no queremos cache stale.
  res.setHeader('Cache-Control', 'no-cache')
  if (req.method === 'HEAD') {
    res.statusCode = 200
    res.end()
    return
  }
  res.statusCode = 200
  fs.createReadStream(abs).pipe(res)
}

/** Copia lo expuesto a `dist/guia/` para que `vite preview` y el despliegue sirvan el corpus. */
function copyToDist(outDir) {
  const root = corpusRoot()
  if (!fs.existsSync(root)) return
  const dest = path.resolve(outDir, 'guia')
  for (const entry of EXPOSED) {
    const from = path.join(root, entry)
    if (!fs.existsSync(from)) continue
    const to = path.join(dest, entry)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.cpSync(from, to, { recursive: true, force: true })
  }
}

export function guiaCorpus() {
  let outDir = 'dist'
  return {
    name: 'guia-corpus',
    configResolved(config) {
      // outDir viene relativo al root del proyecto, no al cwd de quien lanza el build.
      outDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use('/guia', serveFile)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/guia', serveFile)
    },
    closeBundle() {
      copyToDist(outDir)
    },
  }
}
