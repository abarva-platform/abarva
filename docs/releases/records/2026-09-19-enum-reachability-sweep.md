# 2026-09-19-enum-reachability-sweep — Check enum comparisons against the column's CHECK constraint

## Release ID

`2026-09-19-enum-reachability-sweep`

## Status

`candidate`

## Plain-English Summary

Several database columns in this product are restricted to a fixed list of
words — a status may be one of four values and nothing else. Application code
then asks questions like "give me the rows whose status is one of these". If
the words in the code are not words the column is allowed to hold, the question
can never be answered yes, and the feature that depends on it silently stops
working. Nothing crashes and no test fails, because a test supplies its own
rows and can hand the code any word it likes.

That happened on `main` earlier today: a newly added gate accepted three status
words the column could not hold, so it refused every row that existed and
blocked a create path. Twenty-seven checks passed on the way in.

This change adds a sweep that reads every such restricted column out of the
migrations, finds the SQL in the application that compares values against those
columns, and fails when a comparison names a value the column cannot hold. It
found one comparison of that shape in the repository. That one is deliberate —
a script that checks an old value left no rows behind after a rename — so it now
carries a written waiver at the call site, and the sweep still prints it on
every run rather than hiding it.

## Layer Impact

Release lane: `global-control-lane` — a CI gate and developer command that
applies to the whole repository, not scoped to any client and not gated by a
feature flag. No client data plane is touched.

- **Layer 4 (products):** no product surface, route, component, copy, prompt or
  answer path changes. Nothing a signed-in user can observe is different.
- **Tooling / CI:** one new check script, one new behavioral suite, one new
  workflow step, one gate-registry classification.
- **Layer 3 (canonical model):** read-only. The sweep parses migrations; it
  opens no connection and writes nothing.

## Client Applicability

- All clients: no behavioral change.
- Specific clients: none.
- Internal only: yes — this is a CI gate and a developer command.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/enum-reachability.mjs` (new) — the sweep.
- `src/__tests__/behaviors/enum-reachability.test.ts` (new) — 20 cases driving
  the real script as a process, against scratch trees and against this
  repository.
- `package.json` — one appended script, `audit:enum-reachability`.
- `.github/workflows/coverage-threshold.yml` — one appended step.
- `docs/architecture/ci-gate-registry.json` — one entry, classified `pr-gate`.
- `src/scripts/verify-029-032.mjs` — one declared waiver comment. No behavior
  change; the query is unchanged.

## QA / Validation

**Failing first.** The suite was written before the sweep was finished and run
against the tree: **3 failed / 15 passed of 18**. Two failures were real defects
in the sweep — the alias parser consumed the `JOIN` keyword as an alias of the
preceding table, so the second table of every join went unregistered, and an
unqualified column then resolved against the wrong table. The third was the
repository finding described below. After the repair and the waiver:
**0 failed / 20 passed of 20**.

**Mutation check.** Fourteen mutations of the real script, each applied to the
file the suite executes, each restored byte-identically afterwards and the
restore verified by SHA-256: **14 caught, 0 survived**. Four survived their
first attempt and the missing cases were added rather than the survivors
recorded:

- a CTE was only tested with a name no migration constrains, so treating every
  CTE as a base table resolved to nothing either way and passed; the case now
  names the CTE after a real table;
- the minimum waiver-reason length was unreachable, because the only case used
  an empty reason that the marker pattern already rejected; a short-but-present
  reason case was added;
- no case placed a SQL comment above a comparison, so replacing comments with a
  single space — which shifts every offset after them and misreports the line a
  finding sits on — passed; a case now asserts the line under a comment;
- the `PARTIAL` verdict had no case that distinguished it from `UNREACHABLE`.

**Scope baseline**, same command either side, measured by restoring the tree to
`main` and re-running: `npm run test:behaviors` — 31 suites / 308 tests /
**0 failing before** → 32 suites / 328 tests / **0 failing after**.

**Anti-vacuity.** A sweep that resolves nothing reports clean in the same voice
as a sweep that resolved a hundred, which is how a check in this repository has
gone green on a deleted subject before. The sweep therefore reports its
resolution count and exits `3` with a `VACUOUS` verdict below a recorded floor.
On this tree it reads **633 CHECK-constrained columns** across 373 migrations
and resolves **147 comparisons** to a specific constrained column (375
considered, 86 left unresolved and reported as such rather than passed).

**Commands.** `npm run typecheck` exit **0**; `npx eslint` on all changed files
exit **0**; `npm run audit:enum-reachability` exit **0**;
`node scripts/release-check.mjs --base origin/main --head HEAD` exit **0**.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is loaded by the
application at runtime. The repo-owned ACA deploy workflow will build and deploy
the merge commit as it does for any merge, and the runtime invariant will be
proven after it, but no deployed behavior depends on this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: unchanged by this release; recorded after the merge
  deploy as the standard invariant proof.
- ACA runtime invariant: to be read back after merge — template image = 100%
  traffic revision image = both worker job images, digest-pinned.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No route, component, copy, prompt,
  schema, query or data path changes; there is nothing a browser session could
  observe. The one edited runtime file gains a comment.

## Rollback Plan

Revert the PR. The sweep is additive: reverting removes a CI step, an npm
script, a registry entry, a test suite and a comment. No migration, no data, no
runtime state. If the gate proves too noisy before it is tuned, the registry
entry can be reclassified to `report` in a one-line follow-up, which keeps the
measurement and stops it blocking.

## Audit Evidence

- The PR and its CI run, including the `Check enum comparisons against their
  CHECK constraints` step in `Behavior coverage floor`.
- `npm run audit:enum-reachability` output, which prints the resolution counts
  and every waived finding with its reason on every run.
- The mutation table above.

## Known Gaps

- **Only three comparison forms are understood:** `col IN ('a','b')` and
  `col = 'a'` inside SQL-shaped template literals, and `.from('t')` … `.eq()` /
  `.in()` builder chains. A vocabulary held in a TypeScript union type or a
  `const` array — which is where the item-126 defect actually lived after its
  repair — is not compared to anything by this sweep. Stated as a limit rather
  than guessed at: matching a named constant to a column requires a naming
  convention this repository does not have.
- **Parameterised comparisons are invisible by construction.** A query written
  `promotion_state = ANY($4::text[])` carries no literal, so the sweep cannot
  judge it. That is the form the item-126 classifier query now uses.
- **86 of 233 candidate comparisons are unresolved** — the statement names no
  constrained table, or more than one table constrains the same column name.
  These are reported in the counts, never counted as passes.
- **Test files are excluded.** A fixture asserting an impossible value is part
  of why the item-126 defect stayed invisible, but scanning tests needs its own
  treatment: a test may legitimately construct an invalid row. Not attempted.
