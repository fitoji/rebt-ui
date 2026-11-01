# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two situations, confirmed by the maintainer, over the same corpus:

- **Exam candidate** preparing the REBT / baja-tensión exam (oposiciones): reads a specific ITC-BT or guide, drills the bundled quizzes, and repeats only the questions missed.
- **Working technician** who needs the authoritative clause or table quickly during an installation or inspection: jumps straight to an ITC-BT or guide section, copies a table into a spreadsheet, star-favourites what gets reused.

Success is the same in both: reach the exact official clause, table or figure within seconds, and be able to come back to it later.

## Product Purpose

Read the Reglamento Electrotécnico para Baja Tensión (RD 842/2002) as published in the BOE open-data API, and read the Ministry's Guías Técnicas de aplicación, in one interface that keeps the official text intact while making it navigable, searchable and annotatable. It exists because the authoritative sources ship as long PDFs and raw XML, and because exam preparation and on-site consultation both need the same corpus under different pressure.

## Positioning

**Faithful, fast, offline-tolerant reading of the official text.** Same content as the BOE consolidated text and the Ministry PDFs, delivered as structured HTML: real tables, stable block links, full-text search across both corpora, and the reader's own highlights that survive a return visit. A generic PDF reader or the ministry listing cannot truthfully copy that: they hand over paginated files with no stable anchors, no table extraction and no memory of what the reader marked.

The study layer (notes, favourites, quizzes) supports that edge; it is not the promise on its own.

## Operating Context

- Spanish (Spain) electrical regulation. Domain vocabulary is Spanish and stays Spanish: bloque, redacción, ITC-BT, disposición, guía, tabla, anexo.
- Two corpora: the consolidated REBT from `www.boe.es/datosabiertos/api` (98 blocks, several redacciones — the current one is shown) and 38 Ministry guide documents (`guia_rebt/`: `md/` + `tablas/*.csv` + `imgs/` + `indice.json`, 603 pages).
- The browser cannot call `boe.es` (no CORS headers), so a Cloudflare Worker proxies `/boe-api/*` and serves `dist/`.
- All navigation is hash-based (`#/rebt/<bloque>`, `#/guia/<id>`, `#/notas`, `#/cuestionarios`) so the static build needs no rewrite rules.
- Local development runs either against the real BOE (`npm run dev`) or against a simulated BOE (`npm run mock` + `npm run dev:mock`) with no internet.
- Deployment is a Cloudflare Worker; CI on every push to `main` runs typecheck, tests, build, deploy.
- Each unit of work leaves a logbook in `odd/tasks/` recording the request, the decisions and how it was verified.

## Capabilities and Constraints

Capabilities today: REBT reader with real tables, edition selector, progressive full-text search and highlighted matches; guide viewer over the 38 documents with figures and deep links to the official PDFs; table actions (copy as spreadsheet, copy as Markdown, download CSV named after the corpus file); notes created by highlighting text, coloured yellow/green/red, with free-form tags, anchored to text plus context, listed per view and globally at `#/notas`; favourites and a grouped index; quizzes with single-key answering, per-round scoring, repeat-the-missed round, and drag-and-drop loading of external quiz files; light/dark following the system.

Confirmed constraints:

- **No accounts and no server-side user data.** Notes, favourites and loaded quizzes live in `localStorage`. The Worker is stateless: static assets plus the BOE proxy. Do not introduce a user backend.
- **Official content only.** Never invent, paraphrase, summarise or silently correct regulatory text, tables or figures. When the BOE changes format, fix the parser (`src/parse.ts`), not the content. When the corpus is regenerated, the converter changes, not the text.
- **Keep the dependency surface small.** The Markdown subset renderer, the table handling and the test runner are the project's own, sized to what the corpus measurably contains; adding a general-purpose library is a deliberate decision to argue for, not a default.
- TypeScript `strict: true` everywhere (app, worker, tests, Vite plugin); `npm run build` runs the type gate first, so a type error never reaches `dist/`.
- Relative imports carry their extension (`./parse.ts`); `erasableSyntaxOnly` and `verbatimModuleSyntax` stay on so Node can run the tests without a bundler.
- Existing public contracts: the hash routes (`#/{bloque}` legacy links still resolve), the `indice.json` shape, and the CSV file names that mirror `guia_rebt/tablas/`.
- Undecided, do not assume: worker-side search (2C) is recorded in `todo.md` as a future feature, and AENOR/UNE standards plus Gencat forms are noted as wanted — none of these are committed scope.

## Brand Commitments

Existing, not a proposed direction: the name **REBT** used as the product name, the mark in `public/logo.svg` (the protective-conductor stripe, also the favicon), and a Spanish (Spain) interface written in a direct, informal register.

## Evidence on Hand

- `guia_rebt/`: 38 documents / 603 pages, 381 tables as CSV, 123 figures, `indice.json` with edition, revision, page count and PDF `sha256`.
- Live BOE open data through the Worker proxy; a simulated BOE in `mock/` for offline work.
- Three author-written quiz files in `data-json/` (30 questions each, ITC-BT 01-05).
- Interface screenshots in `docs/`, and task logbooks with verified findings in `odd/tasks/`.

Absences that future work must not fill in: no users, testimonials, case studies, press, benchmarks or analytics; no third-party quiz bank; no claim of endorsement by the BOE or the Ministry.

## Product Principles

1. **The official text wins.** Every screen's credibility rests on the content being the published one; anything that risks altering it is refused.
2. **Time to the answer is the metric.** Search, the index, favourites and notes exist to shorten the path to one clause — not to add surface.
3. **Local-first by default.** What the reader marks belongs to the reader's browser; requiring an account to keep a highlight is a product regression.
4. **Resilience over freshness.** A consolidated text that changes a few times a year should keep working offline and under a failing upstream, rather than chase live data.
5. **Measure before building.** Corpus shape, renderer scope and table coverage are established from the real documents before code is written.
