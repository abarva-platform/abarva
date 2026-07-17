# 2026-07-17-tower-command-mart — Tower Command-Center Mart

## Release ID

`2026-07-17-tower-command-mart`

## Status

`candidate`

## Plain-English Summary

Tower now has a persistent command-center mart design under the `cio_tower` schema. The mart turns refreshed Meridian V3 source/template rows into CXO-ready Tower rows for the command center, value proof funnel, program decision lanes, AI portfolio, recommended actions, evidence lineage, and required-field gaps. The Tower page is wired to read this mart first, instead of reconstructing a dashboard from generic rows or falling back to file-backed runtime previews.

## Layer Impact

- Data plane: Adds `cio_tower.mart_*` tables for the Tower command-center read model. These tables are derived projections, not source truth.
- Data-build job: Extends `scripts/tower/project-meridian-v3-to-cio-tower.mjs` so the governed Tower projection can write mart rows in the same transaction as normalized facts and measure results.
- Application runtime: Adds `loadTowerMartCommandView` and makes `/tower` prefer the persistent mart before older `cio_tower` CXO fallback or flagged file-backed runtime proof views.
- UI: Adds a mart-backed Tower command center matching the target experience: Command Center, Value Proof Funnel, Decision Lanes, AI Portfolio, Recommended Actions, and Evidence.

## Client Applicability

- All clients: The schema and runtime reader are shared.
- Specific clients: Meridian / Healthcare Demo is the first projection target in this release candidate.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new feature flag. Mart presence controls the read path; legacy fallbacks remain when the mart is absent.

## Changes Included

- Migration: `supabase/migrations/20260717164000_cio_tower_command_mart_v1.sql`
- Projection: `scripts/tower/project-meridian-v3-to-cio-tower.mjs`
- Audit: `scripts/tower/audit-meridian-v3-cio-tower-projection.mjs`
- Runtime reader: `src/lib/cio-tower/tower-mart-view-model.ts`
- Tower route: `src/app/(maestro)/tower/page.tsx`
- Tower UI: `src/components/tower/TowerIndexPage.tsx`

## QA / Validation

- `npm run project:meridian-v3-cio-tower` passed and generated refreshed mart proof artifacts.
- `npm run audit:meridian-v3-cio-tower-projection` passed. The audit verifies $650.0M total IT budget, $487.5M run, $162.5M change, $53.7M non-additive AI-tagged spend, $35.5M promised value, $3.8M partial finance-validated value, and $0 realized value allowed.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/app/'(maestro)'/tower/page.tsx src/lib/cio-tower/tower-mart-view-model.ts scripts/tower/project-meridian-v3-to-cio-tower.mjs scripts/tower/audit-meridian-v3-cio-tower-projection.mjs` completed with warnings only from existing legacy Tower unused code.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` completed without reported TypeScript errors.

## Rollout Plan

1. Merge through the protected PR lane.
2. Let the approved ACA main deploy workflow build and deploy the image.
3. Apply the migration through the approved database migration path.
4. Run the governed ACA data-build job for Meridian Tower projection with `--write` so `cio_tower.mart_*` is refreshed from the updated V3 templates.
5. Run readback/volumetric proof for the mart tables.
6. Run signed-in Meridian / Healthcare Demo `/tower` browser proof and confirm Tower reads `cio_tower.mart_*`.

## Deployment Authority

- Repo-owned deploy workflow: Required for web runtime.
- Shared runtime mutators: Not allowed from local branch.
- Approved image digest: Captured after ACA main deploy.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Required for governed ACA data-build job.
- Feature/env flag update path: None for the mart reader.
- Live signed-in proof required: Yes, after deploy, migration, and governed data-build job.

## Rollback Plan

If the mart reader causes runtime issues, revert the application commit and redeploy through ACA main workflow. The new `cio_tower.mart_*` tables can remain inert because Tower falls back when no mart rows are read. If the projection writes bad rows, rerun the governed projection job from the prior approved image or delete Meridian mart rows inside an approved data-build rollback job.

## Audit Evidence

- `reports/meridian-v3-cio-tower-projection/projection.json`
- `reports/meridian-v3-cio-tower-projection/mart-command-center.csv`
- `reports/meridian-v3-cio-tower-projection/mart-value-funnel.csv`
- `reports/meridian-v3-cio-tower-projection/mart-program-decision-lanes.csv`
- `reports/meridian-v3-cio-tower-projection/mart-ai-portfolio.csv`
- `reports/meridian-v3-cio-tower-projection/mart-cxo-actions.csv`
- `reports/meridian-v3-cio-tower-projection/mart-evidence-lineage.csv`
- `reports/meridian-v3-cio-tower-projection/mart-required-field-gaps.csv`

## Known Gaps

- This candidate does not itself write production Azure/Postgres rows. The governed ACA data-build job must run after merge/deploy/migration.
- No live signed-in browser proof is claimed until the mart tables are migrated, refreshed, read back, and visible on `https://app.abarva.ai/tower`.
