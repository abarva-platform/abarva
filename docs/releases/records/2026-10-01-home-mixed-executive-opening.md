# 2026-10-01-home-mixed-executive-opening - Mixed Executive Opening

## Release ID

`2026-10-01-home-mixed-executive-opening`

## Status

`candidate`

## Plain-English Summary

When Home serves current record rows with an unreconciled reviewed narrative, the Executive Brief now opens with counted record coverage and evidence state. The prior interpretation remains accessible behind a dated disclosure instead of dominating the first screen. Coherent served records and intentionally selected reviewed records retain their existing presentation.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1-3: no change.
- Layer 4: Home Executive Brief presentation only; it reads the existing served bundle and context-version labels.

## Client Applicability

- All clients with a mixed served Home context: the Executive Brief shows the same source-scoped counts and evidence state already held by the Home bundle.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Lead a mixed Executive Brief with counts from the current Home record types and source coverage/quality/date labels from the current context version.
- Keep the prior reviewed chapter and its supporting sections accessible in a closed, dated disclosure.
- Preserve the existing Executive Brief for coherent served records and selected reviewed records.
- Provide direct navigation from the new opening to the record browser.

## QA / Validation

- PASS: Home component suite, 367 tests across 32 suites; mixed/coherent/fallback and navigation cases included.
- PASS: TypeScript, touched-file lint, formatting, and diff check.
- PASS: Home ratchet, 772/800 tests with the same 12 baselined failing suites and no movement away from baseline.
- PASS: release check.
- NOT RUN at candidate authoring: PR CI; required checks must pass before merge.
- NOT RUN until deployment: signed-in browser proof of the current-count opening, closed prior interpretation, and record navigation.

## Rollout Plan

Merge by PR and deploy through the repo-owned ACA main workflow. No tenant write, data-build job, or source approval is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: Executive Brief opening, current counts, and prior-interpretation disclosure.

## Rollback Plan

Revert by a new controlled PR and deploy through the same workflow. No data rollback is needed.

## Audit Evidence

Focused tests, Home ratchet, PR checks, main deploy run, runtime digest readback, and signed-in browser proof.

## Known Gaps

This does not reconcile old narrative to current rows, approve partial source files, complete source links, establish data currency, or turn record coverage into an executive recommendation. The full walkthrough export retains its existing chapter content and record-state labels; it does not reproduce this compact opening layout.
