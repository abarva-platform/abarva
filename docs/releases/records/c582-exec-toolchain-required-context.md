# 2026-10-04-c582-exec-toolchain-required-context — Run the execution-queue toolchain's contracts where a red can block a merge

## Release ID

`2026-10-04-c582-exec-toolchain-required-context`

## Status

`candidate`

## Plain-English Summary

The repository has fifteen behavioural test suites that guard its own execution
tooling — the gate that decides who owns a piece of work, the generator that
decides what work is available, the control that decides whether a timestamp in
the audit register is trustworthy, and the preflight that decides whether a
scratch directory is safe to work in. Until this change, all fifteen ran in a
continuous-integration job that **could not fail a merge**. The job did run, and
it did go red when something broke; a red simply had no effect, because the
branch protection rules do not list it among the checks a pull request must
pass. Read by name from the repository's own ruleset on 2026-10-04, `main`
requires nineteen named checks, and that job is not one of them.

This change runs those same fifteen suites inside a check that *is* required, so
breaking one of them now blocks the merge that broke it. No test was changed, no
threshold was moved, and no new required check was added — the suites were
attached to a gate the rules already enforce.

It also adds a new contract that keeps the arrangement honest. The contract does
not assert "the step exists"; it reads the list of required checks from the
file that mirrors the ruleset, expands the step's file pattern against the
directory as it actually is, and fails if any suite on disk is run by no
required check. A sixteenth suite written next to the others is therefore
covered the day it lands rather than the day somebody remembers to update a
list.

The underlying lesson is one this repository has now learned twice: a check that
passes may be required by nothing, and nothing about a green advisory run looks
different from a green blocking one.

## Layer Impact

**Release lane: `internal-admin`.** Chosen rather than `global-control-lane`
because nothing here reaches the running application or any client: the change
alters what blocks an internal pull request and adds a test. It is not
`experimental` — nothing is flag-gated — and not `public-demo`, since no public
route or artifact is involved.

- **Platform tooling / CI (no product layer).** This touches continuous
  integration wiring and one new test. It does not touch client intake, source
  adapters, the canonical model, or any product surface.
- **Canonical model:** unaffected. No schema, loader, projection, or read model
  changes.
- **Products:** unaffected. Nothing renders differently for any tenant.

## Client Applicability

