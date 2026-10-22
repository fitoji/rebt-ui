# Tailwind y la barra lateral de shadcn

Rama `feat/tailwind` (se.mergea a `main` cuando el usuario lo decida). Runner de tests:
`node --test` (nativo de Node, sin dependencias de test); type gate: `tsc --noEmit`.

## Specs

- **S1** — *"utiliza la sidebar de shadcn"* (pedido original).
- **S2** — *"Migrar todo a Tailwind"* (decisión del usuario entre las tres opciones que se le
  ofrecieron: su API en nuestro CSS, el componente literal de shadcn, o migrar todo a Tailwind).
- **S3** — La paleta y las tipografías del proyecto siguen siendo las del reglamento: la
  migración no puede cambiar la identidad visual.
- **S4** — La barra lateral del lector y la de la guía son la misma pieza (la de shadcn), con el
  mismo comportamiento en las dos vistas.
- **S5** — La barra se puede plegar y desplegar, y el estado se recuerda entre sesiones.

## Tasks

| # | Tarea | Specs | Ruta | Riesgo | Commit |
|---|-------|-------|------|--------|--------|
| T1 | Tailwind v4 + `@theme inline` con la paleta del proyecto | S2,S3 | inline | 3 | 1 |
| T2 | `shadcn init` + `add sidebar`, con las variables mapeadas a la paleta | S1,S2 | inline | 3 | 1 |
| T3 | Lector: `SidebarProvider` + `Sidebar` + `SidebarInset` | S1,S4 | inline | 3 | 1 |
| T4 | Guía: lo mismo que el lector | S1,S4 | inline | 3 | 1 |
| T5 | El tirador y el atajo ⌘B para plegar y desplegar | S1,S5 | inline | — | 1 |
| T6 | El CSS viejo, a utilities de Tailwind | S2 | inline | 3 | 2 |

**Trazabilidad de ruta**: ninguna tarea dispara un trigger de delegación (ni paralelismo ni
backstop de contexto). Todo inline, con verificación por captura de pantalla en cada paso.

## Decisiones

- **`@theme inline`, no `@theme`.** Con `inline`, la utilidad usa la variable directamente
  (`bg-plano` → `background-color: var(--plano)`), así el tema oscuro la cambia en vivo. Con
  `@theme` normal, Tailwind emitiría el valor y el tema oscuro no llegaría a las utilidades.
- **El preflight obliga a fijar `line-height: normal` en el `body`.** Tailwind pone 1.5 en el
  `html`; el navegador usaba `normal`, que es el ritmo vertical de la app. Sin esa línea, la
  barra lateral y los botones cambiaban de altura (4-9 % de los píxeles de las capturas).
- **Las variables de shadcn apuntan a la paleta del proyecto con `var()`.** Una sola definición
  sirve para los dos temas: al cambiar `--plano`, cambian `--background`, `--sidebar` y todo lo
  demás. Por eso el bloque `.dark` de shadcn se borró entero: el tema oscuro del proyecto ya
  llega solo.
- **La variante `dark` es `[data-theme='dark']`, no `.dark`.** El proyecto elige el tema con un
  atributo en `<html>`, no con una clase.
- **La barra mide 22rem, no los 16rem por defecto de shadcn.** Es el ancho que ya tenía la
  columna del proyecto; cambiarlo movía todo el texto del lector.
- **El contenido sigue scrolleando en su propia columna.** Con el `SidebarInset` de shadcn, la
  página entera scrollea; se fija `height: 100svh` en el inset para que el lector y la guía
  conserven el comportamiento de antes.
- **La barra plegada deja un tirador en el borde izquierdo.** En modo *offcanvas* no queda nada
  visible al plegarla: sin ese tirador, la única forma de volver a abrirla sería el atajo de
  teclado.

## Log

- **L1** (22/10/2026) — *"utiliza la sidebar de shadcn"*.
- **L2** (22/10/2026) — Preguntadas las tres vías posibles; el usuario elige *"Migrar todo a
  Tailwind"*.
- **L3** (22/10/2026) — Línea base: cuatro capturas del proyecto antes de tocar nada
  (`inicio`, `lector`, `guia`, `notas`).
- **L4** (22/10/2026) — Tailwind v4 instalado. Al activarlo, el preflight cambia el
  interlineado del `body`: se fija `line-height: normal` y las cuatro vistas quedan con **0
  píxeles** de diferencia.
- **L5** (22/10/2026) — `shadcn init` + `add sidebar`. El init mete la fuente Geist y un import a
  un archivo que no existe: se quitan (el proyecto usa Barlow Semi Condensed).
- **L6** (22/10/2026) — Las variables de shadcn, mapeadas a la paleta del proyecto; se borra el
  bloque `.dark`.
- **L7** (22/10/2026) — Lector y guía convertidos al patrón de shadcn. Verificación por
  comparación de píxeles: `inicio` 0 %, `notas` 0 %, `guia` 0,08 % y `lector` 1,04 % — la diferencia
  del lector es el botón nuevo en el encabezado (1.022 px) y el subpíxel de la tabla (12.140 px,
  0,05 px en la primera celda: el preflight redistribuye el ancho de las columnas).
- **L8** (22/10/2026) — Verificado el móvil (el cajón es ahora un `Sheet` de shadcn) y el atajo
  ⌘B, que pliega la barra y deja el tirador para volver a abrirla.
