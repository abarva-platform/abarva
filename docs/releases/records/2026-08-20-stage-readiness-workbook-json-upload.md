# 2026-08-20-stage-readiness-workbook-json-upload — Stage Readiness Workbook JSON Upload

## Release ID

`2026-08-20-stage-readiness-workbook-json-upload`

## Status

`candidate`

## Plain-English Summary

Strategic Moves stage-readiness workbooks can now be uploaded through the existing authenticated workbook API as either a multipart file or a base64 JSON payload. Both upload forms use the same parser and still create pending proposal sets; uploading remains separate from human acceptance.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Strategic Moves gains a more reliable upload transport for generated readiness workbooks. This does not change canonical data, tenant input data, graph state, or product projections.

## Client Applicability

- All clients: Strategic Moves users who upload stage-readiness workbooks.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/stage-readiness-workbook/route.ts`
- `src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts`

## QA / Validation

- PASS — `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts' --runInBand`
- PASS — `npx eslint 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/route.ts' 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts'`
- PASS — `npm run release:check`

## Rollout Plan

Merge to main and let the repo-owned Azure Container Apps main deploy workflow publish the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the workbook upload/review path.

## Rollback Plan

Revert the PR and redeploy via the repo-owned ACA main deploy workflow. Existing proposal/review artifacts remain immutable audit records; rollback only removes the JSON upload transport.

## Audit Evidence

- PR URL: pending.
- CI/deploy evidence: pending.
- Signed-in proof: pending.

## Known Gaps

This does not accept workbook responses automatically. Human review still must accept, reject, or mark proposals as needing validation before accepted responses can feed the next phase.
