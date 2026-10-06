# 2026-09-21-source-stage07-scorecard-authority-no-ranking — Stage 07 Scorecard Authority No-Ranking Guard

## Release ID

`2026-09-21-source-stage07-scorecard-authority-no-ranking`

## Status

`candidate`

## Plain-English Summary

Source Stage 07 scorecard authority remains a read-only evidence contract. This change prevents a complete authority read from becoming supplier ranking, stage advancement permission, BAFO round creation, or award approval. The panel now shows score authority completeness and conflict state instead of weighted supplier totals.

## Layer Impact

- Release lane: `global-control-lane` because this is shared Source control-plane/read-contract behavior for all clients unless later feature-gated.
- Layer 3 Canonical Enterprise Model: No schema or canonical data changes. The read contract still requires tenant-scoped criterion versions, frozen weights, named evaluator scores, evidence references, lock provenance, and conflict-free rows.
- Layer 4 Products: Source New renders the scorecard authority posture as reviewer inspection only and removes score-total display from the mounted Stage 07 panel.

## Client Applicability

- All clients: Applies wherever Source New renders Stage 07 scorecard authority.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/proposal-intelligence/scorecard-authority.ts`: keeps action flags false, removes weighted supplier ordering, and exposes completeness/conflict state on vendor rows.
- `src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts`: adds the no-ranking behavioral guard and updates ready-state expectations.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`: replaces ranking-oriented copy and score totals with score authority completeness.
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx`: updates mounted panel expectations.

## QA / Validation

- Expected fail before implementation: `npx jest src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts --runInBand` failed because complete authority still set ranking permission and sorted vendors by weighted score.
- Pass: `npx jest src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts --runInBand` — 6/6 passing.
- Pass: `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand` — 40/40 passing.
- Pass: `npx jest src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand` — 46/46 passing.
- Pass: `npx eslint src/lib/source/proposal-intelligence/scorecard-authority.ts src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts src/components/source/new-workspace/SourceNewWorkspace.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx`
- Pass: `npm run typecheck`
- Pass: `npm run release:check`
- Mutation check: temporarily changing `rankAllowed` back to `ready` fails `src/lib/source/proposal-intelligence/__tests__/scorecard-authority.test.ts` at the no-ranking guard.

## Rollout Plan

Merge through the protected PR path. The normal repo-owned Azure Container Apps main deploy workflow may deploy the resulting image after merge. No migration apply, data-plane write, supplier communication, award, score lock, BAFO send, traffic change, or feature flag change is part of this release.

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

- PR: To be added after opening.
- Local validation: Listed above.
- Backlog item: D-020.

## Known Gaps

- No database schema is applied and no real evaluator score rows are written. Persisting scorecard authority rows remains behind a separate migration/apply approval gate.
- The live signed-in Source UI acceptance check remains owed after merge/deploy.
