# Favoritos: las ITC a mano

Rama `main` (directo, como el resto del historial). Runner de tests: `node --test` (nativo de
Node, sin dependencias de test); type gate: `tsc --noEmit`.

## Specs

- **S1** — *"en rebt tengo acordion para preambulo, reglamento e itc, quisiera tener uno que sea
  Favoritos, y poder agregarle una estrella a las itc que quiero que esten en favoritos, para
  poder tener cerca los itc que busco mas frecuentemente, y guardar esas selecciones en
  localstorage"* (pedido original, 21/10/2026).
- **S2** — Los favoritos se guardan en el navegador (`localStorage`), sin servidor ni cuenta, y
  sobreviven a la sesión.
- **S3** — El apartado de Favoritos se puede abrir a la vez que el de las ITC: el usuario quiere
  tener los favoritos a la vista **mientras** navega por las ITC, no en lugar de ellas.

## Tasks

| # | Tarea | Specs | Ruta | Riesgo | Commit |
|---|-------|-------|------|--------|--------|
| T1 | `src/favoritos.ts`: la lógica de leer, alternar y guardar, con el hook | S1,S2 | inline | — | 1 |
| T2 | `src/Sidebar.tsx`: la estrella en las filas y el acordeón de Favoritos | S1,S3 | inline | — | 1 |
| T3 | `src/styles.css`: la estrella, que vive fuera del botón de la fila | S1 | inline | — | 1 |
| T4 | Tests de la lógica de leer y alternar | S2 | inline | — | 1 |
| T5 | Verificación en el navegador: marcar, recargar, desmarcar | S1,S2 | inline | — | 1 |

**Trazabilidad de ruta**: no hay trigger de delegación (ni paralelismo ni backstop de contexto).
Todo inline.

## Decisiones

- **La estrella es hermana de la fila, no hija.** La fila es un `<button>` y un botón dentro de
  otro botón es HTML inválido: el clic nunca llega al de abajo. La estrella va posicionada de
  forma absoluta sobre el `<li>`, que hace de contenedor.
- **El acordeón de Favoritos tiene su propio estado**, independiente del radio de los otros tres
  (que hoy sólo deja uno abierto a la vez). Por S3: los favoritos y las ITC se quieren abiertos a
  la vez.
- **La lógica de leer y alternar está aparte del hook**, para poder testearla sin navegador.
  `parseFavoritos` tolera un valor corrupto: que el `localStorage` esté de otra versión no puede
  romper la app, se descarta y se empieza de cero.
- **`localStorage` con `try/catch`**: en modo privado o sin cuota, los favoritos viven sólo en
  esa sesión y la app sigue funcionando.

## Log

- **L1** (2026-10-21) — *"en rebt tengo acordion para preambulo, reglamento e itc, quisiera tener uno
  que sea Favoritos, y poder agregarle una estrella a las itc que quiero que esten en favoritos,
  para poder tener cerca los itc que busco mas frecuentemente, y guardar esas selecciones en
  localstorage"*.
- **L2** (2026-10-21) — **Dónde va la estrella**: en las filas del acordeón de ITCs, que es donde
  están las que el usuario quiere tener cerca. Las de Favoritos llevan la suya también, para
  poder desmarcar sin volver a la lista.
- **L3** (2026-10-21) — **Verificado en el navegador**, con el guion de siempre: el acordeón de
  Favoritos aparece primero y abierto, con la pista cuando está vacío; al marcar una fila el
  título pasa a «Favoritos (1)» y el `localStorage` queda con `["da"]`; **tras recargar sigue
  ahí**; y al desmarcar vuelve a estar vacío. La captura de pantalla confirma que la estrella
  marcada y la sin marcar se distinguen.
- **L4** (2026-10-21) — **Un detalle del clasificatorio que se encontró de paso** (preexistente, no
  se toca): la sidebar separa las ITC en "normales" y "disposiciones" comparando ids con `< 'da'`,
  pero como la comparación es lexicográfica, `'id' < 'da'` es falso y el grupo "normales" queda
  vacío. No afecta a nada: los dos grupos se concatenan y la lista final es la misma. Queda
  anotado por si algún día se toca esa clasificación.
