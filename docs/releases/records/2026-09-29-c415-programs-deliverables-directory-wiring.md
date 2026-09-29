# 2026-09-29-c415-programs-deliverables-directory-wiring — Wire the Programs deliverables test directory into CI

## Release ID

`2026-09-29-c415-programs-deliverables-directory-wiring`

## Status

`candidate`

## Plain-English Summary

Four test suites for Programs deliverables existed, passed, and were run by no
continuous-integration job. They cover artifact review decisions, the
deliverable quality validator, move artifacts, and review regeneration. If a
future change broke any of those, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 16 to 15.

Each suite was run on its own **before** it was wired. All four pass, with 28
cases in total. So this change protects future work; it does not repair a
break. The directory is not coverage of nothing: live code outside it imports
the modules under test. That code includes the v1 artifact review-decision,
review-regenerate, list, upload and stage-readiness-workbook route handlers, the
strategic-move phase page, and the deliverable orchestrators that call the
quality validator.

This is slice 1 of backlog item C-415. Fifteen directories remain.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling that applies
to every client's build equally, behind no feature gate.

- **Layer 4 (Products)** — no product behavior changes. No route, component,
  adapter, projection or canonical object is touched. The four test files are
  unmodified.
- **Platform tooling / CI** — one job step added. Three committed measurements
  are updated to match what the repository now does: the coverage census and
  the two dark-directory baselines.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — CI coverage only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — one step,
  `Exercise the Programs deliverables suites`, running
  `npx jest src/lib/programs/deliverables/__tests__ --runInBand`. It is wired
  as a directory with no trailing slash. The path regex does not reach
  `deliverables/orchestrated/__tests__`, which is a separate dark directory
  with its own slice.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (16 → 15).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed. That baseline is set equality over the census's
  dark list, and a wired directory is no longer in it.
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. Covered test files 2221 → 2225,
  uncovered 333 → 329. The rest of the diff is rank renumbering.

## QA / Validation

**Measured before wiring, each suite run on its own with `--runTestsByPath`:**
artifact-review-decisions 4/4, deliverable-quality 17/17, move-artifacts 4/4,
review-regeneration 3/3. All green.

**Source-text scanner judgement, per suite:** none of the four reads a file's
bytes (`readFileSync`, `fs`, `__dirname` and `process.cwd` all absent), so
`T-770` has nothing to refuse and `textIsTheSubject` is negative for all four.

**Baseline over the same scope, base `5cd7a40116` vs this branch.** The base
was measured in this worktree before any edit.

- `npm run test:behaviors`: 154 suites / 1671 tests / 0 failing before, and the
  same after.
- `npm run audit:test-ci-coverage:check`: exit 0 before and after.
- Intermediate state (step added and census refreshed, baselines not yet
  edited): 2 failing of 85 across the ratchet, census and `T-770` suites. Those
  were the two ratchet cases, each naming the wired directory. With the
  baselines edited: 0 of 85.

**Mutations.** Each was checked by comparing the workflow file's sha before the
run, and each run regenerated the census first.

| Mutation | Result |
|---|---|
| M1 — step deleted | 2 failing: both ratchets name the directory as dark again |
| M2 — trailing slash on the path | 2 failing, while the suites themselves still run 28 green. This is `T-062`'s known trap: the runner is green and the visibility gate is not |
| M3 — path widened to the parent `deliverables` | 2 failing. The list ratchet reports `deliverables/orchestrated/__tests__` as no longer dark, so a widened path that sweeps in a second directory is caught rather than silently absorbed |
| M4 — directory line restored to the programs baseline only | exactly 1 failing, the programs ratchet. The product ratchet stays green, so neither baseline covers for the other |

`tsc` and `release:check` results are in the pull request.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout: no
image, migration, flag, environment variable or traffic change. The step
becomes active on the next pull request and on push to `main`.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no** — no product surface changes

## Rollback Plan

Revert the pull request. That restores the step's absence, both baseline lines
and the previous census together. They are consistent only as a set, which is
why they ship as one commit. No migration, no data change, nothing to unwind in
a running environment.

## Audit Evidence

- Per-suite pre-wiring counts and the mutation table above.
- Runner proof comes from the pull request's `AI surface control catalog` job
  log: the step's per-suite `PASS` lines and case totals. It is recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- 15 directories under `src/lib/programs` still run in no workflow. In C-415's
  declared order they are `deliverables/orchestrated`, `phase-success-package`,
  `playbook`, `source-trigger` and `suitability` (2 files each), then
  `architecture`, `controls`, `decomposition`, `evidence-readiness`,
  `learning-writeback`, `mobilization`, `regulatory`, `taxonomy`,
  `tower-trigger` and `vendor-platform-intelligence` (1 each).
