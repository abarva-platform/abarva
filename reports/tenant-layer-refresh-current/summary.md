# Layer 1-4 refresh preparation

Generated: 2026-08-16T11:26:47.401Z
Tenants: `meridian-health`, `skyharbor-air`
Mode: local/offline refresh preparation. Status: `draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use`

Evidence for each tenant is derived only from that tenant's own files. No tenant's facts were used to fill another's gaps.

## Layer roots per tenant

| Tenant          | Layer                     | Artifact group                                                | Path                                                              | Files | Truth eligibility                     | Refresh locally                                   |
| --------------- | ------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | ----: | ------------------------------------- | ------------------------------------------------- |
| meridian-health | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/meridian-health/current`           |    24 | active-declared-source-package        | no — active root is a hard gate                   |
| meridian-health | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/meridian-health/standard-2026-07-v3`      |    25 | duplicate-truth-candidate             | no — classify and reconcile first                 |
| meridian-health | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake` |    27 | draft-not-active                      | yes                                               |
| meridian-health | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/meridian-health/interviews`               |     1 | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| meridian-health | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/meridian-health`               |     — | not-active                            | no — classify only                                |
| meridian-health | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/meridian-health`                |    53 | disposable-build-output               | yes — dry-run only, no active write               |
| meridian-health | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/meridian-health/derived`                  |    11 | derived-output-rebuildable            | yes — as draft summaries only                     |
| meridian-health | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/meridian-health/approved-content`         |     5 | product-projection                    | no — readiness reporting only                     |
| skyharbor-air   | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/skyharbor-air/current`             |    31 | active-declared-source-package        | no — active root is a hard gate                   |
| skyharbor-air   | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3`        |     — | duplicate-truth-candidate             | no — classify and reconcile first                 |
| skyharbor-air   | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/skyharbor-air/v2026-08-governed-intake`   |     6 | draft-not-active                      | yes                                               |
| skyharbor-air   | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/skyharbor-air/interviews`                 |     5 | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| skyharbor-air   | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/skyharbor-air`                 |     1 | not-active                            | no — classify only                                |
| skyharbor-air   | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/skyharbor-air`                  |     — | disposable-build-output               | yes — dry-run only, no active write               |
| skyharbor-air   | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/skyharbor-air/derived`                    |     1 | derived-output-rebuildable            | yes — as draft summaries only                     |
| skyharbor-air   | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/skyharbor-air/approved-content`           |     2 | product-projection                    | no — readiness reporting only                     |

## Claim reconciliation

| Tenant          | Conflict state   | Claims |
| --------------- | ---------------- | -----: |
| meridian-health | `DIVERGENT_COPY` |     24 |
| meridian-health | `UNREGISTERED`   |      5 |
| skyharbor-air   | `DIVERGENT_COPY` |      1 |
| skyharbor-air   | `UNREGISTERED`   |     12 |

## Workstream coverage

A workstream counts as covered only when every canonical target resolves, carries rows, and matches the declared column contract.

| Tenant          | Covered | Partial | Missing |
| --------------- | ------: | ------: | ------: |
| meridian-health |      10 |       0 |       0 |
| skyharbor-air   |      10 |       0 |       0 |

## Layer 2 adapters

Implemented mapping profiles in `src/lib/enterprise-data/source-adapters/mapping-profiles.ts`: **23**, covering source classes `applications_systems`, `enterprise_profile`, `organization_functions`, `vendors_contracts`, `spend_value`, `service_scope_managed_services`, `metrics_outcomes`, `data_assets_integrations`, `infrastructure_platforms`, `programs_priorities`, `ai_automation_use_cases`, `risks_controls`, `relationships`, `operational_process_evidence`, `evidence_registry`, `industry_context_patterns`, `expert_lenses`, against 10 declared workstream adapter families.

| Tenant          | Workstreams with no implemented adapter | Profiles that would run on this tenant | Adapters executed |
| --------------- | --------------------------------------: | -------------------------------------: | ----------------: |
| meridian-health |                                       0 |                                     19 |                 0 |
| skyharbor-air   |                                       0 |                                     19 |                 0 |

Machine-readable Layer 2 dry-run failures: **0** total (0 family, 0 profile, 0 dimension).
Layer 2 failure classifications: **0** unique profile failures (0 classified).
Code-only alias impact, if activated in a future change: **0** profile failures would clear; **0** remain hard-gated.
Semantic decision ledger: **0** profiles require explicit semantic alias approval; **0** are activation-ready from this report.

Adapter gaps are recorded, not filled. No adapter was invented and none was executed.

## Outputs

- `layer-refresh-matrix.csv` — every layer root per tenant with eligibility and gate.
- `claim-reconciliation-matrix.csv` — derived conflicts, duplicates, coverage gaps, and fact-lineage status.
- `adapter-gap-register.csv` — declared adapter family per workstream vs what is implemented.
- `layer2-adapter-dry-run.csv` — required-field satisfaction per mapping profile per tenant.
- `layer2-adapter-reconciliation.csv` — canonical dimension to adapter-family reconciliation for all tenants.
- `layer2-adapter-family-coverage-registry.json` — declared families and implemented mapping profiles.
- `layer2-adapter-dry-run-failures.json` — machine-readable dry-run failures.
- `layer2-dry-run-failure-classification.json` — machine-readable action classification for dry-run failures.
- `layer2-code-only-alias-impact.json` — report-only estimate of mechanically safe alias candidates.
- `layer2-semantic-decision-ledger.json` — report-only ledger of semantic alias approvals still required.
- `<tenant>/layer2-adapter-reconciliation.csv`
- `hard-gate-register.csv` — actions that require explicit approval; none were executed.
- `<tenant>/layer3-canonical-refresh-summary.{md,json}`
- `<tenant>/layer4-projection-refresh-summary.{md,json}`

## What was not done

- The registry was not changed.
- No active tenant input root was written.
- No loader, data-plane write, or retrieval index ran.
- No product or runtime surface was changed.
- No file was retired, moved, or deleted.
