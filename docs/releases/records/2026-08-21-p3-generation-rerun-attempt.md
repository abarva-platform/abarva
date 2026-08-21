# 2026-08-21-p3-generation-rerun-attempt — P3 Generation Rerun Attempts

## Release ID

`2026-08-21-p3-generation-rerun-attempt`

## Status

`candidate`

## Plain-English Summary

P3 phase generation now records an explicit generation attempt id in the atomic batch idempotency key. This lets an operator rerun P3 generation after a blocked or incomplete batch even when the approved decision and context extract are still unchanged and intentionally fresh.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Strategic Moves P3 Approve & Build can enqueue a new governed generation attempt without colliding with an older batch for the same decision/context snapshot.
- Data layers: No Layer 1, Layer 2, Layer 3, canonical, projection, registry, or tenant-input changes.

## Client Applicability

- All clients: Applies to Strategic Moves P3 generation.
- Specific clients: None.
- Internal only: Operator proof and recovery behavior for governed Move generation.
- Public/demo only: None.
- Feature flag: Existing Moves/deliverable flags continue to control availability and quality enforcement.

## Changes Included

- `src/app/api/v1/deliverables/generate-phase/route.ts`
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`

## QA / Validation

- PASS — `npx jest --runTestsByPath src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts --runInBand`

## Rollout Plan

Merge by PR to `main`; the repo-owned ACA main deploy workflow may build and deploy the resulting image. No migrations, data loads, tenant data writes, registry activation, feature flag changes, or traffic changes outside the repo-owned deploy workflow are included.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Re-run P3 Approve & Build after deploy and verify the new batch enqueues.

## Rollback Plan

Revert the PR. P3 generation returns to the prior decision/context/extract-only atomic batch key, which can block same-context reruns until the context snapshot changes.

## Audit Evidence

- PR, CI, deploy, runtime invariant, and signed-in rerun proof to be added after merge/deploy.

## Known Gaps

This does not bypass or weaken P3 quality review, artifact approval, or phase-gate requirements. It only separates legitimate generation attempts.
