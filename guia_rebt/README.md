# guia_rebt — Guía Técnica de Aplicación del REBT en Markdown

Corpus en Markdown de las **Guías Técnicas de aplicación del Reglamento Electrotécnico para Baja
Tensión** que publica el Ministerio de Industria y Turismo, generado desde los PDF oficiales de
`industria.gob.es`, con la misma forma que el corpus REBT del proyecto `boe-rebt`.

> Esto es el corpus. La aplicación que lo publica está en el
> [README del proyecto](../README.md).

## Qué hay

| Carpeta / archivo | Contenido | ¿En git? |
|---|---|---|
| `md/` | un `.md` por guía (texto, encabezados y tablas reales) | sí |
| `tablas/` | un `.csv` por tabla detectada, enlazado desde el `.md` | sí |
| `imgs/` | figuras extraídas o páginas solo-figura rasterizadas | sí |
| `indice.json` | documentos, edición, revisión, páginas, tablas, figuras y `sha256` del PDF | sí |
| `pdf/` | los PDF originales descargados (tu copia de respaldo) | **no** (`gitignore`) |
| `cache/` | intermedios de conversión | **no** |

Los PDF no se versionan: son descargas públicas y el script los vuelve a bajar. El `sha256` de
`indice.json` avisa si el ministerio publicó un archivo distinto.

## Cobertura: qué guías existen y cuáles no

El índice oficial del ministerio (`guia_bt_indice_jul19R8.pdf`, en `pdf/`) organiza las guías en 8
unidades temáticas. Hay guía publicada para **30 ITC-BT**, el RD 842/2002, los 4 anexos, la
introducción y el índice: **38 documentos**.

Las **22 ITC-BT sin guía publicada** (su texto reglamentario se aplica directo, sin guía de
interpretación) son: 01, 02, 06, 07, 11, 31, 32, 34, 35, 36, 37, 38, 39, 41, 42, 43, 44, 45, 46,
47, 48 y 50. No es un hueco de la descarga: el reglamento con esas ITC está en el corpus del
proyecto `boe-rebt`.

**BT-51** es el caso especial: la página del ministerio la lista en su historial de revisiones pero
**ya no la enlaza**. El PDF sigue publicado (`guia_bt_51_feb07R1.pdf`, HTTP 200) y el índice oficial
la incluye, así que el script la agrega explícitamente (`EXTRAS` en
`convert_guia_to_markdown.py`). Si algún día la página vuelve a enlazarla, no se duplica.

## Uso

```bash
python3 -m pip install -r requirements.txt     # pdfplumber + PyMuPDF
python3 convert_guia_to_markdown.py            # descarga y convierte todo
python3 convert_guia_to_markdown.py --solo BT-19
python3 convert_guia_to_markdown.py --no-figuras
python3 convert_guia_to_markdown.py --debug    # trazas de bandas y cabeceras
python3 -m unittest test_convert_guia_to_markdown
```

Es idempotente: si un PDF ya está en `pdf/` y es válido, no se vuelve a pedir. Antes de escribir,
borra solo los `.md` y `.csv` de los documentos que va a regenerar.

## Cómo convierte, y por qué así

Cada decisión está medida contra los PDF reales, no supuesta:

- **Motor**: `pdfplumber` para texto y tablas, `PyMuPDF` para figuras y render. `pymupdf4llm`
  detectó 0 tablas en las páginas con tablas grandes (7-8 de BT-19) y metía cursiva/tachado
  espurio en todos los párrafos; `pdfplumber` saca la tabla de intensidades admisibles completa
  (29 filas). `docling`/`marker` se descartaron: torch + ~1 GB de modelos para 37 PDF digitales.
- **Cabecera y pie repetidos** se quitan por geometría (bandas superior e inferior), no por líneas
  repetidas: con `pdftotext -layout` la alineación cambia por página y la heurística de líneas
  repetidas da 0 coincidencias donde la cabecera está en todas. La cabecera quitada se reusa como
  metadatos (edición, revisión, título).
- **Recuadros**: estas guías enmarcan secciones y figuras. `pdfplumber` los detecta como tabla de
  una columna: si se aceptan, el texto de la sección entera termina dentro de un CSV. Una tabla de
  datos necesita **≥2 columnas y ≥2 filas**; el resto vuelve a ser texto.
- **Páginas que salen ilegibles**: cuando `pdfplumber` parte una tabla en cientos de líneas de pocos
  caracteres (`0 ,5`, `5321`…) no hay tabla que extraer. Medido en 10 páginas del corpus
  (Anexo 2 pág. 6, BT-04 pág. 6, BT-12 pág. 8, BT-21 pág. 16, BT-23 pág. 8, BT-27 págs. 8 y 10,
  BT-28 pág. 22, BT-29 pág. 29, BT-40 pág. 15): una página normal tiene 30-50 líneas de 50
  caracteres o más, y esas dan 63-213 líneas de 6 a 36. En esos casos el `.md` deja una nota y
  muestra la imagen de la página en vez de los pedazos.
