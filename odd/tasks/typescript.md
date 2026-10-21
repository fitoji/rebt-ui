# TypeScript en todo el proyecto

Rama `main` (directo, como el resto del historial del repo). Entrega: unidades de trabajo
commiteadas por rebanada; el push lo decide el usuario. Runner de tests: `node --test` (nativo
de Node, sin dependencias de test); type gate: `tsc --noEmit`.

## Specs

- **S1** — *"bien, quiero que el proyecto tenga typescript para que sea mas seguro"* (pedido
  original, 21/10/2026).
- **S2** — Alcance decidido por el usuario (21/10/2026, pregunta de alcance): **"Todo el
  proyecto"** — la app (`src/`), los tests (`test/`), el plugin de Vite (`vite/`), el worker de
  Cloudflare (`worker/`) y el mock (`mock/`). El type gate cubre el 100% del código que se
  despliega, incluido el guard de path traversal de `guia_rebt/` y el proxy al BOE.
- **S3** — `strict: true` + `tsc --noEmit` como puerta de tipo, obligatorio en el build y en
  CI. `noUncheckedIndexedAccess` **NO** se activa: el código indexa arrays por todo y los `!`
  que obligaría a escribir taparían justo los errores que se quieren ver. Queda anotado como
  endurecimiento futuro, no como olvido.
- **S4** — Los tests siguen con el runner nativo de Node, **sin dependencias nuevas de test**.
  Node 24 hace *type stripping*, así que los tests pasan a `.ts` y se ejecutan tal cual. Por
  eso `erasableSyntaxOnly` y `verbatimModuleSyntax` son obligatorios: lo que no se puede
  borrar no se puede ejecutar.
- **S5** — El worker se compila desde TypeScript (`main = "worker/index.ts"`), con sus propios
  tipos (`@cloudflare/workers-types`) y un `tsconfig` aparte: los tipos del worker chocan con
  los del DOM y no pueden convivir en el mismo `tsconfig`.
- **S6** — **Cero cambios de comportamiento.** La conversión es de tipos, no de lógica. Cualquier
  diferencia observable es un bug de la conversión, no una mejora.

## Tasks

| # | Tarea | Specs | Ruta | Riesgo | Commit |
|---|-------|-------|------|--------|--------|
| T1 | Andamiaje: `tsconfig.json` + `tsconfig.worker.json`, tipos de CSS, deps, scripts (`typecheck`, `build`, `test`) | S3,S4,S5 | inline | item 5 | 1 |
| T2 | Lógica pura: `parse`, `guia/markdown`, `guia/urls`, `route`, `tablas`, `useTheme`, `api`, `guia/api` + sus tests | S1,S3,S4 | inline | — | 1 |
| T3 | Componentes React: `main`, `Router`, `App`, `Landing`, `Reader`, `Sidebar`, `Accordion`, `render`, `Guia`, `InicioBoton`, `TemaBoton` | S1,S3,S6 | inline | — | 1 |
| T4 | Tooling y deploy: `vite/guia-corpus`, `vite.config`, `worker`, `mock`, `wrangler.toml`, CI | S2,S5 | inline | item 5 | 1 |
| T5 | Verificación: typecheck limpio, tests verdes, build, equivalencia con el código anterior | S6 | inline | — | 1 |
| T6 | Documentación: README y este logbook | S1 | inline | — | 2 |

**Por qué un solo commit y no varios por tarea**: la conversión es un renombrado con anotaciones de tipos
acoplado a los imports. Un commit intermedio que dejara `.tsx` importando `.ts` sin convertir los `.jsx`
no compila, y uno que dejara los `.jsx` importando `.js` que ya no existen tampoco. Partirlo daría
commits que no arrancan, que es peor que un commit grande. Con `git diff -M` el renombrado se ve como
tal: 39 archivos, 911 líneas añadidas y 232 quitadas, casi todas anotaciones de tipo.

**Trazabilidad de ruta**: no hay trigger de delegación (ni paralelismo —las unidades comparten
los tipos del dominio— ni backstop de contexto). Todo inline, una rebanada por commit.

