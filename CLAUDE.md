# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Stray Shot Creator Tracker: a marketing team's tool for streamer campaigns
(creators, deals, streams, payments, installs). `frontend/` is a React 19 +
Vite 8 + TypeScript 6 + Tailwind 4 app running on in-memory fixture data.
`backend/` is an Express 5 + TypeScript API, scaffolded in task 0.11 with a
health route and nothing else. No database, no auth, no persistence, no
creator portal or public page yet.

Live on Vercel: https://stray-shot-creator-tracker-kappa.vercel.app. The Vercel
project's Root Directory is `frontend`; `frontend/vercel.json` rewrites every
path to `index.html` so `/payments` and `/creators/:id` survive a reload.
Pushing to `master` deploys production; every PR gets a preview.

## Commands

Both packages take the same commands (Node 22.12+; the frontend also runs on
20.19+), and a change must pass `build`, `lint`, `format:check` and `test` in
whichever it touches. CI runs those four on both for every pull request.

From `frontend/`:

```sh
npm run dev                  # Vite dev server
npm run build                # tsc -b, then vite build
npm run lint                 # oxlint
npm run format:check         # Prettier (npm run format to write)
npm test                     # vitest run, whole suite
npx vitest run src/domain/paymentLedger.test.ts          # one file
npx vitest run src/domain/paymentLedger.test.ts -t "range"  # tests whose name matches
```

From `backend/`:

```sh
npm run dev                  # tsx watch, http://localhost:4000
npm run build                # tsc -b, emitting dist/
npm start                    # run the compiled server
npm test                     # vitest run
```

Don't run `npm ci` while the user's `npm run dev` is running — on Windows a
locked native binary aborts it halfway and leaves `node_modules` gutted; use
`npm install` instead. A dev server also caches a file that was missing when
it first asked for it, so restart it after adding an asset.

## Architecture

`src/App.tsx` is the shell and the only place state changes. It owns
`campaigns` and `creators` (seeded from `data/fixtures.ts`), which dialog is
open (records under edit are held by id, not copied), the overview's and
ledger's filter/sort selections (so they survive visiting a creator), and the
route. Screens in `features/` receive records and callbacks as props and never
fetch or store — this is deliberate so the API can later fill the shell's state
without the screens changing.

- `data/types.ts` is the future API contract. `data/session.ts` is a stub
  `currentTeamMember` standing in for sign-in (open question Q3); it is the
  only module meant to change when real sessions arrive.
- `domain/` holds every business rule as pure functions, unit-tested in Node.
  Screens call these rather than computing balances, statuses or totals. Every
  mutation goes through a domain builder first (`buildPayment`,
  `buildReversal`, `buildCreator`, `applyDraftToCreator`, `buildCampaign`,
  `archiveCreator`, …) and the shell stores the result.
- `ui/` is presentation-only primitives, re-exported from `ui/index.ts`.
  `ui/Modal` owns focus trapping, Escape, and focus return for every dialog.
- `lib/router.ts` is a hand-written History API router (`/`, `/payments`,
  `/creators/:id`); unknown paths show the overview, a missing creator
  `replace`s to `/`. The tab a creator was opened from rides in history state.
  Filters are intentionally not in the URL.
- `lib/usePhoneLayout.ts`: `usePhoneLayout` (<768px) and `useNarrowLayout`
  (<1024px) are used only where the narrow design has _different controls_
  (bottom tab bar, filter sheets, cards instead of tables). Otherwise
  responsiveness is CSS. Don't render both variants and hide one with CSS.
- Design tokens live only in `src/index.css` under `@theme`; never hardcode a
  colour elsewhere.

Payments live inside each `Creator`. The ledger is derived from them on every
render (`domain/paymentLedger.ts`), never stored.

## Backend layout

