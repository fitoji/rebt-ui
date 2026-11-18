import { defineConfig, lazyPlugins } from 'vite-plus'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { guiaCorpus } from './vite/guia-corpus.ts'

// El navegador no puede llamar a boe.es directamente (la API no envía cabeceras CORS),
// así que en desarrollo y en `vite preview` todo pasa por /boe-api.
// BOE_TARGET y BOE_PREFIX permiten apuntar al servidor simulado (npm run dev:mock).
const target = process.env.BOE_TARGET || 'https://www.boe.es'
const prefix = process.env.BOE_PREFIX ?? '/datosabiertos/api'
// El diario del BOE (`/diario_boe/txt.php`) es otra ruta: sirve el texto de las normas que
// la colección consolidada no tiene. Va por su propio prefijo.
const docPrefix = process.env.BOE_DOC_PREFIX ?? '/diario_boe'

const proxy = {
  '/boe-api': {
    target,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/boe-api/, prefix),
  },
  '/boe-doc': {
    target,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/boe-doc/, docPrefix),
  },
}

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    singleQuote: true,
    semi: false,
    overrides: [
      {
        files: ['**/*.css'],
        options: { singleQuote: false },
      },
    ],
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    // El type-aware de Oxlint no resuelve los globals ambientales de Cloudflare Workers
    // (`@cloudflare/workers-types`); el typecheck real del worker corre con `tsc -p tsconfig.worker.json`.
    ignorePatterns: ['worker/**'],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
  },
  plugins: lazyPlugins(() => [react(), tailwindcss(), guiaCorpus()]),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { proxy },
  preview: { proxy },
})
