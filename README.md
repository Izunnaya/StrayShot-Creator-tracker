# Stray Shot Creator Tracker — Web

The frontend half of the creator tracker. Separate repo from the API.

**Stack:** React + Vite + TypeScript, Tailwind CSS v4.

```bash
npm install
npm run dev
```

Requires Node 22.12+ (or 20.19+). On older Node, npm silently skips Vite's
native rolldown binding and the build fails with "Cannot find native binding".

## Layout

| Path              | What lives there                                              |
| ----------------- | ------------------------------------------------------------- |
| `src/index.css`   | Design tokens as a Tailwind `@theme` — every colour and face  |
| `src/ui/`         | Shared primitives: buttons, chips, tiles, pills, progress bar |
| `src/components/` | Shell pieces such as the masthead                             |
| `src/screens/`    | One file per screen                                            |
| `src/data/`       | Static fixture data, replaced by the API in Phase 3           |
| `src/lib/`        | Formatting helpers                                             |

## Where this is in the build

Static screens phase: screens are built with fixture data and no state. Filters
and sort headers render their selected state but do not respond to clicks yet.
Wiring, routing and API calls come in the frontend and integration phases.
