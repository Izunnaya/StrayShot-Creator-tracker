# Decisions

Answers to open questions from the master checklist, with the reasoning behind
them. Each entry says what was ruled out as well as what was chosen, so a later
reader can tell a deliberate trade-off from an oversight.

These four were delegated rather than answered directly. Any of them can be
overruled — the cost of doing so is noted in each.

---

## Q4 — "Recorded by" is the signed-in user, not free text

**Decided:** the field is stamped from the session and shown read-only in the
Record payment modal.

The prototype made it an editable text box defaulting to a name. On a finance
record, a typed name proves nothing: it can be mistyped, left on a colleague's
default, or set to anyone. The value of the field is answering "who do I ask
about this entry", and only an authenticated identity answers that.

Team authentication is Q3 and does not exist yet (task 0.16). Until it does,
the value comes from a single `currentTeamMember` stub so the field is real
from the first payment recorded, and swapping the stub for the session is a
one-line change rather than a data migration.

**Ruled out:** free text with a default. **Reversible:** yes, cheaply.

## Q5 — Overpayment is allowed, warned about, and recorded truthfully

**Decided:** a payment larger than the open balance saves. The modal warns
before saving and the creator then shows an explicit overpaid figure. The
agreed contract total is never silently raised to absorb it.

Money that has left the bank is a fact. Blocking the entry does not undo the
payment; it just means the tracker disagrees with the bank statement, which is
the one thing a finance record must never do. Silently raising the contract
total is worse still — that rewrites the agreement to make an error disappear.

Practically, `getOutstandingBalance` keeps its floor at zero, because nobody
owes a negative amount, and overpayment becomes its own derived figure
(`getOverpaymentAmount`) surfaced next to the balance. Two distinct facts, two
distinct figures, neither hiding the other.

**Ruled out:** blocking the save; auto-raising the agreed total.
**Reversible:** yes — this is display and validation, not storage.

## Q6 — Payments are append-only; mistakes are reversed, not edited

**Decided:** a recorded payment is never edited or deleted. A mistake is
corrected by recording a reversing entry that carries the negative amount and a
reference to the payment it cancels. The correct payment is then recorded
normally.

This is the decision with the longest reach, which is why it is worth settling
before the ledger is built rather than after. Editing in place destroys the
history the ledger exists to provide: the amount someone approved last month
silently becomes a different number, with nothing recording that it changed.
Voiding is better but still mutates a row that another view may already have
totalled.

Append-only keeps every figure derivable by summing, keeps the ledger honest
about what happened and when, and matches how the finance side of the business
already thinks. The cost is one extra field on a payment
(`reversesPaymentId`), validation that only reversals may be negative, and a
ledger that must show reversals rather than quietly netting them out.

**Ruled out:** edit in place; soft delete or void flags.
**Reversible:** expensive after the ledger and any real data exist.

## Q8 — One settlement currency, money stored in minor units

**Decided:** contracts and payments are all in USD for now. Money is stored as
integer cents, not floating-point dollars. The creator's preferred payout
currency stays on their record as display metadata and does not affect any
figure.

The dashboard sums money across creators — paid to date, outstanding, the
ledger total. Mixing currencies in those sums without a conversion policy
produces numbers that are simply wrong, and a conversion policy is a real
decision with no sensible default: which rate source, and the rate on which
date — the day the deal was agreed, the day the payment cleared, or today.
Nobody has signed a non-USD deal, so that decision is not owed yet.

Integer cents is the part worth doing now regardless. Floating-point dollars
drift once you sum them, and the payment history already shows exact amounts,
so a $100.49 payment must survive a round trip intact.

**Ruled out:** multi-currency totals with conversion; floats.
**Reversible:** the currency scope, yes. The storage unit is a migration.

---

## What these cost to implement

| Change | Where |
| --- | --- |
| `currentTeamMember` stub, read-only in the modal | Module 6 |
| `getOverpaymentAmount`, warning copy, balance display | `creatorCalculations`, Module 6 |
| `reversesPaymentId` on `Payment`, negative-amount validation | `data/types`, Module 6, Module 7 |
| Money as integer cents through fixtures, domain and formatters | `data/fixtures`, `lib/format`, all money tests |

The cents change touches the most files and is worth doing before the record
payment form exists, so the first thing that writes money writes it correctly.
