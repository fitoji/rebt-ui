# Notas: subrayar el texto y tenerlo a mano

Rama `main` (directo, como el resto del historial). Runner de tests: `node --test` (nativo de
Node, sin dependencias de test); type gate: `tsc --noEmit`.

## Specs

- **S1** — *"me gustaria una feature en la que pueda subrayar o resaltar un texto y que quede
  guardado en un acordion Notas y tambien pueda ver lo en el texto"* (pedido original, 21/10/2026).
- **S2** — *"en los dos"*: la feature va en **la guía y en el lector del REBT** (decisión del
  usuario, 21/10/2026).
- **S3** — Las notas se guardan en el navegador (`localStorage`), como los favoritos: sin
  servidor ni cuenta, y sobreviven a la sesión.
- **S4** — El texto resaltado se ve **en el texto**, con el color de la marca de la app, y se
  puede volver a él desde la nota (ir al resaltado).
- **S5** — La nota guarda **el texto y su contexto** (lo que hay antes y después), no una
  posición: si el texto se mueve, la nota lo sigue; si el texto ya no está, la nota se avisa y
  se puede borrar.

## Tasks

| # | Tarea | Specs | Ruta | Riesgo | Commit |
|---|-------|-------|------|--------|--------|
| T1 | `src/notas.ts`: el modelo de la nota, la persistencia y el hallazgo del texto en el DOM | S3,S5 | inline | — | 1 |
| T2 | La guía: el acordeón «Notas», el botón flotante y los resaltados | S1,S4 | inline | — | 1 |
| T3 | El lector: el acordeón «Notas» en la barra lateral y los resaltados | S1,S2,S4 | inline | item 3 | 2 |
| T4 | Estilos del resaltado, del botón flotante y de la lista de notas | S4 | inline | — | 2 |
| T5 | Verificación en el navegador de las dos vistas | S1,S2,S4 | inline | — | 2 |

**Trazabilidad de ruta**: no hay trigger de delegación (ni paralelismo —las dos vistas
comparten el modelo de datos— ni backstop de contexto). Todo inline.

## Decisiones

- **El ancla de una nota es el texto y su contexto**, no una ruta de nodos ni un offset. Un
  offset se rompe en cuanto el corpus se regenera; con el contexto, la nota sigue al texto
  aunque se mueva, y si el texto cambió la nota se marca como "no se encuentra" y se puede
  borrar. Es lo que hacen las herramientas de resaltado de verdad.
- **La nota guarda un fragmento de contexto de 40 caracteres por lado.** Con eso se desambigua
  un texto que se repite, que en un reglamento técnico pasa con cada "conectable" o "protección".
- **En la guía y en el lector se resuelve el mismo modelo, cada uno en su espacio.** La guía
  inyecta el texto como HTML y React no lo controla, así que se puede envolver en `<mark>`
  directamente. El lector lo renderiza React, y ahí el resaltado se aplica sobre el DOM ya
  montado, con el artículo re-montado al cambiar de redacción (para que React nunca tenga que
  reconciliar un texto que le partimos).
- **Las notas son del documento (o del bloque) que se está leyendo**, no una lista global: en
  el momento de subrayar son las que tenés a mano. El acordeón «Notas» de cada vista lista las
  suyas, y desde ahí se va al resaltado.

## Log

- **L1** (2026-10-21) — *"me gustaria una feature en la que pueda subrayar o resaltar un texto y
  que quede guardado en un acordion Notas y tambien pueda ver lo en el texto"*.
- **L2** (2026-10-21) — **Alcance**: el usuario eligió "en los dos" (la guía y el lector). La
  diferencia no es de gusto: el texto de la guía se inyecta como HTML y React no lo controla, y
  el del lector lo renderiza React, donde envolver en `<mark>` a ciegas puede romper la
  reconciliación cuando el componente se vuelve a renderizar.
- **L3** (2026-10-21) — **El botón flotante**: al seleccionar texto aparece un botón pegado a
  la selección; al pulsarlo se guarda la nota. Se escucha `mouseup` y `keyup` (con teclado
  también se puede subrayar) y se ignora la selección que no cae dentro del texto.
- **L4** (2026-10-21) — **Verificado en el navegador, en las dos vistas**, con un arrastre
  real de ratón (con `Input.dispatchMouseEvent`, no una selección hecha por código: esa no
  dispara el `mouseup` que escucha la app). En la guía y en el lector: el botón aparece, la
  nota se guarda, el texto queda resaltado, el acordeón la lista, al recargar sigue ahí y al
  quitarla desaparece el resaltado.
- **L5** (2026-10-21) — **El caso delicado del lector**: ahí el texto lo renderiza React, y
  envolverlo en `<mark>` a ciegas puede romper la reconciliación. Se comprobó justo eso:
  cambiando el tema (que re-renderiza la app entera) el resaltado sobrevive, el texto sigue
  entero y la app no se rompe. El artículo además se re-monta al cambiar de redacción
  (`key`), para que React nunca tenga que reconciliar un texto que le partimos.
- **L6** (2026-10-21) — **El ancla es el texto y su contexto**, no una posición: un offset se
  rompe en cuanto el corpus se regenera. Con 40 caracteres de contexto a cada lado, un texto
  que se repite (que en un reglamento técnico pasa con cada «conectable») se desambigua, y si
  el texto ya no está, la nota simplemente no se resalta.
