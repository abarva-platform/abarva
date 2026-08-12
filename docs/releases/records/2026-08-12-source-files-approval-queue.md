# 2026-08-12-source-files-approval-queue — Source Files Approval Queue

## Release ID

`2026-08-12-source-files-approval-queue`

## Status

`candidate`

## Plain-English Summary

Source Files now shows a compact current-stage artifact review queue above the
full lifecycle matrix. When stage inputs are complete but artifact review still
blocks approval, users can see which stage artifacts need action, why they
matter, and which existing client-final acceptance action clears the blocker.

## Layer Impact

- `global-control-lane` / Product layer: Source event Files workspace presentation only. Existing file
  upload, artifact lifecycle, client-final acceptance, and approval persistence
  contracts are unchanged.
- Canonical model: No schema, data, or projection changes.

## Client Applicability

- All clients: Yes, for Source event workspaces using the current Files surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: adds the
  current-stage artifact review queue and reuses the existing
  `AcceptClientFinalButton` for AI-draft rows.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`:
  adds regression coverage for the queue.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand`
- PASS: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- Pending before merge: PR checks, deploy workflow, ACA runtime invariant, and
  signed-in Source Files browser proof.

## Rollout Plan

Merge through PR into `main`. The repo-owned ACA main deploy workflow builds and
deploys the exact merge SHA to `app.abarva.ai`. After deploy, verify the ACA
runtime invariant and perform signed-in browser proof on a Source Files
workspace with current-stage artifact review blockers.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy workflow.
- ACA runtime invariant: Pending deploy workflow evidence.
- Worker image invariant: Pending deploy workflow evidence.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Files workspace.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. This removes
the current-stage queue and returns Files to the prior lifecycle matrix view. No
data cleanup or migration rollback is required.

## Audit Evidence

- Pending PR URL.
- Pending CI/deploy run.
- Pending signed-in Source Files screenshot and proof JSON.

## Known Gaps

This change does not generate missing artifacts, alter client-final upload
persistence, or change the approval gate rules. It only makes the already-known
current-stage artifact review actions visible before the detailed matrix.
