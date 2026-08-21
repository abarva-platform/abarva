# 2026-08-21-deliverable-quality-actionability — Deliverable Quality Actionability

## Release ID

`2026-08-21-deliverable-quality-actionability`

## Status

`candidate`

## Plain-English Summary

Deliverable generation already blocks unsupported numeric, date, currency, and percentage claims. This change makes that blocker actionable by including short examples of the offending claim text in the quality result, so operators can cite, label, or remove the exact claim instead of seeing only a count.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Strategic Moves deliverable generation status becomes more actionable when a generated artifact is blocked by the quality gate.
- Data layers: No Layer 1, Layer 2, Layer 3, canonical, or projection data changes.

## Client Applicability

- All clients: Applies to governed deliverable generation quality output.
- Specific clients: None.
- Internal only: Operator/debug visibility for blocked generated deliverables.
- Public/demo only: None.
- Feature flag: Existing deliverable quality flags continue to control enforcement.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-validator.ts`
- `src/lib/deliverables/orchestrator/__tests__/unsupported-figure-blocker.test.ts`

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/unsupported-figure-blocker.test.ts --runInBand` — passed.
- `npx eslint src/lib/deliverables/orchestrator/quality-validator.ts src/lib/deliverables/orchestrator/__tests__/unsupported-figure-blocker.test.ts` — passed.

## Rollout Plan

Merge by PR to `main`; the repo-owned ACA main deploy workflow may build and deploy the resulting image. No migrations, data loads, feature flag changes, tenant data writes, or registry activation are included.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Re-run the blocked Strategic Moves generation path and capture the more actionable blocker or successful artifact.

## Rollback Plan

Revert the PR. The previous behavior returns to count-only unsupported-claim blockers.

## Audit Evidence

- PR, CI, deploy, and signed-in generation proof to be added after merge/deploy.
- Local validation commands listed above.

## Known Gaps

This does not relax the unsupported-claim gate and does not repair existing blocked generations by itself. Existing blocked runs must be rerun after deployment to capture the claim examples.
