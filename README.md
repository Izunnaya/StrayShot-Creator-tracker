# Stray Shot Creator Tracker — Web

The frontend half of the creator tracker. Separate repo from the API.

**Stack:** React 19 + Vite 8 + TypeScript, Tailwind CSS v4.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # typecheck + production build
npx oxlint src  # lint
```

> **Node 22.12+ (or 20.19+) required.** On older Node, npm silently skips the
> native rolldown and oxlint bindings and both the build and the dev server die
> with `Cannot find native binding`. As a stopgap on Node 22.11 the two Windows
> bindings are pinned as devDependencies — remove
> `@rolldown/binding-win32-x64-msvc` and `@oxlint/binding-win32-x64-msvc` once
> Node is upgraded, since they are platform-specific.

---

## How the code is arranged

Five layers, each with one job. Dependencies only ever point downward: a screen
may use the domain, the domain never imports a component.

```
src/
├── features/     Screens and the components that belong to one screen
├── ui/           Shared primitives — know nothing about creators or campaigns
├── domain/       Business rules and calculations — no React, no formatting
├── data/         The data itself, and the types describing it
└── lib/          Small helpers: class names, display formatting
```

| Layer | Holds | Never holds |
| --- | --- | --- |
| `features/` | Screen state, layout, composition | Business rules |
| `ui/` | Presentation, variants, hover and focus states | Anything domain-specific |
| `domain/` | Calculations, filtering, sorting, thresholds | JSX, colours, formatting |
| `data/` | Fixtures and type definitions | Logic of any kind |
| `lib/` | Formatting and string helpers | Calculations |

### Why the split matters

**`domain/` is where money and status are decided.** `getCostPerInstall` returns
`Infinity` when a creator has been paid nothing, so they render as "—" and sort
last rather than appearing as the cheapest creator on the campaign. Amounts paid
and owed are always derived from the payment list, never stored, so a progress
bar cannot disagree with the payment history behind it.

**Rules and appearance are kept apart.** `domain/costPerInstallRating.ts` decides
whether a figure is `under-target`, `acceptable`, `over-target` or
`not-measurable`. `features/dashboard/costPerInstallAppearance.ts` decides what
each of those looks like. Thresholds can be argued about without opening a
component, and the palette can change without touching a business rule.

**`data/fixtures.ts` is the seam.** Every screen reads its data from that one
module, so Phase 5 replaces it with API calls without touching anything else.

### Naming

Names are written to be readable without prior knowledge of the domain:
`streamsCommitted` and `streamsDelivered` rather than `agreed` and `streams`,
`peakConcurrentViewers` rather than `peak`, `getOutstandingBalance` rather than
`remainingOf`. Booleans read as questions (`isSelected`, `hasOutstandingBalance`)
and units live in the name (`heightInPixels`, `percentComplete`).

UI primitives are named for their role rather than their appearance —
`Button variant="addNew"`, not `variant="dashed"` — so choosing one does not
require knowing the palette.

---

## The design system

All tokens live in [`src/index.css`](src/index.css) as a Tailwind `@theme`. No
component hardcodes a colour.

- **Ground and panels** — `ground`, `panel`, `panel-head`, `sunk`, six hairline
  weights from `hair` to `hair-6`
- **Accent** — `amber` `#FFC20A`, plus `amber-deep`, `amber-mid`, `amber-dim`
- **State, kept separate from the accent** — `good` (settled), `bad` (open)
- **Faces by role** — `display` (Anton), `head` (Oswald), `body` (Barlow),
  `mono` (IBM Plex Mono)
- **Utilities** — `grain` and `grain-masthead` for the concrete noise texture,
  `clip-corner` for the stencil cut on modals, `bar-partial` for the angled
  amber progress fill

---

## Build status

Following the phased plan in the master checklist: planning → static screens →
frontend → backend → integration.

### Done

**Module 0 — foundation.** Tailwind theme from the design tokens (0.8), the
shared primitive inventory (0.9), the app shell (0.14).

**Module 2 — campaign overview, static and frontend (2.9–2.21).** The screen is
built and interactive:

- Campaign chips filter every figure, the table and the status panels
- Status chips filter the table; counts follow the campaign filter but not the
  status filter, so each chip shows what it would reveal
- All ten column headings sort, reverse on a second click, and open in a
  sensible direction for their type — names A→Z, figures largest first, cost per
  install cheapest first
- Cost-per-install colour bands follow the selected campaign's own target
- Empty states appear wherever a filter empties a table or panel

### Not wired yet

Each of these waits on a module whose own screens do not exist:

| Control | Waits on |
| --- | --- |
| Row click → creator detail | Module 3 (task 2.22) |
| Record payment | Module 6 (task 6.14) |
| New / Edit campaign | Module 1 (tasks 1.12–1.15) |
| Payments tab in the masthead | Module 7 |

Components already accept the handlers — a table row only becomes clickable when
it is given an `onSelectCreator`, so nothing shows an affordance that does
nothing.

### Also outstanding

- **2.14** — loading, empty and error variants for the overview. Its planning
  task (2.8) sits in the phase that was skipped, so the states have not been
  defined.
- **Open questions carried in the code.** Three decisions currently follow the
  prototype and are commented where they are made: whether the status filter
  should move the summary figures (Q20), which cost-per-install target applies
  when all campaigns are in view (Q21), and whether the status panels should
  obey the campaign filter (Q22). Each is a few lines in one file today and a
  schema decision once the backend lands.

---

## Data

Fixture data mirrors the design prototype: 2 campaigns, 14 creators, 18
payments. With no filters applied the dashboard shows **$47,000 paid of $55,200
committed, $8,200 outstanding across 5 creators, 25,545 installs from 2.27M
views, and a blended $1.84 per install** — 8 active creators and 6 completed.
Those figures are the reference for checking that a change has not disturbed
anything.
