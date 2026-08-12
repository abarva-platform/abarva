# 2026-08-12-source-stage-completion-forward-path — Source stage completion forward path

## Release ID

`2026-08-12-source-stage-completion-forward-path`

## Status

`candidate`

## Plain-English Summary

When a Source stage has all workflow inputs completed, the stage workspace now explains the real next step before approval. If file or generated-artifact review still blocks the gate, the primary action sends the user to Files first. If required gate artifacts are already client-final and quality-ready, the primary action opens the approval gate directly.

## Layer Impact

- `global-control-lane` / Products: updates the shared Source event shell completion panel and its regression tests.
- Canonical data model: no schema, migration, tenant data, or read-model change.

## Client Applicability

- All clients: Yes. Applies to all Source event stages using the shared event shell.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`
- `src/lib/source/source-event-shell-v2.ts`

## QA / Validation

- Pass: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/lib/source/__tests__/source-event-shell-v2.test.ts --runInBand`
- Pass: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx src/lib/source/source-event-shell-v2.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Not run yet: live signed-in browser proof; required after repo-owned deploy.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. Verify the Source event stage page in a signed-in browser after deployment.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not used by this release.
- Approved image digest: To be produced by the main deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required by the deploy proof bundle.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI / local validation: pending.
- ACA deploy run and runtime invariant proof: pending.
- Signed-in Source event screenshot / DOM proof: pending.

## Known Gaps

This release improves the completed-stage forward path only. It does not generate or accept missing artifacts, change gate semantics, or bypass artifact quality review.
