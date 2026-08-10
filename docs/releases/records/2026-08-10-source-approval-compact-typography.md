# 2026-08-10-source-approval-compact-typography — Source Approval Compact Typography

## Release ID

`2026-08-10-source-approval-compact-typography`

## Status

`candidate`

## Plain-English Summary

The Source approval gate now uses compact, professional typography. The event title, approval-card headings, routing heading, and captured-facts heading are reduced so the page reads like an operational approval screen rather than a presentation page.

## Layer Impact

Layer 4 Products / `global-control-lane`: Source approval page presentation only. No Source data, approval semantics, workflow stages, prompts, parsing logic, or tenant routing changes are included.

## Client Applicability

- All clients: Yes, for Source event approval pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source access controls only.

## Changes Included

- `src/components/source/approval/EventApprovalCard.tsx`: reduces the approval page event title, brief heading, decision heading, and surrounding spacing.
- `src/components/source/approval/ApprovalRoutingPanel.tsx`: reduces the routing panel heading.
- `src/components/source/approval/IntakeFactsReview.tsx`: reduces the captured-facts disclosure heading.
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx`: updates typography regression coverage.

## QA / Validation

- Pass: `npm test -- --runInBand src/components/source/approval/__tests__/EventApprovalCard.test.tsx`.
- Pass: `npx eslint src/components/source/approval/EventApprovalCard.tsx src/components/source/approval/ApprovalRoutingPanel.tsx src/components/source/approval/IntakeFactsReview.tsx src/components/source/approval/__tests__/EventApprovalCard.test.tsx`.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pending: signed-in browser proof after deployment.

## Rollout Plan

Merge through the normal PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source approval page typography.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Local test output: focused approval-card Jest pass.
- Deploy workflow: pending.
- Signed-in browser proof: pending.

## Known Gaps

This release is presentation-only. It does not claim approval workflow persistence or final-stage approval status is fixed.
