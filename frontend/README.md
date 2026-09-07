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
and accommodates counts above 1,000. Empty and all-zero series show an empty
state; a single day renders a point. Expand the chart's daily-values disclosure
to read the counts and stream-day creator codes as a table.

## Validation

The suite contains 89 tests: 84 covering the domain layer, and 5 interaction
tests in src/features/dashboard/dashboardInteraction.test.tsx that drive the
rendered dashboard through React Testing Library and user-event — campaign and
status filtering, sorting by a column heading in both directions, and returning
from a creator with filters and sort intact. Vitest runs in the node environment
by default; the interaction file opts into jsdom with a @vitest-environment
docblock, so the domain suite keeps its speed.

## Remaining work

Campaign and creator editing, recording payments, the payments ledger, public
and creator portal routes, persistence, authentication, and platform integrations
remain unimplemented. Loading and network-error states will be needed when the
screens consume API data. Navigation currently uses component state rather than
shareable URLs.

Product decisions still open include whether status should filter headline
figures, the CPI target when all campaigns are selected (currently $3.50), and
how overpayments should be represented (currently outstanding balance is
clamped to zero).

Unfiltered reference totals remain $47,000 paid of $55,200 committed,
$8,200 outstanding across five creators, and 25,545 installs from 2,275,000 views.
There are eight active creators and six completed creators.
