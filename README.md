# Lector del REBT

Interfaz React para leer el Reglamento electrotécnico para baja tensión (RD 842/2002, `boe-A-2002-18099`)
a partir de la API de datos abiertos del BOE (legislación consolidada), y visor de las Guías Técnicas
de aplicación publicadas por el Ministerio de Industria y Turismo (el corpus de `guia_rebt/`).

- Pantalla de inicio con los dos destinos: el reglamento y la guía técnica.
- Índice agrupado en reglamento e ITC-BT, con filtro por título.
- Texto con las tablas como tablas reales: cabecera fija, celdas combinadas, copiar a hoja de cálculo, Markdown o CSV.
- Selector de versión (el BOE guarda todas las redacciones; se muestra la vigente por defecto).
- Búsqueda en el texto completo (descarga los bloques una vez, 4 a la vez) con coincidencias resaltadas.
- Visor de la guía: los 38 documentos con sus tablas reales, sus figuras y enlace al PDF oficial.
  Las tablas del corpus también se pueden copiar a hoja de cálculo, copiar como Markdown o
  descargar como CSV, con el nombre del CSV del corpus (`BT-19_t01.csv`).
- Enlaces `#/{id}` para volver a cualquier bloque; tema claro y oscuro según el sistema.

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

## Uso

```bash
npm install
npm run dev          # http://localhost:5173, usa el BOE real
npm test             # node --test, sin dependencias de test
```

El navegador no puede llamar a `boe.es` directamente (la API no envía cabeceras CORS), así que Vite hace de proxy:
`/boe-api/...` → `https://www.boe.es/datosabiertos/api/...` (ver `vite.config.js`).

Para desarrollar sin conexión hay un BOE simulado con datos de ejemplo:

```bash
npm run mock         # terminal 1
npm run dev:mock     # terminal 2
```

> **`dev:mock` está roto en `main`:** el script pasa `BOE_PREFIX=` (vacío) y el proxy responde 400,
> porque el servidor simulado sirve bajo `/datosabertos/api`. Funciona con
> `BOE_TARGET=http://localhost:8787 BOE_PREFIX=/datosabiertos/api npx vite`. No se tocó porque es
> anterior a este trabajo.

## Cómo se sirve la guía

`guia_rebt/` vive en la raíz del repo, fuera de `publicDir`, así que Vite no lo sirve. Lo publica un
plugin propio, `vite/guia-corpus.js`:

- En `dev` y `preview`, un middleware sirve `/guia/indice.json`, `/guia/md/*.md` y `/guia/imgs/*`.
- En `build`, copia lo mismo a `dist/guia/` (~9,7 MB).

Solo se expone esa lista blanca. `pdf/` (12 MB, y además ignorado por git) y `tablas/` no se publican.
El middleware resuelve y comprueba cada ruta antes de tocar el disco, bloqueando `..`, rutas absolutas,
bytes nulos y symlinks que salgan del corpus.

Los enlaces a página del PDF que trae el corpus (`../pdf/BT-19.pdf#page=7`) **no** son locales: se
reescriben a la URL oficial de `indice.json` conservando el ancla, y cada documento tiene además un
botón «Ver PDF original». Es lo que permite leer la guía sin tener los 12 MB de PDF en el despliegue.

### El renderer de Markdown es propio, y a propósito

`src/guia/markdown.js` implementa solo el subconjunto que el corpus usa de verdad, medido sobre los
38 documentos: encabezados, tablas pipe, imágenes, enlaces, listas, blockquotes, reglas y
front-matter. **Cero** código en línea, **cero** vallas y **cero** HTML crudo.

Dos decisiones que parecen rarezas y no lo son:

- **Las celdas de tabla son texto literal.** En el corpus `(**)`, `(*)` y `Método de instalación*` son
  notas al pie y asteriscos del PDF, nunca énfasis. Interpretar `**` como negrita haría que dos notas
  al pie de la misma fila se emparejaran y negritaran media fila.
- **Los `*` y `_` sueltos no se vuelven cursiva.** `_ACTIVOS_` es énfasis del PDF, no sintaxis.

Añadir `marked` o `react-markdown` sería más fácil de escribir, pero metería un parser genérico donde
el corpus no lo necesita y donde el riesgo real es corromper contenido. Si algún día el corpus cambia
de forma, se amplía el renderer, no se cambia la decisión.

## Desplegarlo

`npm run build` genera `dist/` (con el corpus en `dist/guia/`), pero en producción necesitas el mismo proxy delante
(un Cloudflare Worker o una regla de reescritura que lleve `/boe-api/*` a `https://www.boe.es/datosabiertos/api/*`).

## Si el BOE cambia el formato

Todo el conocimiento del XML está en `src/parse.js`. Si algo sale vacío o mal agrupado, guarda la respuesta de
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
