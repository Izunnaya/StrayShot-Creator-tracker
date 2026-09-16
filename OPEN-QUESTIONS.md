# Open questions

Questions raised while building, in the numbering the master checklist uses
(Q1–Q50 live there). Each says what is being asked, why it matters, what the
options cost, and what it blocks. Answers move to DECISIONS.md, with the
reasoning that settled them.

Nothing here is decided. Where a recommendation appears it is marked as one.

---

## Q51 — What happens to a creator who should not be in the roster?

**The gap.** Nothing in the application removes a creator. Campaigns have
archiving in the plan (task 1.6); creators have no equivalent, and neither
brief asks for one. A creator added twice, or typed in as a test, stays in the
table, in the status chip counts, and in the campaign's committed total for as
long as the record exists.

**Why it is not simply a delete button.** A creator is a financial record.
Payments hang off them, and installs are attributed through their code, so
deleting one takes money out of the ledger and installs out of the totals —
the ledger would stop reconciling against the bank statement, which is the one
thing it exists to do. The same reasoning settled Q6 (payments are reversed,
never edited) and Q4 (team members are deactivated, never deleted).

**The options.**

- **Archive.** The creator leaves the table by default and keeps everything
  they carry: payments stay in the ledger, installs stay in the campaign
  totals. Reversible. Needs a decision on whether an archived creator still
  counts toward committed budget, and what their portal shows if they log in.
- **Discard, narrowly.** A real delete, allowed only while nothing has
  happened: no payments, no streams detected, no invite claimed. It covers the
  duplicate and the test entry without ever removing a financial record. Needs
  a decision on whether a sent-but-unclaimed invite blocks it.
- **Both**, which is the shape most finance tools end up with.
- **Neither.** Wrong records are corrected by editing and otherwise left in
  place. Honest, and cheap to build — it is what exists today — but the roster
  accumulates records nobody can act on.

**Recommended:** archive, plus discard while a creator is untouched. Together
they cover both real cases without a control that can destroy a payment.

**Blocks:** a creator archive/discard task in Module 4, the roster's default
filter, and the creator endpoints in Phase 4 (which should not offer DELETE
until this is settled).

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
