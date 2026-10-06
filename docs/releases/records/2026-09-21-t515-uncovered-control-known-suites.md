# 2026-09-21-t515-uncovered-control-known-suites — Make the "no behavioral test" branch of the AI surface control gate able to fail

## Release ID

`2026-09-21-t515-uncovered-control-known-suites`

## Status

`candidate`

## Plain-English Summary

`docs/security/ai-surface-control-catalog.json` records, for each AI-facing control in the
product, whether a test actually exercises it. When a control *has* a test, the gate checks that
claim hard: the file must exist, the catalog workflow must really run it, and the name filter the
workflow uses must be the one the catalog declares. Rename the test and the gate goes red.

When a control declares it has **no** test, the gate checked two things only — that no path was
named, and that the written reason was at least forty characters long. Nothing compared that
sentence to the repository. A reason could therefore stay green no matter how far it drifted from
the code, which is the same shape as a gate that proves a control exists because its name appears
in a file.

It had already drifted. One control's reason said the component "has no rendering suite, so
nothing proves the assumptions list renders rather than collapsing to an empty node" — while a
rendering suite sat on `main` doing exactly that, and passing. Both clauses were false and the
gate had no way to say so.

An uncovered control now also lists `knownSuites`: every test file that references its module.
That list is derived by walking the tree, not chosen by the author, and the audit fails on any
disagreement. When a suite lands on a control the catalog calls untested, the gate turns red until
someone reconciles the sentence with it.

No product behavior changes. This is CI tooling and the catalog record it reads.

## Layer Impact

Release lane: `internal-admin`. AbarVa-only CI/validator tooling and the security
catalog record it reads. No client receives a behavior change.

- **Layer 4 (Products):** none. No product surface, route, component, or agent path is touched.
- **Layer 3 (Canonical model):** none.
- **Layers 1–2 (Intake, adapters):** none.
- **Platform / release control:** `scripts/audit/ai-surface-control-catalog.mjs` gains a check;
  the catalog record gains a derived field on the six controls that declare no behavioral test.

## Client Applicability

