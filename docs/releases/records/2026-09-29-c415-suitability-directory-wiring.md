# 2026-09-29-c415-suitability-directory-wiring — Wire the Programs suitability test directory into CI

## Release ID

`2026-09-29-c415-suitability-directory-wiring`

## Status

`candidate`

## Plain-English Summary

Two test suites for the Programs suitability assessors existed, passed, and were
run by no continuous-integration job. They cover how a workflow is scored for
agentic suitability and how an origination request is assessed before it is
submitted. If a future change broke either, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 12 to 11.

Each suite was run on its own **before** it was wired. Both pass, with 66 cases
in total. So this change protects future work; it does not repair a break. The
directory is not coverage of nothing: the origination submit path imports both
modules under test.

This is slice 5 of backlog item C-415. It is `suitability`, not `source-trigger`,
which comes first in the item's declared order. The importer check for
`source-trigger` found no runtime caller of its modules, and the item treats
that as a question of retiring or mounting the code, not of spending CI time on
it. That question is recorded in the backlog for a decision. Eleven directories
remain.

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
  `Exercise the Programs suitability suites`, running
  `npx jest src/lib/programs/suitability/__tests__ --runInBand`.
  Wired as a directory with no trailing slash. Nothing nests beneath it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (12 → 11).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed (set equality over the census's dark list).
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. Test files 2555 → 2556 and covered
  2232 → 2235: one of each is a route test merged on the base after the census
  was last written, already run by a pull-request workflow; the other two
  covered files are this change. Directories uncovered 145 → 144. Exactly one
  directory leaves the dark list (`src/lib/programs/suitability/__tests__`) and
  none joins. The rest of the diff is rank renumbering.

## QA / Validation

**Measured before wiring, each suite run on its own with `--runTestsByPath`:**
agentic-suitability 59/59, origination-suitability 7/7. Both green.

**Importer check, before wiring:**
`src/lib/programs/origination-submit.ts` imports `origination-suitability`, and
is imported by the Programs origination-submit API route.
`src/lib/programs/origination-charter-extensions.ts`, imported by that same
`origination-submit.ts`, imports workflow decomposition, which imports
`agentic-suitability`. Both modules are on a live route's import path.

**`source-trigger`, checked first and not wired.** `runMoveToSourceHandoff` is
the directory's only entry point. Outside the directory it is named only in a
comment of `MoveToSourceHandoffCta.tsx`, which imports a type from it and is
listed in `docs/architecture/unreachable-components.json`, and as a string in a
proof script. `runMoveToSourceTrigger` and `deriveMobilizationPlanFromMove` have
no caller outside the directory. The item says a directory with no importer but
its own tests is an argument for deletion rather than CI time, so this slice
leaves it dark and records the choice for a decision.

**Source-text scanner judgement, per suite:** neither reads a file's bytes
(`readFileSync`, `fs` and `readFile` all absent; both import the module under
test), so `T-770` has nothing to refuse and `textIsTheSubject` is negative for
both.

**Baseline over the same scope, base `08ec9d5c2f` vs this branch**, measured in
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
| M2 — trailing slash on the path | 2 failing while the step itself still runs 66 green: `T-062`'s known trap is caught by the visibility gate |
| M3 — directory line restored to the programs baseline only (in sorted position) | 1 failing, in the programs ratchet. The product ratchet stays green, so neither baseline covers for the other |
| M4 — path shortened to `suitability` (no `__tests__`) | 0 failing. **Equivalent mutation, not an escape:** nothing else under that path holds a test file, so the step reaches exactly the same two suites |

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

- 11 directories under `src/lib/programs` still run in no workflow:
  `source-trigger` (2 files, awaiting a retire-or-mount decision), then
  `architecture`, `controls`, `decomposition`, `evidence-readiness`,
  `learning-writeback`, `mobilization`, `regulatory`, `taxonomy`,
  `tower-trigger` and `vendor-platform-intelligence` (1 each).
- `mobilization` is imported outside its directory only by `source-trigger`,
  so it inherits the same question and should be decided with it.
