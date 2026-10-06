# 2026-09-28-source-record-evidence-authority - Record-backed evidence guard

## Release ID

`2026-09-28-source-record-evidence-authority`

## Status

`candidate`

## Plain-English Summary

A typed statement can describe a sourcing need, but it cannot establish that an agreement, invoice extract, supplier offer, or other underlying record exists. Source now requires a linked source artifact or a governed cited event fact before record-backed evidence counts toward a gate or appears ready in the stage progress view.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source workflow and its evidence projection. No Layer 3 source facts or tenant records are created, changed, or reclassified by this release.

## Client Applicability

- All clients: yes, on Source evidence-answer and stage-readiness paths.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Shared record-backed evidence readiness rule used by Source gate, coverage, stage guidance, and canvas.
- Typed-answer route refuses record-backed requirement classes and directs the user to link a source record.
- Behavioral coverage for the write boundary, server decision, coverage accounting, next action, and mounted approval view.

## QA / Validation

- Pass: red-first tests failed in the write route, server gate, coverage, and next-action queue before implementation; the focused suite passed 87/87 after implementation.
- Pass: two practical mutations were caught: disabling record-class detection failed seven tests across five suites, and falsely claiming every row has a source failed five tests across four suites. Restoring the guard returned the focused suite to 87/87 green.
- Pass: full TypeScript check with an 8 GB Node heap; scoped ESLint and `git diff --check`.
- Pass: wider Source scope ran 444 suites, 442 passing; two unrelated suites had four failures also reproduced on the clean pre-change checkout.
- Pass: the behavior-coverage job caught a stale canvas import-closure measurement. The repository generator changed only that closure count from 436 to 437; the measured covered and unaudited path sets did not change, and the guard passed 21/21 locally.
- Not run: final-head PR CI, runtime deployment, signed-in replay. These are required before live acceptance is claimed.

## Rollout Plan

Squash-merge through a reviewed PR. The repo-owned ACA main workflow builds and deploys the resulting image. No migration, data build, feature-flag change, or ad-hoc shared-runtime update is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow.
- Approved image digest: pending main workflow output.
- ACA runtime invariant: pending read-only inspection of template and 100%-traffic revision.
- Worker image invariant: pending read-only inspection of both delivery jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: revisit the same synthetic Strategy evidence step and confirm no record-free progression.

## Rollback Plan

Revert the application change through a new PR and the same main deploy workflow if it rejects a genuinely linked record. Do not change evidence rows to force a green gate.

## Audit Evidence

Focused red/green suite output, mutation results, PR checks, official ACA run and digest readback, and the signed-in smoke ledger entry.

## Known Gaps

The synthetic event has no executed incumbent contract or actual spend baseline. This guard does not create either record or provide a governed not-applicable decision; Strategy remains blocked until a valid source record or separately designed applicability decision is supplied.
