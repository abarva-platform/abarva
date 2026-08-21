# 2026-08-21-p3-traceability-generation — P3 Traceability Generation

## Release ID

`2026-08-21-p3-traceability-generation`

## Status

`candidate`

## Plain-English Summary

P3 generation now includes the requirements traceability artifact that the P3→P4 gate already requires. This keeps the gate evidence model consistent: the phase build produces a deliberate trace artifact instead of relying on capture text or manual rewording to satisfy the gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Strategic Moves P3 Approve & Build now enqueues a requirements traceability deliverable between operating-model design and sourcing strategy.
- Data layers: No Layer 1, Layer 2, Layer 3, canonical, projection, registry, or tenant-input changes.

## Client Applicability

- All clients: Applies to Strategic Moves P3 generation and gate evidence.
- Specific clients: None.
- Internal only: Operator proof path for governed Move generation.
- Public/demo only: None.
- Feature flag: Existing Moves/deliverable flags continue to control availability and quality enforcement.

## Changes Included

- `src/lib/programs/deliverable-registry.ts`
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`

## QA / Validation

- PASS — `npx jest --runTestsByPath src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts --runInBand`
- PASS — `npx eslint src/lib/programs/deliverable-registry.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`
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
- Live signed-in proof required: Re-run P3 Approve & Build and approve the generated traceability artifact before retrying the P3 gate.

## Rollback Plan

Revert the PR. P3 generation returns to the prior four-document batch and the P3→P4 gate continues to require a trace artifact that the batch does not produce.

## Audit Evidence

- PR, CI, deploy, runtime invariant, and signed-in P3 rerun proof to be added after merge/deploy.

## Known Gaps

This does not bypass or weaken the P3→P4 gate. The generated trace artifact must still pass quality review and be approved before the phase gate can advance.