- **Documentos de una sola página**: sin páginas donde repetir, la regla de bandas contaba todo lo
  de la franja superior como cabecera y cortaba 252 pt (un 30% de la página) del cuerpo de
  `BT-Anexo-3`. Ahí la cabecera son las primeras filas que arrancan con una etiqueta conocida.
- **Negrita falsa**: varias guías dibujan cada carácter dos veces en la misma posición y el texto
  salía como `CCOOMMPPAAÑÑÍÍAA`. Se descartan los trazos repetidos (a décimas de punto: los reales
  difieren 0,001 pt). Las letras dobles legítimas (`acción`) quedan intactas.
- **Párrafos**: las líneas visuales se vuelven a unir por hueco vertical; los encabezados numerados
  (`2.2.3 …`) y los títulos en mayúsculas arrancan párrafo propio.
- **Figuras**: los diagramas de estas guías son **vectoriales**, no imágenes. Rasterizar páginas
  con dibujos daría 542 de 583 páginas (~90 MB de bordes de tabla). Se extraen solo las imágenes
  embebidas reales (≥200×150 px) y se rasterizan las páginas que son prácticamente una figura;
  el resto deja un enlace a la página del PDF local.

## Límites conocidos

- Las **tablas que pdfplumber no puede leer como texto** (10 páginas del corpus) se muestran como
  imagen de la página: se ven completas, pero no se pueden buscar ni copiar.
- Los **subíndices y símbolos de las fórmulas** quedan separados como palabras (`P vivienda` en vez
  de `Pvivienda`, `Ra ux1`), y las **etiquetas dentro de las figuras** (por ejemplo `Current using
  equipment` en un esquema de BT-18) no son texto del cuerpo: no aparecen en el `.md`.
- Las **figuras vectoriales** dentro de páginas con texto no se rasterizan: el `.md` deja
  `> Figura en la pág. N del PDF original: [ver en el PDF](../pdf/BT-19.pdf#page=N)`. El visor de
  Markdown tiene que abrir enlaces locales para aprovecharlo.
- Las **cabeceras multinivel** de las tablas se conservan como filas consecutivas (fieles al PDF),
  no como encabezado combinado.
- Las líneas del índice quedan como `- 2.2.2 Sección — 4`, con el número de página del PDF.
- El texto sale del PDF tal cual: erratas y redacciones del original no se corrigen.

## Auditoría

`auditar_cobertura.py` compara las palabras del PDF (`pdftotext -layout`) con las del `.md` y los
CSV, y lista lo que falta. Lo que se espera que falte es la cabecera y el pie repetidos y las
líneas del índice con puntos guía.

```bash
pdftotext -layout pdf/BT-19.pdf /tmp/BT-19.txt
python3 auditar_cobertura.py /tmp/BT-19.txt --md md/BT-19.md --tablas 'tablas/BT-19_t*.csv'
```

Clasifica lo que falta, porque no todo es pérdida: `cabecera` (encabezado y pie repetidos, se quitan
a propósito), `artefactos` (formas que sí están en el corpus pero que `pdftotext` deforma: palabras
partidas, glifos duplicados limpios, líneas del índice con puntos) y **`SIN EXPLICAR`**, que es la
lista que hay que mirar.

Resultado en el corpus completo (38 documentos, 603 páginas, 132.097 palabras): **2,90%** de las
ocurrencias fuera del corpus. De las formas `SIN EXPLICAR` (298 en total) quedaron revisadas una por
una:

- **130** son de `BT-Anexo-2`: la tabla de caídas de tensión que ahora se muestra como imagen, o sea
  contenido presente pero no como texto.
- El resto son **símbolos de fórmulas con subíndice** (`pvivienda`, `gmax`, `raux1`), **etiquetas
  dentro de figuras** y **texto que `pdftotext` entrevera** entre dos corridas (`mmeeto`, `toddoolo`,
  `inssppeeccccio`). Ninguna es pérdida: en los casos de `BT-03`, `BT-04` y `BT-05` (los porcentajes
  más altos, 12,9%, 11,2% y 5,4%) la referencia está *peor* que el corpus, con glifos duplicados
  (`ddee`, `mmeeto`, `dessde`) mientras el `.md` sale limpio.

La tabla crítica se verificó a mano contra el PDF original: la tabla de intensidades admisibles para
cables de cobre de BT-19 (pág. 9) coincide fila por fila, incluida la última sección de 630 mm².
