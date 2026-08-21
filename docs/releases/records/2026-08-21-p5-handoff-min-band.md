# 2026-08-21-p5-handoff-min-band — P5 Handoff Minimum Band

## Release ID

`2026-08-21-p5-handoff-min-band`

## Status

`candidate`

## Plain-English Summary

This change adjusts the P5 handoff-pack minimum size band so a concise, complete handoff package is not blocked for being a few words below an arbitrary round-number floor. The maximum ceiling and quality blockers remain intact.

## Layer Impact

Layer 4 / Products. Lane: `global-control-lane`. This affects only Move P5 handoff-pack quality-band validation. It does not change tenant input data, canonical data, projections, registries, retrieval indexes, migrations, or runtime routing.

## Client Applicability

- All clients: Move P5 handoff-pack generation uses the adjusted lower word-band floor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-bar-registry.ts`
- `src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts`

## QA / Validation

- PASS: `npx eslint src/lib/deliverables/orchestrator/quality-bar-registry.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts`
- PASS: `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-size-range.test.ts --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. After deploy, rerun the governed P5 artifact build and verify both P5 artifacts pass the quality gate.

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

This change does not bypass or lower any approval gate. It only adjusts the handoff-pack minimum word-band floor; other quality blockers continue to apply.
