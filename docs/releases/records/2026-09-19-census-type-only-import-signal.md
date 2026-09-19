# 2026-09-19-census-type-only-import-signal — the coverage census stops scoring a governed signal from an erased import

## Release ID

`2026-09-19-census-type-only-import-signal`

## Status

`candidate`

## Plain-English Summary

The test-coverage census ranks directories of tests that no CI job runs, so
whoever wires the next one starts with the riskiest. Its risk signals come from
the product modules a test imports — an AI-surface control, an approval write, a
tenant-scoped read.

It was reading a **type-only** import as if it were a real one. `import type { X }
from "…"` is erased by the compiler before the test runs: nothing is loaded and
nothing is exercised. A suite that borrowed a type name from a governed module
therefore inherited that module's risk, and the printed method note — "signals
come from product modules statically imported by the tests" — was true of the
letter and not of the substance.

This change makes the scorer read the three erasable forms as erasable, and
states that in the method note the report prints.

**It changes the ranking, and one change is worth naming.** A route test
directory sat at rank 20 banded `critical` on an `approval_or_lifecycle_write`
signal whose *only* evidence was a view-model module it reached by
`import type`. With the type edge dropped it keeps the tenant-read signal it
genuinely has and moves to `high`. Five further directories fall from `high` to
unclassified for the same reason. Each of the six was read by hand and the
dropped edge is a genuine `import type` in every case. No directory gains a band.

## Layer Impact

Release lane: `internal-admin` — repository tooling used by the team to decide
which untested directory gets wired next. No client-facing surface.

- **Layer 4 (products):** none. No product code, route, prompt or surface
  changes.
- **Tooling / measurement:** `scripts/quality/test-ci-coverage-census.mjs` only.
  The census is a measurement that always exits 0 and gates nothing; what moves
  is the order of an advisory queue.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — `stripErasableImports` removes
  `import type … from`, `export type … from`, and brace lists whose every
  specifier carries the inline `type` keyword, before specifiers are read. A
  brace list holding one value specifier among the types is kept: the module is
  loaded for that binding.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — two cases driving
  the real script against scratch repositories.

## QA / Validation

Clean baseline and after, same scope, on exact `origin/main`
`31c364e043f0b634650516bb5e2875158921a89b`:

- `npx jest src/__tests__/behaviors` — **344 passed / 0 failed before**,
  **346 passed / 0 failed after** (the two added cases).
- The two new cases first, against the unchanged script: **2 failed / 12 passed**
  in that suite. After the fix: **14 passed**.
- Mutation-checked, three applied and three caught:
  1. `TYPE_ONLY_STATEMENT_RE` never fires → 2 failed.
  2. the brace-list rule always returns the statement → 1 failed.
  3. the brace-list rule strips **every** braced import (the over-correction
     direction) → 2 failed, including the case asserting a value import still
     scores.
  Each mutation was reverted; the file on the branch is byte-identical to the
  reviewed version.
- `node scripts/quality/check-integration-ci-visibility.test.mjs` — 6 pass,
  0 fail. That script exports the command extraction this one imports.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, no diagnostics, with `tsconfig.tsbuildinfo` removed first.
- `npx eslint` on both changed files — exit 0.
- Ranking delta measured rather than asserted: `criticalGovernedRiskDirectories`
  50 → 49, `high` 114 → 110, `unclassified` 225 → 230; six directories change
  band, none upward.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is imported by the
application, and the census runs as an advisory measurement.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image change
- ACA runtime invariant: unaffected; will be re-proven after the merge deploy as
  standing practice
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — no product surface changes

## Rollback Plan

Revert the commit. The census re-reads the tree on every run and holds no state,
so the previous ranking returns on the next invocation. No migration, no data.

## Audit Evidence

- The PR diff and its CI run.
- `node scripts/quality/test-ci-coverage-census.mjs` output before and after,
  whose `counts` block carries the three banding numbers quoted above.
- The suite's mutation results, recorded above with the failure counts.

## Known Gaps

- The committed census at `docs/architecture/test-ci-coverage-census.json` is
  **not** regenerated here. Refreshing it is a separate open question about
  whether the file should be a derived artifact or a periodic snapshot, and
  regenerating it inside this change would bury a 37-line scorer diff in an
  800-line data diff — the exact review failure this backlog exists to repair.
  The committed file already lagged a fresh run before this change.
- A module a test reaches only through `jest.mock("…")` is still not counted as
  an edge. That is pre-existing — the specifier matcher never saw `jest.mock`
  arguments — and is the opposite direction of error from the one fixed here, so
  it is recorded rather than folded in.
