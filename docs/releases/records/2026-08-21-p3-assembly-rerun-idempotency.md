# 2026-08-21-p3-assembly-rerun-idempotency — P3 Assembly Rerun Idempotency

## Release ID

`2026-08-21-p3-assembly-rerun-idempotency`

## Status

`candidate`

## Plain-English Summary

P3 phase assembly uses an ordered batch so companion deliverables only build after the upstream architecture succeeds. A blocked quality-gate attempt could leave the batch idempotency key occupied, preventing a later legitimate rerun with the same approved decision and evidence fingerprint. This change includes the per-attempt context extract id in the batch key, so a new Approve & Build attempt can be enqueued without weakening ordered execution.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Strategic Moves P3 Approve & Build can be rerun after a blocked quality-gate attempt.
- Data layers: No Layer 1, Layer 2, Layer 3, canonical, projection, registry, or tenant-input changes.

## Client Applicability

- All clients: Applies to Strategic Moves P3 batch generation behavior.
- Specific clients: None.
- Internal only: Operator proof path for governed Move generation.
- Public/demo only: None.
- Feature flag: Existing Moves/deliverable flags continue to control availability and quality enforcement.

## Changes Included

- `src/app/api/v1/deliverables/generate-phase/route.ts`
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`

## QA / Validation

- PASS — `npx jest --runTestsByPath src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts --runInBand`
- PASS — `npx eslint src/app/api/v1/deliverables/generate-phase/route.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npm run release:check`

## Rollout Plan

Merge by PR to `main`; the repo-owned ACA main deploy workflow may build and deploy the resulting image. No migrations, data loads, tenant data writes, registry activation, feature flag changes, or traffic changes outside the repo-owned deploy workflow are included.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Re-run the P3 Approve & Build path and capture either queued runs or actionable quality blockers.

## Rollback Plan

Revert the PR. Previous behavior returns, where same-decision/same-fingerprint P3 reruns may collide with an existing blocked batch key.

## Audit Evidence

- PR, CI, deploy, and signed-in P3 rerun proof to be added after merge/deploy.

## Known Gaps

This does not bypass or weaken the deliverable quality gate. A rerun may still block if generated content contains unsupported claims; in that case the blocker should now include actionable claim examples from the prior release.
