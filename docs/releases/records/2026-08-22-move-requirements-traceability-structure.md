# 2026-08-22-move-requirements-traceability-structure — Moves Requirements Traceability Structure

## Release ID

`2026-08-22-move-requirements-traceability-structure`

## Status

`candidate`

## Plain-English Summary

Moves requirements traceability generation now uses a fixed compact control-matrix structure instead of falling back to the generic Moves binder. This prevents a traceability artifact from becoming an overlong report when its purpose is to prove requirement, evidence, design, control, and open-decision linkage before the design gate closes.

## Layer Impact

Layer 4 Products: Updates the Moves deliverable generation contract for the requirements traceability artifact. No tenant intake, source adapter, canonical model, data-plane loader, graph, migration, registry, or read-model behavior changes.

## Client Applicability

- All clients: Moves deliverable generation users.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add a fixed five-section requirements traceability structure.
- Set explicit section-level word budgets whose total stays below the artifact hard ceiling.
- Add tests proving the brief resolver composes requirements traceability through the fixed-structure path and preserves compact authoring budgets.

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts --runInBand` — pass.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, retry the affected Moves phase generation and confirm the requirements traceability artifact clears the size gate.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the prior behavior. No data rollback is required.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant output, and signed-in deliverable generation retry proof after deployment.

## Known Gaps

This change does not alter quality gate thresholds. It narrows the authoring structure so generated content is more likely to satisfy the existing gate.
