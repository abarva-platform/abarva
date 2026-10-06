# 2026-09-19-source-approval-workspace-decision-readiness — Source approval workspace decision readiness

## Release ID

`2026-09-19-source-approval-workspace-decision-readiness`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source event approval workspace so a pending stage decision shows its event/version binding, reviewer role, and exact blockers before any approval action is available. The existing approve button is still the only mutation path, and it is shown only when the server-built stage gate action is armed and the local decision model has no blockers.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source presentation now renders a clearer approvals workspace over existing server-read approval inbox, ledger, stage, artifact, and access state.
- Layer 3 Canonical Enterprise Model: No schema, canonical object, tenant data, or projection data is changed.

## Client Applicability

- All clients: Applies to the shared Source event approvals workspace after deployment.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/approval-workspace-decisions.ts` adds the pure grouped decision/readiness model.
- `src/lib/source/approvals-inbox.ts` adds event/version and reviewer-role metadata to routed approval items.
- `src/lib/source/source-event-shell-v2.ts` wires the grouped decision model into the Source event shell view.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` renders grouped pending decisions and blocks the approve control when blockers exist.
- `src/lib/source/__tests__/approval-workspace-decisions.test.ts` covers blocker and ready-state behavior.
- `docs/codex-handoff/SOURCE_NEW_EVENT_BACKLOG_2026-08-10.md` records the bounded F6 slice claim.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/source/__tests__/approval-workspace-decisions.test.ts src/lib/source/__tests__/approvals-inbox.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand`
- Pass: `npx eslint src/lib/source/approval-workspace-decisions.ts src/lib/source/approvals-inbox.ts src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/lib/source/__tests__/approval-workspace-decisions.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
- Not run: signed-in browser acceptance against the deployed product.

## Rollout Plan

Merge through PR to `main`, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the digest-pinned image. After deploy, run signed-in Source approval workspace acceptance separately.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout.
- Shared runtime mutators: None in this release.
- Approved image digest: Not applicable until the main deploy workflow builds it.
- ACA runtime invariant: Required after deployment before claiming live.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, separate from this local candidate validation.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migration rollback, data rollback, approval-record cleanup, or tenant data-plane action is required because this release does not write data or change schema.

## Audit Evidence

- PR diff for the files listed above.
- Local Jest and ESLint command output recorded in the PR checks or agent transcript.
- Release record: this file.

## Known Gaps

- Signed-in browser acceptance is not included in this local candidate.
- This release does not submit, approve, reject, or send back any Source decision.
