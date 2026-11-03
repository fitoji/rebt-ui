---
name: REBT
description: Lectura fiel del reglamento eléctrico, compuesta como una lámina técnica.
colors:
  papel-de-plano: "#e8edf0"
  hoja: "#fbfcfc"
  tinta-de-plano: "#17252e"
  tinta-secundaria: "#4a5c67"
  linea-de-reticula: "#c9d4da"
  azul-de-plano: "#1f5f85"
  azul-de-plano-lavado: "#dcebf3"
  marron-de-fase: "#7a4a2b"
  amarillo-de-marca: "#ffe49a"
  verde-de-proteccion: "#6fae00"
  amarillo-de-proteccion: "#f2c500"
  nota-verde: "#cbeaa2"
  nota-roja: "#f6c3bb"
  aviso-exito: "#2f7a3a"
  aviso-exito-fondo: "#e4f3e6"
  aviso-error: "#b3392e"
  aviso-error-fondo: "#fbe8e4"
  papel-de-plano-oscuro: "#0f1a20"
  hoja-oscura: "#16232b"
  tinta-oscura: "#e3ebee"
  tinta-secundaria-oscura: "#9db0ba"
  linea-oscura: "#2b3c46"
  azul-de-plano-oscuro: "#86c1e3"
  azul-de-plano-lavado-oscuro: "#1e3441"
  marron-de-fase-oscuro: "#d9a47c"
  amarillo-de-marca-oscuro: "#5c4b12"
  aviso-exito-oscuro: "#7fce8b"
  aviso-error-oscuro: "#f09189"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0em"
  titular:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
  cuerpo:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  lectura:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 0.62vw + 0.62rem, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.62
  rotulo:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.13em"
  dato:
    fontFamily: "ui-monospace, SF Mono, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  lg: "6px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  reticula: "120px"
components:
  boton-primario:
    backgroundColor: "{colors.azul-de-plano}"
    textColor: "{colors.hoja}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  boton-secundario:
    backgroundColor: "{colors.papel-de-plano}"
    textColor: "{colors.tinta-de-plano}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  campo-busqueda:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta-de-plano}"
    typography: "{typography.cuerpo}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  cajetin:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta-de-plano}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.xs}"
  rotulo:
    textColor: "{colors.tinta-secundaria}"
    typography: "{typography.rotulo}"
  dato:
    textColor: "{colors.tinta-de-plano}"
    typography: "{typography.dato}"
  nota-de-texto:
    backgroundColor: "{colors.amarillo-de-marca}"
    textColor: "{colors.tinta-de-plano}"
    rounded: "{rounded.xs}"
---

# Design System: REBT

## Overview

**Creative North Star: "El plano de taller"**

Este sistema compone el reglamento como la copia de trabajo de un plano: papel gris azulado con retícula, líneas de 1 px que separan sin decorar, rótulos en versalita y cifras en mono tabular. No es una estética técnica aplicada por encima de un lector de documentos; es el soporte que hace legible un texto normativo largo, y por eso todo lo que compite con la lectura se fue.

El color no es una paleta inventada: sale del propio reglamento. El azul del conductor neutro lleva enlaces, cabeceras y foco; el marrón de fase queda para lo secundario; y la franja verde-amarilla del conductor de protección es la única marca de "estás aquí". Esa franja sólo aparece donde significa algo —la fila activa, la barra de indexado, el logotipo— y nunca como adorno.

El sistema es plano. La profundidad se construye por capas tonales —plano, hoja— y una sola sombra existe en toda la app, para el popover de notas y los diálogos. La calidez no viene del ornamento sino del color de resalte: las notas amarillas, verdes y rojas tienen peso visible y son la parte del sistema donde el lector deja su marca.

**Key Characteristics:**
- Retícula de 24 px con línea mayor cada 5 como fondo de toda la app, fija al scroll.
- Jerarquía por línea de 1 px y capa tonal, no por sombra ni por relleno.
- Dos familias: Barlow Semi Condensed para la interfaz, IBM Plex Sans para el texto que se lee de corrido.
- La lámina manda: título, cajetín, tablas y navegación comparten un ancho; la prosa se corta a su medida dentro de ella.
- Mono reservado a códigos, medidas y cifras, con numerales tabulares.
- Una única curva de movimiento, sin rebotes, con camino de movimiento reducido en cada animación espacial.
- En las vistas de lectura el borde derecho es la barra de progreso: no hay segunda barra de scroll.

