import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { guiaCorpus } from './vite/guia-corpus.ts'

// El navegador no puede llamar a boe.es directamente (la API no envía cabeceras CORS),
// así que en desarrollo y en `vite preview` todo pasa por /boe-api.
// BOE_TARGET y BOE_PREFIX permiten apuntar al servidor simulado (npm run dev:mock).
const target = process.env.BOE_TARGET || 'https://www.boe.es'
const prefix = process.env.BOE_PREFIX ?? '/datosabiertos/api'

const proxy = {
  '/boe-api': {
    target,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/boe-api/, prefix),
  },
}

export default defineConfig({
  plugins: [react(), guiaCorpus()],
  server: { proxy },
  preview: { proxy },
})
