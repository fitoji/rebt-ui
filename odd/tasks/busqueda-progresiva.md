# Búsqueda progresiva en el texto completo

Rama `main` (directo, como el resto del historial). Runner de tests: `node --test` (nativo de
Node, sin dependencias de test); type gate: `tsc --noEmit`.

## Specs

- **S1** — *"vamos con busqueda progresiva y deja apuntado como feature futuro el 2c"* (pedido
  original, 21/10/2026). La búsqueda en el texto completo deja de esperar a que terminen de
  descargarse los 98 bloques: los resultados aparecen a medida que llegan. Y la búsqueda en el
  worker (2C) queda anotada como feature futuro.
- **S2** — **Cero cambios en el resultado final**: los mismos bloques, el mismo número de
  coincidencias y el mismo fragmento. Lo que cambia es cuándo aparecen.
- **S3** — La búsqueda se extrae a un módulo puro (`src/busqueda.ts`) para que se pueda testear:
  la lógica de buscar estaba dentro del componente y era intestable.

## Tasks

| # | Tarea | Specs | Ruta | Riesgo | Commit |
|---|-------|-------|------|--------|--------|
| T1 | `src/busqueda.ts`: la búsqueda como función pura, con `obtener` que devuelve el bloque si ya está descargado | S2,S3 | inline | — | 1 |
| T2 | `src/App.tsx`: contador de bloques indexados que dispara el recálculo de la búsqueda | S1,S2 | inline | — | 1 |
| T3 | `src/Sidebar.tsx`: el rótulo del progreso y el aviso mientras se indexa | S1 | inline | — | 1 |
| T4 | Tests de la búsqueda: por título, por texto, y **que los resultados crezcan** | S1,S2,S3 | inline | — | 1 |
| T5 | Feature futuro 2C anotado en `todo.md` | S1 | inline | — | 2 |

**Trazabilidad de ruta**: no hay trigger de delegación (ni paralelismo ni backstop de contexto).
Todo inline.

## Decisiones

- **La señal de "han llegado bloques nuevos" es un contador, no el contenido.** `peekBlock` lee un
  `Map` de módulo, y un `useMemo` no se recalcula porque un `Map` haya cambiado. Por eso `App`
  lleva un contador `indexados` que se incrementa en el `onProgress` de `loadAll`, y que es
  dependencia del memo. Está anotado en el código: si alguien lo quita, los resultados dejan de
  aparecer solos.
- **Los títulos se buscan siempre**, estén descargados o no. Por eso hay resultados desde el
  primer bloque, y no solo cuando termina de indexar.
- **Los títulos normalizados se calculan una vez** (`useMemo` sobre `blocks`): normalizar 98
  títulos en cada recálculo de la búsqueda es trabajo de más.

## Log

- **L1** (2026-10-21) — *"vamos con busqueda progresiva y deja apuntado como feature futuro el
  2c"*.
- **L2** (2026-10-21) — **El problema medido**: la búsqueda bloqueaba 5,6 s hasta que bajaban los
  98 bloques (2,17 MB). Los resultados solo aparecían cuando `textReady` era true, o sea al
  final; la barra de progreso era lo único que se movía.
- **L3** (2026-10-21) — **Cómo se resolvió**: `loadAll` ya avisaba bloque a bloque por
  `onProgress`, y el `Map` de `api.ts` ya se llenaba solo. Lo que faltaba era que la búsqueda
  mirara ese `Map` mientras se llena. Ahora `buscarEnBloques` recibe un `obtener` que devuelve
  `undefined` para lo que todavía no llegó, y los resultados van apareciendo.
- **L4** (2026-10-21) — **Verificado en el navegador**, con el mismo guion contra el servidor de
  desarrollo: los resultados crecen con los bloques (1 → 4 → 15 → 25 → 37 → 45 → 53 → 54 filas)
  y el último aparece al terminar. Antes, la primera fila solo aparecía al final.
- **L5** (2026-10-21) — **El 2C queda anotado** en `todo.md`: buscar en el worker para bajar
  ~30 KB en vez de 2,17 MB. Pide el corpus guardado (KV o assets), un índice y una política de
  reindexado; es la parte cara de la opción 2 y por eso no se hizo ahora.