Controllers and models, plus the pieces Express needs. No view layer — the
frontend is the view, and a controller assembles its own JSON. `server.ts`
reads the environment and listens; `app.ts` builds the app without listening,
so tests drive the whole stack through supertest without opening a port
(`src/app.test.ts`). Under `src/`: `config/` (settings checked at boot),
`routes/` (paths to controllers, nothing else), `controllers/` (read request,
call work, answer), `models/` (records and their rules, from 0.15),
`middlewares/` (not-found, errors, later auth and logging).

Layers point one way: routes name controllers, controllers call models. A
model never imports Express, so a rule can serve an endpoint, a seed script or
a job, and be tested without a server. The rules it must enforce are the
frontend's `src/domain/` rules; the contract it must satisfy is
`frontend/src/data/types.ts`.

Imports name the `.ts` file they mean (`rewriteRelativeImportExtensions`), not
`./app.js`.

## Domain rules that code must preserve

Reasoning for each is in `DECISIONS.md` under its Q-number; `docs/domain.md`
has the full set.

- Money is integer cents everywhere. Only `lib/format.ts` divides by 100, and
  typed amounts are parsed from digits (never via float); input past the cent
  is refused, not rounded. USD only. (Q8)
- Payments are append-only. A mistake is corrected by a reversal: a new
  payment with a negative amount and `reversesPaymentId`. Only reversals may be
  negative; a payment is reversed at most once; reversals aren't reversible.
  Totals sum every record including reversals. (Q6)
- A payment stores `recordedByTeamMemberId`, never a name; names are resolved
  for display from a directory that never removes anyone. (Q4)
- Overpayment is allowed and shown as overpaid; outstanding never goes
  negative and the agreed total is never raised. (Q5)
- Agreed total (`contractedAmountInCents`) is fixed at save: per stream = rate
  × streams committed, flat fee = rate. Per view is deliberately unsupported. (Q9)
- Lifecycle status (prospect/contracted/active/completed) is derived in
  `getLifecycleStatus`, not stored.
- Campaign filter scopes the headline figures, chip counts, panels and budget;
  status filter only affects the table and chart. (Q20)
- Cost per install is judged against the creator's own campaign target; no
  campaign or nothing paid means no verdict. (Q21)
- Discard only while a creator has no payments, streams or claimed invite;
  archive only hides from roster and chips (money stays in every total) and is
  refused while a balance is owed. (Q51)
- Records reference each other by id (creator → campaign), never copied names.

## Tests

Vitest defaults to the `node` environment. Rendered tests (`*.test.tsx`) must
opt in with `// @vitest-environment jsdom` as the first line and drive screens
via Testing Library + `user-event`. jsdom has no `matchMedia`, so the wide
layout renders unless a test stubs it (see `features/dashboard/phoneFilters.test.tsx`).
`src/testing/resetLocation.ts` resets the URL between tests. Test timeout is
20s because user-event typing is slow. Keep the test inventory in
`frontend/README.md` current when adding test files.

## Conventions

- Imports: `@/` across source folders, relative within a folder.
- Prettier: single quotes, no semicolons, 100-char width, LF.
- Commit subjects are plain imperative sentences describing the product effect,
  no type prefix (e.g. "Show an overpaid creator as overpaid, not settled");
  the body explains why and cites the Q-number or build-plan task. PRs go into
  `master` from `feature/*`, `fix/*` or `docs/*` branches.

## Workflow and scope

- Work follows a numbered master build plan (tasks like 6.15, questions Q1–Q53)
  kept outside the repo; Q-numbers in code comments refer to it. Each module
  goes planning → static screens → frontend → backend → integration, and a
  task is built only once the user approves it.
- Don't decide open product questions in code. Add them to `OPEN-QUESTIONS.md`
  (options, costs, what they block); settled answers move to `DECISIONS.md`
  with reasoning and what was ruled out.
- The UI must match the Claude Design project exactly, including compact
  sizing. Read the design (via the DesignSync tool) before building UI rather
  than inferring sizes from screenshots.
