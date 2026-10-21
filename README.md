# REBT · lector del reglamento y visor de la guía técnica

Aplicación web para leer el Reglamento electrotécnico para baja tensión (RD 842/2002,
`boe-A-2002-18099`) desde la API de datos abiertos del BOE, y para consultar las Guías Técnicas
de aplicación publicadas por el Ministerio de Industria y Turismo (el corpus de `guia_rebt/`).
Todo en TypeScript con `strict`. En producción: <https://rebt-ui.fitoji.workers.dev>.

## Qué hace

| Vista | Qué ofrece |
|---|---|
| **Lector del reglamento** | Texto del BOE con las tablas como tablas reales (cabecera fija, celdas combinadas) y **copiar a hoja de cálculo, Markdown o CSV**. Selector de redacción (el BOE guarda todas; se muestra la vigente) y búsqueda en el texto completo con las coincidencias resaltadas. |
| **Visor de la guía** | Los 38 documentos de la Guía Técnica con sus tablas reales, sus figuras y el enlace al PDF oficial. Las tablas también se copian a hoja de cálculo, se copian como Markdown o se descargan como CSV, **con el nombre del CSV del corpus** (`BT-19_t01.csv`). |
| **Índice** | Agrupado en Preámbulo / Reglamento / ITC-BT, con acordeones y filtro por título. |
| **Además** | Pantalla de inicio con los dos destinos, enlaces `#/{id}` a cualquier bloque, tema claro/oscuro según el sistema. |

## Arranque rápido

```bash
npm install
npm run dev          # http://localhost:5173, contra el BOE real
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de Vite. |
| `npm run build` | **Typecheck y luego** empaqueta en `dist/`. Si hay un error de tipos, no se empaqueta. |
| `npm run typecheck` | `tsc --noEmit`: la puerta de tipos de la aplicación y la del worker. |
| `npm test` | `node --test` sobre los tests en TypeScript. Sin dependencias de test. |
| `npm run check` | Typecheck + tests, que es lo que corre el CI. |
| `npm run mock` | BOE simulado en `:8787`, con datos de ejemplo. |
| `npm run dev:mock` | Vite contra el BOE simulado, para trabajar sin conexión. |

Hace falta **Node ≥ 22.18** (en `engines`): los tests corren en TypeScript sin bundler porque Node
hace *type stripping* (el borrado de tipos) desde esa versión.

El navegador no puede llamar a `boe.es` directamente (la API no envía cabeceras CORS), así que Vite
hace de proxy: `/boe-api/...` → `https://www.boe.es/datosabiertos/api/...` (ver `vite.config.ts`).

## Rutas

Todo va por hash, para que servir el build no necesite reglas de reescritura.

| Ruta | Qué muestra |
|---|---|
| `#/` | pantalla de inicio |
| `#/rebt` | el lector del reglamento, primer bloque |
| `#/rebt/<bloque>` | el lector en ese bloque |
| `#/guia` | índice de las 38 guías técnicas |
| `#/guia/<id>` | una guía concreta (`BT-19`, `BT-Anexo-2`, …) |
| `#/<bloque>` | enlace antiguo del lector, sigue funcionando |

## Dónde está cada cosa

| Ruta | Qué contiene |
|---|---|
| `src/` | La aplicación. `src/tipos.ts` tiene los tipos del dominio; `src/guia/` el intérprete del corpus y sus URLs. |
| `src/guia/markdown.ts` | El intérprete de Markdown del corpus (propio, ver más abajo). |
| `test/` | Tests en TypeScript, con el runner nativo de Node. |
| `vite/guia-corpus.ts` | Plugin que publica `guia_rebt/` en `/guia/*`. |
| `worker/index.ts` | El Worker de Cloudflare: sirve `dist/` y hace de proxy hacia el BOE. |
| `mock/server.ts` | El BOE simulado para trabajar sin conexión. |
| `guia_rebt/` | El corpus: `md/` + `tablas/` + `imgs/` + `indice.json`, y el conversor en Python. |
| `odd/tasks/` | Los logbooks de cada trabajo: qué se pidió, qué se decidió y cómo se verificó. |

## TypeScript

Todo el proyecto está en TypeScript (`strict: true`): la aplicación, los tests, el plugin de Vite,
el worker y el mock. La puerta de tipos es `npm run typecheck`, y `npm run build` la ejecuta
**antes** de empaquetar, así que un error de tipos no llega a `dist/`. En CI corren el typecheck y
los tests antes del despliegue.

Tres decisiones que conviene conocer antes de tocar el código:

- **Los tipos del dominio viven en `src/tipos.ts`**, en un solo sitio: bloque, versión, ítem, rejilla e
  índice de la guía. Si cambia la forma de un dato, se ve ahí y no en veinte archivos.
- **El worker tiene su propio `tsconfig`** (`tsconfig.worker.json`): los tipos de Cloudflare y los del
  DOM declaran los mismos globales (`Request`, `Response`, `fetch`) y chocan si comparten configuración.
