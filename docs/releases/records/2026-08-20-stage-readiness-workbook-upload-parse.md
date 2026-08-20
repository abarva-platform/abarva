# 2026-08-20-stage-readiness-workbook-upload-parse — Stage Readiness Workbook Upload Parse Preview

## Release ID

`2026-08-20-stage-readiness-workbook-upload-parse`

## Status

`candidate`

## Plain-English Summary

Strategic Moves can now accept an uploaded Stage Readiness Workbook and return a parse preview: workbook metadata, proposed response rows, validation issues, and summary counts. This is a preview-only step for operator and UI wiring; it does not store the workbook, persist responses, advance a phase, or update governed Move state.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Strategic Moves API route for read-only workbook parse preview. No tenant data, canonical data, migrations, retrieval changes, phase-gate automation, runtime configuration, or data-plane writes.

## Client Applicability

- All clients: Strategic Moves can parse generated readiness workbooks for the signed-in Move context.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this increment.

## Changes Included

- Extends `GET /api/v1/programs/[programId]/stage-readiness-workbook` with a `POST` handler for multipart workbook parse preview.
- Requires the signed-in tenancy context and existing Move route ownership checks before parsing.
- Validates the uploaded workbook against the route Move ID and requested phase.
- Returns parser issues with HTTP 422 for workbook/route mismatches instead of applying any response.
- Adds route tests for successful parse preview, Move mismatch rejection, and missing file rejection.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts' src/lib/programs/stage-readiness-workbooks/__tests__/parser.test.ts` — PASS (2 suites, 8 tests).

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated runtime. The route is inactive until a caller posts a workbook file.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Route smoke after deploy.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Expected: PR, local validation output, CI/check output, ACA deploy run, and signed-in route smoke.

## Known Gaps

This increment does not add a UI upload form, object storage, proposed-change persistence, human accept/reject workflow, structured response writes, phase readiness updates, or P2 prompt integration.
