# Landing + visor de la Guía Técnica del REBT

Rama `feat/landing-y-visor-guia`. Entrega: unidades de trabajo en la rama, una PR al final
 salvo que el usuario pida otra cosa. Runner de tests: `node --test` (nativo de Node 20, sin
 dependencias nuevas).

## Specs

- **S1** — *"quiero una landing con un boton que vaya a rebt y otro que habra la guia de
  rebt en @guia_rebt/"* (pedido original, 19/10/2026). Dos destinos: el lector del REBT que ya
  existe en `src/`, y el corpus `guia_rebt/`.
- **S2** — *"quiero la 1. y que ademas tenga los enlaces a pdf oficiales"*. La opción 1 era el
  **visor completo dentro de la app**: lista los 38 documentos desde `guia_rebt/indice.json` y
  renderiza el Markdown con tablas reales e imágenes. Y además, enlaces a los PDF oficiales.
- **S3** — El subconjunto de Markdown que hay que renderizar está **medido sobre el corpus**,
  no supuesto: 619 encabezados, 3.576 líneas de tabla pipe, 123 imágenes, 65 enlaces, 12
  negritas, 762 ítems de lista, 75 blockquotes, 76 reglas `---`, 446 comentarios HTML
  (`<!-- tabla: … -->`) y front-matter entre `---`. **Cero** code spans, **cero** fences y
  **cero** HTML crudo. Renderer propio y ajustado a ese subconjunto; sin dependencia nueva.
- **S4** — Los enlaces `../imgs/…` del corpus se sirven bajo `/guia/…`. Los 65 enlaces
  `../pdf/<id>.pdf#page=N` son a un PDF **local y no versionado** (`guia_rebt/pdf/` está en
  `.gitignore`), así que se reescriben a la URL oficial de `indice.json` conservando el
  fragmento `#page=`.
- **S5** — El contrato de rutas documentado (`#/{id}`, p.ej. `#/i01`) **sigue funcionando**.
  SeConvive con `#/rebt`, `#/rebt/{id}`, `#/guia` y `#/guia/{id}`.

## Tasks

| # | Tarea | Specs | Ruta | Riesgo | Commit |
|---|-------|-------|------|--------|--------|
| T1 | Plugin Vite que sirve `guia_rebt/` en `/guia/*` (dev, preview y build) con guarda de path traversal | S1,S3 | inline | **item 2** | 1 |
| T2 | Tests RED del renderer sobre casos reales del corpus | S2,S3 | inline | — | 2 |
| T3 | `src/guia/markdown.js`: renderer del subconjunto + reescritura de rutas | S3,S4 | inline | item 6 | 2 |
| T4 | Índice de la guía: 38 documentos desde `indice.json`, filtro por título, enlace al PDF oficial | S2,S4 | inline | — | 3 |
| T5 | Lector de documento: render, anterior/siguiente, "ver PDF oficial" | S2,S4 | inline | — | 3 |
| T6 | `Landing.jsx` + enrutado `#/`, `#/rebt`, `#/rebt/{id}`, `#/guia`, `#/guia/{id}` preservando `#/{id}` | S1,S5 | inline | **item 3** | 3 |
| T7 | Estilos de landing, índice de guía y documento | S1 | inline | — | 3 |
| T8 | Botón «← Inicio» en los tres headers | S6 | inline | — | 4 |
| T9 | `README.md` (rutas, qué se sirve, decisión del renderer) + verificación | — | inline | **items 2,3** | 4 |

**Trazabilidad de ruta**: no hay trigger de delegación (ni paralelismo ni backstop de contexto).
Una sola unidad coherente; todo inline siguiendo este logbook.

- **S6** (añadido 19/10) — *"agrega un boton a rebt y a guias que vuelva al incio, quizas en el
  header"*: un control `← Inicio` en el header de las tres vistas (lector, índice de la guía,
  documento), como componente compartido `src/InicioBoton.jsx`.

## Estrategia de entrega

