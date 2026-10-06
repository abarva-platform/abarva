# 2026-09-30-c415-taxonomy-directory-wiring — Wire the Programs solution-archetype taxonomy test directory into CI

## Release ID

`2026-09-30-c415-taxonomy-directory-wiring`

## Status

`candidate`

## Plain-English Summary

One test suite for the Programs solution-archetype taxonomy existed, passed,
and was run by no continuous-integration job. It proves the archetype taxonomy
and its behaviour fixtures form a complete, internally consistent contract:
every archetype key is present, lookups by key agree, readiness thresholds
compare correctly, and every fixture names a real archetype. If a future change
broke that contract, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 6 to 5.

The suite was run on its own **before** it was wired. It passes, with 20 cases.
So this change protects future work; it does not repair a break. The directory
is not coverage of nothing: the taxonomy module is imported at runtime by
several Programs modules (below).

This is slice 11 of backlog item C-415. Five directories remain.

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
  `Exercise the Programs solution-archetype taxonomy suite`, running
  `npx jest src/lib/programs/taxonomy/__tests__ --runInBand`.
  Wired as a directory with no trailing slash. Nothing nests beneath it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (6 → 5).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed (set equality over the census's dark list).
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`.
  **The committed census on the base was not fully current:** regenerating it
  with the base workflow changed counts only — 3 test files added by the two
  pull requests merged since the last regeneration, all 3 already covered
  (test files 2560 → 2563, covered 2244 → 2247, directories with tests
  494 → 496). No uncovered path changed, and the base check exited 0. With this
  step on top: covered 2247 → 2248, uncovered 316 → 315, directories uncovered
  139 → 138. The only test path that leaves the uncovered list is
  `src/lib/programs/taxonomy/__tests__/archetype-fixtures.test.ts`, and none
  joins.

## QA / Validation

**Measured before wiring, the suite run on its own:** archetype-fixtures 20/20.
Green.

**Importer check, before wiring:** `getSolutionArchetype`, the archetype keys
and the maturity types from `solution-archetype-taxonomy.ts` are imported at
runtime by `regulatory/sr-11-7-control-deliverable.ts` (reached from the
strategic-move trace page), `architecture/solution-architecture-options.ts`,
`controls/control-eval-matrix.ts`, `decomposition/workflow-decomposition.ts`,
`suitability/agentic-suitability.ts`, `suitability/origination-suitability.ts`
and `origination-charter-extensions.ts`. `archetype-fixtures.ts` is imported
for its `ReadinessProfile` type by runtime modules and as a value only by
tests; it is the declared acceptance contract for the suitability classifier.

**Source-text scanner judgement:** the suite reads no file's bytes
(`readFileSync`, `fs`, `__dirname` and `process.cwd` all absent; it imports the
modules under test), so `T-770` has nothing to refuse and `textIsTheSubject` is
negative.

**Baseline over the same scope, base `f168961e54` vs this branch**, measured in
this worktree before any edit:

- `npm run test:behaviors`: 156 suites / 1682 tests / 0 failing before, and
  156 / 1682 / 0 after.
- `npm run audit:test-ci-coverage:check`: exit 0 before and after.
- The two ratchet suites plus the `T-770` scanner refusal (28 tests): 0 failing
  before. Intermediate state (step added and census refreshed, baselines not
  yet edited): 2 failing of 28 — the two ratchet cases. With the baselines
  edited: 0 of 28.

**Mutations.** Each changed the file before the run (checked by numstat), each
run regenerated the census first, and each was restored from `HEAD` after.

| Mutation | Result |
|---|---|
| M1 — the step deleted | 2 failing: both ratchets name the directory as dark again |
| M2 — trailing slash on the path | 2 failing while the suite itself still runs 20 green under that path: `T-062`'s known trap is caught by the visibility gate |
| M3 — directory line restored to the programs baseline only | 1 failing, in the programs ratchet. The product ratchet stays green, so neither baseline covers for the other |
| M4 — path shortened to `taxonomy` (no `__tests__`) | 0 failing. **Equivalent mutation, not an escape:** the only test file under that path is the one suite, so the step reaches exactly the same suite |

`tsc --noEmit` (6 GB heap, build-info removed) exit 0. `release:check` result
is in the pull request.

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

- Per-suite pre-wiring count, the census comparison and the mutation table
  above.
- Runner proof comes from the pull request's `AI surface control catalog` job
  log — the step's per-suite `PASS` line and case total — recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- 5 directories under `src/lib/programs` still run in no workflow:
  `source-trigger` (2 files) and `mobilization` (1), both awaiting the
  retire-or-mount decision recorded as C-575; `learning-writeback` (1), whose
  suite runs 2 failing of 16 pending an open canonical-tenant-list decision;
  then `tower-trigger` and `vendor-platform-intelligence` (1 each).
