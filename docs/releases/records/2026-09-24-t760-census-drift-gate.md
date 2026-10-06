# 2026-09-24-t760-census-drift-gate — Wire the test-CI-coverage census drift check into CI

## Release ID

`2026-09-24-t760-census-drift-gate`

## Status

`candidate`

## Plain-English Summary

The repository keeps a committed census of which test files are actually run by
a CI job. That census is the input to deciding which untested area gets wired up
next, so when it falls out of date the queue is ranked from a stale file and
nobody finds out until someone regenerates it and sees a large unexplained diff.

A checker that compares the committed census against a fresh measurement already
existed and was runnable by hand. It ran in no workflow. The only workflow that
named the census named it in three comments — a control that exists but is
reached by nothing is the failure mode this release-control discipline was
written against.

This change gives that checker a pull-request job of its own, adds a behavioral
test that holds the wiring in place and proves the gate can fail, and refreshes
the committed census in the same change.

## Layer Impact

**Release lane: `global-control-lane`** — shared CI/control-plane tooling, applying
to every pull request in the repository, behind no feature gate. It is not
`client-data-lane`: nothing here reads, writes, seeds or ingests tenant data.

- **Products / canonical model:** none. No product surface, tenant data, read
  model, adapter or schema changes. No runtime code changes.
- **Platform tooling (tests, validators, CI):** one new workflow, one new
  behavioral test, one refreshed generated artifact.

## Client Applicability

- All clients: no behavior change.
- Specific clients: none.
- Internal only: yes — CI and engineering tooling only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/test-ci-coverage-census.yml` — new pull-request job running
  `npm run audit:test-ci-coverage:check`, plus a step summary reporting the count
  drift the check deliberately does not enforce.
- `src/__tests__/behaviors/t760-census-drift-ci-gate.test.ts` — new behavioral
  test, 7 cases.
- `docs/architecture/test-ci-coverage-census.json` — refreshed in the same
  change, as the item requires.

## Correction to the item, measured rather than argued

The item's acceptance reads: "Prove the gate by mutation: adding a test file
without refreshing the census must fail the job." That is not what `--check`
does, and the difference is a written, measured decision in the script rather
than an oversight. `--check` gates the coverage **shape** — which directories are
covered, partial or uncovered — and never the counts. Re-measured on
`origin/main` `d3d8a198c`, in the real tree and again in an isolated scratch
root, both agreeing:

| mutation | counts | shape | `--check` exit |
|---|---|---|---|
| a test file in an **already-covered** directory | `testFiles` +1, `coveredTestFiles` +1 | unchanged | **0** |
| a test file in a directory **no workflow reaches** | `testFiles` +1, `uncoveredTestFiles` +1 | `+uncovered <dir>` | **1** |

A gate on the counts would fire on nearly every pull request that adds a test,
and the cheapest way to green would be regenerating a two-thousand-line
artifact — which is how a control stops being read. So the gate is the second
row, the counts stay a report, and the first row is pinned as a passing test
case so that a future change promoting the counts to a failure has to confront
it rather than silently landing.

**Left for Anand, not guessed:** whether the counts should ever become a
failure. The recommendation is no — report them, as this job now does in its
step summary — but the decision belongs to the person who owns the cost of a
red check on every PR.

## QA / Validation

**Baseline over the same scope, measured on a clean tree, not an absolute
count.** `src/__tests__/behaviors` on `origin/main` `d3d8a198c` with this
change stashed: **114 suites, 1055 tests, 0 failing**. With the change:
**115 suites, 1062 tests, 0 failing**. The delta is this change's own suite.

**The gate is green on the current tree:** `node
scripts/quality/test-ci-coverage-census.mjs --check` exits 0, reporting
"committed census matches this run" and "coverage shape matches the committed
census".

**Break-the-fix, four mutations, each confirmed to be a real edit before its
effect was believed:**

| mutation | result |
|---|---|
| delete the workflow file | 4 of 7 cases fail |
| narrow the trigger to `paths: ["docs/**"]` | the paths-filter case fails |
| remove `set -o pipefail` from the gate step | the pipe case fails |
| neutralise `if (shape.state !== "current")` in the census script | the "fails when a test directory no workflow reaches appears" case fails |

Restored after each; 7 of 7 green again, and the census script is byte-identical
to `origin/main`.

**Why the step sets `pipefail` twice, in the shell and in the assertion:** the
default shell for a `run:` block on Linux is `bash -e {0}` with no pipefail, so
`npm run … | tee` exits with `tee`'s status and the gate would have been green
on every drift it detected. A pipe swallowing an exit status is one of the
shapes this backlog was opened against, so the step declares `shell: bash`, sets
`set -o pipefail` explicitly, and a test case reads the step and fails if either
is removed while the pipe remains.

**Why there is no `paths:` filter:** the coverage shape is a function of the test
tree, the workflow files, `package.json` and the repo scripts those resolve to.
Enumerating those inputs is the exemption branch — the one pull request that
moves an input nobody listed is exactly the one the gate must not miss, and that
miss is unobservable when it happens. The check is a ~5-second read of the tree.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit
  **0**, 0 diagnostics (judged by exit code, not by grepping for `error TS`).
- `npx eslint src/__tests__/behaviors/t760-census-drift-ci-gate.test.ts` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see the PR.

**One observed side effect, recorded rather than hidden.** Wiring the census
script into a workflow command makes the census walk its own source, so two of
its JSDoc paragraphs that quote `jest src/…` now appear in the `quotedNotRun`
list (5 → 7 entries). Those are mentions credited to nobody, they enforce
nothing, and the coverage shape is unchanged; the committed census records them
because it records what was measured.

## Known Gaps

- **The counts remain ungated.** `--check` enforces the coverage shape only, for
  the reason measured above. A census whose counts lag while every directory
  keeps its coverage state will still pass this job; the lag is now printed in
  the job's step summary rather than being invisible, which is the improvement
  claimed here. Turning the counts into a failure is a policy decision, not an
  omission — see the correction section.
- **This job proves the census artifact is current; it does not run any of the
  suites the census counts.** Those are wired by their own workflows and their
  own items. A directory that is genuinely uncovered stays uncovered after this
  change; what changes is that it cannot become uncovered silently.
- **No live proof is owed and none is claimed.** The change is unreachable from
  the running application, so `merged` and `deployed` are the only rungs this
  record can reach. Nothing here is `live-proven` and nothing needs to be.

## Rollout Plan

Merge to `main`. The workflow takes effect on the next pull request. No image
build, no migration, no flag, no runtime rollout — nothing in this change is
reachable from the running application.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as it does for every commit to `main`; this change contributes nothing
  to the image.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this release; the merge's deploy run is
  verified for the usual runtime invariant, not because this change alters it.
- ACA runtime invariant: verified post-merge from the deploy run's own
  `runtime-invariant-proof.json`.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** — there is no product surface to prove.

## Rollback Plan

Revert the commit. The workflow disappears with it and the committed census
returns to its previous counts. No migration, no data, no runtime state.

## Audit Evidence

- The pull request and its check-run list.
- The merge SHA and the `aca-main-deploy` run at or after it, with the
  `runtime-invariant-proof.json` artifact.
- `src/__tests__/behaviors/t760-census-drift-ci-gate.test.ts`, which records the
  mutation results as executable cases rather than as prose in this file.
