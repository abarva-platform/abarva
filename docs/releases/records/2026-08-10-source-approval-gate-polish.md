# 2026-08-10-source-approval-gate-polish — Source Approval Gate Polish

## Release ID

`2026-08-10-source-approval-gate-polish`

## Status

`candidate`

## Plain-English Summary

Source approval workspaces now read more like professional decision pages instead of large hero pages. The final stage approval ledger also recognizes a real approval record on the terminal stage, so a completed final gate does not keep presenting itself as unfinished.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source approval workspace typography is made denser and calmer.
- Canonical model: no schema or persistence change.
- Source workflow read model: final-stage approval display now uses the existing approval row as the completion signal when there is no next stage to advance into.

## Client Applicability

- All clients: yes, for Source event approval workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source event workflow path only.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/lib/source/approval-ledger-model.ts`
- `src/lib/source/__tests__/approval-ledger.test.ts`

## QA / Validation

- `npm test -- --runInBand src/lib/source/__tests__/approval-ledger.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx` passed.
- `npx eslint src/lib/source/approval-ledger-model.ts src/lib/source/__tests__/approval-ledger.test.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` passed.
- Release check and live signed-in proof are required before release.

## Rollout Plan

Open a PR, merge through the protected main branch, and deploy through the repo-owned Azure Container Apps main deployment workflow.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by main deploy workflow after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source approval workspace and terminal gate display.

## Rollback Plan

Revert the PR. No migration rollback is required.

## Audit Evidence

- PR URL: pending.
- CI/deploy run: pending.
- Live Source approval proof: pending.

## Known Gaps

- This does not change approval authorization policy or upload parsing behavior.
