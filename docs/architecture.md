# Architecture

How the frontend is put together today, and where the API will attach. For
what the words mean — deal, reversal, archived — see [domain.md](domain.md).

## The layers

```
 main.tsx
    └─ App.tsx ─────────── the shell: owns campaigns, creators, open dialogs, the route
         ├─ features/ ──── screens and dialogs; take what to show as props
         │     └─ ui/ ──── presentation primitives; know nothing about the product
         ├─ domain/ ────── pure functions: every rule and every calculation
         ├─ lib/ ───────── formatting, routing, media queries
         └─ data/ ──────── types (the contract), fixtures, the stand-in session
```

Dependencies point one way. `domain/` imports only `data/` types and other
domain modules — no React, no formatting. `ui/` imports nothing from
`features/` or `domain/`; the status pill and platform tag read two types from
`data/`. `features/` use everything below them. Only `App.tsx` changes state.

### `data/` — the contract

- **`types.ts`** is the shape of every record the app reads: `Campaign`,
  `Creator`, `Payment`, `Stream`, `DailyInstall`. When the API is built, these
  are what its responses must satisfy, which is why the field names are long
  and unambiguous (`amountInCents`, `recordedByTeamMemberId`).
- **`fixtures.ts`** holds two campaigns and fourteen creators carried over from
  the design prototype (decided in Q30), plus synthetic daily install data for
  the chart. The screens show the same figures the design was reviewed with.
- **`session.ts`** stands in for sign-in: a small team directory and a
  `currentTeamMember`. It exists so a payment is stamped with who recorded it
  from the first payment onward (Q4). When real sessions arrive, this is the
  only module that changes.

### `domain/` — the rules

Every business rule is a pure function here, tested in Node without a browser.
Screens never compute a balance or a status themselves; they call these.

| Module                 | Answers                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `creatorCalculations`  | Paid, outstanding, overpaid, progress, cost per install, lifecycle status  |
| `paymentRecording`     | Parsing a typed amount to cents, validating a payment, building a reversal |
| `paymentLedger`        | The ledger rows across all creators, its filters, sort and filtered total  |
| `paymentHistory`       | One creator's payments, newest first                                       |
| `creatorRecording`     | Validating the three-step creator form, computing the agreed total         |
| `campaigns`            | Validating and building a campaign, finding one by id                      |
| `campaignSummary`      | The overview's headline figures                                            |
| `campaignBudget`       | Committed against budget for one campaign                                  |
| `costPerInstallRating` | Whether a creator's cost per install beats their campaign's target         |
| `creatorFiltering`     | Campaign, status and text search filters, and the chip counts              |
| `creatorSorting`       | Table column sorting and the phone's single sort button                    |
| `creatorArchive`       | Whether a creator can be archived, and archiving or restoring them         |
| `creatorDiscard`       | Whether a creator can be discarded                                         |
| `installChart`         | The daily install series and stream-day markers for the chart              |
| `streamHistory`        | One creator's streams, newest first                                        |
| `teamMembers`          | Resolving a team member id to a display name                               |

A new rule belongs here, with a test beside it, before any screen uses it.

### `features/` — the screens

| Folder           | Contains                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `dashboard/`     | The campaign overview: figures, budget, chart, follow-up panels, creator table |
| `creatorDetail/` | One creator: header, stat strip, payment progress, payment and stream history  |
| `payments/`      | The ledger screen, and the record-payment and reverse-payment dialogs          |
| `campaigns/`     | The create/edit campaign dialog                                                |
| `creators/`      | The three-step creator dialog, and the archive and discard dialogs             |

Screens receive records and callbacks as props and do not fetch or store
anything themselves. That is what will let the data source change underneath
them without the screens changing.

### `ui/` — the primitives

`Button`, `Modal`, `FilterChip`, `FilterSheet`, `FormField`, `Panel`,
`ProgressBar`, `StatStrip`, `SearchField` and a few more, re-exported from
`ui/index.ts`. They are built to the Claude Design project's sizes and have no
knowledge of campaigns or creators.

`Modal` is the one with real behaviour: it moves focus into the dialog, keeps
Tab inside it, closes on Escape, and returns focus to whatever opened it. It
has its own test file for that reason.

### `lib/`

- **`format.ts`** is the only place money is converted from cents to dollars,
  and the only place numbers and dates are turned into display text.
