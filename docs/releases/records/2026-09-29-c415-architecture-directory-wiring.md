# 2026-09-29-c415-architecture-directory-wiring — Wire the Programs solution-architecture test directory into CI

## Release ID

`2026-09-29-c415-architecture-directory-wiring`

## Status

`candidate`

## Plain-English Summary

One test suite for the Programs solution-architecture option scorer existed,
passed, and was run by no continuous-integration job. It covers how candidate
solution architectures are scored and ranked when a move is originated. If a
future change broke that scoring, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 11 to 10.

The suite was run on its own **before** it was wired. It passes, with 13 cases.
So this change protects future work; it does not repair a break. The directory
is not coverage of nothing: the origination submit path imports the module
under test.

This is slice 6 of backlog item C-415. Ten directories remain.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling that applies to every
client's build equally, behind no feature gate.

- **Layer 4 (Products)** — no product behavior changes. No route, component,
  adapter, projection or canonical object is touched. The test file is
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
  `Exercise the Programs solution-architecture suite`, running
  `npx jest src/lib/programs/architecture/__tests__ --runInBand`.
  Wired as a directory with no trailing slash. Nothing nests beneath it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (11 → 10).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed (set equality over the census's dark list).
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. Test files unchanged at 2556; covered
  2235 → 2236; directories uncovered 144 → 143. Exactly one directory leaves
  the dark list (`src/lib/programs/architecture/__tests__`) and none joins. The
  rest of the diff is rank renumbering.

## QA / Validation

**Measured before wiring, the suite run on its own:**
solution-architecture-options 13/13. Green.

**Importer check, before wiring:**
`src/lib/programs/origination-charter-extensions.ts` imports
`buildSolutionArchitectureOptions` at runtime, and is imported by
`src/lib/programs/origination-submit.ts`, which the Programs origination-submit
API route imports. The expert-kernel solution-architecture pack also imports it.
The module is on a live route's import path.

**Source-text scanner judgement:** the suite reads no file's bytes
(`readFileSync`, `fs`, `__dirname` and `process.cwd` all absent; it imports the
module under test), so `T-770` has nothing to refuse and `textIsTheSubject` is
negative.

**Baseline over the same scope, base `63e3d5f05d` vs this branch**, measured in
this worktree before any edit:

- `npm run test:behaviors`: 155 suites / 1683 tests / 0 failing before, and
  155 / 1683 / 0 after.
- `npm run audit:test-ci-coverage:check`: exit 0 before and 0 after.
- Ratchet, census, discovery and `T-770` scope (5 suites, 93 tests): 0 failing
  before. Intermediate state (step added and census refreshed, baselines not
  yet edited): 2 failing of 93 — the two ratchet cases, each naming the wired
  directory. With the baselines edited: 0 of 93.

**Mutations.** Each changed the file before the run (checked by numstat), each
run regenerated the census first, and each was restored from `HEAD` after.

| Mutation | Result |
|---|---|
| M1 — step deleted | 2 failing: both ratchets name the directory as dark again |
| M2 — trailing slash on the path | 2 failing while the step itself still runs 13 green: `T-062`'s known trap is caught by the visibility gate |
| M3 — directory line restored to the programs baseline only (in sorted position) | 1 failing, in the programs ratchet. The product ratchet stays green, so neither baseline covers for the other |
| M4 — path shortened to `architecture` (no `__tests__`) | 0 failing. **Equivalent mutation, not an escape:** nothing else under that path holds a test file, so the step reaches exactly the same suite |

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

- Per-suite pre-wiring count and the mutation table above.
- Runner proof comes from the pull request's `AI surface control catalog` job
  log — the step's per-suite `PASS` line and case total — recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- 10 directories under `src/lib/programs` still run in no workflow:
  `source-trigger` (2 files) and `mobilization` (1), both awaiting the
  retire-or-mount decision recorded as C-575; then `controls`,
  `decomposition`, `evidence-readiness`, `learning-writeback`, `regulatory`,
  `taxonomy`, `tower-trigger` and `vendor-platform-intelligence` (1 each).
