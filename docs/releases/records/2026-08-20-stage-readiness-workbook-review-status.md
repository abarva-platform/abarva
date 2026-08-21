# 2026-08-20-stage-readiness-workbook-review-status — Stage Readiness Review Artifact Status

## Release ID

`2026-08-20-stage-readiness-workbook-review-status`

## Status

`candidate`

## Plain-English Summary

Terminal Strategic Moves stage-readiness workbook reviews now persist their approval artifact with the existing Artifact Vault status value `approved`. The API can still describe the review outcome as accepted, but the stored artifact row uses the database-approved lifecycle vocabulary.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Strategic Moves review artifacts can be saved after a reviewer accepts all workbook proposals. This does not change tenant intake, canonical data, graph state, or product projections.

## Client Applicability

- All clients: Strategic Moves users who review stage-readiness workbook proposal sets.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/proposals.ts`
- `src/lib/programs/stage-readiness-workbooks/__tests__/proposals.test.ts`

## QA / Validation

- PASS — `npx jest --runTestsByPath src/lib/programs/stage-readiness-workbooks/__tests__/proposals.test.ts --runInBand`
- PASS — `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts' --runInBand`
- PASS — `npx eslint src/lib/programs/stage-readiness-workbooks/proposals.ts src/lib/programs/stage-readiness-workbooks/__tests__/proposals.test.ts`

## Rollout Plan

Merge to main and let the repo-owned Azure Container Apps main deploy workflow publish the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for stage-readiness workbook review.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Existing review artifacts written with the corrected status remain valid Artifact Vault records.

## Audit Evidence

- PR URL: pending.
- CI/deploy evidence: pending.
- Signed-in proof: pending.

## Known Gaps

This only corrects the Artifact Vault status used when every proposal in a review is accepted. It does not change workbook parsing, proposal classification, P2 readiness rules, document upload UX, or the definition of which answer states count as evidence-ready.
