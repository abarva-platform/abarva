# 2026-09-29-c415-phase-success-package-directory-wiring — Wire the Programs phase success package test directory into CI

## Release ID

`2026-09-29-c415-phase-success-package-directory-wiring`

## Status

`candidate`

## Plain-English Summary

Two test suites for the Programs phase success package existed, passed, and were
run by no continuous-integration job. They cover how a move's phase success
package is assembled from its phase pack and playbook, and how it is generated.
If a future change broke either, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 14 to 13.

Each suite was run on its own **before** it was wired. Both pass, with 8 cases
in total. So this change protects future work; it does not repair a break. The
directory is not coverage of nothing: the v1 Programs phase-success-package
route handler imports the module under test.

This is slice 3 of backlog item C-415. Thirteen directories remain.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling that applies to every
client's build equally, behind no feature gate.

- **Layer 4 (Products)** — no product behavior changes. No route, component,
  adapter, projection or canonical object is touched. The two test files are
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
  `Exercise the Programs phase success package suites`, running
  `npx jest src/lib/programs/phase-success-package/__tests__ --runInBand`.
  Wired as a directory with no trailing slash. Nothing nests beneath it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (14 → 13).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed (set equality over the census's dark list).
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. The committed census on the base was
  one test file stale: the previous merge added a behaviors suite and changed
  the ranking method without regenerating it. A clean regeneration of the base
  alone reads 2555 test files, 2228 covered, 327 uncovered, 147 directories
  uncovered; this branch reads 2555, 2230, 325, 146. **This change's own delta
  is exactly +2 covered, −2 uncovered, and one directory leaving the dark list**
  (`src/lib/programs/phase-success-package/__tests__`, and no other). The rest
  of the diff is the base's drift and rank renumbering.

## QA / Validation

**Measured before wiring, each suite run on its own with `--runTestsByPath`:**
core 4/4, generate 4/4. Both green.

**Importer check, before wiring:** `src/app/api/v1/programs/[programId]/phase-success-package/route.ts`
imports the package. Observed and not acted on: the one UI caller of that route,
`SessionPlaybookPanel`, is listed in `docs/architecture/unreachable-components.json`.
The route itself is live; whether the panel is mounted or retired is a product
call outside this item.

**Source-text scanner judgement, per suite:** neither reads a file's bytes
(`readFileSync`, `fs`, `__dirname` and `process.cwd` all absent), so `T-770` has
nothing to refuse and `textIsTheSubject` is negative for both.

**Baseline over the same scope, base `95d4cb4f8b` vs this branch**, measured in
this worktree before any edit:

- `npm run test:behaviors`: 155 suites / 1685 tests / 0 failing before, and
  155 / 1685 / 0 after.
- `npm run audit:test-ci-coverage:check`: exit 0 before and 0 after.
- Ratchet, census and `T-770` scope (5 suites, 92 tests): 0 failing before.
  Intermediate state (step added and census refreshed, baselines not yet
  edited): 2 failing of 92 — the two ratchet cases, each naming the wired
  directory. With the baselines edited: 0 of 92.

**Mutations.** Each changed the file before the run (checked by numstat), each
run regenerated the census first, and each was restored from `HEAD` after.

| Mutation | Result |
|---|---|
| M1 — step deleted | 2 failing: both ratchets name the directory as dark again |
| M2 — trailing slash on the path | 2 failing: `T-062`'s known trap is caught by the visibility gate |
| M3 — directory line restored to the programs baseline only | 2 failing, both in the programs ratchet: the dark-set case and its sorted-baseline case (the line was re-inserted out of order). The product ratchet stays green, so neither baseline covers for the other |
| M4 — path shortened to `phase-success-package` (no `__tests__`) | 0 failing. **Equivalent mutation, not an escape:** nothing else under that path holds a test file, so the step reaches exactly the same two suites. Recorded so nobody reads it as a guard that could not fail |

`tsc --noEmit` (6 GB heap) exit 0. `release:check` result is in the pull
request.

## Rollout Plan

Merge to `main` through the repo-owned workflow. No runtime rollout: no image,
migration, flag, environment variable or traffic change. The step becomes active
on the next pull request and on push to `main`.

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
and the previous census together; they are consistent only as a set, which is
why they ship as one change. Nothing to unwind in a running environment.

## Audit Evidence

- Per-suite pre-wiring counts and the mutation table above.
- Runner proof comes from the pull request's `AI surface control catalog` job
  log — the step's per-suite `PASS` lines and case totals — recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- 13 directories under `src/lib/programs` still run in no workflow. In C-415's
  declared order: `playbook`, `source-trigger` and `suitability` (2 files
  each), then `architecture`, `controls`, `decomposition`,
  `evidence-readiness`, `learning-writeback`, `mobilization`, `regulatory`,
  `taxonomy`, `tower-trigger` and `vendor-platform-intelligence` (1 each).
