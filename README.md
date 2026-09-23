# Stray Shot Creator Tracker

The marketing team's tool for running streamer campaigns for Stray Shot: which
creators are signed to which campaign, what each deal is worth, what has been
streamed, what has been paid, and what every install cost.

**Live:** https://stray-shot-creator-tracker-kappa.vercel.app

## Where it stands

The team side of the product is built as a working frontend, at desktop and
phone widths, running on the fixture data it holds in the browser. The API
beside it is scaffolded — Express and TypeScript, now connected to a
PostgreSQL database on Neon — but it serves no product endpoint yet, so the
screens still read fixtures and every change is lost on reload.

| Built                                                                      | Not yet built                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Campaign overview: headline figures, budget, installs chart, creator table | The tables themselves: campaign, creator and payment (1.16, 4.21, 6.15)  |
| Creator screen: deal, payment progress, payment and stream history         | Every product endpoint, and the screens reading them instead of fixtures |
| Payments ledger: search, campaign and date filters, sort, filtered total   | Team sign-in and roles (waits on open question Q3)                       |
| Creating and editing campaigns                                             | Creator portal: invite, claim, login, portal, expired link               |
| Adding and editing creators, in the three-step form                        | Public code-redemption landing page                                      |
| Recording and reversing payments                                           | YouTube and Twitch polling, stream matching                              |
| Archiving a finished creator, discarding an untouched one                  | Install attribution and delivery verification                            |
| An address for every screen: `/`, `/payments`, `/creators/:id`             | Loading and error states for data fetched over the network               |
| An Express API, its connection to Postgres, and CI on both packages        |                                                                          |

## Running it locally

Needs Node 22.12 or later (the frontend also runs on 20.19+). The two packages
are installed and run separately.

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

The API takes the same command names, from `backend/`:

```sh
cd backend
npm install
cp .env.example .env   # DATABASE_URL is a Neon connection string
npm run db:generate
npm run dev            # http://localhost:4000
```

`npm run build`, `npm run lint`, `npm run format:check` and `npm test` mean the
same thing there, plus `npm start` to run the compiled server. A change must
pass those four in whichever package it touches; CI runs them on both for every
pull request. Detail is in [backend/README.md](backend/README.md).

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
├── backend/             Express + TypeScript API over Postgres (Neon) with Prisma: health and readiness so far
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
| [backend/README.md](backend/README.md)       | API detail: how the server is laid out and what each layer may do       |
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
Library, oxlint and Prettier. The API is planned as Node, Express, and
TypeScript over PostgreSQL with Prisma.