## Colors

Paleta de plano: grises azulados de bajo contraste para el papel, un azul de conducto para la acción, y tres familias de resalte que pertenecen al lector.

### Primary
- **Azul de plano** (#1f5f85): enlaces, cabeceras de grupo, foco visible y el botón primario. Es el azul del conductor neutro del reglamento, no un azul de marca.
- **Azul de plano lavado** (#dcebf3): fondo inducido para hover, resplandor superior del body y estados seleccionados. Nunca como texto.

### Secondary
- **Marrón de fase** (#7a4a2b): acentos secundarios y el estado de favorito marcado. Aparece poco, y por eso señala.

### Tertiary
- **Amarillo de marca** (#ffe49a): el resaltado de texto y la nota amarilla. Es el mismo token: lo que el lector subraya y lo que el lector anota se ven igual.
- **Verde de protección** (#6fae00) y **Amarillo de protección** (#f2c500): exclusivos de la franja del conductor de protección —la marca de posición, la barra de indexado y el logotipo.

### Neutral
- **Papel de plano** (#e8edf0): fondo de la aplicación.
- **Hoja** (#fbfcfc): superficie de tarjeta, barra lateral, cajetín y popover. Un paso más claro que el papel; ahí está toda la elevación del sistema.
- **Tinta de plano** (#17252e): texto principal.
- **Tinta secundaria** (#4a5c67): rótulos, metadatos, texto de apoyo.
- **Línea de retícula** (#c9d4da): bordes, separadores y la propia retícula del fondo.

### Avisos
- **Verde de acierto** (#2f7a3a sobre #e4f3e6) y **rojo de fallo** (#b3392e sobre #fbe8e4): el veredicto del cuestionario y los errores de carga. Fondo teñido más tinta propia, con el color de filo como acento.

### Dark
El tema oscuro no invierte: recalibra. El papel baja a #0f1a20 y la hoja a #16232b (la hoja sigue siendo más clara que el papel, para conservar la capa tonal). El azul sube a #86c1e3 porque el original no alcanza contraste sobre fondo oscuro, y los resaltes de nota se oscurecen para no encandilar. Los avisos cambian de valor, no de rol.

### Named Rules
**The Resalte Is Not Ink Rule.** Los colores de nota y de protección son fondos. Como tinta sobre papel dan alrededor de 1,5:1. Para texto de veredicto se usan los tokens de aviso, nunca `--nota-rojo`, `--tierra-a` ni `--marca`.

**The Marca Única Rule.** La franja verde-amarilla significa "estás acá" y no otra cosa. No se usa como borde decorativo, fondo de tarjeta ni acento genérico. Si aparece, hay una posición que señalar.

**The Two-Theme Rule.** Todo color nuevo se declara en el `:root` claro y en el oscuro. Una variable sin su par oscuro es un bug, no una decisión pendiente.

## Typography

**Display Font:** Barlow Semi Condensed (con Arial Narrow, system-ui)
**Body Font:** IBM Plex Sans (con Segoe UI, system-ui)
**Label/Mono Font:** mono del sistema (SF Mono, Menlo, Consolas)

**Character:** Barlow Semi Condensed es una condensed de señalética: entra mucho texto en poco ancho y se lee como rótulo, no como prosa. IBM Plex Sans aparece donde hay párrafos que se leen de corrido —el cuerpo del reglamento y la guía—: es una grotesca humanista de origen técnico, de aperturas abiertas y formas suaves, que aguanta párrafos largos sin el ruido de una serif ni la frialdad de una geométrica. El cambio de familia, más un cuerpo mayor, es la señal de que empezó el texto oficial. El mono no es decoración técnica: es la tipografía de las cifras del plano.

### Hierarchy
- **Display** (600, 2.1rem, 1.1): título de bloque del reglamento y cabecera de la portada. Equilibrado con `text-wrap: balance`.
- **Titular** (600, 1.5rem, 1.15): capítulo de la guía y títulos de sección.
- **Título** (600, 1.2rem, 1.3): subtítulo dentro de un bloque, cabecera de tarjeta.
- **Lectura** (400, `clamp(1.0625rem, 0.62vw + 0.62rem, 1.25rem)`, 1.62): cuerpo del texto oficial, en IBM Plex Sans, con ancho máximo de 40em (unas 88 letras) y partición de palabras. Los títulos internos del texto se miden en `em` de este cuerpo, para que crezcan con él.
- **Cuerpo** (400, 1rem, 1.5): interfaz —barra lateral, botones, formularios—, en condensed.
- **Rótulo** (600, 0.68rem, 1.2, tracking 0.13em, mayúsculas): etiquetas de campo y cabeceras de grupo. Es la pieza que hace que un bloque se lea como cajetín.
- **Dato** (400, 0.9rem, tabular): números de artículo, medidas, porcentajes, códigos ITC-BT. `font-variant-numeric: tabular-nums` y cero barrado.

### Named Rules
**The Mono Is For Data Rule.** El mono se usa para códigos, medidas y cifras; nunca para frases. Una oración en mono se lee como consola, no como plano.

**The Reading Face Rule.** La lectura de corrido va en IBM Plex Sans con un cuerpo propio, más grande que la interfaz. Es lo que marca el texto que viene del BOE o del Ministerio: si algo se lee como documento y no como herramienta, está en la tipografía de lectura.

**The Measure Grows With The Type Rule.** La columna se define en `em` del cuerpo de lectura (`40em`), nunca en píxeles: cuando la pantalla es más ancha, sube el cuerpo y no la cantidad de letras por línea. Una línea de 130 caracteres no es aprovechar la pantalla, es cansar al lector.

## Layout

La retícula del fondo es el sistema de medida: 24 px con línea mayor cada 120 px, fija al scroll, pintada con gradientes en el `body` en vez de capas absolutas. No es ornamento —es la referencia contra la que se alinean las tarjetas y las líneas de 1 px.

Los anchos son deliberados y distintos por tarea, pero salen de una sola medida: **la lámina es la medida más un margen fijo de 16rem** (`--lamina: calc(var(--medida) + 16rem)`). El título, el cajetín, las tablas y la navegación ocupan la lámina entera; la prosa se corta a 40em dentro de ella y deja un margen derecho que es el sitio de las marcas —la barra de progreso, los filetes—, no un hueco. Así la proporción entre texto y hoja es la misma en un portátil de 1440 que en un monitor de 1920, porque las dos crecen juntas.

La barra lateral mide 22rem y queda fija, porque el índice es el mapa de la lámina.

La densidad es de instrumento: filas de índice de una sola línea con la marca a la izquierda, padding vertical de 0.35rem en listas densas y de 1.15rem en las entradas de la portada. El espacio entre bloques lo da el margen del título (2.2rem arriba), no un separador.

Responsive: por debajo de `md` la barra lateral pasa a offcanvas con `transition-transform` de 300 ms y el lector pierde el índice lateral pero gana el ancho completo; el cajetín cae a dos columnas y la última ficha, si queda sola, ocupa la fila. Las tablas del corpus scrollean dentro de su contenedor, nunca la página. La tabla del archivo —`#/antiguos` y `#/cambios`— es la excepción: son cinco campos cortos, así que en móvil se apila en tres renglones con `display: grid` en el `tr`. Esconder columnas dejaría un título sin su año. En móvil el cuerpo de lectura baja al mínimo del `clamp` y se apaga la partición de palabras: con la línea corta sólo añadiría guiones.

## Elevation & Depth

El sistema es plano por defecto. La profundidad se comunica por capa tonal: papel de plano para el fondo, hoja para cualquier superficie que se apoye encima. Un borde de 1 px hace el trabajo que en otros sistemas haría una sombra.

Existe una sola sombra en toda la aplicación, y es para lo que de verdad flota: el popover de creación de nota y los diálogos.

### Shadow Vocabulary
- **Popover flotante** (`0 2px 10px rgb(0 0 0 / 0.4)`): sólo el menú de nota sobre la selección y los diálogos modales. En ningún otro lugar.

### Named Rules
**The Flat-By-Default Rule.** Una superficie en reposo no proyecta sombra. Si algo parece necesitar una, necesita una línea de 1 px o un paso tonal, no una sombra.

**The One Shadow Rule.** Un solo valor de sombra en todo el proyecto. Una segunda sombra es una decisión de sistema, no un ajuste local.

## Shapes

Lenguaje de esquina corta y consistente con la idea de línea dibujada: 4 px es el radio por defecto de controles, tarjetas y cajetines; 3 px en los elementos más chicos (botones de icono, insignias); 2 px en el resaltado de texto; 6 px existe pero es raro. Nada redondeado por encima de 6 px excepto las barras de scroll, que usan 999 px para poder ser finas.

Los bordes son siempre de 1 px y del color de línea. No hay bordes de 2 px, ni bordes de color de acento como decoración, ni bordes laterales gruesos: un filo de color a un costado es el patrón de tarjeta genérica que este sistema evita. La única excepción deliberada es la cita tipográfica en bloque del markdown, que conserva su filete porque es una cita, no una tarjeta.

El cajetín lleva la lógica al extremo: sus celdas se separan con un `gap` de 1 px sobre fondo de línea, así la retícula es el propio borde y no hay doble línea en ningún cruce.

## Components

### Buttons
- **Shape:** esquina de 4 px, padding de 8 px × 16 px, peso 600.
- **Primary:** fondo azul de plano, texto hoja. En hover sube 1 px (`translateY(-1px)`) y sube el brillo; nunca cambia de color.
- **Secondary:** fondo papel de plano, borde de línea, texto tinta. En hover el borde pasa a azul de plano y el fondo a azul lavado.
- **Hover / Focus:** transiciones de 200 ms con `--ease-plano`. El foco es siempre `outline: 2px solid var(--neutro)` con `outline-offset: 2px`; jamás se elimina el anillo en un campo de texto.
- **Disabled:** opacidad 0.45 y sin `pointer-events`.

### Chips
- **Style:** las muestras de color de nota son círculos de 0.8rem con borde de hoja al 50 % y escala 110 % en hover.
- **State:** seleccionado se marca con el anillo de foco, no con un borde extra.
- **Estado y relación:** el chip de estado es un borde de 1 px con el texto adentro —`Vigente`, `Derogada`, `SE MODIFICA`, `SE ACTUALIZA`, `SE DEROGA`, `SE DECLARA`—, nunca sólo color: el color refuerza lo que el texto ya dice. Lo vigente y lo que modifica o actualiza van en `--neutro`; lo derogado, lo derogado por sentencia y lo que declara una nulidad, en `--fase`.

### Cards / Containers
- **Corner Style:** 4 px.
- **Background:** hoja sobre papel de plano.
- **Shadow Strategy:** ninguna en reposo.
- **Border:** 1 px de línea de retícula.
- **Internal Padding:** 16 px en densidad normal, 20 px en paneles de contenido.

### Inputs / Fields
- **Style:** fondo hoja, borde de 1 px de línea, radio 4 px, padding 6 px × 10 px, tipografía de cuerpo.
- **Focus:** anillo de 2 px del azul de plano con offset 2. Sin `outline: none`, nunca.
- **Error / Disabled:** el error usa el rojo de aviso en borde y texto; el disabled baja a opacidad 0.55.

### Navigation
La barra lateral es el índice de la lámina: fondo hoja, borde derecho de 1 px, filas de una línea. La fila activa se marca con la franja del conductor de protección —un elemento único que se desplaza entre filas con `transform`, medido con `ResizeObserver`— y no con un fondo de color por fila. Si la fila activa cae dentro de un grupo plegado, la marca desaparece: no miente sobre dónde está el bloque abierto.

Los grupos se pliegan con `grid-template-rows` de `0fr` a `1fr` en 300 ms; el contenido queda montado y se marca `inert` + `aria-hidden` para el lector de pantalla.

### Cajetín (signature)
El bloque de rótulos que cierra cada lámina: una retícula de celdas de 1 px sobre fondo de línea, cada celda con un rótulo en versalita y un valor en tinta. Encabeza cada bloque del reglamento, cada guía y la portada. Es la pieza que más rápido comunica de qué sistema se trata, y la que hay que respetar cuando se agregue una vista nueva.

### Pie de lámina (signature)
El cajetín que cierra la portada: la firma del proyecto a la izquierda —marca, nombre y una línea de qué es— y cuatro campos de dato a la derecha (licencia, código, correcciones, fuente), con la letra pequeña como última fila de la placa. Usa la misma retícula de 1 px del cajetín y el ancho de la lámina. Los valores van en `.dato` y en tinta; el azul y el subrayado aparecen sólo al pasar por encima, porque son enlaces de consulta, no llamadas a la acción. El pie del landing es el único sitio del sistema donde esto ocurre.

### Esqueleto de carga (signature)
Mientras carga un bloque o una guía se muestra una lámina de líneas del ancho real del texto con un barrido de 1.5 s, no un "Cargando…" en texto corrido. La barra de indexado usa la franja verde-amarilla en movimiento continuo: es la única animación en bucle del sistema cuando nadie toca nada, y vive dentro de una barra de 6 px.

### Barra de progreso de lectura (signature)
En el lector y en la guía, el borde derecho de la ventana es la barra de scroll: 6 px de la franja del conductor de protección que avanzan hasta el punto de lectura, sobre una vía de 6 px del color de la línea, siempre dibujada, con el hilo de 1 px de la retícula como canto interior. No hay barra nativa en esas vistas —el progreso dice más que un tirador— y por eso la franja aparece con un significado literal: **estás acá**. La vía se ve desde el primer píxel del documento, así la barra está ahí aunque todavía no se haya leído nada; la franja la va cubriendo. Mientras se scrollea, la franja marcha (la misma animación de la barra de indexado) y aparece una cifra en mono a su lado; al detenerse, la cifra se retira y la franja se queda quieta. En pantallas de menos de 1200 px la cifra no se muestra: no hay margen donde ponerla sin tapar el texto.

La barra se monta en el `body`, fuera del contenedor que scrollea: cualquier `transform` de la vista —la animación de entrada lo deja puesto— lo convertiría en el bloque contenedor de un `position: fixed` y la barra se iría con el texto al bajar.

### Lectura que entra
Cada bloque del texto —párrafo, título, tabla, figura— aparece cuando llega al borde inferior de la ventana: sube 0.62rem y se aclara en 420 ms, con una cascada de 35 ms entre hermanos que entran juntos, tope de cuatro. Lo que ya está a la vista no se anima nunca, y lo que se salta de golpe (una coincidencia de búsqueda, una nota) se suelta sin animación. Con movimiento reducido el texto aparece ya puesto.

## Do's and Don'ts

### Do:
- **Do** separar con una línea de 1 px del color de retícula o con un paso tonal de papel a hoja.
- **Do** usar `.rotulo` para etiquetas de campo y `.dato` para cifras, códigos y medidas.
- **Do** mover la marca del conductor de protección con `transform` entre filas; el estado se desplaza, no parpadea.
- **Do** usar `--ease-plano` (`cubic-bezier(0.22, 1, 0.36, 1)`) para todo lo que entra, y dar a cada animación espacial su rama de `prefers-reduced-motion` en la que el espacio se apaga y el color y el estado siguen.
- **Do** declarar cada color nuevo en ambos temas.
- **Do** mantener el texto oficial a 40em de ancho máximo (unas 88 letras), en IBM Plex Sans y con el cuerpo de lectura; los títulos internos del texto, en `em`.
- **Do** dejar que la lámina crezca con la medida: la proporción entre hoja y texto se mantiene en cualquier pantalla.
- **Do** dejar el borde derecho libre en las vistas de lectura: ahí van la barra de progreso y nada más.

### Don't:
- **Don't** usar `--nota-rojo`, `--tierra-a` ni `--marca` como color de texto: son fondos de resalte y no alcanzan contraste como tinta.
- **Don't** devolver la topografía al fondo de la aplicación. Compite con el texto corrido y se retiró por eso; sobrevive sólo en la portada, al 20 %, anclada a una esquina.
- **Don't** agregar sombras a tarjetas, filas ni paneles, ni un segundo valor de sombra al sistema.
- **Don't** usar bordes laterales gruesos de color (`border-left: 4px`) como acento: es el patrón de tarjeta genérica del que este sistema se separó.
- **Don't** poner frases en mono, ni subir el radio de un control por encima de 6 px.
- **Don't** usar rebotes, springs ni overshoot en el movimiento: una sola curva, desaceleración larga.
- **Don't** emplear la franja verde-amarilla como decoración; sólo señala una posición. La barra de progreso es el único sitio donde puede llenar una tira entera, porque esa tira *es* la posición.
- **Don't** devolver la barra de scroll nativa a las vistas de lectura: dos barras a la derecha dicen lo mismo y no dicen cuánto falta.
- **Don't** quitar el anillo de foco de un campo de texto para "limpiar" el diseño.
