# 2026-06-21-scb-tower-projection-wire — Tower read-model reads the durable projection (context_projection precedence)

## Release ID

`2026-06-21-scb-tower-projection-wire`

## Status

`candidate`

## Plain-English Summary

Wires the durable Tower lens projection (`ai_control_tower_lens_mv`, shipped #3790) into `getAiControlTowerReadModel` as a `context_projection` precedence step: `ai_control_data_plane` → **`context_projection`** → `first_capital_local_synthetic_fallback` → `empty` (matching §4 of the First Capital substrate brief). When the projection returns a lens, Tower serves it with `source: 'context_projection'` and an honest disclosure ("projected live from this tenant's committed context layer"). When the projection is null (today, since the MV isn't applied live), the read-model behaves byte-identically to before — no regression. This is the durable fix for First Capital's Tower "demo fallback," inert until the MV migration runs in the VNet.

## Layer Impact

- **client-data-lane:** `src/lib/ai-control-tower/read-model.ts` gains a `context_projection` source + a precedence step calling `getControlTowerLensProjection`. Graceful: null projection → unchanged behavior. No schema change.

## Client Applicability

- All clients: No behavior change today (MV not applied → null → existing path). Once the MV is populated, a tenant with a committed context-layer Tower projection reads it instead of the synthetic fallback.
- Specific clients: Targets First Capital's Tower demo-fallback.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/ai-control-tower/read-model.ts` — `'context_projection'` source + disclosure; precedence step (try projection → use with that source; else fall through unchanged); `buildModelFromProjection` reuses existing `buildFunctions`/`buildKpis`.
- `src/lib/ai-control-tower/__tests__/read-model.test.ts` — projection-present → context_projection; projection-null → unchanged fallback; non-FC empty.

## QA / Validation

Validation: Pass. `tsc --noEmit` clean. read-model suite 4/4 + projection module 14/14 (no regression). Graceful degradation verified: null projection (the live state) → existing fallback/empty behavior, byte-identical. The projection-present path is exercised via a mock; the real MV path is NOT live (the MV isn't applied — needs the VNet migration run from #3790).

## Rollout Plan

Merge to `main`. Goes live for real once the #3790 migration is applied in the VNet and the MV is refreshed; until then it's a correct no-op precedence step.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` (auto on push).
- Shared runtime mutators: none (the MV creation is the separate #3790 migration, run via the VNet job).
- Approved image digest: built by the deploy workflow.
- ACA runtime invariant: read-model behaves as today until the MV exists.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — after the MV is applied, prove First Capital Tower reads `context_projection` (not the fallback).

## Rollback Plan

Revert the PR — removes the precedence step + source. No data/migration.

## Known Gaps

- Inert until the #3790 MV migration runs in the VNet (the gating live step).
- The §4 column-contract drift test is a follow-on.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-tower-projection-wire` → `main`.
- CI: `npm run release:check`, tsc clean, read-model 4/4 + projection 14/14.
