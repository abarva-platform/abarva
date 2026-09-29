# 2026-09-29-c415-programs-orchestrated-directory-wiring — Wire the Programs orchestrated deliverables test directory into CI

## Release ID

`2026-09-29-c415-programs-orchestrated-directory-wiring`

## Status

`candidate`

## Plain-English Summary

Two test suites for the orchestrated Programs deliverables existed, passed, and
were run by no continuous-integration job. They cover the orchestrated move
business case and the wiring between a move deliverable request and its quality
bar. If a future change broke either, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 15 to 14.

Each suite was run on its own **before** it was wired. Both pass, with 18 cases
in total. So this change protects future work; it does not repair a break. The
directory is not coverage of nothing: live code outside it imports the modules
under test — the v1 Moves board-grade business-case route handler, the
orchestrated board-artifact move route, discovery-plan auto-generation and the
deliverable orchestrator's renderers.

This is slice 2 of backlog item C-415. Fourteen directories remain.

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
  `Exercise the Programs orchestrated deliverables suites`, running
  `npx jest src/lib/programs/deliverables/orchestrated/__tests__ --runInBand`.
  Wired as a directory with no trailing slash. Nothing nests beneath it, and the
  slice-1 step's path does not reach it (its regex needs `deliverables/__tests__`
  contiguous).
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (15 → 14).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed (set equality over the census's dark list).
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. Covered test files 2225 → 2227,
  uncovered 329 → 327, directories uncovered 148 → 147. The rest of the diff is
  rank renumbering.

## QA / Validation

**Measured before wiring, each suite run on its own with `--runTestsByPath`:**
orchestrated-business-case 12/12, quality-bar-wiring 6/6. Both green.

**Source-text scanner judgement, per suite:** neither reads a file's bytes
(`readFileSync`, `fs`, `__dirname` and `process.cwd` all absent), so `T-770` has
nothing to refuse and `textIsTheSubject` is negative for both.

**Baseline over the same scope, base `6290814f71` vs this branch**, measured in
this worktree before any edit:

- `npm run test:behaviors`: 154 suites / 1671 tests / 0 failing before, and the
  same after.
- `npm run audit:test-ci-coverage:check`: exit 0 before and after.
- Intermediate state (step added and census refreshed, baselines not yet
  edited): 2 failing of 85 across the ratchet, census and `T-770` suites — the
  two ratchet cases, each naming the wired directory. With the baselines
  edited: 0 of 85.

**Mutations.** Each changed the file's sha before the run, and each run
regenerated the census first.

| Mutation | Result |
|---|---|
| M1 — step deleted | 2 failing: both ratchets name the directory as dark again |
| M2 — trailing slash on the path | 2 failing: `T-062`'s known trap is caught by the visibility gate |
| M3 — path shortened to `deliverables/orchestrated` (no `__tests__`) | 0 failing. **Equivalent mutation, not an escape:** nothing else under that path holds a test file, so the step reaches exactly the same two suites. Recorded so nobody reads it as a guard that could not fail |
| M4 — directory line restored to the programs baseline only | exactly 1 failing, the programs ratchet; the product ratchet stays green, so neither baseline covers for the other |

`tsc --noEmit` (6 GB heap) exit 0. `release:check` result is in the pull request.

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
why they ship as one commit. Nothing to unwind in a running environment.

## Audit Evidence

- Per-suite pre-wiring counts and the mutation table above.
- Runner proof comes from the pull request's `AI surface control catalog` job
  log — the step's per-suite `PASS` lines and case totals — recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- 14 directories under `src/lib/programs` still run in no workflow. In C-415's
  declared order: `phase-success-package`, `playbook`, `source-trigger` and
  `suitability` (2 files each), then `architecture`, `controls`,
  `decomposition`, `evidence-readiness`, `learning-writeback`, `mobilization`,
  `regulatory`, `taxonomy`, `tower-trigger` and `vendor-platform-intelligence`
  (1 each).
