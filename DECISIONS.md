# Decisions

Answers to open questions from the master checklist, with the reasoning behind
them. Each entry says what was ruled out as well as what was chosen, so a later
reader can tell a deliberate trade-off from an oversight.

The first five were delegated rather than answered directly; Q7, Q20 and Q21
were answered by the team. Any of them can be overruled — the cost of doing so is
noted in each.

---

## Q4 — "Recorded by" is the signed-in user, not free text

**Decided:** the field is stamped from the session and shown read-only in the
Record payment modal.

The prototype made it an editable text box defaulting to a name. On a finance
record, a typed name proves nothing: it can be mistyped, left on a colleague's
default, or set to anyone. The value of the field is answering "who do I ask
about this entry", and only an authenticated identity answers that.

Team authentication is Q3 and does not exist yet (task 0.16). Until it does,
the value comes from a `currentTeamMember` stub so the field is real from the
first payment recorded, and swapping the stub for the session is a one-line
change rather than a data migration.

**Amended:** the payment stores `recordedByTeamMemberId`, not a name. A
display name cannot tell two M. Devlins apart, and it stops being true the
moment one is corrected or changed — on an append-only record, where the entry
is never rewritten, that leaves attribution quietly wrong rather than
obviously missing. The id is immutable and the name is resolved from
`teamMembers` when a payment is rendered, the same way a campaign name is
resolved from its id.

That directory is append-only for the same reason. Someone who leaves is
deactivated, never deleted: their id is on every payment they recorded, and
removing the row would turn exact attribution into "unknown team member"
across the whole history.

The id is a string while every other id here is a number, because it does not
come from the same place: the others are minted by the API, and this one
identifies an authenticated subject, which arrives as a string from whatever
issues the session. Storing it as a number now would guarantee the migration
this decision set out to avoid.

**Ruled out:** free text with a default; storing the display name alongside
the id, which is the same staleness with an extra copy to disagree with.
**Reversible:** yes, cheaply.

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

## Q7 — Committing past a campaign budget is allowed, and shown

**Decided:** a campaign whose agreed deals exceed its budget saves, and says
so. The dashboard shows committed against budget whenever a single campaign is
in view, and the campaign form says what is already committed while the budget
is being typed. Nothing refuses a deal or an edit for being over.

This follows Q5, and for the same reason. A signed deal is a fact; refusing to
record it does not unsign it, it only means the tracker disagrees with what the
team has actually agreed. The escape hatch from a hard block is typing a larger
budget, which corrupts the very figure the block was protecting.

A block would also be unescapable in practice. A budget is a campaign-level
total but deals are saved one creator at a time, so the rule would have to fire
in the creator form on the strength of other creators' records — and lowering a
budget below what is already committed would then leave every creator on that
campaign unsaveable, down to correcting an email address.

The budget was collected and displayed nowhere before this, so going over was
silent rather than permitted. The fixture data has been over on Season 2 Launch
all along — $34,300 committed against $30,000 — and nothing on screen said so.

**Ruled out:** refusing to save a deal that takes a campaign over budget, and
refusing to lower a budget below what is committed.
**Reversible:** yes. `getCampaignBudgetPosition` already computes the overage,
so a block would be a guard at a save site rather than new arithmetic.

## Q20 — The headline figures follow the campaign, not the status filter

**Decided:** the dashboard's four summary figures are scoped by the campaign
chips and unaffected by the status chips.

Campaign is a scope and status is a lens: the figures say which campaign they
describe, and the table below says which of its creators are being looked at.
The application already worked this way everywhere else — the status chip
counts and both follow-up panels were scoped to the campaign only — so the
summary strip was the one place where status changed what the numbers meant.

Selecting Prospects made the strip read "$0 paid of $0 committed", which looks
like a broken campaign rather than an empty slice, and took away the
denominator the filtered table is being read against.

**Ruled out:** totals that follow both filters, on the argument that what is
shown should be what is totalled.
**Reversible:** yes, one call site — `filterCreatorsByCampaign` back to
`filterCreators`.

## Q51 — A creator is archived when they are finished, discarded only while untouched

**Decided:** both, because they answer different questions. Archiving takes a
creator out of the roster once the work is over and keeps everything they
carry. Discarding throws the record away, and is refused the moment the record
is evidence of anything: money recorded against them, a stream detected, or a
claimed portal account. Correcting a record is editing, which already covers
every field.

Discarding exists for the two cases that actually occur: the same creator
entered twice, and the test entry someone made while learning the form. Both
are records of nothing, and leaving them in place inflates the roster, the
status chip counts, and a campaign's committed budget.

