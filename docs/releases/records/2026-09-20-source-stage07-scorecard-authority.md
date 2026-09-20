# 2026-09-20-source-stage07-scorecard-authority — Source Stage 07 Scorecard Authority

## Release ID

`2026-09-20-source-stage07-scorecard-authority`

## Status

`candidate`

## Plain-English Summary

Source Stage 07 now has a read-only scorecard authority contract and a mounted Source New panel that fails closed when scorecard authority is missing or incomplete. Ranking, advancement and BAFO-ready posture require approved criterion versions, frozen weights, named evaluator scores, evidence references, override reasons when required, and locked score state. AI suggestions remain advisory only.

## Layer Impact

- Release lane: `global-control-lane` because this is shared Source control-plane/read-contract behavior for all clients unless later feature-gated.
- Layer 3 Canonical Enterprise Model: Defines the smallest tenant-scoped authority shape for scorecard criteria and evaluator scores. It does not create or apply schema.
- Layer 4 Products: Source New displays the authority posture for evaluation and BAFO stages and refuses readiness when the authority read is absent or blocked.

## Client Applicability

- All clients: Applies wherever Source New renders Stage 07 evaluation or BAFO posture.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- New read contract: `src/lib/source/proposal-intelligence/scorecard-authority.ts`
- Export: `src/lib/source/proposal-intelligence/index.ts`
- Mounted read-only panel: `src/components/source/new-workspace/SourceNewWorkspace.tsx`
- Explicit fail-closed page projection: `src/app/(maestro)/source/new/[eventId]/page.tsx`
- Behavioral tests: `src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts`, `src/components/source/new-workspace/SourceNewWorkspace.test.tsx`

## QA / Validation

- Pass: `npx jest src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts --runInBand` — 5/5 passing.
- Pass: `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand` — 38/38 passing.
- Pass: `npx eslint 'src/lib/source/proposal-intelligence/scorecard-authority.ts' 'src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts' 'src/components/source/new-workspace/SourceNewWorkspace.tsx' 'src/components/source/new-workspace/SourceNewWorkspace.test.tsx' 'src/app/(maestro)/source/new/[eventId]/page.tsx'`
- Pass: `git diff --check`
- Pass: `npm run typecheck`
- Pass: `npm run release:check`
- Not run: Full repository CI before PR.
- Not claimed: Signed-in browser proof. This candidate intentionally does not perform or claim signed-in acceptance.

## Rollout Plan

Merge through the protected PR path. The normal repo-owned Azure Container Apps main deploy workflow may deploy the resulting image after merge. No migration apply, data-plane write, supplier communication, award, score lock, BAFO send or feature flag change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Not applicable until after merge/deploy.
- ACA runtime invariant: Not run; candidate only.
- Worker image invariant: Not run; candidate only.
- Feature/env flag update path: None.
- Live signed-in proof required: Owed after deployment for product acceptance; not performed or claimed here.

## Rollback Plan

Revert the PR. Because this is read-only product/model code with no schema apply and no tenant data writes, rollback does not require data migration.

## Audit Evidence

- PR: To be opened from `codex/source-scorecard-authority-d020-recovery`
- Local validation: To be added before merge.
- Backlog item: D-020.

## Known Gaps

- No database schema is applied and no real evaluator score rows are written. Persisting scorecard authority rows remains behind a separate migration/apply approval gate.
- The live signed-in Source UI acceptance check remains owed after merge/deploy.