**Estrategia de entrega**: el pronóstico son ~2.300 líneas tocadas, por encima de la unidad de
revisión, así que va en commits chicos y revisables (uno por tarea). **Directo a `main`**, como
el resto del historial del repo; sin PR hasta que lo pida el usuario.

## Decisiones de tipos

- **Dominio**: los tipos del negocio (bloque, versión, ítem, rejilla, índice de la guía) viven
  en `src/tipos.ts`, en un solo lugar, y no se redeclaran por archivo.
- **Imports relativos con extensión explícita** (`./parse.ts`): es lo que permite que Node
  ejecute los tests en `.ts` sin bundler, y Vite resuelve igual.
- **`import type` explícito** para los tipos (`verbatimModuleSyntax`): sin esto, Node
  importaría en runtime un binding que no existe.
- **Un `tsconfig` para la app y otro para el worker**: los tipos de Cloudflare y los del DOM
  declaran los mismos globales (`Request`, `Response`, `fetch`) y chocan.

## Log

- **L1** (2026-10-21) — *"bien, quiero que el proyecto tenga typescript para que sea mas
  seguro"*.
- **L2** (2026-10-21) — Alcance: pregunta al usuario con tres opciones (todo el proyecto / solo
  la app / gradual con `allowJs`). Respuesta: **"Todo el proyecto (Recomendado)"**. El motivo
  está en S2: el plugin de Vite (guard de path traversal) y el worker (proxy al BOE) son
  justamente las dos piezas que el type gate tiene que cubrir.
- **L3** (2026-10-21) — **El bug que motivó la decisión, medido**: el `ReferenceError` de
  `theme`/`toggle` que tumbaba la página de guías (L14 de `landing-y-visor-guia.md`) es
  exactamente el error que `tsc` detecta en el build (`TS2304: Cannot find name 'theme'`).
  TypeScript no es aquí un capricho de estilo: es la puerta que falta.
- **L4** (2026-10-21) — **TypeScript 7.0.2**, que es el compilador nativo (Go) ya estable. Con
  `erasableSyntaxOnly` y `verbatimModuleSyntax` activados, todo lo que el proyecto escribe es
  borrable por el *type stripping* de Node, y por eso los tests en `.ts` corren con `node --test`
  sin bundler ni flags. Node 22.18+ es el mínimo (queda en `engines`).
- **L5** (2026-10-21) — **Los tests en `.ts` sin bundler** era el objetivo: sin la
  extensión explícita en los imports (`./parse.ts`), Node no resuelve el módulo. Vite también
  resuelve, y `index.html` pasa a apuntar a `/src/main.tsx`.
- **L6** (2026-10-21) — **Verificación diferencial, no solo "compila"**: se levantó la versión
  anterior (commit `157802e`) en un worktree aparte y se ejecutó el mismo guion sobre las dos
  versiones en Chrome headless: la TSV copiada, el Markdown copiado, el CSV descargado, el texto
  renderizado, el número de tablas, de celdas, de enlaces y de imágenes, el índice de la guía y el
  lector del REBT contra el BOE simulado. **Salida byte a byte idéntica** en las dos vistas, y el
  CSV descargado idéntico también al del corpus. La conversión no cambió el comportamiento (S6).
- **L7** (2026-10-21) — **La conversión dejó limpio de paso** (sin tocar el comportamiento): imports
  muertos en `App.tsx` (`splitTitle`, `TemaBoton`), props que se pasaban y no se usaban
  (`id` y `onVolver` en `GuiaIndice`), y la unificación de `setTimeout` en `window.setTimeout`
  (con `@types/node` en juego, el `setTimeout` global devuelve un `Timeout` de Node, no un número).
- **L8** (2026-10-21) — **CI**: el workflow pasa a Node 24 y gana dos pasos, `typecheck` y `test`,
  antes del build y del deploy. Antes los tests **nunca** corrían en CI: existían, pero nadie los
  ejecutaba.
