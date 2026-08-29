# 2026-08-29-tower-active-layer4-serving — Tower Active Layer 4 Serving

## Release ID

`2026-08-29-tower-active-layer4-serving`

## Status

`candidate`

## Plain-English Summary

Tower serving views now expose the active Tower Layer 4 assessment for each tenant instead of allowing historical projection rows to mix with the current product read. The Tower reader also filters all serving views to the same active assessment and projection version before it computes portfolio totals, counts, action lanes, or evidence lists.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: Updates the Tower serving helper functions and reader guardrails so current product rows come from one active Layer 4 projection set.

Layers 1-3: No source, adapter, or canonical data changes.

## Client Applicability

- All clients: Tower serving view semantics apply wherever the ECL Tower serving views are present.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Tower routing flags are unchanged.

## Changes Included

- Migration: `supabase/migrations/20260829113000_tower_active_layer4_serving_views.sql`
- Reader: `src/lib/tower/readTowerCommandCenter.ts`
- Regression test: `src/lib/tower/__tests__/readTowerCommandCenter.test.ts`

## QA / Validation

- `npx jest src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand` passed.
- `npx eslint src/lib/tower/readTowerCommandCenter.ts scripts/tower/load-healthcare-demo-layer4-products.mjs` passed.
- `ECL_RECONCILE_REF=HEAD npm run test:ecl-projection-schema-reconciliation` passed.

## Rollout Plan

Merge through PR to `main`, allow the repo-owned Azure Container Apps main deploy workflow to publish the digest-pinned web image, apply the migration through the approved ACA operator job, then rerun the Tower Layer 4 product/cube load job and signed-in Tower proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Operator job must use the digest-pinned deployed image.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/tower` for an authenticated product session.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. If the migration has already been applied, apply a follow-up migration that restores the prior Tower serving helper definitions, then rerun the Tower Layer 4 readback.

## Audit Evidence

- PR URL: to be added.
- CI checks: to be added.
- ACA deploy run: to be added.
- Layer 4 Azure load proof: to be added.
- Signed-in Tower proof: to be added.

## Known Gaps

Azure migration, Layer 4 load readback, and signed-in proof are pending for this release candidate.