- All clients: no change. Nothing a client can see is altered.
- Specific clients: none.
- Internal only: yes — this changes what blocks an internal pull request.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/exec-toolchain-requiredness.test.ts` — **new.** For
  every `scripts/exec/*.test.mjs` suite on disk, asserts that some job whose
  name is a required status context actually executes it. Requiredness is read
  from `docs/ci/required-status-checks.json`; file patterns in a `run:` block
  are expanded against the filesystem rather than matched as text; shell comment
  lines are stripped before any command is read. Four cases run over the real
  repository, six over fixtures built in a temp directory.
- `.github/workflows/coverage-threshold.yml` — adds one step,
  `Prove the execution-queue toolchain contracts can fail a merge`, to the
  `Behavior coverage floor` job. It sweeps `scripts/exec/*.test.mjs` with plain
  `node`, echoes each suite path before running it, runs every suite even after
  one fails, and exits non-zero at the end if any failed.
- `.github/workflows/execution-queue-toolchain.yml` — comment only. Records at
  the top of the file that this job cannot block a merge, and names the required
  step that now does. No job, step, trigger, or command changed.
- `docs/ci/required-status-checks.json` — **not modified.** The set of required
  contexts is unchanged by this release, and the mirror describes the ruleset
  rather than this repository's wiring. Named here because it was claimed and a
  reader should know it was deliberately left alone.

## QA / Validation

All numbers below were measured in this change's own worktree on
`origin/main` `1ca13f73a9`, over the stated scope, with a baseline taken by
restoring the files to their `origin/main` content and re-running — not recalled.

**Red first, same scope, same command**
(`npx jest --runTestsByPath src/__tests__/behaviors/exec-toolchain-requiredness.test.ts --no-coverage --ci`):

| state | result |
|---|---|
| contract present, required step absent | **2 failed / 8 passed**, the failure enumerating all 15 suites as unguarded |
| contract present, required step present | **10 passed / 0 failed** |

**Eight mutations applied, eight caught.** The four aimed at the wiring:

| # | mutation | result |
|---|---|---|
| 1 | the sweep step deleted from the required job | 2 failed / 8 passed |
| 2 | the hosting job renamed, so the mirror no longer lists it | 2 failed / 8 passed |
| 3 | the file pattern replaced by a two-file list | 1 failed / 9 passed |
| 4 | the sweep replaced by a shell **comment** naming the pattern | 2 failed / 8 passed |

Mutation 4 is the one this repository's founding defect demands: a control that
a comment can satisfy is not a control. The four aimed at the contract itself
were each confirmed to fail **their own named case** rather than a neighbour,
because a case that passes through the wrong branch cannot fail for the right
reason:

| # | mutation | caught by |
|---|---|---|
| 5 | comment-stripping removed | case 5 — *a shell comment naming the glob covers nothing* |
| 6 | requiredness hard-coded instead of read from the mirror | case 2 — *the same glob in a job the mirror does not require covers nothing* |
| 7 | pattern expansion replaced by substring matching | case 4 — *a glob that cannot match the suffix covers nothing* |
| 8 | the suite directory read as empty | case 1 — *finds suites to guard at all* |

**The step's own command, run verbatim with a runner-like `HOME`:** 15 of 15
suites pass — **1,164 passed, 0 failed, 14 skipped, exit 0, 68 seconds.** The
hosting job's timeout is 25 minutes.

Two notes on that run, both stated rather than smoothed over. First, run with
this operator machine's real `HOME`, `id-collision.test.mjs` reports 69 passed /
1 failed: that is the pre-existing condition filed as **C-585**, where two
suites read the live operator corpus at `~/Downloads` and their calibration has
drifted. A runner has no such directory, those cases skip, and the suite is 60 /
0 / 3 — which is what the step will see, and what the existing advisory job has
been reporting green for days. This release does not fix C-585 and does not
depend on it; it also does not hide it, since the required step will begin
reporting it the day a runner ever does have that corpus. Second,
`worktree-sweep-hazard.test.mjs` failed 2 cases on a first attempt at a
runner-like `HOME` placed under `/tmp`; that was an artifact of the fake home
being inside a directory the host genuinely sweeps, not a runner condition, and
with the fake home outside `/tmp` the suite is 38 / 0.

**Wider scope, clean baseline, same command**
(`npx jest src/__tests__/behaviors --no-coverage --ci`): see the Audit Evidence
section — before and after are recorded there with the suite and test counts.

**Coverage floor.** The new step is plain `node`, not jest, so it contributes
nothing to the coverage denominator and cannot move the floor. This matters
concretely: the floor observed 90.05 against a threshold of 90 on the previous
merge, a 0.05-point margin, and a step that enlarged the measured set could have
failed the gate it was being added to. The new test file imports only
`node:fs`, `node:os`, `node:path` and `js-yaml` — no module under `src/` — so it
adds no application lines to the set either.

**The acceptance's own CI proof** — break one `scripts/exec/` contract on the
branch, show the pull request is blocked quoting the blocking context by name
from the rulesets API, then restore it and show the block clears — is recorded
in Audit Evidence against the run ids and conclusions it produced.

## Rollout Plan

Merge to `main` through the repo-owned pull-request path with squash merge. There
is no runtime rollout: this change alters continuous-integration wiring and adds
a test. No image is built from it for any reason other than the ordinary
post-merge deploy, no migration applies, no flag changes, and no product surface
is affected. The change takes effect for the next pull request opened after the
merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  and untouched by this release.
- Shared runtime mutators: none. No `az` command is run by this change, and no
  Container App template, revision weight, environment variable, secret, scale
  rule or worker job is read or written by it.
- Approved image digest: not applicable — this release changes no runtime image.
  The ordinary post-merge deploy will build one as it does for every merge, and
  its digest is recorded in the register, not here.
- ACA runtime invariant: not applicable to the change itself. The post-merge
  deploy's invariant is proven in the register as usual.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — and this is a determination, not an
  omission. The guarded behaviour is a continuous-integration gate. Nothing it
  governs is reachable from a browser, so a signed-in reading of the deployed
  application could not distinguish a pass from a fail. The proof that belongs to
  this change is the pull-request block, which is recorded in Audit Evidence.

## Rollback Plan

Revert the merge commit. The new step and the new contract disappear together,
restoring the previous state exactly: the fifteen suites continue to run in the
advisory job, which is where they ran before. No data, migration or runtime
state is involved, so there is nothing to unwind and no ordering constraint.

A narrower rollback, if the sweep proves slow or flaky on a runner rather than
wrong: delete the step from `coverage-threshold.yml`. The contract then fails,
which is correct — it is the thing that reports the suites are ungated — so the
contract must be removed in the same commit, and the item reopened rather than
left with a quietly weakened gate.

## Audit Evidence

- Pull request, CI run ids, and the required-check roll call read by name from
  `GET /repos/abarva-platform/abarva/rulesets/17227397`: recorded in the
  execution register entry releasing item C-582.
- The before/after pull-request block for the deliberately broken contract: two
  commits on this branch, with the `Behavior coverage floor` conclusion and the
  pull request's mergeability for each, recorded in the same register entry.
- Local measurements: the red-first pair, the eight mutations, the verbatim step
  run, and the wider behaviours baseline, all reproducible from the commands
  quoted in QA / Validation.
- Item C-582 in `EXECUTION_BACKLOG_20260918.md`, and the claim and release lines
  in `EXECUTION_CLAIMS.md`.

## Known Gaps

- **The mirror's residual is unchanged and still real.** Requiredness lives in
  GitHub repository settings, which no file in this repository can derive.
  `docs/ci/required-status-checks.json` mirrors it, and neither that file's own
  guard nor this new contract can see a context **added** to the ruleset and not
  written down. This release narrows nothing there and claims nothing about it;
  the residual is stated in the mirror itself.
- **C-585 is untouched.** Two `scripts/exec/` suites carry calibration cases
  that fail against the live operator corpus and skip on a runner. This release
  attaches those suites to a required gate without settling that drift. The
  consequence is explicit: on a runner the cases skip, so the gate is real for
  every case except those, and C-585 remains the item that closes them.
- **The advisory job is still named step by step.** Fifteen individually titled
  steps in `execution-queue-toolchain.yml` name these suites, while the blocking
  run is a single swept step. That is the shape item T-595 was filed against, and
  it is mitigated here rather than removed: the required step echoes each suite
  path so the blocking run has a quotable line per suite, and the advisory
  workflow now says at the top that it cannot gate anything. Deleting the
  fifteen steps would remove the only written record of what several of those
  controls measured, which is not a trade this change makes unasked.
- **Only this directory is covered.** The contract asks its question about
  `scripts/exec/` alone. Whether other test directories in the repository run
  only in advisory jobs is a separate census, not answered here.
