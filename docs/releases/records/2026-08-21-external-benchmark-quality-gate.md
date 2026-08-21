# 2026-08-21-external-benchmark-quality-gate — External Benchmark Quality Gate

## Release ID

`2026-08-21-external-benchmark-quality-gate`

## Status

`candidate`

## Plain-English Summary

The deliverable quality gate now distinguishes labelled external benchmarks from unsupported client facts. A quantified reference may pass only when it is explicitly framed as an external/reference/sensitivity benchmark; unsupported annual savings or benefit claims remain blocked unless they are cited, assumption-tagged, or marked as an open input.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Strategic Moves generated deliverable quality review is corrected so external benchmarks can be carried as references without being mistaken for client-proven facts.
- Data layers: No Layer 1, Layer 2, Layer 3, canonical, projection, registry, or tenant-input changes.

## Client Applicability

- All clients: Applies to generated deliverable quality validation.
- Specific clients: None.
- Internal only: Operator proof and quality-gate behavior.
- Public/demo only: None.
- Feature flag: Existing deliverable generation flags continue to govern availability.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-validator.ts`
- `src/lib/deliverables/orchestrator/__tests__/unsupported-figure-blocker.test.ts`

## QA / Validation

- PASS — `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/unsupported-figure-blocker.test.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts --runInBand`

## Rollout Plan

Merge by PR to `main`; the repo-owned ACA main deploy workflow may build and deploy the resulting image. No migrations, data loads, tenant data writes, registry activation, feature flag changes, or traffic changes outside the repo-owned deploy workflow are included.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Re-run the governed P3 generation after deploy and verify the quality gate no longer blocks a labelled external benchmark while preserving value-evidence gates.

## Rollback Plan

Revert the PR. The quality gate returns to treating labelled external benchmark figures as unsupported client facts.

## Audit Evidence

- PR, CI, deploy, runtime invariant, and signed-in rerun proof to be added after merge/deploy.

## Known Gaps

This does not authorize annual savings, ROI, or benefit claims without source evidence. Those claims remain blocked unless cited, explicitly assumption-tagged, or left as open inputs.
