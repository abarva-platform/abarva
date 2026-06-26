# 2026-06-26-tower-materialized-read-model-isolation — Tower Materialized Read Model Isolation

## Release ID

`2026-06-26-tower-materialized-read-model-isolation`

## Status

`candidate`

## Plain-English Summary

Tower now has an additive `tower_*` materialized read-model contract for demo-readiness work. The visible Tower runtime fallback no longer reaches directly into the enterprise context projection; it reads only the Tower read-model tables when the existing AI initiatives registry is empty.

## Layer Impact

- `global-control-lane`: changes shared Tower runtime fallback behavior for all clients once deployed.
- `client-data-lane`: adds additive `tower_*` schema for materialized Tower read models, gaps, spend realism audit, forbidden identifiers, and answer traces.

## Client Applicability

- All clients: runtime fallback path now expects Tower materialized read models.
- Specific clients: Lakeshore and SkyHarbor are the first demo-readiness targets.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none in this slice.

## Changes Included

- Migration: `supabase/migrations/20260626130000_tower_demo_readiness_materialized_plane.sql`
- Runtime reader: `src/lib/tower/tower-materialized-read-model.ts`
- Materialization planner: `src/lib/tower/tower-materialization.ts`
- Materialization CLI: `src/scripts/tower/materialize-read-model.ts`
- Runtime refactor: `src/lib/atlas/tower-grounding.ts`
- Tests: `src/lib/tower/__tests__/tower-materialized-read-model.test.ts`, `src/lib/tower/__tests__/tower-materialization.test.ts`
- Decision record: `NEEDS_DECISION.md`

## QA / Validation

- Targeted Jest: pass — `npx jest src/lib/tower/__tests__/tower-materialized-read-model.test.ts src/lib/tower/__tests__/tower-materialization.test.ts --runInBand` (7 tests passed).
- ESLint: pass — `npx eslint src/lib/tower/tower-materialized-read-model.ts src/lib/tower/tower-materialization.ts src/lib/tower/__tests__/tower-materialized-read-model.test.ts src/lib/tower/__tests__/tower-materialization.test.ts src/lib/atlas/tower-grounding.ts src/scripts/tower/materialize-read-model.ts`.
- TypeScript: blocked — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` now runs past the heap issue, but full-repo typecheck is blocked by pre-existing missing dependency/type declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- Release check: pass — `npm run release:check`.
- Live Azure/Postgres migration apply: not-run in this PR.
- Signed-in browser proof: not-run in this PR.

## Rollout Plan

1. Merge to main.
2. Apply the additive migration in Azure/Postgres.
3. Run the approved Tower materialization job to populate `tower_read_model_*` from governed upstream sources.
4. Deploy through the repo-owned Azure Container Apps path.
5. Browser-prove Lakeshore and SkyHarbor Tower surfaces with the proof bundle.

## Deployment Authority

- Repo-owned deploy workflow: required for ACA rollout.
- Shared runtime mutators: no manual non-main mutation.
- Approved image digest: captured during deploy.
- ACA runtime invariant: active revision/template/traffic must match approved main digest.
- Worker image invariant: materialization job image must be recorded before live apply.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Lakeshore and SkyHarbor.

## Rollback Plan

Code rollback: revert the Tower runtime fallback refactor and redeploy the previous main image.

Data rollback: migration is additive. Leave tables in place if rollback is urgent; stop the materialization job and clear feature/runtime usage. Dropping additive tables requires a separate approved destructive migration.

## Audit Evidence

- PR: draft `#4010`
- Tests: to be attached before ready-for-review.
- Live proof: not in this slice.

## Known Gaps

- Materialization job is scaffolded and test-covered, but not yet run against live Azure/Postgres.
- Gates A-F are not all proven yet.
- Lakeshore Level 2/Level 3 portfolio-company views remain Path A named gaps until operating-company data is explicitly approved.
