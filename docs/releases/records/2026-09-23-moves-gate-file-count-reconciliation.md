# 2026-09-23-moves-gate-file-count-reconciliation — Moves Gate File Count Reconciliation

## Release ID

`2026-09-23-moves-gate-file-count-reconciliation`

## Status

`candidate`

## Plain-English Summary

The Moves gate-approval panel now avoids showing a zero evidence count when the phase already has current generated artifacts in Files & Evidence. If no linked evidence exists but generated phase artifacts do exist, the gate panel names those as generated artifacts instead of implying the vault is empty.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Moves UI copy and counts on the phase gate surface. No Layer 1, Layer 2, Layer 3, tenant-data, schema, or data-plane writes are included.

## Client Applicability

- All clients: Moves users see a clearer gate summary when a phase has generated artifacts but no linked source-evidence rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Reconciles the gate-panel file/evidence chip with current phase generated artifacts already loaded for the Files & Evidence surface.
- Keeps source-evidence wording when linked evidence is present.
- Adds regression coverage for a completed phase that has current generated artifacts and no linked evidence.

## QA / Validation

- `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 77 tests.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — passed.
- `npm run typecheck` — passed.
- `npm run release:check` — passed.
- Live proof will be recorded after merge and deploy.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned ACA main deploy workflow may rebuild and redeploy the application image after merge.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned main deploy workflow.
- Approved image digest: Captured by the repo-owned workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, completed Moves gate-panel count smoke proof.

## Rollback Plan

Revert the pull request. The gate panel returns to its prior evidence-only count behavior.

## Audit Evidence

Pull request, CI results, deploy run, runtime invariant, and signed-in Moves gate-panel smoke proof will be linked when available.

## Known Gaps

This release reconciles the visible gate-panel count with current generated artifacts only. It does not change the underlying evidence-readiness model or treat generated deliverables as source evidence.
