# 2026-08-20-stage-readiness-workbook-proposal-set — Workbook Proposal Set Persistence

## Release ID

`2026-08-20-stage-readiness-workbook-proposal-set`

## Status

`candidate`

## Plain-English Summary

Completed stage-readiness workbook uploads now become durable pending proposal sets. The parser still does not accept the answers or feed the next phase automatically; it stores review-required proposals that must be accepted or rejected in a later human review step.

## Layer Impact

Layer 4 Products: Updates the Moves workbook upload route and UI status message.

Operational artifact layer: Reuses the existing Move artifact vault to store immutable JSON proposal-set artifacts with source workbook hash, parser version, contract versions, uploader, base Move revision, and pending response proposals.

No Layer 1 tenant intake, Layer 2 adapter output, Layer 3 canonical model, Source cube, or data-plane projection refresh is changed.

## Client Applicability

- All clients: Moves users who upload stage-readiness workbooks.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Adds stage-readiness workbook proposal-set builder and persistence helper.
- Stores valid uploaded workbook parses as `review_required` approval artifacts in the Move artifact vault.
- Returns proposal-set artifact metadata from the workbook upload route.
- Updates the workbook upload UI status to show pending proposal-set storage separately from parse completion.
- Adds JSON content type support for Move artifacts.

## QA / Validation

- `npx jest src/lib/programs/stage-readiness-workbooks/__tests__/proposals.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 69 tests.
- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts' --runInBand` — passed, 6 tests.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow will publish the route and UI behavior. No manual data load or migration apply is required because this uses the existing Move artifact vault.

## Deployment Authority

- Repo-owned deploy workflow: Yes.
- Shared runtime mutators: None outside the repo-owned main deploy.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Verify after deploy if runtime proof is requested.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Recommended for workbook upload review.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. Existing proposal-set artifacts remain review-required historical artifacts; they do not feed P2 unless a later human acceptance flow exists.

## Audit Evidence

- Focused Jest commands listed above.
- PR, CI, deploy, and optional signed-in proof to be attached after publication.

## Known Gaps

Human accept/reject/needs-validation actions and P2 consumption of accepted responses are not included in this slice.
