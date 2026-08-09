# 2026-08-09-tower-value-case-copy-polish - Tower Value-Case Copy Polish

## Release ID

`2026-08-09-tower-value-case-copy-polish`

## Status

`candidate`

## Plain-English Summary

Tower Command Center board-posture and Evidence workplan copy now refers to value-case evidence and source-backed benefit without using legacy promised-benefit wording in board-visible labels. This is a presentation-only correction so the cockpit language matches the semantic model already promoted.

## Layer Impact

- `global-control-lane`: Updates shared Tower cockpit presentation copy, Evidence workplan label rendering, and regression tests.
- Products layer: Tower display language changes only. No canonical data, source adapter, schema, Cube, migration, route contract, or tenant data changes are included.

## Client Applicability

- All clients: Yes, wherever the Tower Command Center cockpit renders the affected board-posture or Evidence workplan labels.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/command-center/views/CommandCenterView.tsx`
- `src/components/tower/command-center/views/EvidenceView.tsx`
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`
- `docs/releases/records/2026-08-09-tower-value-case-copy-polish.md`

## QA / Validation

- Pass: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- Pass: source scan confirms the stale board-posture phrase is absent from product source and only retained in a negative regression assertion.
- Pass: `npx eslint src/components/tower/command-center/views/EvidenceView.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`
- Pass: `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`

## Rollout Plan

Merge through the protected PR lane. If merged, the repo-owned Azure Container Apps main deployment workflow can publish the copy change with the next digest-pinned web image. No standalone data build, migration, feature flag, traffic shift, or shared runtime mutation is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: Required for any shared runtime publication after merge.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Not applicable before merge/deploy.
- ACA runtime invariant: Must be proven by the deploy workflow if this candidate is later deployed.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Tower smoke proof recommended after shared publication because the affected text is board-visible.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main workflow. Rollback is code-only because there are no data, schema, migration, or configuration changes.

## Audit Evidence

- PR URL: pending
- Local test output: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- Release gate: `npm run release:check`

## Known Gaps

This candidate does not perform a fresh shared deployment or signed-in browser proof. That is intentional: the change is limited to one board-visible sentence and its regression test, and live publication should happen only through the governed main deployment path after merge.
