# 2026-08-20-phase-capture-authoritative-values — Phase capture renders only persisted values

## Release ID

`2026-08-20-phase-capture-authoritative-values`

## Status

`candidate`

## Plain-English Summary

The Moves phase workspace now treats phase-capture fields as authoritative
only when the server has already persisted them. The client no longer derives
P1-P5 capture text from charter fallbacks, selected options, phase labels,
evidence summaries, or hardcoded guidance. Empty persisted fields render as
empty and keep Approve & Build blocked until a real capture value exists.

The server-side phase-capture guard also rejects the old synthesized P1-P5
template shapes if an older browser tab or replayed request submits them.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Layer 4 (Products):** Moves phase workspace behavior changes. Capture
  editors render persisted state only and no longer prefill synthesized
  capture.
- **Layer 3 (Canonical Model):** no schema change and no data migration. The
  phase-capture write route receives a stricter validation guard before any
  `program_modules` write.

## Client Applicability

- All clients: yes, for the Moves phase workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/lib/programs/phase-capture-integrity.ts`
- `src/lib/programs/__tests__/phase-capture-integrity.test.ts`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- `npx jest src/lib/programs/__tests__/phase-capture-integrity.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`:
  passed, 85/85 focused tests.
- `npx eslint src/lib/programs/phase-capture-integrity.ts src/lib/programs/__tests__/phase-capture-integrity.test.ts src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`:
  passed.
- `git diff --check`: passed.
- `npm run release:check`: passed.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow
builds and deploys the change. No migration, data load, feature flag, tenant
promotion, or manual runtime mutation is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: unchanged but checked by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: targeted Moves page proof recommended.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. No data rollback is
required because this change does not write tenant data or alter schema.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6546
- CI run: pending.
- Deploy run: pending.

## Known Gaps

- Existing persisted phase-capture rows are not modified by this change.
- This prevents synthesized capture from being newly rendered or saved; any
  separate repair of already-persisted rows would require its own diagnostic
  and reviewed repair plan.
