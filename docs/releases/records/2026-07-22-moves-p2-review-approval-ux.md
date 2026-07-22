# 2026-07-22 Moves P2 Review Approval UX

## Release ID

`2026-07-22-moves-p2-review-approval-ux`

## Status

`released`

## Plain-English Summary

The signed-in First Capital sandbox Move exposed a confusing P2 review workflow: uploaded current-state files could be visible and awaiting review while the findings header still said there were zero evidence items, and approving an evidence row did not visibly remove it until a manual refresh. The approval step could also read as fully ready even when hard gate criteria were still open. This release corrects those front-end state labels and the review-row interaction without weakening the underlying gate controls.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves phase-shell UI behavior for current-state review, evidence counts, and approval-step readiness language.
- `client-data-lane`: No schema, ingestion, retrieval, tenant data, or candidate-promotion behavior changes.

## Client Applicability

- All clients: Applies wherever the Moves Finder shell and P2 current-state readiness panel are active.
- Specific clients: Validated against the First Capital FS Demo sandbox Move during live E2E testing.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves shell rollout path; this PR does not add new flags.

## Changes Included

- `src/components/strategic-moves/CurrentStateReadinessPanel.tsx`
  - Hides a pending review row immediately after approve/reject succeeds.
  - Uses `router.refresh()` after the action instead of relying on a delayed full-page reload.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Shows review-required current-state documents as visible evidence in the findings header.
  - Separates workflow progress from hard-gate status so blocked gates do not read as `100% ready`.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Adds regression coverage for review-required evidence count visibility.
  - Adds regression coverage for immediate pending-row removal after approval.
  - Adds regression coverage that a blocked approval step is not labeled ready.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
  - Result: 44 passed / 44 total.
  - Notes: Existing duplicate Jest mock warnings and an existing `EvidenceUploadControl` act warning still appear; neither is introduced by this change.
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/CurrentStateReadinessPanel.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Warning: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  - Result: Failed on pre-existing Home optional dependency resolution for `@xyflow/react` and `@dagrejs/dagre`; no Moves-specific type errors surfaced before that stop.
- Pass: Signed-in production browser proof against the First Capital sandbox Move after deploy.
  - Review Findings showed `6 APPROVED EVIDENCE ITEMS`.
  - Approve & Build showed `Gate blocked · 3/5 hard met · Approve & Build`.
  - The stale label `100% ready · Approve & Build` was absent.
  - No browser console errors or failed non-prefetch network requests were observed.

## Rollout Plan

Merged through PR to `main`. The repo-owned ACA deploy workflow built and deployed the exact merge SHA to `ca-abarva-web-lab-eastus`. The ACA runtime invariant was verified and the signed-in First Capital P2 review page check was rerun after deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- PR URL: https://github.com/abarva-platform/abarva/pull/5289
- Merge SHA: `3c256b3cc5496c9c3297335a7fb5f768ddff70b5`
- Deploy workflow run: https://github.com/abarva-platform/abarva/actions/runs/29911309077
- Approved image digest: `sha256:d7bc2a00462d06883fc8c6b45f38e186b1dc3e9d80e5ac1e5e1c4e773efc91bb`
- ACA revision: `ca-abarva-web-lab-eastus--m3c256b3c`
- ACA runtime invariant: Passed; 100% traffic was assigned to the approved revision/image.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Completed against First Capital sandbox Move P2 Review Findings and Approve & Build views.

## Rollback Plan

Revert this PR or remove the merged commit from the next ACA image. Backend evidence review, current-state ingest, and gate logic are unchanged, so rollback only affects the presentation/state-refresh behavior.

## Audit Evidence

- Live issue proof:
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/33-35-p2-post-ingest-ui-proof.json`
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/36-38-p2-current-state-review-approval-proof.json`
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/46-p2-inpage-generation-poll-proof.json`
- Post-deploy signed-in proof:
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/47-post-ux-hotfix-p2-page-proof.json`
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/47-post-ux-hotfix-p2-page-playwright.png`
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/48-49-post-ux-hotfix-p2-workflow-proof.json`
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/48-post-ux-hotfix-p2-review-findings.png`
  - `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/49-post-ux-hotfix-p2-approve-build.png`

## Known Gaps

- This does not redesign the full P1/P2 approval page into a board-grade executive review page.
- This does not change generation quality gates, deliverable prompt behavior, or hard/soft evidence policy.
- One P2 generated deliverable remained blocked by `blocked_quality: non_mechanical_writing`; that is preserved as a real quality-gate outcome, not hidden.