Pronóstico: ~1.000 líneas cambiadas, por encima de las ~400 de la unidad de revisión.
Estrategia `ask-on-risk`. **Pendiente**: la estrategia de PR encadenadas es decisión del usuario
(push y PR no se crean sin que lo pida). Todo el trabajo está en la rama `feat/landing-y-visor-guia`.

## Log

- **L1** (2026-10-19 10:52) — *"quiero una landing con un boton que vaya a rebt y otro que
  habra la guia de rebt en @guia_rebt/"*.
- **L2** (2026-10-19) — Preguntado el alcance del botón "Guía" (visor completo / índice mínimo /
  solo enlaces a PDF). Respuesta: *"quiero la 1. y que ademas tenga los enlaces a pdf
  oficiales"* → visor completo dentro de la app + enlaces a los PDF oficiales.
- **L3** (2026-10-19) — Decisión de arquitectura: **sin dependencia nueva**. El subconjunto de
  Markdown del corpus es cerrado y está medido (S3): renderizarlo a mano es más barato y más
  seguro que sumar `marked`/`react-markdown` al bundle. Tests con `node:test` nativo.
- **L4** (2026-10-19) — Requisito derivado del corpus: `guia_rebt/` vive en la raíz del repo,
  **fuera de `public/`**, así que Vite no lo servía. Por eso T1 es middleware propio y no
  `publicDir`.
- **L5** (2026-10-19) — Riesgo asumido a propósito: el middleware de T1 sirve archivos del disco,
  así que **debe** bloquear path traversal (`../`, rutas absolutas, symlinks). Es el ítem 2 de
  riesgo alto y por eso lleva verificación independiente.
- **L6** (2026-10-19) — **Bug encontrado y corregido por la verificación, no por los tests.** El
  renderer invoca `resolveUrl(href, kind)` y `resolveGuiaUrl` esperaba `(href, { fuentePdf })`. Al
  pasarla tal cual, `fuentePdf` llegaba `undefined` y **los 65 enlaces al PDF oficial se descartaban
  en silencio**: la guía renderizaba bien pero sin un solo enlace. Corregido ligando el resolver al
  documento en `Guia.jsx`, y fijado con dos tests (que el renderer pase `kind`; que el enlace
  sobreviva con el resolver ligado). Comprobado sobre los 38 documentos: 65/65 al PDF oficial, 0 rotas.
- **L7** (2026-10-19) — **Bug preexistente encontrado, NO corregido** (fuera del alcance pedido):
  el script `dev:mock` de `package.json` pasa `BOE_PREFIX=` vacío y el proxy responde **400**, porque
  `mock/server.mjs` sirve bajo `/datosabiertos/api`. Está roto en `main`. Documentado en el README
  con la variante que funciona; arreglarlo es decisión del usuario.
- **L8** (2026-10-19) — Verificación del renderer sobre el corpus entero, no solo sobre muestras:
  38 documentos → 381 tablas (exactamente las 381 del corpus), 3.195 filas, 18.008 celdas
  (10.786 vacías por la rejilla expandida), 123 imágenes, 0 fragmentos de Markdown sin interpretar,
  0 etiquetas desbalanceadas, 0 negritas falsas.
- **L9** (2026-10-19) — Seguridad con `curl --path-as-is` (sin normalizar la ruta en el cliente):
  9 vectores de traversal dan 404 y los 3 recursos válidos dan 200. Con `curl` normalizando, `../`
  salía con 200 y parecía una fuga; era el cliente, no el servidor.
- **L10** (2026-10-19) — `dist/` no estaba en `.gitignore` y el build genera 9,7 MB. Añadido.
- **L11** (2026-10-19) — Al implementar T8 apareció un segundo bug: en `Router.jsx`, `onVolver` ya
  apuntaba a `#/guia`, o sea al propio índice, así que un botón "Inicio" reutilizándolo no volvería
  a la landing. Separadas las dos acciones (`onInicio` → `#/`, `onVolver` → `#/guia`).
- **L12** (2026-10-19) — Verificación visual con Firefox headless de las cuatro vistas. El lector y
  el documento hubo que capturarse embebidos en un wrapper que retiene el evento `load`, porque la
  captura headless dispara antes de que resuelvan los `fetch` en cadena.
