# 2026-09-19-source-verdict-suites-run-in-ci — Run the Source artifact verdict suites in CI

## Release ID

`2026-09-19-source-verdict-suites-run-in-ci`

## Status

`candidate`

## Plain-English Summary

Two test suites guard an important promise in Source: that every artifact
generated for an event — the deal pack, the executive report, and the HTML and
PowerPoint renders of that report — states the same verdict, the one the
expert-judgment kernel actually returned. An artifact that says "Award / proceed"
while the kernel is holding the award is the failure those suites exist to catch.

Neither suite ran in any CI job. Nothing executed them on a pull request, on the
merge queue, or on a merge to `main`. They were run only when somebody happened to
run them by hand.

The cost was measurable. One of the two sat **red** for weeks without anyone being
told, and during that time an expectation in the other was rewritten to agree with
the behaviour rather than with the case it describes. Eighteen test cases were
protecting nothing.

This change adds one step so both suites run on every pull request. No product
code changes; no test is added, weakened or removed.

## Layer Impact

- **Test/tooling only.** One step appended to an existing pull-request workflow.
- No product surface, route, component, agent surface, canonical model, source
  adapter or data-plane path changes.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: no client-visible change.
- Specific clients: none.
- Internal only: yes — CI coverage only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — one appended step running
  `src/lib/source/exports/__tests__/artifact-verdict-consistency.test.ts` and
  `src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts`.

## QA / Validation

- **The gap was verified on clean `origin/main` before the edit**, not inferred:
  no file under `.github/workflows/` and no `package.json` script names either
  suite or any directory containing them. `test:nav`, `test:behaviors` and
  `test:integration` are the only scoped jest scripts and none reaches
  `src/lib/**/__tests__`.
- **Both suites are green on `main` before wiring**, so this adds coverage without
  importing a failure: `npx jest --runTestsByPath` over the two files —
  **2 suites passed, 18 tests passed, 0 failed.**
- **The step was proven to execute**, not merely declared: the appended step is
  read back from the workflow job log on this pull request, showing both suites
  running and their case count.
- `npm run audit:ai-surface-controls` exit **0** with the step in place
  (18 surfaces, 37 declared controls, 26 of 37 covered) — the appended step does
  not disturb the catalog's own accounting, which validates the declared-control
  direction only.
- `node scripts/release-check.mjs --base origin/main --head HEAD` exit **0**.

## Rollout Plan

Merge to `main`. The step takes effect on the next pull request. The repo-owned
ACA main deploy workflow will build and deploy the merge SHA as it does for any
merge, but nothing in this change affects the running image's behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: recorded against the merge SHA after the deploy run.
- ACA runtime invariant: Container App template image must equal the
  100%-traffic revision image, digest-pinned; verified after deploy.
- Worker image invariant: both non-manual deliverable worker jobs on the same
  digest; verified after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no — CI configuration only, with no product
  surface a signed-in session could observe.

## Rollback Plan

Revert the pull request. The step is additive and removing it restores the prior
CI configuration exactly. No data written, no migration, no runtime behaviour
change.

## Audit Evidence

- The pull request and its CI run, including the job log showing the appended step
  executing both suites.
- The `audit:ai-surface-controls` output above.

## Known Gaps

- **This wires two suites, not the class.** The majority of the repository's unit
  tests live under `src/lib/**/__tests__` and are reached by no scoped script and
  no workflow. An inventory of those directories against CI coverage, and a scope
  widening or an explicit per-directory decision, is backlog item 77 and is not
  attempted here.
- **Nothing enforces that this step stays.** The control-catalog audit proves a
  *declared control's* test runs; these two suites are not declared controls, so
  deleting the step would be silent. That structural gap is part of item 77.
- The suites are wired into the control-catalog workflow because it is the
  existing pull-request workflow whose purpose is executing control-proving
  suites. If item 77 produces a dedicated home for unit suites, this step should
  move there rather than accumulate siblings.
