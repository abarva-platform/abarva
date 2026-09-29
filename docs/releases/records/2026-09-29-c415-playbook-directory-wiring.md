# 2026-09-29-c415-playbook-directory-wiring — Wire the Programs playbook test directory into CI

## Release ID

`2026-09-29-c415-playbook-directory-wiring`

## Status

`candidate`

## Plain-English Summary

Two test suites for the Programs move-phase playbook existed, passed, and were
run by no continuous-integration job. They cover how a move's phase playbook and
its workshop templates are assembled, and how the design-session pack renders —
including binding the approval page to tracked per-role approval data. If a
future change broke either, the build would not have noticed.

This change adds that directory to a job that runs on every pull request. It
also removes the directory from the two committed lists of test directories
that still run nowhere. Under `src/lib/programs` that list goes from 13 to 12.

Each suite was run on its own **before** it was wired. Both pass, with 14 cases
in total. So this change protects future work; it does not repair a break. The
directory is not coverage of nothing: the v1 Programs playbook route handler and
the phase success package (`core`, `generate`) import the modules under test.

This is slice 4 of backlog item C-415. Twelve directories remain.

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
  `Exercise the Programs playbook suites`, running
  `npx jest src/lib/programs/playbook/__tests__ --runInBand`.
  Wired as a directory with no trailing slash. Nothing nests beneath it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.baseline.json` —
  the directory's line is removed (13 → 12).
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  directory's line is removed (set equality over the census's dark list).
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. The committed census on the base was
  current (`audit:test-ci-coverage:check` exit 0 before any edit), so the whole
  count delta is this change's: 2555 test files throughout; covered 2230 → 2232,
  uncovered 325 → 323, directories uncovered 146 → 145. Exactly one directory
  leaves the dark list (`src/lib/programs/playbook/__tests__`) and none joins.
  The rest of the diff is rank renumbering.

## QA / Validation

**Measured before wiring, each suite run on its own with `--runTestsByPath`:**
design-session-pack-approval-data 6/6, move-phase-playbook 8/8. Both green.

**Importer check, before wiring:**
`src/app/api/v1/programs/[programId]/playbook/route.ts` imports the design
session pack and the AI-PDLC session overrides;
`src/lib/programs/phase-success-package/core.ts` and `generate.ts` import the
playbook type and overrides. Observed and not acted on: the one UI caller of
the playbook route, `SessionPlaybookPanel`, is listed in
`docs/architecture/unreachable-components.json` — the same observation slice 3
recorded for the phase-success-package route. The route and the package are
live; whether the panel is mounted or retired is a product call outside this
item.

**Source-text scanner judgement, per suite:** neither reads a file's bytes
(`readFileSync`, `fs`, `__dirname` and `process.cwd` all absent; both mock the
data plane and import the module under test), so `T-770` has nothing to refuse
and `textIsTheSubject` is negative for both.

**Baseline over the same scope, base `bcb6470119` vs this branch**, measured in
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
| M2 — trailing slash on the path | 2 failing while the step itself still runs 14 green: `T-062`'s known trap is caught by the visibility gate |
| M3 — directory line restored to the programs baseline only (in sorted position) | 1 failing, in the programs ratchet. The product ratchet stays green, so neither baseline covers for the other |
| M4 — path shortened to `playbook` (no `__tests__`) | 0 failing. **Equivalent mutation, not an escape:** nothing else under that path holds a test file, so the step reaches exactly the same two suites. Recorded so nobody reads it as a guard that could not fail |

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

- 12 directories under `src/lib/programs` still run in no workflow. In C-415's
  declared order: `source-trigger` and `suitability` (2 files each), then
  `architecture`, `controls`, `decomposition`, `evidence-readiness`,
  `learning-writeback`, `mobilization`, `regulatory`, `taxonomy`,
  `tower-trigger` and `vendor-platform-intelligence` (1 each).
