# Layer 4 projection refresh — skyharbor-air

Mode: readiness report only. No runtime surface, database projection, or product cube was refreshed.

## Fact lineage before quoting any figure

Source: `reports/tower-fact-lineage/lineage.json`

**1 metric(s) are `CONFLICT` for this tenant and must not be quoted at all:** `promised_value_usd`.

4 metric(s) are `ONE_SOURCE` and may only be quoted with that caveat stated: `it_budget_usd`, `ai_initiative_funding_usd`, `ai_tool_cost_usd`, `vendor_run_rate_usd`.

## Surface readiness

| Surface | Local artefact | Readiness | Refreshed | Blocked by |
| --- | --- | --- | --- | --- |
| Home context and architecture projections | `datasets/tenant-inputs/skyharbor-air/derived/home-context-view.json` | no-local-artefact | no | Layer 3 fact conflicts unresolved |
| Intelligence / aVa context bundle | `datasets/tenant-inputs/skyharbor-air/derived/canonical-facts.json` | no-local-artefact | no | Layer 3 fact conflicts unresolved |
| Moves context package | `datasets/tenant-inputs/skyharbor-air/derived/moves-context-view.json` | no-local-artefact | no | Layer 3 fact conflicts unresolved |
| Source read model / package | `datasets/tenant-inputs/skyharbor-air/derived/evidence-registry.json` | no-local-artefact | no | Layer 3 fact conflicts unresolved |
| Tower deterministic mart / cube | `datasets/tenant-inputs/skyharbor-air/derived/tower-dashboard-view.json` | no-local-artefact | no | Layer 3 fact conflicts unresolved |

Status: `draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use`
