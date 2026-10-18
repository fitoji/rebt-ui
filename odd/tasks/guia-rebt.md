# guia_rebt — Guía Técnica de Aplicación del REBT a Markdown

Descarga los 37 PDF publicados por industria.gob.es (Guías Técnicas de aplicación del REBT)
y los convierte a Markdown con la misma forma que el corpus REBT del proyecto `boe-rebt`.

Todo vive en `guia_rebt/`. Se versiona `md/ + tablas/ + imgs/ + indice.json`; `pdf/` y `cache/`
quedan en disco y fuera de git (son la fuente y el intermedio, regenerables).

## Specs

- **S1** — *"quiero bajar informacion desde este link que tiene muchos pdf y pasarlos a markdown de la misma forma que hicimos con rebt"* (pedido original, 17/10; URL registrada por Engram truncada: `https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalaciones…`). Fuente confirmada y usada: `https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalacionesindustriales/baja-tension/Paginas/guia-tecnica-aplicacion.aspx` → 37 PDFs, 583 páginas, 12,5 MB.
- **S2** — *"sigamos con el pendiente 1 en una carpeta /guia_rebt dentro de este proyecto"*: todo el trabajo (script, tests, corpus) bajo `guia_rebt/` del repo `rebt-ui`.
- **S3** — *"yo quiero tener los pdf guardados como backup , pero quiero utilizar los md"* + elección "A": `pdf/` se guarda en disco y **no** se versiona; se versionan `md/`, `tablas/`, `imgs/` e `indice.json`. `cache/` ignorado.
- **S4** — *"puedes mirar el codigo py del otro proyecto"*: se reusan las convenciones de `boe-rebt/info/boe_rebt_to_markdown.py` — `unittest` de stdlib sin red, tablas expandidas a rejilla rectangular, heurística de encabezados numerados, caché que no se envenena con respuestas inválidas, `indice.json` con metadatos y `<!-- tabla: ... -->` enlazando cada CSV.
- **S5** — *"Solo el corpus"*: **sin** visor estático `index.html` por ahora. El visor (o la integración con la UI React) es trabajo aparte y no se decide acá.
- **S6** — *"Sí: .gitignore + sacar node_modules del índice"*: hecho en `1bfa6e7` (`node_modules/` fuera del índice, archivos intactos en disco).
- **S7** — Salida por documento: `md/<id>.md` con front-matter (título, edición, revisión, código de guía, fuente), tablas como tablas Markdown reales + CSV en `tablas/`, figuras en `imgs/`, y `indice.json` con título/URL/edición/revisión/páginas/tablas/`sha256` del PDF.
- **S8** — Cobertura de figuras declarada y verificable: imágenes embebidas reales (≥200×150) extraídas a `imgs/`; páginas solo-figura (texto <400 caracteres y ≥25 trazos) rasterizadas a `imgs/` a 110 dpi; las figuras **vectoriales** dentro de páginas con texto no se rasterizan y el `.md` deja un enlace a la página del PDF local. Este límite se documenta en el README.

## Tasks

| # | Tarea | Specs | Ruta | Commit |
|---|-------|-------|------|--------|
| T1 | Andamiaje `guia_rebt/` (requirements.txt, .gitignore de `pdf/` y `cache/`) | S2,S3 | inline | 1 |
| T2 | Lista de documentos desde la página índice (título, URL, código) | S1 | inline | 1 |
| T3 | Descarga a `pdf/` con caché y `sha256` | S1,S4 | inline | 1 |
| T4 | Página → texto limpio (bandas de cabecera/pie por geometría) | S1,S4 | inline | 2 |
| T5 | Tablas: rejilla con fill-down → CSV + tabla Markdown | S1,S4 | inline | 2 |
| T6 | Estructura del `.md`: front-matter, encabezados numerados, índice | S1,S7 | inline | 2 |
| T7 | Figuras: imágenes reales, páginas solo-figura, marcador vectorial | S8 | inline | 3 |
| T8 | `indice.json` + CLI + corrida completa sobre los 37 PDFs + auditoría | S7 | inline | 3 |
| T9 | `guia_rebt/README.md` + README raíz | S5,S8 | inline | 4 |
| T10 | Verificación independiente y cierre | — | gentle-ai-verify | — |

## Log

- **L1** (2026-10-17 22:47) — *"quiero bajar informacion desde este link que tiene muchos pdf y pasarlos a markdown de la misma forma que hicimos con rebt https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalaciones…"* (registro truncado en Engram; URL reconstruida hoy y verificada con HTTP 200).
- **L2** (2026-10-18 22:0x) — *"ya inicialice el git y pushe todo, sigamos con el pendiente 1 en una carpeta /guia_rebt dentro de este proyecto"*.
- **L3** (2026-10-18) — *"puedes mirar el codigo py del otro proyecto"* (autorización explícita de lectura fuera del root: `/home/a/dev-pi/boe-rebt`).
- **L4** (2026-10-18) — *"explicame como serian las opciones , yo quiero tener los pdf guardados como backup , pero quiero utilizar los md"* → elección **A**: corpus versionado, PDFs ignorados en disco.
- **L5** (2026-10-18) — Alcance: **"Solo el corpus"** (sin visor estático).
- **L6** (2026-10-18) — Higiene git aprobada y ejecutada: commit `1bfa6e7`.
- **L7** (2026-10-18) — Evidencia de diseño: `pymupdf4llm` detecta 0 tablas en las páginas 7-8 de `guia_bt_19`; `pdfplumber` detecta la tabla de intensidades admisibles completa (29 filas). Motor elegido: `pdfplumber` para texto y tablas, `PyMuPDF` para imágenes/render. `docling`/`marker` descartados (torch + ~1 GB de modelos, desproporcionado para 37 PDFs con texto real).