- **`router.ts`** is about ninety lines over the History API — three routes
  do not need a library. See [Routing](#routing).
- **`usePhoneLayout.ts`** answers "is this a phone?" (below 768px) and "is this
  too narrow for the table?" (below 1024px) for the places where the narrow
  design uses different controls, not just different styles.

## Where state lives

`App.tsx` holds all of it:

- **The records** — `campaigns` and `creators`, seeded from the fixtures.
  Payments live inside each creator; the ledger is _derived_ from them on every
  render, never stored separately, so it cannot disagree with a creator's own
  screen.
- **Which dialog is open**, and for which record. Records under edit are held
  by id, not as a copy, so a dialog never shows a stale version.
- **Filters and sort orders** for the overview and the ledger, through the
  `useCreatorFilterSelection`, `useCreatorSortSelection` and
  `usePaymentLedgerSelection` hooks. Holding them in the shell is what makes
  them survive a trip to a creator's screen and back.
- **The route**, read from the address bar.

Every change goes through a domain function first — `buildPayment`,
`buildReversal`, `buildCreator`, `applyDraftToCreator`, `buildCampaign`,
`archiveCreator`, `restoreCreator` — and the shell only stores the result.

## Routing

| Address         | Screen            |
| --------------- | ----------------- |
| `/`             | Campaign overview |
| `/payments`     | Payments ledger   |
| `/creators/:id` | One creator       |

Anything else shows the overview. An address for a creator who does not exist
is replaced with `/`, so Back does not return to a dead link.

A creator's screen remembers which tab opened it (carried in history state,
not the URL) and returns there, so following a ledger row to a creator does
not lose the ledger. Filters are deliberately not in the URL.

A static host must answer every path with `index.html`. Vite's dev server does
this already; in production `frontend/vercel.json` does.

## Responsive design

Most of the responsive work is CSS. The JavaScript breakpoints are used only
where the phone design has different controls:

- **Below 768px (phone):** masthead tabs become a bottom tab bar, filters move
  into a sheet, the overview's figures sit two by two, and dialogs open as
  bottom sheets.
- **Below 1024px:** the creator table and the ledger become cards with a
  single sort button. The table needs 1320px before its money columns stop
  wrapping.

Rendering both versions and hiding one with CSS would put two of every control
in the page, which confuses screen readers and tests alike.

## Styling

Tailwind CSS 4. Every colour, typeface and rule width is a design token in
`src/index.css`, under `@theme`, lifted from the Claude Design prototypes.
Nothing outside that file hardcodes a hex value. The design uses four faces,
hairline borders, no rounded corners, and a clipped corner on dialogs.

Every screen sits over the game's key art. `App.tsx` renders one fixed,
`aria-hidden` layer with the `.app-backdrop` class, which draws the image
under a 90–94% dark wash. It is a fixed layer rather than
`background-attachment: fixed`, which iOS Safari ignores. The images live in
`src/assets/`: a portrait crop for phones and a landscape crop from 768px up,
each as WebP with a JPEG fallback. So the picture reads through, panels,
dialogs, sheets and table heads use translucent tokens (`--color-panel` at
55%, `--color-panel-head` at 42%), while inputs and the boxes inside dialogs
stay solid.

If a new image is added while `npm run dev` is running and does not appear,
restart the dev server: it caches a file that was missing when first asked
for.

## Tests

Vitest runs in two environments:

- **Unit tests** (Node) cover `domain/` and `lib/` — the rules, exhaustively.
- **Rendered tests** (jsdom) drive whole screens through Testing Library and
  `user-event`: typing into forms, clicking through dialogs, checking that a
  payment recorded in one place appears in every other. Each file opts in with
  a `// @vitest-environment jsdom` first line, so the unit suite stays fast.

`frontend/README.md` lists every file and what it covers.

## Where the API will attach

The backend is planned as Express and TypeScript over PostgreSQL with Prisma
(build plan tasks 0.11, 0.15 and 0.17 onward). The frontend is arranged so the
switch is narrow:

1. `data/types.ts` becomes the API contract, ideally shared with the server.
2. `App.tsx` stops seeding from `fixtures.ts` and fills the same state from the
   API. The screens below it take props and do not change.
3. The shell's update handlers call endpoints instead of only updating local
   state. The domain rules stay, and the server enforces the same ones.
4. `session.ts` is replaced by the real session once team sign-in is decided
   (open question Q3).
5. Loading, empty and error states are added per screen (build plan 2.8 and
   2.14) — the one kind of UI that fixture data never needed.
