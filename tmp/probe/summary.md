# Two-tenant Layer 1-4 refresh preparation

Generated: 2026-08-14T12:56:39.204Z
Tenants: `apex-retail`, `lakeshore-holdings`
Mode: local/offline refresh preparation. Status: `draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use`

Evidence for each tenant is derived only from that tenant's own files. No tenant's facts were used to fill another's gaps.

## Layer roots per tenant

| Tenant | Layer | Artifact group | Path | Files | Truth eligibility | Refresh locally |
| --- | --- | --- | --- | ---: | --- | --- |
| apex-retail | Layer 1 — Client Intake | registry-declared active input package | `datasets/tenant-inputs/active/apex-retail/current` | 23 | active-declared-source-package | no — active root is a hard gate |
| apex-retail | Layer 1 — Client Intake | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/apex-retail/standard-2026-07-v3` | — | duplicate-truth-candidate | no — classify and reconcile first |
| apex-retail | Layer 1 — Client Intake | governed intake draft package | `datasets/tenant-inputs/apex-retail/v2026-08-governed-intake` | — | draft-not-active | yes |
| apex-retail | Layer 1 — Client Intake | interview and questionnaire discovery channel | `datasets/tenant-inputs/apex-retail/interviews` | — | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| apex-retail | Layer 1 — Client Intake | candidate pack | `datasets/tenant-inputs/candidates/apex-retail` | 2 | not-active | no — classify only |
| apex-retail | Layer 2 — Source Adapters | generated adapter output | `datasets/tenant-inputs/generated/apex-retail` | — | disposable-build-output | yes — dry-run only, no active write |
| apex-retail | Layer 3 — Canonical Model | derived canonical context artifacts | `datasets/tenant-inputs/apex-retail/derived` | 1 | derived-output-rebuildable | yes — as draft summaries only |
| apex-retail | Layer 4 — Products | approved narrative/product content | `datasets/tenant-inputs/apex-retail/approved-content` | 1 | product-projection | no — readiness reporting only |
| lakeshore-holdings | Layer 1 — Client Intake | registry-declared active input package | `datasets/tenant-inputs/active/lakeshore-holdings/current` | 23 | active-declared-source-package | no — active root is a hard gate |
| lakeshore-holdings | Layer 1 — Client Intake | adjacent standard pack (parallel copy of the same dimensions) | `datasets/tenant-inputs/lakeshore-holdings/standard-2026-07-v3` | — | duplicate-truth-candidate | no — classify and reconcile first |
| lakeshore-holdings | Layer 1 — Client Intake | governed intake draft package | `datasets/tenant-inputs/lakeshore-holdings/v2026-08-governed-intake` | — | draft-not-active | yes |
| lakeshore-holdings | Layer 1 — Client Intake | interview and questionnaire discovery channel | `datasets/tenant-inputs/lakeshore-holdings/interviews` | — | source-signal-not-deterministic-truth | yes — as draft copies inside the governed package |
| lakeshore-holdings | Layer 1 — Client Intake | candidate pack | `datasets/tenant-inputs/candidates/lakeshore-holdings` | 2 | not-active | no — classify only |
| lakeshore-holdings | Layer 2 — Source Adapters | generated adapter output | `datasets/tenant-inputs/generated/lakeshore-holdings` | — | disposable-build-output | yes — dry-run only, no active write |
| lakeshore-holdings | Layer 3 — Canonical Model | derived canonical context artifacts | `datasets/tenant-inputs/lakeshore-holdings/derived` | 1 | derived-output-rebuildable | yes — as draft summaries only |
| lakeshore-holdings | Layer 4 — Products | approved narrative/product content | `datasets/tenant-inputs/lakeshore-holdings/approved-content` | 1 | product-projection | no — readiness reporting only |

## Claim reconciliation

| Tenant | Conflict state | Claims |
| --- | --- | ---: |
| apex-retail | `DIVERGENT_COPY` | 2 |
| apex-retail | `UNREGISTERED` | 4 |
| lakeshore-holdings | `DIVERGENT_COPY` | 2 |
| lakeshore-holdings | `UNREGISTERED` | 4 |

## Workstream coverage

A workstream counts as covered only when every canonical target resolves, carries rows, and matches the declared column contract.

| Tenant | Covered | Partial | Missing |
| --- | ---: | ---: | ---: |
| apex-retail | 5 | 5 | 0 |
| lakeshore-holdings | 5 | 5 | 0 |

## Layer 2 adapters

Implemented mapping profiles in `src/lib/enterprise-data/source-adapters/mapping-profiles.ts`: **4**, covering source classes `applications_systems`, `enterprise_profile`, `evidence_registry`, against 10 declared workstream adapter families.

| Tenant | Workstreams with no implemented adapter | Profiles that would run on this tenant | Adapters executed |
| --- | ---: | ---: | ---: |
| apex-retail | 6 | 0 | 0 |
| lakeshore-holdings | 6 | 0 | 0 |

Adapter gaps are recorded, not filled. No adapter was invented and none was executed.

## Outputs

- `layer-refresh-matrix.csv` — every layer root per tenant with eligibility and gate.
- `claim-reconciliation-matrix.csv` — derived conflicts, duplicates, coverage gaps, and fact-lineage status.
- `adapter-gap-register.csv` — declared adapter family per workstream vs what is implemented.
- `layer2-adapter-dry-run.csv` — required-field satisfaction per mapping profile per tenant.
- `hard-gate-register.csv` — actions that require explicit approval; none were executed.
- `<tenant>/layer3-canonical-refresh-summary.{md,json}`
- `<tenant>/layer4-projection-refresh-summary.{md,json}`

## What was not done

- The registry was not changed.
- No active tenant input root was written.
- No loader, data-plane write, or retrieval index ran.
- No product or runtime surface was changed.
- No file was retired, moved, or deleted.
