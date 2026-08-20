# 2026-08-20-stage-readiness-workbook-upload-preview-ui — Stage Readiness Workbook Upload Preview UI

## Release ID

`2026-08-20-stage-readiness-workbook-upload-preview-ui`

## Status

`candidate`

## Plain-English Summary

Strategic Moves now shows a simple parse-preview control beside the Stage Readiness Workbook download link. A user can upload a completed workbook and see parsed response counts, required-question counts, and validation issues before any governed state is changed.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Strategic Moves phase page UI for workbook parse preview. No tenant data, canonical data, migrations, object storage, structured response writes, phase-gate movement, or runtime configuration changes.

## Client Applicability

- All clients: Strategic Moves phase pages can preview completed Stage Readiness Workbooks when the route is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this increment.

## Changes Included

- Adds a compact workbook parse-preview control beside the readiness workbook download action.
- Posts the selected workbook to the existing stage-readiness workbook route with signed-in credentials.
- Displays parsed response counts, required-question counts, and the first validation issue.
- Keeps language in preview state; it does not mark readiness complete or persist responses.
- Extends the Moves phase shell test to verify download plus parse-preview behavior.

## QA / Validation

- `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — PASS (1 suite, 65 tests; existing async React `act(...)` warnings only).

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated runtime.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Browser proof that the phase page displays the preview control and parse counts.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Expected: PR, local validation output, CI/check output, ACA deploy run, and signed-in browser proof.

## Known Gaps

This increment does not store uploaded workbooks, persist parsed responses, add human accept/reject, advance phase readiness, or feed P2 generation. It is preview UI only.
