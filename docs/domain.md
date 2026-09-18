# The domain

What the tracker's records mean and the rules they follow. The reasoning
behind each rule is in [DECISIONS.md](../DECISIONS.md), under the Q-number
given; the code that enforces it is in `frontend/src/domain/`.

## Glossary

| Term              | Meaning                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Campaign**      | A promotion with a start and end date, a total budget, and a target cost per install.                                  |
| **Creator**       | A streamer the team works with. Belongs to at most one campaign (open question Q13).                                   |
| **Code**          | The creator's unique code, which viewers type in to credit them. Case-insensitive; no two creators share one.          |
| **Tracking link** | The link a creator puts in their stream description, derived from their code: `strayshot.game/r/<code>`. Never stored. |
| **Deal**          | What a creator has agreed to: a rate model, a rate, streams committed, a delivery window, requirements.                |
| **Agreed total**  | The full value of a deal, fixed when the deal is saved (`contractedAmountInCents`).                                    |
| **Stream**        | One broadcast, detected on YouTube or Twitch. Never typed in by a person.                                              |
| **Delivered**     | A stream that counts towards the creator's commitment.                                                                 |
| **Install**       | A new player credited to a creator through their code or link.                                                         |
| **Payment**       | Money sent to a creator. Append-only.                                                                                  |
| **Reversal**      | A second payment with a negative amount that cancels a mistaken one.                                                   |
| **Ledger**        | Every payment across every creator: what has left the account.                                                         |
| **Invite**        | The email that lets a creator claim their portal account: not sent, sent, or claimed.                                  |

## Money

- **Every amount is integer cents** — in the types, the fixtures, and every
  calculation. Dollars exist only in `lib/format.ts`, at the moment a figure is
  shown. Floating-point dollars drift when summed, and payments are reconciled
  against a bank statement to the cent. (Q8)
- **A typed amount is read from its digits**, never through a float, and an
  amount typed past the cent is refused rather than rounded.
- **One currency, USD.** A creator's preferred payout currency is recorded for
  whoever makes the transfer, but it does not change any figure. (Q8)
- Totals show whole dollars; payment records show cents when there are any.

## Deals and the agreed total

Two rate models are supported (Q9):

| Rate model | Agreed total             |
| ---------- | ------------------------ |
| Per stream | rate × streams committed |
| Flat fee   | the rate                 |

Per view is not offered: it has no agreed total until the views exist, and
every payment figure in the app is a proportion of an agreed total. The agreed
total is computed once, when the deal is saved, so a later rate change does not
retroactively change what was owed for work already done.

## Payments

- **Recorded by is stamped, not typed.** Each payment stores the id of the
  team member who entered it, taken from the session. The name is looked up
  only for display, from a directory that never removes anyone. (Q4)
- **Append-only.** A payment is never edited or deleted. A mistake is
  cancelled by a reversal — a new record with the negative amount, pointing at
  the original — and both stay visible in the history and the ledger. Only a
  reversal may be negative; a payment can be reversed only once, and a
  reversal cannot itself be reversed. (Q6)
- **Overpaying is allowed, with a warning.** The creator then shows as
  _overpaid_ by the exact amount, rather than as settled. The agreed total is
  never raised to absorb it. (Q5)
- **Paying before delivery is allowed.** The overview's _Paid, not delivered_
  panel exists to watch exactly that case. (Q10, settled in the build plan)
- A payment is recorded from a creator — their own screen, the overview's
  _Delivered, payment open_ panel, or their card on a phone — because it
  settles that creator's deal. The ledger lists payments but does not create
  them.

## Figures derived from payments

Nothing below is stored; each is computed from the payment list every time.

| Figure           | Rule                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| Paid             | Sum of all payments, reversals included                                                 |
| Outstanding      | Agreed total − paid, never below zero                                                   |
| Overpaid         | Paid − agreed total, when paid is more                                                  |
| Cost per install | Paid ÷ installs. With nothing paid or no installs it is not measurable and shows as "—" |

**Cost-per-install rating.** Each creator is judged against the target of
_their own_ campaign, at every level of the overview (Q21):

- **Under target:** at or below it.
- **Acceptable:** above it, but within 1.6× the target.
- **Over target:** beyond 1.6× the target.
- **Not measurable:** nothing paid yet, or no campaign to judge against. It
  gets no colour.

## Lifecycle status

Derived from the record, not set by hand (whether the team may override it is
open question Q24):

| Status         | When                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Prospect**   | No deal activity at all: no streams committed or delivered, no agreed total, no payments |
| **Contracted** | A deal exists, but nothing has been delivered yet                                        |
| **Active**     | At least one stream delivered, and the deal is not yet closed out                        |
| **Completed**  | Every committed stream delivered and the agreed total fully paid                         |

The overview's two follow-up panels come from the same records:

- **Delivered, payment open** lists creators who have delivered everything but
  are still owed.
- **Paid, not delivered** lists creators who have been paid something but still
  owe streams.

## Leaving the roster

Two ways, for two different situations (Q51):

- **Discard** throws a record away. It is for a duplicate or a test entry, and
  it is refused once the record is evidence of anything: any payment
  (reversals included), any stream, or a claimed portal account. A sent but
  unclaimed invite does not block it.
- **Archive** hides a finished creator from the roster and the status chips —
  and nothing else. Their payments stay in the ledger, and their installs and
  spend stay in every campaign figure and in committed budget. It is refused
  while money is still owed. It is reversed from the creator's own screen,
  reached through the Archived filter, and nothing archives or restores itself.

## Campaigns and the overview

- A creator refers to their campaign **by id**, and a payment reaches its
  campaign through its creator, so renaming a campaign reaches every screen at
  once.
- **Committing past the budget is allowed and shown**, on the overview's budget
  panel and in the campaign form while the budget is typed. (Q7)
- **Campaign is a scope, status is a lens.** The headline figures, chip counts,
  follow-up panels and budget panel follow the campaign filter only. The table
  and the installs chart follow both campaign and status. (Q20)
- Search matches a creator's name or code on the overview. On the ledger it
  also matches a payment's reference, the text a bank statement line carries.

## Still open

Questions whose answers will change these rules: Q13 (one creator in several
campaigns), Q24 (setting status by hand), Q52 (revoking an invite), Q53 (a
tracking link surviving a change of code), and the attribution and delivery
questions Q37–Q46. See [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) and the
master build plan.