- All clients: no change in behavior.
- Specific clients: none.
- Internal only: yes — CI gate and the security catalog it validates.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/ai-surface-control-catalog.mjs`
  - an uncovered control (`behavioralTest.status: "none"`) must declare `knownSuites`, and that
    list must equal the set of test files under `src` that reference the control's module. Missing
    and extra entries are reported separately, naming the file and the control.
  - `indexSuitesReferencing` walks the test tree once for every module that needs it, rather than
    once per control.
  - `AI_SURFACE_CONTROL_CATALOG_PATH` is added as a test seam so a suite can run the real script
    against a mutated catalog and prove the branch goes red. Nothing in CI sets it;
    `npm run audit:ai-surface-controls` reads the committed catalog.
- `docs/security/ai-surface-control-catalog.json`
  - `knownSuites` added to all six controls that declare no behavioral test, derived from the tree.
  - the reason on `source-estimate-assumption-disclosure:risk-caveat` replaced: it denied the
    existence of a suite that exists and passes. The new reason names that suite, says what it
    does prove, and states what remains unproven — that no route mounts the component, so no
    estimate a user sees is shown to carry the caveat.
  - the five `tower-atlas-program-pressure-brief` reasons now name the view-model suite that
    asserts each evidence token, and distinguish it from the rendering proof that does not exist.
- `src/__tests__/behaviors/uncovered-control-known-suites.test.ts` (new)

**Deliberately not changed:** no behavioral test was written for either uncovered component. Both
declare `routeReachable: false` and the audit verifies that against the real route graph. A
rendering test for a component no route mounts would manufacture coverage for a screen nobody can
open; that work stays blocked behind mounting the surfaces.

**No workflow step was added.** `coverage-threshold.yml` already runs
`npm run coverage:behavior-gate`, which runs the whole `src/__tests__/behaviors` tree on every pull
request to `main` with no path filter, so the new suite executes without a new step. A second
invocation in `ai-surface-control-catalog.yml` would cost CI time and prove nothing further.

## QA / Validation

Measured on `origin/main` `6c8ade175501202027f720eb36c7770d242108a0`, from the worktree
`/tmp/exec-queue-20260921T191500Z`.

**Red first, same scope both times** — `npx jest --runTestsByPath
src/__tests__/behaviors/uncovered-control-known-suites.test.ts --runInBand`:

| | result |
|---|---|
| before the fix | **5 of 6 failing** |
| after the fix | **0 of 6 failing** |

The one case passing before the fix was "the real catalog passes the audit", which passed
trivially because the gate had nothing to say about the branch.

**The defect, demonstrated on the real path.** With the check added and the catalog not yet
reconciled, `npm run audit:ai-surface-controls` exited non-zero naming all six controls. With the
catalog reconciled it exits 0, and the two coverage figures are unchanged — `32 of 32 (100%)`
reachable controls covered, `8 of 40` not on any screen. No number moved; nothing was counted as
covered that was not covered before.

**Three mutations, three caught.** Each applied to the fixed tree, measured, then reverted:

| mutation | result |
|---|---|
| neuter the reconciliation in the script, leaving a comment containing the word `knownSuites` where the logic was | **3 of 6 failing** — the comment decoy did not hold the gate open |
| restore the drifted reason on the Source control | **1 of 6 failing** |
| drop one derived entry from the Tower control's `knownSuites` | **2 of 6 failing** |

The expected suite set in the test is walked by the test itself, not read back from the script
under test — a negative control that asks the implementation for the answer cannot fail.

**Blast radius** — `npx jest src/__tests__/behaviors --runInBand --no-coverage`: recorded in the
pull request body against the same scope on `origin/main`.

**Typecheck** — `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`, judged
by exit code, recorded in the pull request body.

## Known Gaps

- **`knownSuites` is matched on the module's basename, not on a resolved import.**
  A test file that merely names `ProgramPressureCards` in a comment would be listed.
  That is deliberate — the purpose of the field is to force a human to look when the
  test tree changes, and a broad net fails safe in that direction — but it means the
  list is "files that mention this module", not "files that test it". The field name
  should be read that way.
- **One consequence is visible in the catalog today:** the new suite itself appears in
  `source-estimate-assumption-disclosure`'s `knownSuites`, because it asserts that
  suite's path as a string. That is accurate rather than circular — it is a test file
  that references the module — but it means editing this test can move the catalog.
- **The reason prose is still prose.** The gate forces reconciliation when the suite
  set changes; it does not and should not parse the sentence for truth. A reason that
  is wrong in a way no suite change reveals will still pass. The check narrows the
  window, it does not close it.
- **The two uncovered surfaces are still uncovered and still unmounted.** This release
  does not move `32 of 32` or `8 of 40`. Mounting them, or retiring them, remains the
  open product decision recorded in the catalog's `unreachableReason`.

## Rollout Plan

Merge to `main` via squash. No runtime rollout: no image, migration, flag, env var, worker job or
traffic change. The repo-owned ACA main deploy workflow will build and deploy the merge commit as
it does for any change to `main`; nothing in this release depends on that deploy to take effect,
because the changed code runs only in CI.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp` command is run by or for this change.
- Approved image digest: not applicable — no runtime image change is requested.
- ACA runtime invariant: unaffected; verified after merge as routine practice, not as a condition
  of this change taking effect.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** This release changes no user-visible surface. A signed-in
  check would prove nothing about it and none is claimed.

## Rollback Plan

Revert the squash commit. The change is three files with no schema, data, or runtime coupling, so
a revert is complete and immediate. Reverting restores the previous gate, which means the
uncovered-control branch becomes unfalsifiable again and the corrected reason returns to its
drifted text — that is the cost of the rollback, and it is the reason to fix forward instead
unless the gate is blocking unrelated work.

## Audit Evidence

- Pull request URL and its checks.
- `npm run audit:ai-surface-controls` output before reconciliation (six named failures) and after
  (passed, coverage figures unchanged).
- `npx jest --runTestsByPath src/__tests__/behaviors/uncovered-control-known-suites.test.ts` at
  5-of-6 failing before and 0-of-6 after.
- The three mutation runs above.
- `src/components/source/__tests__/EstimateAssumptionDisclosure.test.tsx` passing on
  `6c8ade175`, which is the evidence that the replaced reason was false.
