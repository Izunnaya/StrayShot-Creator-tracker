# Contributing

## How work is planned

Work follows the master build plan: every task is numbered by module (4.21,
6.15…), every open question by Q-number, and each module goes through five
phases in order — planning, static screens, frontend, backend, then
integration and testing. A module's static screens are approved before its
behaviour is built. Work discovered mid-task is added to the plan, not folded
in silently.

Product questions are not answered in code. A question raised during the build
goes into [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) with its options, what each
costs, and what it blocks. When it is answered, it moves to
[DECISIONS.md](DECISIONS.md) with the reasoning and what was ruled out.

The visual design is the Claude Design project. Screens follow it exactly,
including sizes; read the design rather than inferring from a screenshot.

## Branches and pull requests

- Branch from `master`: `feature/<area>` for new work, `fix/<what>` for
  corrections, `docs/<what>` for documentation.
- Open the pull request **into `master`**. Merging to `master` deploys
  production on Vercel.
- Every pull request gets a Vercel preview deployment, linked from the PR.
  Check the change there, at desktop and phone widths, before merging.
- Pull requests are reviewed automatically by Claude (the _Claude Code Review_
  workflow). Mention `@claude` in a PR or issue comment to ask it something
  directly.

## Commits

Each commit is one change that stands on its own and passes every check.

The subject line is a plain sentence in the imperative saying what the change
does for the product, without a type prefix:

```
Show an overpaid creator as overpaid, not settled
Refuse money typed past the cent instead of rounding it
Give each screen its own address
```

The body says why: what was wrong or missing, what was considered, and which
Q-number or task it settles. Wrap it at about 72 characters.

## Before you push

From `frontend/`:

```sh
npm run build          # type-check (tsc -b) and production build
npm run lint           # oxlint
npm run format:check   # Prettier
npm test               # the full suite
```

All four must pass.

## Code conventions

- **Rules go in `src/domain/`**, as pure functions with tests beside them.
  Screens call them; screens never compute a balance, a status or a total.
- **Money is integer cents** everywhere. Only `src/lib/format.ts` turns cents
  into dollars, and only for display.
- **Records refer to each other by id**, never by a copied name.
- **Payments are append-only.** Nothing edits or deletes one; a correction is a
  reversal.
- **Imports:** use `@/` across source folders, relative imports for files in
  the same folder.
- **Formatting:** Prettier — single quotes, no semicolons, 100-character lines,
  LF line endings. EditorConfig and `.gitattributes` keep editors and Git
  consistent.
- **Styling:** Tailwind utilities over the design tokens in `src/index.css`.
  Never hardcode a colour outside that file.
- **Accessibility:** use real table, heading and button semantics. Dialogs go
  through `ui/Modal`, which manages focus.

## Tests

- A new domain rule gets a unit test in the same folder (`*.test.ts`, runs in
  Node).
- A new screen behaviour gets a rendered test (`*.test.tsx`) whose first line
  is `// @vitest-environment jsdom`, driving the screen the way a person would
  through Testing Library and `user-event`.
- Test what the user sees and what the rule promises, not the implementation.
- Update the test inventory in `frontend/README.md` when you add a test file.
