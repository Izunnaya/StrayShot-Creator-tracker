# Stray Shot Creator Tracker — API

The backend half of the creator tracker. Separate repo from the frontend.

**Stack:** Node + Express + TypeScript, PostgreSQL via Prisma.

Nothing is scaffolded yet. The API is Phase 4 work in the master checklist —
it starts at task 0.15 (Postgres + Prisma, schema conventions) and 0.16
(team-surface sessions and protected routes), after the static screens and
frontend phases are approved.

Serves two audiences from one database:

- **Team surface** — campaigns, creators, payments, the payments ledger.
- **Creator surface** — invite, claim, login, and a portal that returns only
  the signed-in creator's own data.

Plus the scheduled integrations: YouTube and Twitch polling, stream matching,
install attribution, and delivery verification.
