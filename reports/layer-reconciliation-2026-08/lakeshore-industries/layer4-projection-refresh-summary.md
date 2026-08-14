# Layer 4 projection refresh — lakeshore-industries

Mode: readiness report only. No runtime surface, database projection, or product cube was refreshed.

## Fact lineage before quoting any figure

Source: `reports/tower-fact-lineage/lineage.json`

No `CONFLICT` metrics for this tenant.

No `ONE_SOURCE` metrics for this tenant.

## Surface readiness

| Surface | Local artefact | Readiness | Refreshed | Blocked by |
| --- | --- | --- | --- | --- |
| Home context and architecture projections | `datasets/tenant-inputs/lakeshore-industries/derived/home-context-view.json` | no-local-artefact | no | Layer 1 SME validation not complete |
| Intelligence / aVa context bundle | `datasets/tenant-inputs/lakeshore-industries/derived/canonical-facts.json` | no-local-artefact | no | Layer 1 SME validation not complete |
| Moves context package | `datasets/tenant-inputs/lakeshore-industries/derived/moves-context-view.json` | no-local-artefact | no | Layer 1 SME validation not complete |
| Source read model / package | `datasets/tenant-inputs/lakeshore-industries/derived/evidence-registry.json` | no-local-artefact | no | Layer 1 SME validation not complete |
| Tower deterministic mart / cube | `datasets/tenant-inputs/lakeshore-industries/derived/tower-dashboard-view.json` | no-local-artefact | no | Layer 1 SME validation not complete |

Status: `draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use`
