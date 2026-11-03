# Lectura ancha: otra fuente, la lámina completa, el texto que entra y la barra de progreso

Rama `main` (directo, como el resto del historial). Verificación: `npm run check` (type gate +
98 tests) y capturas con Chrome por CDP a 390, 1024, 1440 y 1920 px, en claro y oscuro.

## Specs

- **S1** — *"revisa el ancho de los textos, me parece muy estrecho, quizás que aproveche más la
  pantalla"* (pedido original, 03/11/2026).
- **S2** — *"me gustaría que los textos del reglamento tengan otra fuente, más suave y técnica"*.
- **S3** — *"cuando hago scroll el texto que va surgiendo de abajo esté animado"*, también en la guía.
- **S4** — *"una barra de scroll vertical animada mostrando el progreso de lectura del texto"*.
- **S5** — Vale para las dos superficies de lectura: el lector del REBT y el visor de la guía.
  La portada, las notas y los cuestionarios quedan como estaban salvo la tipografía.

## Tasks

| # | Tarea | Specs | Ruta | Riesgo |
|---|-------|-------|------|--------|
| T1 | IBM Plex Sans como tipografía de lectura; tokens `--lectura`, `--lectura-tam`, `--medida`, `--lamina` | S2,S1 | inline | Entrega de la fuente (Google Fonts) |
| T2 | Medida en `em` del cuerpo y lámina = medida + margen fijo; cajetín, tablas y navegación al ancho de la lámina | S1 | inline | Que la medida quede demasiado larga |
| T3 | `src/hooks/useRevelar.ts`: la cascada del texto al entrar | S3 | inline | Texto invisible si el observador falla |
| T4 | `src/BarraProgreso.tsx`: la franja de progreso en el borde derecho | S4 | inline | Coste por frame |
| T5 | Estilos: escalas en `em`, cajetín a una columna sólo con control, partición de palabras | S1,S2 | inline | — |
| T6 | `DESIGN.md`: tipografía, medida, movimiento y componentes nuevos | — | inline | — |
| T7 | Verificación en navegador de las cuatro anchuras y los dos temas | S1–S5 | inline | — |

## Decisiones

- **La columna se mide en `em` del cuerpo, no en píxeles ni en `ch`.** `--medida: 40 * var(--lectura-tam)`:
  con IBM Plex Sans son unas 88 letras, y el número de letras por línea es el mismo en un portátil
  que en un monitor de 1920 porque el cuerpo sube con `clamp`. La alternativa —dejar la medida fija y
  ensanchar en píxeles— termina en líneas de 130 caracteres. `ch` se descartó porque mide el ancho
  del cero (0.6 em en Plex) y daba una falsa sensación de columna corta.
- **La lámina es la medida más un margen.** `--lamina: calc(var(--medida) + 16rem)`. Así la
  proporción entre prosa y hoja no cambia con la pantalla y el margen derecho tiene un ancho
  previsible: ahí van las marcas. El texto pasa de 595 px a 754 px en una ventana de 1440 (+27 %) y
  de 17 px a 18,85 px de cuerpo.
- **IBM Plex Sans, no una serif más suave.** El pedido era "más suave y técnica": Plex es una
  grotesca humanista de origen técnico, con aperturas abiertas, que aguanta párrafos largos sin el
  ruido de una serif y sin la frialdad de una geométrica. Se retira Source Serif 4 del proyecto: dos
  familias y el mono, como antes. `--font-serif` queda como alias de la lectura para que ninguna
  pieza ajena caiga en Georgia.
- **Cambia la señal de "texto oficial".** Antes era la serif; ahora es la familia de lectura más un
  cuerpo mayor que la interfaz. La regla `The Serif Means Official` de `DESIGN.md` se reescribe como
  `The Reading Face`.
- **El texto entra con `IntersectionObserver`, no con `animation-timeline: view()`.** La animación
  de scroll nativa sería más barata, pero no permite decidir que lo que ya está a la vista no se
  anime, ni rescatar lo que se salta de golpe. El escalonado es de 35 ms con tope de cuatro: una
  cascada corta, no una coreografía.
- **Lo que se salta, no se anima.** Al ir a una coincidencia de búsqueda o a una nota, los bloques
  que quedan por encima de la vista se sueltan en el acto desde el mismo listener de scroll: el
  observador nunca los vería intersecar y quedarían `opacity: 0` para siempre.
