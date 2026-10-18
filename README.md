# Lector del REBT

Interfaz React para leer el Reglamento electrotécnico para baja tensión (RD 842/2002, `BOE-A-2002-18099`)
a partir de la API de datos abiertos del BOE (legislación consolidada).

- Índice agrupado en reglamento e ITC-BT, con filtro por título.
- Texto con las tablas como tablas reales: cabecera fija, celdas combinadas, copiar a hoja de cálculo, Markdown o CSV.
- Selector de versión (el BOE guarda todas las redacciones; se muestra la vigente por defecto).
- Búsqueda en el texto completo (descarga los bloques una vez, 4 a la vez) con coincidencias resaltadas.
- Enlaces `#/{id}` para volver a cualquier bloque; tema claro y oscuro según el sistema.

## Uso

```bash
npm install
npm run dev          # http://localhost:5173, usa el BOE real
```

El navegador no puede llamar a `boe.es` directamente (la API no envía cabeceras CORS), así que Vite hace de proxy:
`/boe-api/...` → `https://www.boe.es/datosabiertos/api/...` (ver `vite.config.js`).

Para desarrollar sin conexión hay un BOE simulado con datos de ejemplo:

```bash
npm run mock         # terminal 1
npm run dev:mock     # terminal 2
```

## Desplegarlo

`npm run build` genera `dist/`, pero en producción necesitas el mismo proxy delante
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
