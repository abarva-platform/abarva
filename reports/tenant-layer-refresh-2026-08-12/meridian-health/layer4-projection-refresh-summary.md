# Layer 4 projection refresh — meridian-health

Mode: readiness report only. No runtime surface, database projection, or product cube was refreshed.

## Fact lineage before quoting any figure

Source: `reports/tower-fact-lineage/lineage.json`

**3 metric(s) are `CONFLICT` for this tenant and must not be quoted at all:** `ai_initiative_funding_usd`, `promised_value_usd`, `vendor_run_rate_usd`.

2 metric(s) are `ONE_SOURCE` and may only be quoted with that caveat stated: `ai_tagged_budget_usd`, `ai_tool_cost_usd`.

## Surface readiness

| Surface | Local artefact | Readiness | Refreshed | Blocked by |
| --- | --- | --- | --- | --- |
| Home context and architecture projections | `datasets/tenant-inputs/meridian-health/derived/home-context-view.json` | no-local-artefact | no | Layer 3 fact conflicts unresolved |
| Intelligence / aVa context bundle | `datasets/tenant-inputs/meridian-health/derived/canonical-facts.json` | local-artefact-present-not-refreshed | no | Layer 3 fact conflicts unresolved |
| Moves context package | `datasets/tenant-inputs/meridian-health/derived/moves-context-view.json` | no-local-artefact | no | Layer 3 fact conflicts unresolved |
| Source read model / package | `datasets/tenant-inputs/meridian-health/derived/evidence-registry.json` | local-artefact-present-not-refreshed | no | Layer 3 fact conflicts unresolved |
| Tower deterministic mart / cube | `datasets/tenant-inputs/meridian-health/derived/tower-dashboard-view.json` | no-local-artefact | no | Layer 3 fact conflicts unresolved |

Status: `draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use`
