# models/

The records themselves: the Prisma schema's entities and the code that reads
and writes them. Nothing here yet — the database arrives in task 0.15, and the
first tables (campaign, creator, payment) in 1.16, 4.21 and 6.15.

A model knows about storage and about the rules that make a record valid. It
knows nothing about HTTP: no request, no response, no status codes. That way
the same rule can be called from an endpoint, a seed script or a scheduled
job, and can be tested without a server.

The domain rules the frontend already holds in `frontend/src/domain/` —
money in cents, append-only payments, how a lifecycle status is derived — are
the rules this layer has to enforce too. See `docs/domain.md`.
