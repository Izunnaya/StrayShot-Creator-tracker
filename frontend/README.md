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

The overview filters creators by campaign and lifecycle status. The summary and
installs chart follow both filters; status-chip counts and follow-up panels
follow the campaign only. The app shell preserves filtering and sorting when
opening a creator and returning to the overview.

A creator with no committed streams, agreed amount, delivered streams, or payment
records is a prospect. A zero-dollar deal with committed streams is contracted
until delivery is complete. This convention should be replaced by an explicit
deal record when the API is introduced.

Balances derive from payment records. Unmeasurable cost per install displays as
an em dash and sorts last in both directions. The blended figure is also
unmeasurable when nothing has been paid. Payment history and its balance summary
show cents; dashboard summaries retain whole-dollar formatting.

The performance table uses native table, column-header, and row-header semantics.
Creator names are keyboard-operable buttons, and the active column header
exposes its sorting direction.

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

The suite contains 138 tests in 13 files. `npm test` is the source of truth
for that count; the split below is what each group is for.

**Unit tests, 111, running in node.** Nine files covering the domain layer and
the formatters: calculations, filtering, sorting, the campaign summary, the
cost-per-install rating, payment history and the payment recording rules, plus
src/lib/format.test.ts, which holds money to exact cents.

**Rendered tests, 27, running in jsdom.** Four files, each opting in with a
`// @vitest-environment jsdom` docblock so the unit suite keeps running in node
and keeps its speed:

| File                                                         | Tests | What it covers                                                                          |
| ------------------------------------------------------------ | ----- | --------------------------------------------------------------------------------------- |
| features/dashboard/dashboardInteraction.test.tsx             | 5     | Filtering and sorting reaching the table, and returning from a creator with both intact |
| features/dashboard/components/InstallsOverTimeChart.test.tsx | 7     | The chart component, including a zero-install series keeping its stream markers         |
| features/payments/recordPayment.test.tsx                     | 9     | Recording a payment through the modal, and every reason it refuses to save              |
| features/payments/reversePayment.test.tsx                    | 6     | Reversing a payment, and that dismissing the confirmation changes nothing               |

Vitest discovers both .test.ts and .test.tsx files.

## Remaining work

Campaign and creator editing, the payments ledger, public and creator portal
routes, persistence, authentication, and platform integrations remain
unimplemented. Loading and network-error states will be needed when the screens
consume API data. Navigation currently uses component state rather than
shareable URLs.

Recording and reversing a payment are built, against the fixture data the shell
holds in memory. Sorting the creator table is unavailable below the lg
breakpoint, where the table becomes cards and the column headings it lives in
are gone.

Product decisions still open include whether status should filter headline
figures, and the cost-per-install target when all campaigns are selected
(currently 350 cents). The four payment decisions — who is recorded, how
overpayment behaves, how a mistake is corrected, and the money unit — are
settled in DECISIONS.md at the repository root. One piece of the overpayment
decision is still outstanding: the record payment modal warns and allows it,
but a creator who has been overpaid does not yet show that figure on their own
screen.

Unfiltered reference totals remain $47,000 paid of $55,200 committed,
$8,200 outstanding across five creators, and 25,545 installs from 2,275,000 views.
There are eight active creators and six completed creators.