- **Los imports relativos llevan la extensión** (`./parse.ts`). Es lo que permite que Node ejecute los
  tests en TypeScript sin bundler, y Vite resuelve igual. Por eso `erasableSyntaxOnly` y
  `verbatimModuleSyntax` están activados: lo que no se puede borrar no se puede ejecutar, y un `import`
  de un tipo tiene que ser `import type` o Node lo importaría en runtime.

`noUncheckedIndexedAccess` está **deliberadamente apagado**: el código indexa arrays por todo y los `!`
que obligaría a escribir taparían justo los errores que se quieren ver.

## Cómo se sirve la guía

`guia_rebt/` vive en la raíz del repo, fuera de `publicDir`, así que Vite no lo sirve. Lo publica un
plugin propio, `vite/guia-corpus.ts`:

- En `dev` y `preview`, un middleware sirve `/guia/indice.json`, `/guia/md/*.md` y `/guia/imgs/*`.
- En `build`, copia lo mismo a `dist/guia/` (~9,7 MB).

Solo se expone esa lista blanca. `pdf/` (12 MB, y además ignorado por git) y `tablas/` no se publican.
El middleware resuelve y comprueba cada ruta antes de tocar el disco, bloqueando `..`, rutas absolutas,
bytes nulos y symlinks que salgan del corpus.

Los enlaces a página del PDF que trae el corpus (`../pdf/BT-19.pdf#page=7`) **no** son locales: se
reescriben a la URL oficial de `indice.json` conservando el ancla, y cada documento tiene además un
botón «Ver PDF original». Es lo que permite leer la guía sin tener los 12 MB de PDF en el despliegue.

### El intérprete de Markdown (`renderer`) es propio, y a propósito

`src/guia/markdown.ts` implementa solo el subconjunto que el corpus usa de verdad, medido sobre los
38 documentos: encabezados, tablas pipe, imágenes, enlaces, listas, blockquotes, reglas y
front-matter. **Cero** código en línea, **cero** vallas y **cero** HTML crudo.

Dos decisiones que parecen rarezas y no lo son:

- **Las celdas de tabla son texto literal.** En el corpus `(**)`, `(*)` y `Método de instalación*` son
  notas al pie y asteriscos del PDF, nunca énfasis. Interpretar `**` como negrita haría que dos notas
  al pie de la misma fila se emparejaran y negritaran media fila.
- **Los `*` y `_` sueltos no se vuelven cursiva.** `_ACTIVOS_` es énfasis del PDF, no sintaxis.

Añadir `marked` o `react-markdown` sería más fácil de escribir, pero metería un parser genérico donde
el corpus no lo necesita y donde el riesgo real es corromper contenido. Si algún día el corpus cambia
de forma, se amplía el intérprete, no se cambia la decisión.

## Desplegarlo

Producción es un **Cloudflare Worker** (`worker/index.ts`): sirve `dist/` como archivos estáticos y hace de proxy
de `/boe-api/*` a `https://www.boe.es/datosabertos/api/*`, que es lo que permite que el navegador
hable con el BOE.

```bash
npm run build          # typecheck + dist/
npx wrangler deploy    # publica el worker
```

En el CI, cada push a `main` hace: typecheck → tests → build → despliegue. Para que eso funcione, el
**entorno** de GitHub llamado `CLOUDFLARE_API_TOKEN` (en *Settings → Environments*) necesita dos
secretos:

| Secreto | Para qué |
|---|---|
| `CLOUDFLARE_API_TOKEN` | El token de la API, con la plantilla *Edit Cloudflare Workers* de Cloudflare. El que hay puesto en el entorno es de la época de Pages y **no sirve para Workers**. |
| `CLOUDFLARE_ACCOUNT_ID` | En qué cuenta está el worker. **Sin esto**, wrangler intenta listar las cuentas para averiguarlo y el despliegue falla antes de compilar. |

- Worker en producción: <https://rebt-ui.fitoji.workers.dev>
- El proyecto viejo de **Pages** (`rebt-ui.pages.dev`) quedó atrás y sirve el código fuente crudo:
  muestra pantalla en blanco. Se puede borrar.

## Si el BOE cambia el formato

Todo el conocimiento del XML está en `src/parse.ts`. Si algo sale vacío o mal agrupado, guarda la respuesta de
`/boe-api/legislacion-consolidada/id/BOE-A-2002-18099/texto/indice` y de un bloque, y ajusta ahí.

## Corpus de la Guía Técnica (`guia_rebt/`)

Al lado del lector vive `guia_rebt/`: un corpus en Markdown de las Guías Técnicas de aplicación del
REBT publicadas por Industria (38 documentos, 603 páginas), generado desde los PDF oficiales por
`guia_rebt/convert_guia_to_markdown.py` y con la misma forma que el corpus REBT de `boe-rebt`
(`md/` + `tablas/*.csv` + `imgs/` + `indice.json`). Los PDF se descargan a `guia_rebt/pdf/`, que no
se versiona.

```bash
python3 -m pip install -r guia_rebt/requirements.txt
python3 guia_rebt/convert_guia_to_markdown.py            # todo
python3 guia_rebt/convert_guia_to_markdown.py --solo BT-19
```

Decisiones de conversión, límites conocidos y cómo se auditó la cobertura: `guia_rebt/README.md`.
