# 2026-09-20-hygiene-gate-judges-exit-codes — The mandatory PR hygiene gate judges exit codes

## Release ID

`2026-09-20-hygiene-gate-judges-exit-codes`

## Status

`candidate`

## Plain-English Summary

`scripts/integration/hygiene_gate.sh` runs on every pull request. Five of its checks could not
report a problem, and each was measured on the current default branch by running the gate rather
than by reading it.

1. **The typecheck reported success by crashing.** It searched the compiler's output for the text
   `error TS`. On this repository that command exits `134` with an out-of-memory stack trace and
   emits no diagnostic at all, so the search found nothing and the gate printed `TypeScript clean`.
   A genuine type error and a crash were indistinguishable. It now runs at the documented heap size
   and is judged by its exit status.
2. **The secret-hygiene check passed a failing suite.** It searched the test runner's summary for
   `Tests:.*passed`, which the line `Tests: 8 failed, 53 passed, 61 total` satisfies. Proven by
   putting a known-failing suite through the gate's own pipeline. It now reads the run's exit status.
3. **The stash check read a field the report has never contained.** It looked for a list that
   `stash_safety_check.py` does not emit, so the emptiness test on it was always false and the gate
   printed `No risky stashes` unconditionally — including on the tree this change was written in,
   where that script reported 92 stashes from other branches and declared the tree unsafe to
   integrate. It now reads the field the report actually publishes, and says what it found.
4. **Two checks passed when their subject was missing.** Deleting the wave manifest, or the
   secret-hygiene suite, printed `not present (skipped)` and counted as a pass. An absent subject is
   an unanswered question and now fails.
5. **One check had no failing branch at all.** Both outcomes called `pass`, so a finding and a
   clean result printed the same line.

A third verdict, `WARN`, was added for the one finding that is real but must not block: the stash
stack is specific to a machine and shared between working copies, so another working copy's entry
must not block this repository's pull requests, and it is empty on a build runner. Being unable to
read the report is different, and fails.

## Layer Impact

Lane: `internal-admin`. Continuous-integration tooling only. No canonical model, no product surface,
no source adapter, no client intake, no data plane, no schema, no prompt, no route, no component.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a pull-request gate and its behavioural test
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/integration/hygiene_gate.sh` — five repairs described above, plus a `WARN` verdict and a
  summary line that reports it.
- `src/__tests__/behaviors/hygiene-gate-exit-codes.test.ts` — new behavioural suite. It drives the
  real script as a subprocess in a scratch repository, with path shims standing in for the compiler,
  the test runner and the stash reporter so a crash, a partial failure and an unreadable report are
  reproduced deterministically. One case runs the real stash reporter and holds every field the gate
  reads to that report's actual keys — the case that would have caught defect 3, which no fixture
  could, because a fixture written from the code would simply have agreed with it.
- `docs/architecture/test-ci-coverage-census.json` — refreshed, because the new suite changes the
  covered-file count the wiring queue ranks on.

## QA / Validation

Baseline and result measured with the identical suite over the same scope, judged by exit code.

- **The suite, against the unrepaired script: 10 failed / 7 passed of 17. Against the repaired
  script: 0 failed / 17 passed.** The seven that pass either way are deliberate guardrails — the
  green paths must stay green — plus a floor that fails if the fixture stops exercising the script.
- **Scope baseline, same command both sides (`npm run test:behaviors`): 45 suites / 455 tests,
  0 failing → 46 suites / 471 tests, 0 failing.**
- The directory whose triage found this is unchanged: `npx jest src/__tests__/integration/ops`
  reports 2 failed of 14 suites and 30 failed of 372 tests before and after. Its existing
  source-text contract suite still passes 12 of 12 — it was green throughout, which is the point:
  every one of the five defects was present while it was.
- **Nine mutations, nine caught**, the control passing again after each revert: restoring the
  output-grep typecheck (3 failures); removing the heap option (1); restoring the summary-text
  match (1); restoring each of the two skip-as-pass branches (1 each); restoring the second passing
  branch (1); collapsing the new verdict into a pass (1); restoring the field name the report does
  not contain (2); and, as a control, silencing every verdict line, which fails 14 of 17 including
  the non-vacuity floor.
- The repaired script was run end to end against this repository. It reports the stash finding it
  had been silent about, and every other check passes; the only failure is the working tree being
  uncommitted at the time of the run.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit `0`, with the
  incremental build-info removed first. `npx eslint` on the new file exit `0`. Coverage census
  reports no drift.

**One regression caught by the repository's own instrument and repaired before it shipped.** Holding
the suite path in a shell variable reads identically to a person and is opaque to the coverage
resolver, which moved from zero unresolved invocations to two and downgraded its uncovered count to
an upper bound. The literal path was restored and the reason written beside it.

## Rollout Plan

Merge to main. No image build, no container deploy, no migration, no flag. The gate takes effect on
the next pull request that runs it.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; this release starts no deploy of its own
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image changes
- ACA runtime invariant: unaffected; no container template, revision or traffic change
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — continuous-integration tooling and its test; no route,
  component, prompt, schema or data-plane path is touched

## Rollback Plan

Revert the single commit. The script returns to its previous behaviour and the new suite is removed
with it. No state is written anywhere, so there is nothing to unwind.

## Audit Evidence

- The pull request and its checks
- The gate step in the hygiene workflow, running the repaired script
- The before and after figures above, reproducible by checking out the base and running the same
  suite unchanged

## Known Gaps

- The repaired typecheck fails rather than passes if the compiler still exhausts its heap at the
  documented size. That is the intended direction and it is a behaviour change: a crash that used to
  read as success now blocks. The size was measured as sufficient on this tree today; when the
  project outgrows it the gate will say so instead of going quiet, which is the outcome this repair
  exists to produce.
- The stash finding warns rather than blocks, for the reason stated above. If that stack is ever
  made specific to a working copy, the finding should be reconsidered as a failure.
- The directory whose triage surfaced all of this is still not wired into continuous integration.
  Its two failing suites need decisions that are not this change's to take, and they are recorded
  separately. Nothing here changes that.
