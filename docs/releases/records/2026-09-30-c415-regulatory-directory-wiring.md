# 2026-09-30-c415-regulatory-directory-wiring — Wire the Programs SR 11-7 control deliverable test directory into CI

## Release ID

`2026-09-30-c415-regulatory-directory-wiring`

## Status

`candidate`

## Plain-English Summary

One test suite for the Programs SR 11-7 control deliverable existed, passed, and
was run by no continuous-integration job. It covers how a strategic move is
judged to fall under model-risk regulation, which solution archetype it
resolves to, and what control deliverable that implies. If a future change
broke that logic, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 7 to 6.

The suite was run on its own **before** it was wired. It passes, with 19 cases.
So this change protects future work; it does not repair a break. The directory
is not coverage of nothing: the strategic-move trace page and the cross-module
trace view import the module under test at runtime.

This is slice 10 of backlog item C-415. Six directories remain.

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
  `Exercise the Programs SR 11-7 control deliverable suite`, running
  `npx jest src/lib/programs/regulatory/__tests__ --runInBand`.
  Wired as a directory with no trailing slash. Nothing nests beneath it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (7 → 6).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed (set equality over the census's dark list).
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. The committed census on the base was
  current: regenerating it with the workflow at the base produced no diff. With
  this step: covered 2243 → 2244, uncovered 317 → 316, directories uncovered
  140 → 139. The only test path that leaves the uncovered list is
  `src/lib/programs/regulatory/__tests__/sr-11-7-control-deliverable.test.ts`,
  and none joins.

## QA / Validation

**Measured before wiring, the suite run on its own:**
sr-11-7-control-deliverable 19/19. Green.

**Importer check, before wiring:** `isSr117RegulatedTenant` and
`resolveSolutionArchetypeForMove` are imported at runtime by the strategic-move
trace page (`src/app/(maestro)/strategic-moves/[moveId]/trace/page.tsx`) and by
`src/lib/programs/cross-module-trace-view.ts`; the trace view component imports
it too.

**Source-text scanner judgement:** the suite reads no file's bytes
(`readFileSync`, `fs`, `__dirname` and `process.cwd` all absent; it imports the
module under test), so `T-770` has nothing to refuse and `textIsTheSubject` is
negative.

**Baseline over the same scope, base `813f02af62` vs this branch**, measured in
this worktree before any edit:

- `npm run test:behaviors`: 156 suites / 1682 tests / 0 failing before, and
  156 / 1682 / 0 after.
- `npm run audit:test-ci-coverage:check`: exit 0 after.
- The two ratchet suites plus the `T-770` scanner refusal (28 tests): 0 failing
  before. Intermediate state (step added and census refreshed, baselines not
  yet edited): 2 failing of 28 — the two ratchet cases, each naming the wired
  directory. With the baselines edited: 0 of 28.

**Mutations.** Each changed the file before the run (checked by numstat), each
run regenerated the census first, and each was restored from `HEAD` after.

| Mutation | Result |
|---|---|
| M1 — the step deleted | 2 failing: both ratchets name the directory as dark again |
| M2 — trailing slash on the path | 2 failing while the step itself still runs 19 green: `T-062`'s known trap is caught by the visibility gate |
| M3 — directory line restored to the programs baseline only | 1 failing, in the programs ratchet. The product ratchet stays green, so neither baseline covers for the other |
| M4 — path shortened to `regulatory` (no `__tests__`) | 0 failing. **Equivalent mutation, not an escape:** the only test file under that path is the one suite, so the step reaches exactly the same suite |

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

- Per-suite pre-wiring count, the census comparison and the mutation table
  above.
- Runner proof comes from the pull request's `AI surface control catalog` job
  log — the step's per-suite `PASS` line and case total — recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- `learning-writeback`, next in the item's order, was measured first and **not
  wired**: its one suite runs 2 failing of 16. Both failures are the governed
  promotion evaluator refusing a registry-declared tenant key as non-canonical,
  because the policy module consults the shorter of the two exported canonical
  tenant lists. That is an open ownership decision already on the backlog;
  widening a governance allowlist, or skipping the two cases, is not a change
  to make as a side effect of CI wiring. It stays dark until that decision
  lands.
- 6 directories under `src/lib/programs` still run in no workflow:
  `source-trigger` (2 files) and `mobilization` (1), both awaiting the
  retire-or-mount decision recorded as C-575; `learning-writeback` (above);
  then `taxonomy`, `tower-trigger` and `vendor-platform-intelligence`
  (1 each).
