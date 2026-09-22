# Stray Shot Creator Tracker — API

The backend half of the creator tracker. It lives beside `frontend/` in this
repository (Q50).

**Stack:** Node, Express 5 and TypeScript, with PostgreSQL via Prisma to come.

Scaffolded in task 0.11. There is no database yet and no product endpoint: the
only route is a health check, which proves the stack is wired together.
PostgreSQL and Prisma are task 0.15, the response and error conventions 0.17,
and team sign-in 0.16, which waits on Q3.

## Development

Needs Node 22.12 or later.

```sh
npm install
cp .env.example .env
npm run dev          # tsx watch, http://localhost:4000
```

| Command                | What it does                         |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Dev server, restarting on every save |
| `npm run build`        | Type-check and compile to `dist/`    |
| `npm start`            | Run the compiled server from `dist/` |
| `npm test`             | The test suite, once                 |
| `npm run test:watch`   | Tests, re-run on every save          |
| `npm run lint`         | oxlint                               |
| `npm run format:check` | Prettier, checking only              |

A change must pass build, lint, format:check and test. CI runs the same four
on every pull request, for this package and the frontend.

## Structure

Controllers and models, with the pieces Express needs around them. There is no
view layer here: the frontend is the view, and an endpoint answers with JSON.

```
src/
├── server.ts       Entry point: reads the environment, starts listening
├── app.ts          Builds the Express app without listening, so tests can drive it
├── config/         Settings read from the environment, checked at boot
├── routes/         Which path and method reach which controller. Nothing else
├── controllers/    Read the request, call the work, answer
├── models/         The records and the rules that make them valid (from 0.15)
└── middlewares/    Work that wraps every request: not-found, errors, later auth
```

The layers only point one way: routes name controllers, controllers call
models. A model never imports Express, which is what lets the same rule serve
an endpoint, a seed script or a scheduled job, and be tested without a server.

A controller assembles its own response body. What a model hands back is not
automatically what should go over the wire, and the shape that does is the
API's contract: `frontend/src/data/types.ts` is what it has to satisfy.

`createApp()` is kept apart from `server.ts` so a test can send a request
through the whole stack — routes, middlewares and all — without opening a
port. `src/app.test.ts` does exactly that.

Imports name the `.ts` file they mean; the compiler rewrites them to `.js` on
the way out.

## The two audiences it will serve

- **Team surface** — campaigns, creators, payments, the payments ledger.
- **Creator surface** — invite, claim, login, and a portal that returns only
  the signed-in creator's own data.

Plus the scheduled integrations: YouTube and Twitch polling, stream matching,
install attribution, and delivery verification.

The business rules it has to enforce are already written down: `docs/domain.md`
for what they are, `DECISIONS.md` for why. The frontend's `src/domain/` holds
the same rules in pure functions, and `src/data/types.ts` is the contract these
endpoints have to satisfy.
