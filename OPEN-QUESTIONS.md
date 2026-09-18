# Open questions

Questions raised while building, in the numbering the master checklist uses
(Q1–Q50 live there). Each says what is being asked, why it matters, what the
options cost, and what it blocks. Answers move to DECISIONS.md, with the
reasoning that settled them.

Nothing here is decided. Where a recommendation appears it is marked as one.

---

## Q52 — Can a sent invite be revoked?

**The gap.** An invite can be sent and resent, and the record shows not sent /
sent / claimed. Nothing takes one back. An invite sent to the wrong address,
or to someone who should never have been added, stays valid until it is used.

Section 8 of the Additions says invite links are unique and single use, and
rules out self-service recovery — but says nothing about the team cancelling
one.

**The options.**

- **Revoke.** The link stops working and the creator returns to "not sent".
  Someone following the old email lands on the expired screen, which already
  exists in the design.
- **Rely on resending.** If a resend invalidates the previous link (Q15, also
  unanswered), sending a new invite to a corrected address is already a
  revocation of the old one — but only when there is a corrected address to
  send to, which is not the case for a creator added by mistake.
- **Leave it.** A wrongly sent invite is claimed by whoever received it, and
  the team deals with it afterwards.

**Recommended:** revoke, and make it explicit that a resend invalidates the
previous link. They are the same mechanism.

**Depends on:** Q14 (how long an invite is valid) and Q15 (whether a resend
kills the previous link). **Blocks:** 8.2, and the invite controls on the
creator form.

---

## Q53 — Does a tracking link survive a change of code?

**The gap.** A creator's tracking link is derived from their code, and the
code is editable. Correcting a mistyped code therefore breaks every link
already published in a stream description or a pinned comment, silently: the
old link keeps resolving to nothing, and the installs it would have earned go
unattributed.

This is Q40 in the master checklist, unanswered, and it is the reason a code
correction is not as cheap as it looks on the form.

**The options.**

- **Keep old codes redirecting.** A creator owns a current code and any number
  of retired ones; retired codes redirect and still attribute. Nothing already
  published breaks. Costs a table of codes per creator rather than a column on
  the creator.
- **Freeze the code once the invite is claimed or a link is published.** The
  mistake has to be caught early, and after that a correction means a new
  creator record.
- **Let it break.** Simplest, and quietly loses installs.

**Recommended:** retired codes that still redirect and attribute. It is the
only option where a correction cannot cost a creator their installs.

**Blocks:** 17.1 (code format and generation), 18.2 (tracking links), and the
attribution rules in Module 19.

---

## Q54 — Does a payment need a details view of its own?

**The gap.** Clicking a payment in the ledger opens the creator it went to.
Nothing shows one payment on its own, the way a bank statement opens a single
transaction. Neither brief asks for it and the design has no such screen.

Today it would mostly repeat the row: the desktop ledger already shows every
field a payment stores. It becomes worth having once there is something the
row cannot carry:

- **The reversal pair together.** The two halves of a cancelled payment are
  tagged separately in the list; nothing shows "reversed on 14 Aug by K. Osei"
  beside the payment it undid, with a link between them.
- **An address for one payment**, such as `/payments/1042`, to paste into a
  reconciliation sheet or a message to finance.
- **Audit detail from the API:** when the payment was entered, as distinct from
  the date the money went out, and the reason for a reversal (Q55).

**The options.**

- **A details panel or dialog** opened from a ledger row and from the creator's
  payment history, with its own address, the reversal pair, and Reverse.
- **Richer rows instead.** Link a reversal to its original in the list, and
  leave one-payment views out.
- **Leave it.** The row and the creator's screen are enough.

**Recommended:** a details view, built after the payments endpoint exists
(tasks 6.15–6.18), when it has entry times and audit data to show. It needs a
design in the Claude Design project first.

**Depends on:** Q55 for the reversal reason. **Blocks:** nothing yet; it would
be a new task in Module 7.

---

## Q55 — Should a reversal record why?

**The gap.** Reversing a payment records the negative amount, the date and who
reversed it (Q6), but not the reason. A year later, a reversal in the ledger
says that a payment was cancelled and never why: a typo in the amount, the
wrong creator, a bounced transfer, a duplicate entry. For a finance record,
"why was this undone" is the first question an auditor asks.

A second, smaller gap: a reversal's date is the day it was entered, stored in
the same `paidOn` field as a payment's, though no money moved that day.

**The options.**

- **A required reason**, chosen from a short list (wrong amount, wrong
  creator, duplicate, transfer failed, other) with a free-text note for
  "other". Consistent and reportable.
- **An optional free-text note.** Cheap, and will mostly be left empty.
- **Leave it.** The team explains reversals outside the tool.

**Recommended:** a required reason from a short list, with a note, and the
reversal's date named for what it is (`reversedOn`) when the schema is
written. The reversal dialog gains one field.

**Blocks:** the payment schema (6.15) and Q54's details view.
