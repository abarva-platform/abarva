# 2026-08-12-source-approval-page-density — Source Approval Page Density

## Release ID

`2026-08-12-source-approval-page-density`

## Status

`candidate`

## Plain-English Summary

The Source event approval screen now uses a tighter operational layout. The large approval title, section headings, action panel, disclosures, and nested review panels were reduced in visual weight so approvers can review the decision, rationale, gate checks, and supporting audit details with less scrolling.

## Layer Impact

- `global-control-lane` / Products: Source approval presentation only. The same event facts, approval controls, audit disclosures, routing logic, and API calls are preserved.

## Client Applicability

- All clients: Yes, for Source event approval pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/approval/EventApprovalCard.tsx`
- `src/components/source/approval/ApprovalRoutingPanel.tsx`
- `src/components/source/approval/IntakeFactsReview.tsx`
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx`

## QA / Validation

- `npx jest src/components/source/approval/__tests__/EventApprovalCard.test.tsx --runInBand` passed.
- Broader lint, TypeScript, release check, PR CI, deploy, and live proof will be captured before release.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Captured after the repo-owned deploy workflow completes.
- ACA runtime invariant: Verify template image and 100% traffic revision image after deploy.
- Worker image invariant: Verify worker job images match the deployed web digest after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes for claiming the approval page is live-proven.

## Rollback Plan

Revert the PR and allow the repo-owned ACA deploy workflow to publish the previous approval-page presentation.

## Audit Evidence

- PR URL, CI run, deployment run, ACA revision/digest readback, worker image readback, and health check to be attached after merge/deploy.

## Known Gaps

This release does not change approval behavior, artifact generation, data persistence, or stage advancement logic.
