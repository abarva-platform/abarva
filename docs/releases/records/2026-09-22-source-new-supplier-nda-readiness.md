# 2026-09-22-source-new-supplier-nda-readiness — Source New Supplier NDA Readiness

## Release ID

`2026-09-22-source-new-supplier-nda-readiness`

## Status

`candidate`

## Plain-English Summary

Source New now shows a read-only Suppliers & NDA checkpoint that can distinguish accepted candidates, incumbent contract vendors, and selected respondents when the governed records support those states. A selected respondent is shown only when a named human selector, timestamp, and evidence reference are all present. Partial or missing selection authority stays unselected, and the surface still exposes no supplier contact, send, notification, or selection action.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 product projection: the Source New event workspace reads existing candidate supplier authority and vendor registry payload fields into a clearer mounted checkpoint.

Layer 3 canonical/read-model boundary: no schema, migration, tenant data mutation, or canonical object write is included. The parser only consumes fields already present in the governed supplier registry payload.

## Client Applicability

- All clients: Source New users viewing event supplier readiness receive the read-only projection once deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Parse complete respondent-selection authority from the candidate supplier registry payload.
- Carry selected respondent state into the existing Stage 04 vendor panel projection.
- Render selected respondent count and human selection provenance in the Source New workspace.
- Add tests for complete selection, incomplete selection fail-closed behavior, and the mounted workspace row.

## QA / Validation

- Red-first focused tests failed before implementation:
  - `npx jest --runTestsByPath src/lib/source/candidate-suppliers/__tests__/event-candidate-authority-repository.test.ts src/__tests__/behaviors/stage04-vendor-panel-says-what-it-knows.test.ts src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand`
  - Failures showed missing parser selection authority, `selected_respondent` count `0` instead of `1`, and the mounted row rendering as `not under contract` instead of `selected respondent`.
- After implementation, the same command passed: 3 suites, 66 tests.
- Mutation proof:
  - Removing the selection evidence-reference check changed incomplete selection from 0 selected respondents to 1; the behavior test failed.
  - Rendering selected respondents as ordinary candidates removed the visible `selected respondent` label; the mounted workspace test failed.

## Rollout Plan

Merge by pull request into `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. No migration, data-build job, tenant write, feature flag, or manual Azure mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy after merge.
- ACA runtime invariant: Required after deploy before claiming runtime live.
- Worker image invariant: Required by the deployment proof path.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for product acceptance of the mounted Source New supplier/NDA checkpoint after deployment. Do not claim acceptance from local or CI evidence.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. Because this release has no migration or tenant-data write, rollback is a code-only revert.

## Audit Evidence

- Focused Jest red/green output for parser, projection, and mounted workspace tests.
- Mutation output showing the incomplete-selection and selected-label guards fail when the implementation is weakened.
- Pull request and hosted CI once opened.
- ACA runtime invariant proof after merge and repo-owned deploy.
- Signed-in Source New replay after runtime proof.

## Known Gaps

This does not create supplier records, select respondents, send supplier communications, approve legal terms, advance lifecycle state, or clear the frozen event's upstream Define blockers. It only mounts the read-only checkpoint for records that already exist.
