# 2026-09-19-programs-phase-templates-ci-wiring — Wire the first of the 38 dark Programs directories

## Release ID

`2026-09-19-programs-phase-templates-ci-wiring`

## Status

`candidate`

## Plain-English Summary

Wiring `src/lib/programs/__tests__` as a directory left a gap that reads like a pedantic detail and
is not one. A jest path argument is a regular expression tested against the whole path, so the
string `src/lib/programs/__tests__` does not appear anywhere in
`src/lib/programs/phase-templates/__tests__/what-changed.test.ts`. Naming the parent covers the
suites *in* it, and nothing nested beneath it. Thirty-eight directories under `src/lib/programs`,
holding 168 test files, were still reached by no workflow.

This change wires the first of those thirty-eight, chosen by governed risk rather than by
convenience: `phase-templates/__tests__` scores 100, band `critical`, on the signal
`approval_or_lifecycle_write`, and ranks 25th in the repository.

**The honest claim here is weaker than the one the parent directory's change could make, and it is
worth stating plainly.** That change found a suite that had been failing for 44 days. This
directory was measured before it was wired and it is green — 10 suites, 63 tests, under a second.
Nothing is being repaired. What is being bought is the future: from now on these suites fail
visibly instead of silently, and a suite added here tomorrow is covered on the day it is written.

A green directory is still worth wiring when the code beneath it is live, and this code is live.
Eleven of the thirteen modules beside those suites are imported from outside the directory, and the
barrel is imported by two API routes (`assemble-pattern`, `approved-inputs-pack`). A directory whose
only importer is its own test file would be an argument for deleting it, not for running it — that
check was made before the wiring, not after.

The ratchet that holds the dark-directory count comes down 38 → 37 in the same change. Lowering it
in the same commit that wires one is what keeps the number a measurement instead of a ceiling
nobody revisits.

No product code changed.

## Layer Impact

Release lane: `global-control-lane`. Shared repository tooling. No client-scoped data, no
internal-admin capability, no public surface, no feature flag.

- **Layer 4 (Products)** — test coverage over the Programs phase-template library: phase workflow,
  approved-inputs packs, enterprise promotion, feed-forward, readiness packs, option assembly,
  upload inference. No runtime behaviour changes; no product module is modified. Both changed files
  are a workflow and a test.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — developer-facing CI coverage.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — new step `Exercise the Programs
  phase-template suites`, naming the directory literally so the CI-visibility gate registers it.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` — the reachability,
  literal-naming and sibling-collision cases now run over a declared list of wired directories
  rather than a single constant, each with a floor under its suite count; the dark-directory ratchet
  moves 38 → 37.

## QA / Validation

Measured on `origin/main` `258bc02d7`, in a dedicated worktree.

**The directory before wiring.** 10 suites, 63 tests, 0.521s, all passing. Census confirms 38
uncovered directories / 168 test files under `src/lib/programs`, with
`phase-templates/__tests__` top-ranked among them.

**Guard, before → after, identical file:** **3 failed / 5 passed → 0 failed / 8 passed.** The three
failures are the three assertions this item is about — the directory is uncovered, it is named in
no jest command, and the ratchet reads 38 against an expected 37.

**Scope baseline, same command both sides (`npm run test:behaviors`):** 43 suites / 423 tests
passing, 0 failing, before → 43 suites / 426 tests passing, 0 failing, after. The three extra tests
are the `it.each` expansion over the second directory.

**Six mutations, every one caught:**

| # | Mutation | Result |
|---|---|---|
| 1 | Delete the workflow step | 3 failed / 5 passed |
| 2 | Add a trailing slash to the step's path | 3 failed / 5 passed |
| 3 | Wire a second directory without lowering the ratchet | 1 failed (37 expected, 36 read) |
| 4 | Introduce a new dark directory | 1 failed (37 expected, 38 read) |
| 5 | Break a module the suites cover | the wired step goes red: 2 of 10 suites fail |
| 6 | Empty the wired directory of its suites | 1 failed on the non-vacuity floor |

**Mutation 2 is the one worth reading.** `npx jest src/lib/programs/phase-templates/__tests__/`
still runs all ten suites and still prints `10 passed` — a human watching CI sees green — but the
visibility gate matches a suite by its exact path or by an ancestor directory it can see named, and
a trailing slash defeats that. The suites would run while continuing to be reported as owned by no
workflow. That is the precise failure this guard exists to catch, and it is invisible to anyone
reading the log.

**Mutation 6 covers the vacuity direction.** An emptied directory is absent from both of the
census's gap lists, which is indistinguishable from being covered. The floor under each directory's
suite count is what separates them.

**Two positive controls, both passing, so the guard is not merely brittle:** adding a suite to the
newly wired directory passes (it is covered), and adding a suite to a directory that is still dark
passes (the file count is reported, not pinned — failing every such pull request would teach people
to raise the number rather than read it).

`tsc --noEmit` exit 0 with `tsconfig.tsbuildinfo` removed first and judged by exit code, not by
grep. `eslint` exit 0, no output. Workflow YAML parses and the step resolves into the
`ai-surface-control-catalog` job, which runs on `pull_request`. The step takes ~1s against a
12-minute ceiling on a job whose slowest recent run was 281s, so no timeout change is needed.

## Rollout Plan

Merge to `main`. CI-only change; the repo-owned ACA main deploy workflow runs on merge as usual.
No migration, no data build, no flag, no runtime mutation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: n/a — no runtime image contract changes.
- ACA runtime invariant: verified after merge as routine, not because this change can affect it.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. No route, component, prompt, schema, API or data-plane path
  is touched; the only non-test file is a workflow.

## Rollback Plan

Revert the PR. The workflow step and the guard case disappear together, returning the directory to
zero coverage and the ratchet to 38; no data or runtime state is involved.

## Audit Evidence

- PR and its check run for this branch.
- The workflow step log line `Exercise the Programs phase-template suites`, which prints the suite
  and test counts from a real runner — the numbers above are local until that log exists.
- `node scripts/quality/test-ci-coverage-census.mjs --json`, which reports the directory's covered
  count before and after.

## Known Gaps

- **These 10 suites have never executed on a CI runner.** They passed on one machine. Environment
  dependence and flake have had no opportunity to show, which is the same gap backlog items T-021
  and T-038 name for other newly-wired directories. The first runs of this step should be read
  before the directory is treated as settled.
- **37 directories under `src/lib/programs` holding 158 test files still run nowhere**, the largest
  being `expert-kernel/exports/board-grade/__tests__` (22), `expert-kernel/__tests__` (18) and
  `expert-kernel/domain/__tests__` (18). Out of scope here by design: backlog item T-062 asks for
  one directory at a time, each measured before it is wired, and the ratchet holds the number
  meanwhile.
- **None of the 37 was measured in this change**, so whether the next one is green like this one or
  red like the parent directory's 44-day failure is unknown. That measurement is the first step of
  wiring each, not an afterthought.
- **The committed census (`docs/architecture/test-ci-coverage-census.json`) is not regenerated
  here.** It already lagged a fresh run before this change; folding a large data refresh into a
  small diff is the review failure this work exists to repair. That is backlog item T-012's open
  decision, and T-059's.
