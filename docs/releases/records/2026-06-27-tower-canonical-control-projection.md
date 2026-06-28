# 2026-06-27-tower-canonical-control-projection — Tower Canonical Control Projection

## Release ID

`2026-06-27-tower-canonical-control-projection`

## Status

`candidate`

## Plain-English Summary

Tower now prefers the governed AI Control Tower substrate when building the materialized Tower read model. This prevents generic enterprise context rows from inflating dashboard totals or contradicting aVa chat answers. The materialized Tower refresh also replaces each tenant's existing Tower rows before writing fresh rows, so stale rows cannot survive a corrected refresh. Tower dashboard budget rollups now derive from the same materialized/control initiative rows when those rows exist, preventing the older `tower_budget_rollups` / F12 fallback path from overriding the canonical Tower numbers.

## Layer Impact

- `global-control-lane`: shared Tower projection and materialization behavior changes for every tenant.
- `client-data-lane`: tenant-scoped Tower read-model rows are deleted and rewritten during materialization; source data is not deleted.

## Client Applicability

- All clients: Tower tenants using the materialized Tower read model.
- Specific clients: Apex Retail, First Capital Financial, Lakeshore Holdings, Meridian Health, SkyHarbor Air.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag; this is the canonical Tower projection path.

## Changes Included

- `src/lib/tower/tower-semantic-projection.ts`: prefer current `ai_control_*` rows before generic `enterprise_context_records` projection.
- `src/lib/tower/tower-materialization.ts`: delete tenant-scoped materialized rows before upsert.
- `src/lib/tower/tower-materialized-read-model.ts`: carry portfolio/company/function metadata from materialized initiative rows.
- `src/lib/tower/tower-budget-rollups.ts`: derive Tower budget rollups from materialized initiatives when the canonical read model is available.
- `src/lib/atlas/tower-grounding.ts`: use materialized-derived budget rollups for dashboard and aVa factual spine.
- `src/lib/tower/__tests__/tower-materialization.test.ts`: assert delete-before-upsert behavior.
- `docs/releases/records/2026-06-27-tower-canonical-control-projection.md`: release record.

## QA / Validation

- Pass: `npx jest src/lib/tower/__tests__/tower-materialized-read-model.test.ts src/lib/tower/__tests__/tower-materialization.test.ts src/lib/tower/__tests__/tower-question-bank.test.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts --runInBand` — 4 suites / 22 tests passed.
- Pass: `npx eslint src/lib/tower/tower-semantic-projection.ts src/lib/tower/tower-materialization.ts src/lib/tower/__tests__/tower-materialization.test.ts src/scripts/tower/materialize-read-model.ts scripts/qa/tower-live-scorer.ts`.
- Pass: `npx eslint src/lib/admin/ai-initiatives/queries.ts src/lib/tower/tower-materialized-read-model.ts src/lib/tower/tower-budget-rollups.ts src/lib/atlas/tower-grounding.ts`.
- Live data proof after first deploy: all five tenants' materialized initiative counts and committed annual spend matched governed `ai_control_*` rows. Remaining issue found: dashboard/chat factual spine still read stale `tower_budget_rollups`; this follow-up fixes that path.
- Pending: VNet rematerialization and signed-in browser/scorer proof after deployment.

## Rollout Plan

1. Merge to `main`.
2. Build and deploy the main image to Azure Container Apps.
3. Run `src/scripts/tower/materialize-read-model.ts --apply` inside the private VNet for each canonical tenant.
4. Run the Tower live scorer with KPI repeatability coverage and capture the HTML/JSON proof bundle.
5. Browser-check `/tower` for SkyHarbor and Lakeshore with signed-in storage states, then mint/run remaining tenant states if needed.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: no local/non-main runtime mutation approved.
- Approved image digest: assigned by the main ACA deploy.
- ACA runtime invariant: active revision and template image must match the main image digest at 100% traffic.
- Worker image invariant: not changed by this release.
- Feature/env flag update path: no feature flag required.
- Live signed-in proof required: yes, Tower dashboard and aVa chat proof after rematerialization.

## Rollback Plan

Redeploy the prior approved main image. If data rollback is required, rerun the previous materializer or delete tenant-scoped `tower_read_model_*`, `tower_gap_register`, `tower_spend_realism_audit`, and `tower_forbidden_identifiers` rows so Tower falls back to the prior projection behavior.

## Audit Evidence

- Pre-fix live audit: governed `ai_control_*` rows existed for all five tenants while materialized Tower rows were inflated or stale for some tenants.
- Mid-fix live audit: materialized read-model reconciliation passed for all five tenants, but SkyHarbor dashboard/chat still showed `$2.6B` from `tower_budget_rollups` while governed Tower committed annual spend was `$1.03125B`.
- Code proof: projection precedence now returns `ai_control_tower` before attempting generic context projection.
- Code proof: dashboard budget rollups now derive from materialized initiatives whenever the canonical Tower read model is present.
- Test proof: materialization unit test asserts tenant-scoped delete before upsert.

## Known Gaps

- Live rematerialization and signed-in browser proof are pending until this candidate is deployed to the ACA runtime.
- Available local Clerk storage states currently cover SkyHarbor and Lakeshore Tower proof; remaining tenant browser proof may require refreshed/minted automation states.
