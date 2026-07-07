# 2026-07-07-lakeshore-holdco-pilot-source-fix — Lakeshore Holdco Pilot Source Fix

## Release ID

`2026-07-07-lakeshore-holdco-pilot-source-fix`

## Status

`candidate`

## Plain-English Summary

Reconciles the Lakeshore pilot source pack to the approved holding-company operating model: one holding company, four named portfolio companies, corporate/shared-services IT, opco-local IT, and a non-operating revenue allocation bucket. The change removes stale generated operating companies from the V7 pack, corrects the Tower profile away from the old large-industrial story, and scopes Tower applications, infrastructure, budget, functions, IT ownership, and role-level leadership to holdco/shared-services/opco entities.

## Layer Impact

- `client-data-lane`: Updates Lakeshore source-pack CSV/YAML/JSON artifacts only. No database migration is included.
- `source/corpus governance`: Strengthens truth-basis separation by marking the pack as `pilot_reconciled_pending_client_confirmation`.
- `Tower data source`: Treats Tower Lakeshore files as first-class source-family inputs with entity scope instead of a flat tenant-only view.
- `V7 data contract`: Keeps the V7 model broad, but reconciles holding-company rows to the approved source contract and refreshes the Azure load payload.

## Client Applicability

- All clients: No.
- Specific clients: Lakeshore Holdings / `lakeshore-industries`.
- Internal only: Yes, until the corrected pack is loaded and browser-proven.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `datasets/lakeshore-industries-synthetic-v7-holdco/**`
- `tower-standardized-v1/lakeshore-industries/**`
- `tower-standardized-v1/PACKAGE_MANIFEST.csv`
- This release record.

## QA / Validation

Pass:

- Verified V7 has exactly four `portfolio_company` rows: Northline Supply Chain, Brightmark Marketing Services, Forge & Field Consumer Products, and Great Lakes Pantry Services.
- Verified V7 holdco row has `revenue_usd=0` and `consolidated_group_revenue_usd=7120000000` with a non-additive revenue rule.
- Verified no fixed Lakeshore V7/Tower surfaces contain stale generated opcos: HarborPoint, Riverton, Keystone, `LSH-OPCO-HPG`, `LSH-OPCO-RCF`, or `LSH-OPCO-KIS`.
- Verified Tower application rows include `entity_id` and `entity_scope`.
- Verified Tower max `users_or_entities_supported` is plausible for the pilot pack: `2846`.
- Verified Tower additive detail IT budget sums to `$190.6M`.
- Verified Tower infrastructure has 80 entity-scoped rows.
- Verified `V7_HOLDCO_HYGIENE_REPORT.json` reports `opcos=4`.

Not run:

- Azure data-build job.
- Azure/Postgres load verification.
- Deployed Home/Tower browser proof.
- Signed-in aVa answer-quality test.

## Rollout Plan

Merge through PR after review. This is a source-pack change and does not become active in the deployed app until the approved data-build job loads the corrected pack into the target Azure layers and the runtime surfaces are pointed at that loaded version.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable to this source-pack-only candidate.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before calling the pilot experience ready.

## Rollback Plan

Revert this PR to restore the prior local source packs. If already loaded into Azure, run the governed data-build rollback or reload the previous approved source pack version; do not manually mutate production web runtime or shared Azure traffic.

## Audit Evidence

- Local hard-invariant validation in the PR branch.
- Updated pilot-readiness report generated to `/Users/anand/Downloads/AbarVa_Pilot_Readiness_Source_Audit_FIXED.html`.

## Known Gaps

- This fixes source-pack structure for the holding-company tenant type. It does not prove Azure load, graph materialization, retrieval indexing, or deployed browser rendering.
- The allocation bucket remains synthetic/pending client confirmation and should be resolved during pilot intake.
- Leadership remains role-level, not named-person client truth.
