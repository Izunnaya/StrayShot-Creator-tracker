# Stray Shot Creator Tracker — Web

React, Vite, TypeScript, and Tailwind CSS frontend. Data is currently synthetic;
the backend and external integrations are not implemented.

## Development

Use Node 22.12+ (or a supported Node 20 release at least 20.19).

    npm install
    npm run dev
    npm test
    npm run lint
    npm run build
    npm run format
    npm run format:check

On Node 22.11, npm can skip the native Rolldown and Oxlint bindings. Use a
supported Node version when installing dependencies. The explicit Windows
bindings are optional dependencies so they do not prevent installation on
other platforms.

## Structure

- features/: screens and their components.
- ui/: shared presentation components.
- domain/: pure calculations, filtering, sorting, and chart aggregation.
- data/types.ts: shared data contracts, including daily installs and stream markers.
- data/fixtures.ts: demo records and synthetic fixture generation.
- lib/: display formatting and small helpers.

Use @/ for imports across source directories and relative imports for siblings.
The alias is configured in both TypeScript and Vite; Vitest uses Vite's resolver.
Both TypeScript projects enable strict checking.

Prettier defines single quotes, no semicolons, a 100-character print width,
and LF line endings. EditorConfig supplies editor defaults; .gitattributes
keeps text files using LF across platforms.

## Current behavior

The overview filters creators by campaign and lifecycle status. Campaign is a
scope and status is a lens: the summary figures, status-chip counts, follow-up
panels and budget panel follow the campaign only, while the table and the
installs chart follow both (DECISIONS Q20). With a single campaign in view, the
budget panel shows what its deals commit against its budget, and flags a
campaign that has committed past it — allowed and reported rather than refused,
per DECISIONS Q7. The campaign form says what is already committed while the
budget is being typed. The app shell preserves filtering and sorting when
opening a creator and returning to the overview.

A creator with no committed streams, agreed amount, delivered streams, or payment
records is a prospect. A zero-dollar deal with committed streams is contracted
until delivery is complete. This convention should be replaced by an explicit
deal record when the API is introduced.

A payment records the id of the team member who entered it, never their name:
the name is resolved from the session directory when it is rendered, so a
correction or a shared name cannot make an append-only record misattribute
itself (DECISIONS Q4). The directory never removes anyone.

Balances derive from payment records. Unmeasurable cost per install displays as
an em dash and sorts last in both directions. The blended figure is also
unmeasurable when nothing has been paid. Payment history and its balance summary
show cents; dashboard summaries retain whole-dollar formatting.

The performance table uses native table, column-header, and row-header semantics.
Creator names are keyboard-operable buttons, and the active column header
exposes its sorting direction.

The masthead tabs switch between the overview and the payments ledger. A
creator's own screen covers whichever tab opened it and returns there. The
ledger lists every payment across every creator, newest first and to the cent,
with reversals shown in place and both halves of a cancelled pair marked. It is
derived from the creator records on every render rather than stored, so a
payment recorded or reversed anywhere appears in it immediately. Its campaign
filter is separate from the dashboard's. Recording a payment is not offered
there: a payment settles one creator's deal, so it starts from that creator.

## Chart data

The fixture reporting window starts July 19, 2026 and covers 42 days.
Daily attribution is **synthetic**, not observed campaign performance. Weighted
daily records reconcile exactly to each creator's install total and assign
nothing before their campaign starts. Campaigns and lifecycle selections are
aggregated from those creator records. Stream markers come from stream history
and are deduplicated per creator and day.

The vertical scale adjusts to the selected data, includes numeric tick labels,
and accommodates counts above 1,000. A missing reporting window shows an empty
state; an all-zero series still draws the chart with its stream markers and a
note. A single day renders a point. Expand the chart's daily-values disclosure
to read the counts and stream-day creator codes as a table.

## Validation

The suite contains 281 tests in 23 files. `npm test` is the source of truth
for that count; the split below is what each group is for.

**Unit tests, 198, running in node.** Fourteen files covering the domain layer and
the formatters: calculations, filtering, sorting, the campaign summary, the
cost-per-install rating, campaign and creator recording rules, payment history,
the payment recording rules, the ledger, the campaign budget position and the
team-member lookup, plus src/lib/format.test.ts, which holds money to exact
cents.

**Rendered tests, 83, running in jsdom.** Nine files, each opting in with a
`// @vitest-environment jsdom` docblock so the unit suite keeps running in node
and keeps its speed:

| File                                                         | Tests | What it covers                                                                         |
| ------------------------------------------------------------ | ----- | -------------------------------------------------------------------------------------- |
| ui/Modal.test.tsx                                            | 15    | The dialog shell: focus in, no Tab out from anywhere, Escape, focus back to the opener |
| features/creators/creatorManagement.test.tsx                 | 11    | Adding and editing a creator across the three steps, and the portal invite             |
| features/campaigns/campaignManagement.test.tsx               | 13    | Creating and editing a campaign, a rename reaching every creator, and the budget line  |
| features/payments/recordPayment.test.tsx                     | 10    | Recording a payment through the modal, and every reason it refuses to save             |
| features/payments/paymentsLedger.test.tsx                    | 8     | The ledger gathering every payment, money entered elsewhere reaching it, attribution   |
| features/payments/reversePayment.test.tsx                    | 7     | Reversing a payment, and that dismissing the confirmation changes nothing              |
| features/dashboard/components/InstallsOverTimeChart.test.tsx | 7     | The chart component, including a zero-install series keeping its stream markers        |
| features/dashboard/dashboardInteraction.test.tsx             | 10    | Filtering and sorting reaching the table, what the headline figures follow, the budget |
| features/creatorDetail/CreatorDetailScreen.test.tsx          | 2     | A creator with no campaign showing a figure without a verdict                          |

Vitest discovers both .test.ts and .test.tsx files.

## Remaining work

Public and creator portal routes, persistence, authentication, and platform
integrations remain unimplemented. Loading and network-error states will be
needed when the screens consume API data. Navigation currently uses component
state rather than shareable URLs.

Campaign management, creator recording, recording and reversing a payment, and
the payments ledger are built, against the fixture data the shell holds in
memory. Sorting the creator table is unavailable below the lg breakpoint, where
the table becomes cards and the column headings it lives in are gone; the
ledger has no sorting to lose, being ordered by date throughout.

One product decision is still open: the cost-per-install target when all
campaigns are selected (currently 350 cents, and used only there — a creator
with no campaign is left unrated rather than judged against it). Whether status
filters the headline figures and whether commitments may exceed a campaign
budget are settled in DECISIONS.md as Q20 and Q7. The four payment decisions — who is recorded, how
overpayment behaves, how a mistake is corrected, and the money unit — are
settled in DECISIONS.md at the repository root. One piece of the overpayment
decision is still outstanding: the record payment modal warns and allows it,
but a creator who has been overpaid does not yet show that figure on their own
screen.

Unfiltered reference totals remain $47,000 paid of $55,200 committed,
$8,200 outstanding across five creators, and 25,545 installs from 2,275,000 views.
There are eight active creators and six completed creators.
