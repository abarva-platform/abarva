# 2026-07-12-moves-approve-build-run-polling — Moves Gate Build Proof

## Release ID

`2026-07-12-moves-approve-build-run-polling`

## Status

`candidate`

## Plain-English Summary

The Moves phase gate no longer stops at a local "queued" message after deliverables are enqueued. The live gate action now uses the governed Approve & Build component, finalizes phase capture before enqueue, submits the existing phase-gate approval after durable runs are queued, and polls each deliverable run until it reaches a terminal built, blocked, or failed state.

## Layer Impact

- Product UI: The P1-P5 gate approval view now shows run-level proof rows instead of static queued-only cards.
- Control-plane workflow: The existing `/phase-capture`, `/deliverables/generate-phase`, `/deliverables/runs/:runId`, and `/phase-gate-approval` contracts are composed into one user-facing gate action.
- Data plane: No schema, migration, tenant data, or retrieval changes.

## Client Applicability

- All clients: Yes, for clients using the Moves phase workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pending before merge: targeted ESLint, release check, whitespace check, and TypeScript.
- Browser/live signed-in proof: Not run in this candidate branch.

## Rollout Plan

Open a PR, squash merge to `main`, and allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merge SHA. No manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Determined by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment by the ACA main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for final browser-visible proof of the Moves gate action.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: Pending.
- Local focused Jest output: 11 tests passed in `MovesPhaseStandaloneClient.test.tsx`.
- Deployment proof: Pending until merge and ACA deploy.

## Known Gaps

Signed-in browser proof is not available from this unauthenticated Codex session unless a signed-in app browser session is provided.
