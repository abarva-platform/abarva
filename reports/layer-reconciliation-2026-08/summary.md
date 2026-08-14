# Layer 1-4 refresh preparation

Generated: 2026-08-14T14:26:03.682Z
Tenants: `apex-retail`, `first-capital-financial`, `healthcare-demo-new`, `lakeshore-holdings`, `lakeshore-industries`, `meridian-health`, `skyharbor-air`
Mode: local/offline refresh preparation. Status: `draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use`

Evidence for each tenant is derived only from that tenant's own files. No tenant's facts were used to fill another's gaps.

## Layer roots per tenant

| Tenant                  | Layer                     | Artifact group                                                | Path                                                                      | Files | Truth eligibility                     | Refresh locally                                   |
| ----------------------- | ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- | ----: | ------------------------------------- | ------------------------------------------------- |
| apex-retail             | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/apex-retail/current`                       |    23 | active-declared-source-package        | no — active root is a hard gate                   |
| apex-retail             | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/apex-retail/standard-2026-07-v3`                  |     — | duplicate-truth-candidate             | no — classify and reconcile first                 |
| apex-retail             | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/apex-retail/v2026-08-governed-intake`             |     — | draft-not-active                      | yes                                               |
| apex-retail             | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/apex-retail/interviews`                           |     — | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| apex-retail             | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/apex-retail`                           |     2 | not-active                            | no — classify only                                |
| apex-retail             | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/apex-retail`                            |     — | disposable-build-output               | yes — dry-run only, no active write               |
| apex-retail             | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/apex-retail/derived`                              |     1 | derived-output-rebuildable            | yes — as draft summaries only                     |
| apex-retail             | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/apex-retail/approved-content`                     |     1 | product-projection                    | no — readiness reporting only                     |
| first-capital-financial | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/first-capital-financial/current`           |    23 | active-declared-source-package        | no — active root is a hard gate                   |
| first-capital-financial | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/first-capital-financial/standard-2026-07-v3`      |     — | duplicate-truth-candidate             | no — classify and reconcile first                 |
| first-capital-financial | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/first-capital-financial/v2026-08-governed-intake` |     — | draft-not-active                      | yes                                               |
| first-capital-financial | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/first-capital-financial/interviews`               |     5 | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| first-capital-financial | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/first-capital-financial`               |    22 | not-active                            | no — classify only                                |
| first-capital-financial | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/first-capital-financial`                |    21 | disposable-build-output               | yes — dry-run only, no active write               |
| first-capital-financial | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/first-capital-financial/derived`                  |     — | derived-output-rebuildable            | yes — as draft summaries only                     |
| first-capital-financial | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/first-capital-financial/approved-content`         |     — | product-projection                    | no — readiness reporting only                     |
| healthcare-demo-new     | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/healthcare-demo-new/current`               |    24 | active-declared-source-package        | no — active root is a hard gate                   |
| healthcare-demo-new     | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/healthcare-demo-new/standard-2026-07-v3`          |     — | duplicate-truth-candidate             | no — classify and reconcile first                 |
| healthcare-demo-new     | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/healthcare-demo-new/v2026-08-governed-intake`     |     — | draft-not-active                      | yes                                               |
| healthcare-demo-new     | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/healthcare-demo-new/interviews`                   |     1 | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| healthcare-demo-new     | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/healthcare-demo-new`                   |     — | not-active                            | no — classify only                                |
| healthcare-demo-new     | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/healthcare-demo-new`                    |     — | disposable-build-output               | yes — dry-run only, no active write               |
| healthcare-demo-new     | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/healthcare-demo-new/derived`                      |     — | derived-output-rebuildable            | yes — as draft summaries only                     |
| healthcare-demo-new     | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/healthcare-demo-new/approved-content`             |     — | product-projection                    | no — readiness reporting only                     |
| lakeshore-holdings      | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/lakeshore-holdings/current`                |    23 | active-declared-source-package        | no — active root is a hard gate                   |
| lakeshore-holdings      | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/lakeshore-holdings/standard-2026-07-v3`           |     — | duplicate-truth-candidate             | no — classify and reconcile first                 |
| lakeshore-holdings      | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/lakeshore-holdings/v2026-08-governed-intake`      |     — | draft-not-active                      | yes                                               |
| lakeshore-holdings      | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/lakeshore-holdings/interviews`                    |     — | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| lakeshore-holdings      | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/lakeshore-holdings`                    |     2 | not-active                            | no — classify only                                |
| lakeshore-holdings      | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/lakeshore-holdings`                     |     — | disposable-build-output               | yes — dry-run only, no active write               |
| lakeshore-holdings      | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/lakeshore-holdings/derived`                       |     1 | derived-output-rebuildable            | yes — as draft summaries only                     |
| lakeshore-holdings      | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/lakeshore-holdings/approved-content`              |     1 | product-projection                    | no — readiness reporting only                     |
| lakeshore-industries    | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/lakeshore-industries/current`              |    23 | active-declared-source-package        | no — active root is a hard gate                   |
| lakeshore-industries    | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/lakeshore-industries/standard-2026-07-v3`         |     — | duplicate-truth-candidate             | no — classify and reconcile first                 |
| lakeshore-industries    | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/lakeshore-industries/v2026-08-governed-intake`    |     — | draft-not-active                      | yes                                               |
| lakeshore-industries    | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/lakeshore-industries/interviews`                  |     — | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| lakeshore-industries    | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/lakeshore-industries`                  |     — | not-active                            | no — classify only                                |
| lakeshore-industries    | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/lakeshore-industries`                   |     — | disposable-build-output               | yes — dry-run only, no active write               |
| lakeshore-industries    | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/lakeshore-industries/derived`                     |     — | derived-output-rebuildable            | yes — as draft summaries only                     |
| lakeshore-industries    | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/lakeshore-industries/approved-content`            |     — | product-projection                    | no — readiness reporting only                     |
| meridian-health         | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/meridian-health/current`                   |    25 | active-declared-source-package        | no — active root is a hard gate                   |
| meridian-health         | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/meridian-health/standard-2026-07-v3`              |    25 | duplicate-truth-candidate             | no — classify and reconcile first                 |
| meridian-health         | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake`         |    27 | draft-not-active                      | yes                                               |
| meridian-health         | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/meridian-health/interviews`                       |     1 | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| meridian-health         | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/meridian-health`                       |     — | not-active                            | no — classify only                                |
| meridian-health         | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/meridian-health`                        |    53 | disposable-build-output               | yes — dry-run only, no active write               |
| meridian-health         | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/meridian-health/derived`                          |    11 | derived-output-rebuildable            | yes — as draft summaries only                     |
| meridian-health         | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/meridian-health/approved-content`                 |     5 | product-projection                    | no — readiness reporting only                     |
| skyharbor-air           | Layer 1 — Client Intake   | registry-declared active input package                        | `datasets/tenant-inputs/active/skyharbor-air/current`                     |    31 | active-declared-source-package        | no — active root is a hard gate                   |
| skyharbor-air           | Layer 1 — Client Intake   | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3`                |     — | duplicate-truth-candidate             | no — classify and reconcile first                 |
| skyharbor-air           | Layer 1 — Client Intake   | governed intake draft package                                 | `datasets/tenant-inputs/skyharbor-air/v2026-08-governed-intake`           |     6 | draft-not-active                      | yes                                               |
| skyharbor-air           | Layer 1 — Client Intake   | interview and questionnaire discovery channel                 | `datasets/tenant-inputs/skyharbor-air/interviews`                         |     5 | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| skyharbor-air           | Layer 1 — Client Intake   | candidate pack                                                | `datasets/tenant-inputs/candidates/skyharbor-air`                         |     1 | not-active                            | no — classify only                                |
| skyharbor-air           | Layer 2 — Source Adapters | generated adapter output                                      | `datasets/tenant-inputs/generated/skyharbor-air`                          |     — | disposable-build-output               | yes — dry-run only, no active write               |
| skyharbor-air           | Layer 3 — Canonical Model | derived canonical context artifacts                           | `datasets/tenant-inputs/skyharbor-air/derived`                            |     1 | derived-output-rebuildable            | yes — as draft summaries only                     |
| skyharbor-air           | Layer 4 — Products        | approved narrative/product content                            | `datasets/tenant-inputs/skyharbor-air/approved-content`                   |     2 | product-projection                    | no — readiness reporting only                     |

## Claim reconciliation

| Tenant                  | Conflict state   | Claims |
| ----------------------- | ---------------- | -----: |
| apex-retail             | `DIVERGENT_COPY` |      2 |
| apex-retail             | `UNREGISTERED`   |      4 |
| first-capital-financial | `DIVERGENT_COPY` |     19 |
| first-capital-financial | `IDENTICAL_COPY` |      1 |
| first-capital-financial | `UNREGISTERED`   |      4 |
| healthcare-demo-new     | `UNREGISTERED`   |      5 |
| lakeshore-holdings      | `DIVERGENT_COPY` |      2 |
| lakeshore-holdings      | `UNREGISTERED`   |      4 |
| lakeshore-industries    | `UNREGISTERED`   |      4 |
| meridian-health         | `DIVERGENT_COPY` |     18 |
| meridian-health         | `IDENTICAL_COPY` |      7 |
| meridian-health         | `NAME_DRIFT`     |      2 |
| meridian-health         | `SCHEMA_GAP`     |     18 |
| meridian-health         | `UNREGISTERED`   |      6 |
| skyharbor-air           | `DIVERGENT_COPY` |      1 |
| skyharbor-air           | `UNREGISTERED`   |     12 |

## Workstream coverage

A workstream counts as covered only when every canonical target resolves, carries rows, and matches the declared column contract.

| Tenant                  | Covered | Partial | Missing |
| ----------------------- | ------: | ------: | ------: |
| apex-retail             |       5 |       5 |       0 |
| first-capital-financial |       5 |       5 |       0 |
| healthcare-demo-new     |      10 |       0 |       0 |
| lakeshore-holdings      |       5 |       5 |       0 |
| lakeshore-industries    |      10 |       0 |       0 |
| meridian-health         |       0 |      10 |       0 |
| skyharbor-air           |      10 |       0 |       0 |

## Layer 2 adapters

Implemented mapping profiles in `src/lib/enterprise-data/source-adapters/mapping-profiles.ts`: **22**, covering source classes `applications_systems`, `enterprise_profile`, `organization_functions`, `vendors_contracts`, `spend_value`, `service_scope_managed_services`, `metrics_outcomes`, `data_assets_integrations`, `infrastructure_platforms`, `programs_priorities`, `ai_automation_use_cases`, `risks_controls`, `operational_process_evidence`, `evidence_registry`, `industry_context_patterns`, `expert_lenses`, against 10 declared workstream adapter families.

| Tenant                  | Workstreams with no implemented adapter | Profiles that would run on this tenant | Adapters executed |
| ----------------------- | --------------------------------------: | -------------------------------------: | ----------------: |
| apex-retail             |                                       0 |                                     18 |                 0 |
| first-capital-financial |                                       0 |                                     18 |                 0 |
| healthcare-demo-new     |                                       0 |                                     18 |                 0 |
| lakeshore-holdings      |                                       0 |                                     18 |                 0 |
| lakeshore-industries    |                                       0 |                                     18 |                 0 |
| meridian-health         |                                       0 |                                      0 |                 0 |
| skyharbor-air           |                                       0 |                                     18 |                 0 |

Machine-readable Layer 2 dry-run failures: **43** total (0 family, 18 profile, 25 dimension).

Adapter gaps are recorded, not filled. No adapter was invented and none was executed.

## Outputs

- `layer-refresh-matrix.csv` — every layer root per tenant with eligibility and gate.
- `claim-reconciliation-matrix.csv` — derived conflicts, duplicates, coverage gaps, and fact-lineage status.
- `adapter-gap-register.csv` — declared adapter family per workstream vs what is implemented.
- `layer2-adapter-dry-run.csv` — required-field satisfaction per mapping profile per tenant.
- `layer2-adapter-reconciliation.csv` — canonical dimension to adapter-family reconciliation for all tenants.
- `layer2-adapter-family-coverage-registry.json` — declared families and implemented mapping profiles.
- `layer2-adapter-dry-run-failures.json` — machine-readable dry-run failures.
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
