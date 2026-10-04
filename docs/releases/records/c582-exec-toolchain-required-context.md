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
- `.github/workflows/hygiene-gate.yml` — adds one step,
  `Prove the execution-queue toolchain contracts can fail a merge`, to the
  `Run hygiene_gate.sh` job. It sweeps `scripts/exec/*.test.mjs` with plain
  `node`, echoes each suite path before running it, runs every suite even after
  one fails, and exits non-zero at the end if any failed.
- `.github/workflows/coverage-threshold.yml` — **not modified.** The
  `Behavior coverage floor` job was the first choice of host and was rejected on
  a measured ground; see *Which required job hosts it* below. It is left byte for
  byte as it was.
- `.github/workflows/execution-queue-toolchain.yml` — comment only. Records at
  the top of the file that this job cannot block a merge, and names the required
  step that now does. No job, step, trigger, or command changed.
- `docs/ci/required-status-checks.json` — **not modified.** The set of required
  contexts is unchanged by this release, and the mirror describes the ruleset
  rather than this repository's wiring. Named here because it was claimed and a
  reader should know it was deliberately left alone.

### Which required job hosts it, and why the first answer was wrong

The step was first written into `Behavior coverage floor`, on the reasoning that
that job is the declared home for controls which must be able to fail a merge —
five such steps already live there. The reasoning was sound and the choice was
still wrong, on a ground that only measurement shows.

Read from the Actions API as real job `started_at`/`completed_at` instants,
rather than from the `timeout-minutes` written in the YAML:

| required job | observed duration | its timeout | margin |
|---|---|---|---|
| `Behavior coverage floor` | 20m07s (00:22:35Z → 00:42:42Z) | 25 min | ~5 min |
| `Run hygiene_gate.sh` | 4m59s (00:39:35Z → 00:44:34Z) | 15 min | ~10 min |
| `Typecheck + reasoning-layer tests` | 3m24s (00:42:08Z → 00:45:32Z) | 20 min | ~16 min |

A 68-second sweep added to the floor would have consumed roughly a quarter of
the thinnest remaining margin in the repository. That matters more than the
arithmetic suggests: a `timeout-minutes` kill reports **cancelled**, not failed.
The failure mode introduced would therefore have been a *false state* on a
required check rather than an honest red — an intermittently unreadable gate,
which is the opposite of what this item asks for.

`Run hygiene_gate.sh` is the better host on its subject too, not only on
headroom: it already owns the repository's own tooling under `scripts/`, since
it shellchecks that tree and runs a script out of `scripts/integration/`. The
`scripts/exec/` contracts sit with their own kind there, where pairing them with
a job that measures `src/` was the unrelated coupling the acceptance warned
about. It also disposes of the coverage question entirely instead of arguing it
away: the floor job is untouched, so no argument about `node` versus jest in the
denominator is needed.

The contract needed **no change** for the move. It reads requiredness from the
mirror and expands the pattern against the directory, so relocating the step
between two required jobs is invisible to it — the property that was designed
in, and the move is the first evidence it holds.

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

All four wiring mutations were re-run after the host moved from
`Behavior coverage floor` to `Run hygiene_gate.sh`, and all four are still
caught: 2F/8P, 2F/8P, 1F/9P, 2F/8P, with 10/0 unmutated on either side.

**Coverage floor.** The floor job is not modified by this release. The new test
file lands in `src/__tests__/behaviors`, which the floor sweeps, and it imports
only `node:fs`, `node:os`, `node:path` and `js-yaml` — no module under `src/` —
so it adds no application lines to the measured set.

**The acceptance's own CI proof, performed and read rather than reasoned
about.** One line was removed from `unknownFlags` in `scripts/exec/cli-entry.mjs`
— the skip that lets a value flag consume its own argument, the regression item
T-748 was filed against — pushed as commit `f01c55b367`, and reverted in the
commit after it.

| reading | value |
|---|---|
| job | `Run hygiene_gate.sh`, run `37166231486`, **completed / failure**, 01:04:53Z → 01:07:09Z |
| failing step | 6. `Prove the execution-queue toolchain contracts can fail a merge` — **failure**; steps 7–9 skipped behind it |
| is that context required? | **yes** — `Run hygiene_gate.sh` is present in `GET /repos/abarva-platform/abarva/rulesets/17227397`, read by name, not taken from the job's own title |
| pull request | `mergeStateStatus=BLOCKED` at head `f01c55b367` |

**On the strength of that last row, stated precisely rather than leaned on:**
`BLOCKED` also covers *pending* required checks, so it is not by itself the
proof. The decisive reading is the one above it — a required context reached a
**failure** conclusion, and a failed required check cannot be satisfied while
the head stands. The `BLOCKED` row corroborates; it does not carry the claim.

**The blocking run's own log, which is the part that matters for T-595:** all
fifteen suites ran and each is named in it, with per-suite counts. 1,170 passed,
5 failed, 14 skipped — and the five failures fall in **three** contracts, not
one: `append-claim.test.mjs` 92/2, `cli-entry.test.mjs` 32/2,
`toolchain-manifest.test.mjs` 16/1. A `set -e` sweep would have reported only
the first. The run also confirms the C-585 prediction on a real runner:
`id-collision.test.mjs` 60/0/3 and `register-merge-coverage.test.mjs` 47/0/3,
those cases skipping exactly as expected where no operator corpus exists.

The clearing half — the same job green on the reverted head — is recorded in
Audit Evidence.

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
wrong: delete the step from `hygiene-gate.yml`. The contract then fails,
which is correct — it is the thing that reports the suites are ungated — so the
contract must be removed in the same commit, and the item reopened rather than
left with a quietly weakened gate.

## Audit Evidence

- Pull request, CI run ids, and the required-check roll call read by name from
  `GET /repos/abarva-platform/abarva/rulesets/17227397`: recorded in the
  execution register entry releasing item C-582.
- The before/after pull-request block for the deliberately broken contract: two
  commits on this branch, with the `Run hygiene_gate.sh` conclusion and the
  pull request's mergeability for each, recorded in the same register entry. An
  earlier probe commit was run against the superseded `Behavior coverage floor`
  host and is explicitly **not** the evidence: a block proof must name the job
  that actually gates.
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
- **The sweep is the job's first step, so a toolchain red hides a hygiene red
  and not the reverse.** That is ordinary GitHub step semantics and it is a
  diagnostic cost, not a gating one: the job is red either way, so the merge is
  blocked either way. First position was chosen because the sweep is 68 seconds
  against the hygiene gate's ~5 minutes and the faster signal arrives sooner.
  The suites also import nothing but Node builtins and their own siblings, so
  the step cannot be broken by a dependency change and does not depend on the
  `npm ci` above it.
- **`docs/architecture/test-ci-coverage-census.json` is left stale on purpose,
  and the reason is arithmetic rather than laziness.** The new test file moves
  `testFiles` and `coveredTestFiles` by one each. The committed census is a
  report, not a gate — `audit:test-ci-coverage:check` exits 0 and says so in
  those words — so this does not redden `main`. Refreshing it here would make
  it *more* wrong: this branch is based on `1ca13f73a9`, where the census reads
  2667, while `main` has since moved to 2669 for unrelated reasons.
  Regenerating from this base would commit 2668 and the squash merge would
  write that onto a tree whose true count is 2670, replacing a known lag with a
  confidently wrong number. The correct refresh is one run on current `main`
  after this merges, which is a different change.
- **Only this directory is covered.** The contract asks its question about
  `scripts/exec/` alone. Whether other test directories in the repository run
  only in advisory jobs is a separate census, not answered here.