What it refuses is the more important half. Payments are in the ledger and
installs are attributed through the creator's code, so removing a creator who
has either would take money out of a total that has to reconcile against a
bank statement — the same reasoning that made payments append-only (Q6) and
the team directory deactivate-only (Q4). A reversed payment still counts as
money recorded: the pair sums to nothing but is two rows in the ledger, and
the ledger is what would lose them.

An invite that has been sent does not block it; one that has been claimed
does. Until it is claimed nothing exists but an email, and Q52 asks whether
that email can be revoked.

**Archiving hides, and hides nothing else.** An archived creator leaves the
roster and the status chips, and that is the whole of it. Their payments stay
in the ledger, their installs and spend stay in the campaign's figures, and
they still count toward committed budget. The alternative — money that leaves
the totals when a record is tidied away — is the same break a delete would
cause, arriving quietly a month later instead of at the click. Archiving is a
view, not an accounting event: the table is what the team works from day to
day, and last season's finished creators crowd it.

Archiving is refused while an outstanding balance stands. Archiving says the
work is finished, a debt says it is not, and the roster is where anyone would
go looking for someone to pay. An overpaid creator can be archived: nothing is
owed to them. The way through is to record the payment that settles them, or
reverse what was agreed — both already exist.

Restoring is a button on the creator's own screen, reached through the
Archived filter, and nothing restores by itself. A creator who is archived and
then earns a new stream stays archived; the team put them there.

The counts follow the same line. "All 14" and the chips beneath it describe
the roster, so they drop when someone is archived, and an Archived chip
appears beside them carrying its own count — shown only when there is
something on the shelf, so the row stays quiet on a fresh campaign.

**Ruled out:** a plain delete, which would break the ledger; archiving that
also withdraws a creator from the campaign's figures, which would make the
totals depend on who had been tidied up; and an automatic archive on
completion, which would move records nobody asked to move. What an archived
creator's portal shows is left to the portal work — the record is unchanged,
so the honest default is that it keeps working.
**Reversible:** yes. Both rules are one function each, `getDiscardBlockers`
and `getArchiveBlockers`, and archiving is a single `archivedOn` date.

## Q21 — Each creator is judged against their own campaign's target

**Decided:** cost per install is coloured against the target of the campaign
the creator is on, whether the dashboard shows one campaign or all of them. A
creator with no campaign gets no colour. The $3.50 fallback is gone.

With every campaign in view there is no single target, and the prototype
filled the gap with a design-tool value. But every row already belongs to a
campaign with a target of its own, so a stand-in was never needed: it only
ever disagreed with the real one. MiraPlays shows why it mattered — $3.33 an
install on a $3.00 campaign read as under target against $3.50, and turned
over target the moment their campaign was selected. A verdict that changes
with the filter is not a verdict about the creator.

The headline blended figure is not coloured at either level, so it needs no
target.

**Ruled out:** a fixed team-wide default; suppressing the colour when all
campaigns are shown, which would hide a real verdict to avoid a fake one.
**Reversible:** yes, one call site in the overview.

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

## Q9 — Per stream and flat fee are supported; per view is not

**Decided:** a deal's agreed total is the rate multiplied by the streams
committed when paying per stream, and the rate itself when it is a flat fee.
Per view is left out of the rate model entirely for now.

Per view has no agreed total, and everything about how this application
handles money is built on having one. The paid-against-agreed bar, the
outstanding balance, what the record payment modal projects, the "delivered,
payment open" panel and the overpayment rule are all proportions of a figure
agreed before any money moves. A per-view deal has no such figure until the
views exist, so those five things would each need a second meaning.

Supporting it properly needs one more piece of product: either a committed
view count, which would make it arithmetic like per stream, or a cap, which
would make it a flat fee with a refund. Neither is in the brief's field list,
and inventing one would be guessing at a commercial term.

So the dropdown offers the two that work, and the third waits for an answer
rather than being half-built. If a per-view deal is signed before then, it can
be recorded as a flat fee for the agreed cap.

**Ruled out:** an agreed total that moves as views accumulate — it would make
a settled deal un-settle itself overnight.
**Reversible:** yes. Adding a rate model is additive, and no existing record
would need to change.

---

## What these cost to implement

| Change                                                           | Where                                          |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| `currentTeamMember` stub, read-only in the modal                 | Module 6                                       |
| `getOverpaymentAmount`, warning copy, balance display            | `creatorCalculations`, Module 6                |
| `reversesPaymentId` on `Payment`, negative-amount validation     | `data/types`, Module 6, Module 7               |
| `getCampaignBudgetPosition`, budget panel, live line in the form | `campaignBudget`, Module 1, dashboard          |
| Summary scoped by campaign alone                                 | `CampaignOverviewScreen`                       |
| Money as integer cents through fixtures, domain and formatters   | `data/fixtures`, `lib/format`, all money tests |

The cents change touches the most files and is worth doing before the record
payment form exists, so the first thing that writes money writes it correctly.
