# 2026-08-21-move-runner-approval-and-artifact-inheritance — Move Runner Approval And Artifact Inheritance

## Release ID

`2026-08-21-move-runner-approval-and-artifact-inheritance`

## Status

`candidate`

## Plain-English Summary

Move approval gates remain in place, but pilot-mode Move runners with approval authority can approve pricing snapshots without requiring a separate reviewer identity. Strict mode still enforces separation of duties. When pilot-mode self-approval occurs, the immutable pricing snapshot rationale records that it was a pilot self-approval.

Later Move phases can also use the Move's own current generated artifacts as internal governed evidence. This lets handoff and measurement deliverables inherit earlier signed/generated package context instead of treating the evidence set as empty when no separate uploaded evidence exists.

## Layer Impact

- Layer 4 Products / Moves (`global-control-lane`): Updates approval and generation-context behavior in Moves. No canonical data model, tenant intake, source adapter, or projection schema changes are included.
- Operational artifact layer (`global-control-lane`): Reads current `generated_artifacts` rows for the same client and Move as internal-only evidence candidates. It does not make generated artifacts canonical enterprise truth.

## Client Applicability

- All clients: Yes, where Moves and the pricing estimate approval flow are available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing `GATE_APPROVAL_STRICT_MODE` controls pilot versus strict separation-of-duties behavior.

## Changes Included

- `src/lib/pricing/effort-engine/snapshot-service.ts`: Routes pricing snapshot separation-of-duties through the shared strict-mode gate and records pilot self-approval in the snapshot rationale.
- `src/app/api/v1/programs/[programId]/pricing/estimates/[estimateId]/approve/route.ts`: Updates route contract comments to match pilot/strict behavior.
- `src/lib/deliverables/orchestrator/evidence-assembler.ts`: Adds current generated Move artifacts as same-Move, internal-only governed evidence candidates.
- `src/lib/pricing/effort-engine/__tests__/snapshot-service.test.ts`: Covers pilot self-approval, strict-mode rejection, and audit-note persistence.
- `src/lib/deliverables/orchestrator/__tests__/surface.test.ts`: Covers generated-artifact inheritance when other evidence channels are empty.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/pricing/effort-engine/__tests__/snapshot-service.test.ts 'src/app/api/v1/programs/[programId]/pricing/__tests__/approve-route.test.ts' --runInBand` — 33 tests passed.
- Pass: `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand` — 14 tests passed.
- Pass: `npx eslint src/lib/pricing/effort-engine/snapshot-service.ts src/lib/pricing/effort-engine/__tests__/snapshot-service.test.ts 'src/app/api/v1/programs/[programId]/pricing/estimates/[estimateId]/approve/route.ts'`.
- Pass: `npx eslint src/lib/deliverables/orchestrator/evidence-assembler.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow will build and deploy the image. No manual migration, tenant-data mutation, registry activation, or data-plane load is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Yes, on merge to `main`.
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Pending merge/deploy.
- ACA runtime invariant: Required after deploy before claiming runtime proof.
- Worker image invariant: Required after deploy because Move artifact generation runs through the worker image.
- Feature/env flag update path: None in this release.
- Live signed-in proof required: Yes, for affected Move approval/generation behavior.

## Rollback Plan

Revert the PR. Strict-mode production behavior remains available through `GATE_APPROVAL_STRICT_MODE`; reverting restores the prior pricing snapshot approval behavior and removes generated-artifact inheritance from the orchestrator evidence assembler.

## Audit Evidence

- PR URL: pending.
- Local focused Jest and ESLint output from the candidate branch.
- Post-merge deploy run, ACA runtime invariant, and signed-in Move proof to be attached after deployment.

## Known Gaps

This release does not change hard gate criteria, lower deliverable quality thresholds, approve unresolved rate gaps, or promote generated artifacts into canonical enterprise data.
