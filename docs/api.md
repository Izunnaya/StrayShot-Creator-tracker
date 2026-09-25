# The API contract

What every endpoint answers, and in what shape. Settled in task 0.17, before
any product endpoint existed, so that the first one and the fiftieth agree.

The shapes themselves are `frontend/src/data/types.ts`. This document says how
they travel: what a success looks like, what a failure looks like, and which
status code carries which.

## A success is the record

There is no envelope. A single record is the record; a collection is an array
of them.

```
GET /api/campaigns/3          →  200
{ "id": 3, "name": "Launch week", "startDate": "2026-03-01",
  "totalBudgetInCents": 250000 }

GET /api/campaigns            →  200
[ { "id": 3, ... }, { "id": 4, ... } ]
```

A `{ "data": ... }` wrapper was considered and left out. The frontend's types
describe the record, not a parcel around it, so `App.tsx` can put a `fetch`
where `fixtures.ts` is today and unwrap nothing. If paging is ever needed, it
arrives on the endpoints that need it rather than in every body from the start.

Within a body:

- **Money is an integer of cents**, in a field ending `InCents`. Never a
  decimal, never a formatted string. (Q8)
- **Dates are ISO 8601 strings**, as they already are in `data/types.ts` —
  `paidOn`, `startDate`, `endDate`.
- **Ids are integers**, and a reference is the id alone (`campaignId`), never
  a copied name. `recordedByTeamMemberId` is the one string id: it stands in
  for a sign-in identity rather than a row this database owns. (Q4)
- **Nothing derived is sent as though it were stored.** Lifecycle status,
  balances and totals are computed, and a field that carries one is documented
  as computed where the endpoint is described.

## A failure is always `error`

```
{ "error": { "code": "...", "message": "...", "reasons": [ ... ] } }
```

- `code` is what a caller branches on: stable, snake_case, and never reworded
  once an endpoint ships.
- `message` is written for a person reading it, and is safe to show.
- `reasons` appears only when a request was refused for more than one thing,
  or when a field is named. Each reason carries its own `code` and `message`,
  and a `field` when it points at one.

Nothing else appears. No stack, no database message, no echo of what the
server was doing — those go to the log. `src/errors.ts` holds the codes that
are not tied to one module; a module adds its own beside the rule that raises
them.

## Status codes

| Code | When                                                                    |
| ---- | ----------------------------------------------------------------------- |
| 200  | A read, or an update that answers with the updated record                |
| 201  | A record was created. The body is the record, with a `Location` header   |
| 204  | A delete or a discard: nothing left to answer with, so no body           |
| 400  | The request itself is wrong: unparseable JSON, or a body that will not do |
| 404  | No such address, or no such record                                       |
| 409  | The request was understood and the record's state refuses it             |
| 500  | A bug. Fixed message, nothing about how it happened                      |

### 400 — the caller got the request wrong

```
POST /api/payments            →  400
{ "error": { "code": "invalid_json",
             "message": "The request body is not valid JSON." } }
```

A body that parses but cannot be used answers `validation_failed`, naming
every field at fault at once — a form shows all of its errors, not the first:

```
{ "error": {
    "code": "validation_failed",
    "message": "That payment could not be saved.",
    "reasons": [
      { "field": "amountInCents", "code": "not_an_amount",
        "message": "Enter an amount in dollars and cents." },
      { "field": "paidOn", "code": "missing",
        "message": "Say when the money went out." } ] } }
```

The shape is settled here; the checking arrives with the first endpoint that
reads a body (1.16). No validation library is chosen yet — that is a 1.16
decision, made when there is something to validate.

### 404 — no such address, or no such record

The same `not_found` code for both. A caller asking for `/api/creators/999`
and a caller asking for `/api/nonsense` have made the same kind of mistake,
and neither needs to be told which of the two the server thinks it was.

### 409 — the rule refuses

Not a malformed request and not a missing record: a request the server
understood perfectly, about a record whose state does not allow it.

```
POST /api/creators/12/archive  →  409
{ "error": {
    "code": "creator_has_balance",
    "message": "This creator cannot be archived yet.",
    "reasons": [
      { "code": "balance_owed",
        "message": "$400.00 is still outstanding." } ] } }
```

These are the rules already written down in `docs/domain.md` and enforced in
`frontend/src/domain/` — a payment is reversed at most once (Q6), a creator is
discarded only while untouched and archived only once settled (Q51). The
refusal lists those functions already return (`getArchiveRefusals`, the
discard reasons, `paymentRecording`'s) are what `reasons` carries, so the same
rule says the same thing on both sides of the wire.

## The two endpoints outside this contract

`/api/health` and `/api/ready` answer to a load balancer, not to the
application, and keep their own shapes on purpose. `/api/health` says the
process is listening; `/api/ready` runs `SELECT 1` and answers 200 or 503.
Neither is a record, and neither should be made to look like one.

## What this does not cover yet

Authentication and what a request without a session gets (0.16, waiting on
Q3); CORS for the deployed frontend; rate limiting; pagination; and request
logging with an id a caller could quote. Each earns its own task rather than
being guessed at here.
