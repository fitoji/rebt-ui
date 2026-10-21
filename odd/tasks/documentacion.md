# Documentación del proyecto

Rama `main` (directo, como el resto del historial).

## Specs

- **S1** — *"revisa la documentacion, hazla mas linda, agrega iconos imagenes, etc utiliza skills o
  busca skills para hacerlo mejor"* (pedido original, 21/10/2026).
- **S2** — Todo en **español**, como el resto de la documentación del proyecto.
- **S3** — Las imágenes son **reales**: capturas de la app en producción y una marca hecha con la
  identidad que la app ya tenía. Nada de imágenes de adorno.
- **S4** — La documentación tiene que seguir siendo **fácil de leer**, no un catálogo: primero la
  respuesta, después el detalle.

## Tasks

| # | Tarea | Specs | Ruta | Riesgo | Commit |
|---|-------|-------|------|--------|--------|
| T1 | La marca: un SVG con la franja del conductor de protección | S3 | inline | — | 1 |
| T2 | Tres capturas reales de la app (portada, lector, guía) | S3 | inline | — | 1 |
| T3 | README reescrito: cabecera, badges, índice, capturas, diagrama y admoniciones | S1,S4 | inline | — | 1 |
| T4 | Puntero del README del corpus al del proyecto | S4 | inline | — | 1 |

**Trazabilidad de ruta**: no hay trigger de delegación. Todo inline.

## Decisiones

- **La marca sale de la app, no de la nada.** El CSS ya tenía una identidad: la franja verde y
  amarilla del conductor de protección, que el propio comentario llama "la única marca decorativa".
  El logo es esa franja en una baldosa oscura, con la paleta exacta (`--tinta`, `--tierra-a`,
  `--tierra-b`). Una identidad nueva habría sido inventar una segunda verdad.
- **Las capturas son de producción, no de maqueta.** Se tomaron con Chrome headless contra
  `rebt-ui.fitoji.workers.dev`, con el tema oscuro forzado, y en el punto donde se ve lo que
  importa: la tabla con sus tres acciones.
- **Los diagramas se validan, no se escriben a ciegas.** El de Mermaid se renderizó con
  `mermaid-cli` para comprobar que la sintaxis es válida.
- **Los skills que se instalaron, ninguno**: el de GitHub oficial (`create-readme`) se leyó y se
  aplicaron sus criterios (GFM, admoniciones, un logo en la cabecera, "no abuses de los emoji"), y
  para las capturas se usó el Chrome headless que ya se venía usando en el proyecto, que da más
  control que los skills de captura que hay sueltos (y que además tienen entre 40 y 1.000
  instalaciones).

## Log

- **L1** (2026-10-21) — *"revisa la documentacion, hazla mas linda, agrega iconos imagenes, etc
  utiliza skills o busca skills para hacerlo mejor"*.
- **L2** (2026-10-21) — **Busqué skills** para el trabajo: `github/awesome-copilot@create-readme`
  (19K instalaciones, repo oficial de GitHub) y `spillwavesolutions/design-doc-mermaid@design-doc-mermaid`
  (76K) para los diagramas. Se leyó el primero y se aplicaron sus criterios; el segundo no hizo
  falta al final, porque el diagrama es uno solo y se validó con `mermaid-cli`.
- **L3** (2026-10-21) — **El README quedó** con: logo, título, descripción, badges, la captura de
  la portada, un índice visual con las dos vistas, un diagrama de la arquitectura, y las secciones
  de siempre con admoniciones de GitHub (`> [!TIP]`, `> [!NOTE]`, `> [!WARNING]`) para lo que hay
  que tener en cuenta de verdad: el requisito de Node, el `noUncheckedIndexedAccess` apagado a
  propósito, los dos secrets del deploy y el Pages viejo que hay que borrar.
- **L4** (2026-10-21) — **Verificado**: un script comprueba que todas las imágenes y rutas que
  menciona el README existen, que los scripts npm son los de verdad y que el diagrama Mermaid
  renderiza. La captura del logo se comprobó a tres tamaños (120, 64 y 28 px) para que se lea
  también en pequeño.
