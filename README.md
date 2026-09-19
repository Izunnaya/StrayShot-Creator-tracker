# Stray Shot Creator Tracker

The marketing team's tool for running streamer campaigns for Stray Shot: which
creators are signed to which campaign, what each deal is worth, what has been
streamed, what has been paid, and what every install cost.

**Live:** https://stray-shot-creator-tracker-kappa.vercel.app

## Where it stands

The team side of the product is built as a working frontend, at desktop and
phone widths, running on the fixture data it holds in the browser. There is no
database, API or sign-in yet, so every change is lost on reload.

| Built                                                                      | Not yet built                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Campaign overview: headline figures, budget, installs chart, creator table | The API and PostgreSQL database (`backend/` is a placeholder) |
| Creator screen: deal, payment progress, payment and stream history         | Team sign-in and roles (waits on open question Q3)            |
| Payments ledger: search, campaign and date filters, sort, filtered total   | Creator portal: invite, claim, login, portal, expired link    |
| Creating and editing campaigns                                             | Public code-redemption landing page                           |
| Adding and editing creators, in the three-step form                        | YouTube and Twitch polling, stream matching                   |
| Recording and reversing payments                                           | Install attribution and delivery verification                 |
| Archiving a finished creator, discarding an untouched one                  | Loading and error states for data fetched over the network    |
| An address for every screen: `/`, `/payments`, `/creators/:id`             |                                                               |

## Running it locally

Needs Node 22.12 or later (or 20.19+). Everything runs from `frontend/`.

```sh
cd frontend
npm install
npm run dev          # http://localhost:5173
```

| Command                | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                              |
| `npm test`             | The full test suite, once                               |
| `npm run test:watch`   | Tests, re-run on every save                             |
| `npm run lint`         | oxlint                                                  |
| `npm run format:check` | Prettier, checking only                                 |
| `npm run format`       | Prettier, rewriting files                               |
| `npm run build`        | Type-check, then build the production bundle to `dist/` |
| `npm run preview`      | Serve the built bundle locally                          |

## Repository layout

```
├── frontend/            React + Vite + TypeScript + Tailwind app (the whole product today)
│   ├── src/
│   │   ├── features/    One folder per screen, with its own components and hooks
│   │   ├── domain/      Pure business rules: money, status, filtering, sorting, ledger
│   │   ├── ui/          Shared presentation components (Button, Modal, FilterChip…)
│   │   ├── data/        Types, fixture data, and the stand-in session
│   │   └── lib/         Formatting, the router, small helpers
│   └── vercel.json      Serves index.html for every path
├── backend/             Placeholder for the Express + Prisma API (not started)
├── docs/                Architecture and domain documentation
├── DECISIONS.md         Product questions that are settled, and why
├── OPEN-QUESTIONS.md    Questions raised during the build, still unanswered
└── CONTRIBUTING.md      Branches, commits, and the checks a change must pass
```

## Documentation

| Document                                     | Read it for                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| [docs/architecture.md](docs/architecture.md) | How the app is put together, where state lives, how the API will slot in |
| [docs/domain.md](docs/domain.md)             | What a campaign, creator, deal and payment are, and the rules on money   |
| [DECISIONS.md](DECISIONS.md)                 | Every settled product decision, with what was ruled out                  |
| [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md)       | What is still undecided and what each question blocks                    |
| [frontend/README.md](frontend/README.md)     | Frontend detail: screen behaviour, chart data, the test inventory        |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | How to make and land a change                                            |

Scope comes from the project brief and its Additions document (the Additions
win where they conflict), and the visual design from the Claude Design project.
Both live outside this repository. The master build plan numbers every task
and every question (Q1–Q53); the Q-numbers in this repository refer to it.

## Deployment

Vercel deploys from GitHub:

- A push to `master` deploys production.
- Every pull request gets its own preview deployment, linked from the PR.

The Vercel project's **Root Directory is `frontend`** and its framework preset
is Vite, so it runs `npm install` and `npm run build` there and publishes
`dist/`. `frontend/vercel.json` rewrites every path to `index.html`; without
it, reloading `/payments` or a creator's page would be a 404.

## Stack

React 19, Vite 8, TypeScript 6 (strict), Tailwind CSS 4, Vitest 4 with Testing
Library, oxlint and Prettier. The API is planned as Node, Express and
TypeScript over PostgreSQL with Prisma.
