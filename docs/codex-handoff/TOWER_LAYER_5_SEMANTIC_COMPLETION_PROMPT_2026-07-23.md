# Codex handoff — Tower Layer 5 semantic completion

Date: 2026-07-23

## Codename

`TOWER-LAYER-5-SEMANTIC-COMPLETION-PR`

## Goal

Move the Tower Command Center bridge semantics into governed Tower Layer 5 read models, without
changing the Command Center visual contract and without deploying or promoting the surface by
default.

The current Command Center bridge is intentionally honest: it reads governed mart rows when they
exist, derives only the fields Layer 5 does not yet persist, and exposes diagnostics for the
semantic decisions it had to make. This PR should make those diagnostics and derived semantics
first-class mart outputs.

## Current state

- `/tower` is wired to serve the Command Center only when `tower_command_center_v2` is enabled for
  the tenant.
- `/tower/legacy` serves the previous Tower surface regardless of flag state.
- `/tower/command` redirects to `/tower`, preserving query params.
- `tower_command_center_v2` is tenant-gated and enabled only for Meridian (`includeTenants:
["meridian"]`) until signed-in proof is captured and a broader rollout is separately approved.
- The Command Center mapper is a bridge, not the target model.
- The known mart gap analysis lives at
  `docs/design/tower/command-center-2026-07-23/MART-LAYER-5-GAP-ANALYSIS.md`.

## Hard rules

- Do not make `tower_command_center_v2` platform default-on or widen it beyond Meridian in this PR.
- Do not remove `/tower/legacy`.
- Do not remove the existing legacy Tower read path.
- Do not remove the governed Tower aVa launcher. Command Center aVa must use the existing
  `/api/tower/cio-chat` path, remain advisory/non-autonomous, and stay within the Meridian-only
  feature scope unless a broader rollout is separately approved.
- Do not mutate production data.
- Do not claim live proof without signed-in browser proof on `app.abarva.ai`.
- Do not normalize `finance_validated_value > usage_supported_value` away; that is a real business
  state.
- Do not use Claude, graph rows, facts, nodes, or edge counts to calculate Tower spend, value, ROI,
  risk, claimable value, or lane decisions.

## Required implementation

1. Add or extend governed Layer 5 mart outputs so the Command Center can read, not derive:
   - `usage_supported_value`
   - `claimable_value`
   - `blocked_value`
   - `usage_status`
   - `finance_validation_status`
   - `evidence_status`
   - `proof_score`
   - `recommended_posture`
   - `decision_lane = watch` where applicable
   - proof-sequence status and explanation
2. Add governed AI spend attribution, without proportional allocation:
   - `tower_mart_ai_spend_attribution`
   - `tenant_id`
   - `fiscal_period`
   - `spend_source_id`
   - `ai_item_id` nullable
   - `spend_category`
   - `amount_usd`
   - `attribution_status`
   - `attribution_method`
   - `attribution_confidence`
   - `is_additive`
   - `source_evidence_refs`
   - allowed statuses: `item_attributed`, `category_attributed`, `shared_platform`,
     `portfolio_only`, `unattributed`
3. Add governed AI portfolio display-bucket diagnostics:
   - `original_item_kind`
   - `display_bucket`
   - `display_bucket_basis`
   - `mapping_policy_version`
4. Preserve exact `item_kind` semantics:
   - `funded_program`
   - `embedded_platform`
   - `usage_benefit`
   - `candidate_opportunity`
5. Let `ai_spend_category` drive Governance display bucket when category says governance/control/risk.
6. Build the missing business evidence-gap mart, distinct from `mart_required_field_gaps`:
   - `business_area`
   - `program_id`
   - `gap_stage`
   - `primary_blocking_gap`
   - `missing_evidence`
   - `why_it_matters`
   - `blocked_decision`
   - `owner_role`
   - `priority`
   - `due_window`
   - `promised_value_exposed`
   - `validated_value_held`
   - `claimable_value_blocked`
   - `source_program_id`
   - `source_evidence_refs`
   - `gap_policy_version`
7. Add portfolio count reconciliation:
   - `source_item_count`
   - `canonical_item_count`
   - `mart_item_count`
   - `eligible_item_count`
   - `display_candidate_count`
   - `plotted_item_count`
   - `excluded_item_count`
   - `exclusion_reasons`
8. Add aVa context outputs only as governed claim context:
   - allowed claims
   - blocked claims
   - source evidence refs
   - proof sequence diagnostics
   - no autonomous action claim

## Required audits

- Reconcile mart outputs to source files used by the Tower projection.
- Prove `usage_supported_value` is adoption-evidenced and not floored at finance validation.
- Prove `finance_validated_value > usage_supported_value` remains legal and visibly explained.
- Prove candidate opportunities remain candidates, not funded programs.
- Prove candidate opportunities do not dominate the default portfolio view and that only a governed
  top-N slice is displayed with "N shown of total" copy.
- Prove Governance display bucket can occur on real data even though `item_kind` has no governance enum.
- Prove every evidence-gap row is a business proof gap, not an ETL/data-quality backlog row.
- Prove portfolio-level AI-tagged spend reconciles as attributed initiative spend plus shared
  platform spend plus unallocated spend.
- Prove no row/fact/node/edge counts leak into CXO-facing Tower content.

## Required outputs

- `reports/tower-layer-5-semantic-completion/summary.md`
- `reports/tower-layer-5-semantic-completion/source-reconciliation.csv`
- `reports/tower-layer-5-semantic-completion/value-chain-reconciliation.csv`
- `reports/tower-layer-5-semantic-completion/spend-attribution-reconciliation.csv`
- `reports/tower-layer-5-semantic-completion/ai-display-bucket-reconciliation.csv`
- `reports/tower-layer-5-semantic-completion/portfolio-count-reconciliation.csv`
- `reports/tower-layer-5-semantic-completion/evidence-gap-reconciliation.csv`
- `reports/tower-layer-5-semantic-completion/proof-sequence-anomalies.csv`
- `reports/tower-layer-5-semantic-completion/ava-context-claims.csv`
- `reports/tower-layer-5-semantic-completion/proof.html`

## Validation

- Focused Tower Command Center mapper and derivation tests.
- Focused Tower Command Center component tests.
- Tower source reconciliation audit.
- `npm run audit:enterprise-naming`
- `npm run release:check`
- Targeted TypeScript compile, or document unrelated blockers precisely.
- `git diff --check`

## Acceptance

Return one final status:

- `TOWER_LAYER_5_SEMANTIC_COMPLETION_READY_FOR_LIVE_PROOF`
- `TOWER_LAYER_5_SEMANTIC_COMPLETION_PARTIAL`
- `TOWER_LAYER_5_SEMANTIC_COMPLETION_BLOCKED`

Definition of done: the Command Center no longer depends on bridge-only derivations for the
specified Layer 5 semantics, the mart outputs reconcile to source files, the aVa claim context is
governed and non-autonomous, the route remains tenant-gated/Meridian-only, and no live/default-on
claim is made without signed-in proof.
