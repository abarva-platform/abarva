# 2026-08-21-p5-value-contract-size-control — P5 Value Contract Size Control

## Release ID

`2026-08-21-p5-value-contract-size-control`

## Status

`candidate`

## Plain-English Summary

This change tightens the P5 value-measurement contract so it behaves like a measurement instrument instead of a second business case. The document now pushes measurement detail into compact tables, blocks methodology or history recaps, and measures the hard word ceiling against prose rather than table cells.

## Layer Impact

Layer 4 / Products. Lane: `global-control-lane`. This affects Move-generated deliverable quality shaping for P5 value-measurement contracts. It does not change canonical data, tenant input data, projections, registries, retrieval indexes, or runtime routing.

## Client Applicability

- All clients: Move P5 value-measurement contract generation uses the updated quality shaping.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts`
- `src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts`

## QA / Validation

- PASS: `npx eslint src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts src/lib/deliverables/orchestrator/quality-bar-registry.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts`
- PASS: `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. After deploy, rerun the P5 governed artifact build and verify that the handoff pack and value-measurement contract pass the quality gate without weakening approvals.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None beyond the repo-owned main deploy.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the Move P5 governed build and read back artifact statuses.

## Rollback Plan

Revert this release commit and redeploy through the repo-owned main deploy workflow. Existing persisted artifacts are immutable and are not rewritten by rollback.

## Audit Evidence

To be filled after PR merge and deploy:

- PR URL:
- Commit:
- Deploy run:
- Runtime invariant proof:
- Signed-in P5 proof:

## Known Gaps

The change does not lower the quality gate or bypass the hard cap. If a future value-measurement contract still exceeds the prose ceiling, the quality gate should continue to block export.
