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
- **L7** (2026-10-21) — **Una página con todas las notas** (21/10/2026, pedido del usuario):
  *"me gustaria si cliequeo en el acorderon de notas se abra una pagina con todas las notas,
  pra poder visualizarlas mejor"*. La ruta nueva `#/notas` las lista todas, de la guía y del
  lector, con el texto entero, el contexto en el que quedó y el documento del que salen; desde
  ahí se salta al texto (la ruta lleva `?nota=<id>`, así que el enlace se puede compartir) o se
  borran.
- **L8** (2026-10-21) — **Un bug que salió al hacerlo**: las notas tenían **tres** instancias
  del hook (la guía, el lector y la nueva página), cada una con su estado, así que la página
  veía la lista vacía aunque las notas estuvieran guardadas. Ahora el estado es **uno solo**, en
  el Router, que es el padre de las tres vistas. Es el mismo error que el de los favoritos, y
  por eso las dos features lo resuelven igual: el estado arriba.
- **L9** (2026-10-21) — **La nota guarda de qué vista y de qué documento viene** (el título
  incluido), para que la página se pueda leer sin tener que cargar los índices. Las notas
  guardadas antes, sin esos campos, se deducen del id: el REBT usa ids en minúsculas y la
  guía en mayúsculas, y los dos universos no se cruzan.
- **L10** (2026-10-21) — **Las notas tienen color** (21/10/2026, pedido del usuario):
  *"me gustaria que el sistema de resaltado de notas, le pueda cambiar el color, que se pueda
  en rojo, amarillo o verde"*. El color se elige **al guardar** (el botón flotante lleva los
  tres) y se cambia después desde la página de notas, que tiene los tres puntos por nota.
  Amarillo, verde y rojo son de la familia de la paleta de la app, con su versión para el
  tema oscuro. El color le dice de un vistazo **para qué** es un pasaje: notable, importante,
  ojo.
- **L11** (2026-10-21) — **Verificado**: la paleta del botón flotante muestra los tres
  colores con su fondo real; guardar con el verde deja el resaltado `nota nota-verde`; desde
  la página se cambia a rojo y el resaltado del texto pasa a `nota nota-rojo`.
- **L12** (2026-10-21) — **Filtro por color** (21/10/2026, pedido del usuario): *"ahora
  cuando voy a notas me gustaria un filtro para ver las de un color u otro"*. Arriba de la lista
  hay una ficha por color, con el punto del color y **cuántas hay de cada uno** ("Verdes (2)"),
  más la de "Todas". Con el color ya en la nota, el filtro es casi obvio.