- **La barra de progreso sustituye a la del navegador en las vistas de lectura.** Dos barras a la
  derecha dicen lo mismo y ninguna dice cuánto falta. 6 px de la franja del conductor de protección
  —el ancho que ya usan la marca del índice y la barra de indexado—, que avanza hasta el punto de
  lectura; debajo queda el hilo de 1 px de la retícula. La cifra en mono aparece mientras se
  scrollea y se retira a los 900 ms.
- **El estado vive en el DOM, no en React.** El scroll pasa sesenta veces por segundo: el relleno se
  escribe como variable CSS (`--p`) y la cifra como `textContent`, con un `requestAnimationFrame` y
  una interpolación corta (0.28) para que el relleno se asiente con algo de inercia.
- **Partición de palabras sólo en la prosa.** Con 88 letras por línea hace falta para no dejar el
  borde derecho deshilachado; en tablas se apaga (`hyphens: manual`) porque parte unidades como
  `mm²`, y en móvil también, porque con la línea corta sólo añade guiones.

## Log

- **L1** (2026-11-03) — Pedido del usuario en cuatro puntos: ancho, fuente del reglamento, texto
  animado al scrollear y barra de progreso vertical.
- **L2** (2026-11-03) — **Medición antes de tocar**: en la app en marcha, la prosa medía 595 px
  (68ch de Source Serif 4 a 17 px) dentro de una lámina de 976 px; el cajetín terminaba en 1140 y la
  tabla en 1382. Tres bordes derechos distintos y 380 px de hueco. La guía estaba en el extremo
  opuesto: 736 px de texto a 88 letras por línea, más largo de lo que conviene.
- **L3** (2026-11-03) — **Variantes miradas, no supuestas**: 38, 43 y 46 em con el cuerpo a 20 px.
  A 46 em la página se ve llena pero la línea llega a 107 letras; a 38 em (79 letras) el hueco
  derecho seguía mandando. Se elige 40 em con partición de palabras, y el ancho se gana subiendo el
  cuerpo, no la línea.
- **L4** (2026-11-03) — **Fallo encontrado al probar**: con `hallarScroller` exigiendo
  `scrollHeight > clientHeight`, la barra de progreso se montaba durante el esqueleto de carga (sin
  scroll todavía), no encontraba el contenedor y se quedaba en 0 %. Se relaja a mirar sólo el
  `overflow-y`. Y el primer `useRevelar` dejaba invisibles los bloques saltados con
  `scrollIntoView`: se añade el rescate por scroll.
- **L5** (2026-11-03) — **Medido el flick**: 4.320 px en 1,1 s dejaban la pantalla a media opacidad
  y se resolvía en ~500 ms; con lectura tranquila (30 px cada 120 ms) el texto llega asentado. El
  margen inferior del observador queda en −10 %.
- **L6** (2026-11-03) — **Arreglos de paso**, en la misma superficie: `p.nota` (nota al pie del BOE)
  se separa de `mark.nota` (subrayado del lector), que heredaba el gris y el cuerpo chico; el
  `select` de redacción deja de salirse del cajetín; en móvil el cajetín pasa a una columna sólo si
  lleva un control, y la última ficha suelta ocupa la fila en vez de dejar un hueco del color de la
  línea.

## Verificación

- `npm run check`: type gate limpio, 98/98 tests.
- `npm run build`: 2098 módulos, sin avisos.
- Capturas (Chrome 155 headless por CDP, `deviceScaleFactor: 1`):
  - Lector 1440×900 claro y oscuro: prosa 754 px, cajetín y tabla a 974 px, franja de progreso al
    0 % y al 100 %.
  - Lector 1920×1080: prosa 800 px, lámina 1056 px — la misma proporción que a 1440.
  - Lector 1024×800 y 390×844 (móvil): la prosa ocupa todo el ancho; cajetín a una columna con el
    control completo.
  - Guía BT-03: 193 bloques observados, 0 ocultos en vista tras saltar de 2.600 px y volver;
    progreso 15 % coherente con `scrollTop/scrollHeight`.
  - Portada, notas y cuestionarios: sin regresiones con la familia nueva.
- Detector de Impeccable sobre los archivos tocados: sin hallazgos nuevos. Los que quedan son
  anteriores y están documentados en `DESIGN.md`: el filete de la cita en bloque, el fondo de
  retícula y el `#000` de la máscara de la topografía.
