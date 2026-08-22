# 2026-08-22-move-p3-approval-timeout — Move P3 Approval Timeout

## Release ID

`2026-08-22-move-p3-approval-timeout`

## Status

`candidate`

## Plain-English Summary

The Move P3 approve-and-build flow now fails visibly if the required solution-option approval call does not complete in a bounded time. The page no longer leaves the phase runner in an indefinite disabled "building" state before deliverable generation has actually been enqueued.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates the Moves phase-gate UI behavior for the P3 approve-and-build preflight. No canonical data model, tenant intake, adapter, or projection schema changes.

## Client Applicability

- All clients: Moves users running the P3 approve-and-build flow.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves surface behavior; no new flag.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — passed.
- `npx tsc --noEmit` — passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the updated app image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy if worker images are updated by the workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the P3 approve-and-build path.

## Rollback Plan

Revert the PR or roll back to the prior ACA revision using the repo-owned deployment/runbook path.

## Audit Evidence

- PR, merge commit, ACA deploy run, and signed-in browser proof to be attached when merged.

## Known Gaps

This does not change the authoritative server-side decision persistence contract. It only prevents an unbounded client-side wait before P3 deliverable generation is enqueued.
