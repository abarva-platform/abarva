# V7 Schema, Volumetrics, And Product Insights

Generated: 2026-07-03

## Executive Summary

V7 is loaded in Azure Postgres under `intelligence_v7` for the five demo tenants. The load now has enough depth to support Home context exploration with actual rows, client-friendly metadata, graph relationships, and retrieval chunk registration.

Home should read V7 first on the deployed app. V6 remains a fallback until the deployed browser gate proves V7 across all tenants and downstream modules are cut over.

## Contract

- Contract version: `v7.0.0-synthetic-depth-v2-20260703`
- Schema: `intelligence_v7`
- Loader image: `acrabarvalab001.azurecr.io/abarva/v7-loader:v7-loader-20260703-175031`
- Loader digest: `sha256:4072e97ca503031468b439f5351f205aa1600c6121855e5c6ab436295833fb3d`
- Successful ACA job execution: `job-v7-intel-load-0703-va07x09`

## Physical Layers

| Layer | Purpose |
| --- | --- |
| `contract_versions` | Names the active V7 contract and generated dataset lineage. |
| `dimension_registry` | The 24 canonical V7 dimensions, source file names, labels, and field counts. |
| `column_registry` | Client-friendly column labels, collection instructions, module usage, and observed source-column metadata. |
| `tenant_pack_runs` | One load run per tenant and contract, including file, record, field, graph, and chunk totals. |
| `source_files` | Source file lineage, checksum, file family, and load status. |
| `business_records` | Canonical tenant-scoped V7 records by dimension, with `values_json` as the row-level fact payload. |
| `record_fields` | Column-level field facts with source-row lineage and evidence posture. |
| `graph_nodes` | Tenant-scoped materialized graph nodes for entities, systems, functions, vendors, programs, data, evidence, and tower concepts. |
| `relationship_edges` | Tenant-scoped relationship edges, normalized relationship types, confidence, source basis, and graph endpoints. |
| `chunk_registry` | Retrieval-eligible chunks with source artifact references and semantic tags. |
| `load_reconciliation` | Reconciliation facts used by the load validation report. |

## Read Views

| View | Use |
| --- | --- |
| `current_tenant_pack_runs` | Latest tenant pack per V7 contract. |
| `current_business_records` | Current tenant business records suitable for product adapters. |
| `graph_edge_health` | Edge counts, node endpoint coverage, and weak-edge reporting. |

## Azure Volumetrics

| Metric | Count |
| --- | ---: |
| Source files | 120 |
| Business records | 21,385 |
| Record fields | 628,080 |
| Graph nodes | 12,721 |
| Relationship edges | 5,700 |
| Retrieval chunks | 3,900 |

## Tenant Volumetrics

| Tenant | Files | Dimensions | Records | Fields | Graph Nodes | Edges | Chunks | Weak Edges < 60 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| SkyHarbor Air Group | 24 | 24 | 5,473 | 160,560 | 3,492 | 1,500 | 1,000 | 0 |
| Apex Retail Group | 24 | 24 | 5,473 | 160,560 | 3,120 | 1,500 | 1,000 | 0 |
| First Capital Financial | 24 | 24 | 3,828 | 112,444 | 2,285 | 1,000 | 700 | 0 |
| Meridian Health | 24 | 24 | 3,828 | 112,444 | 2,285 | 1,000 | 700 | 0 |
| Lakeshore Holdings | 24 | 24 | 2,783 | 82,072 | 1,539 | 700 | 500 | 0 |

## Product Wiring In This Release

Home now tries V7 first for:

- The right-canvas Context Explorer dimension list and loaded-row preview.
- The Home KNOW `/api/home/know/ask` deterministic answer path.
- Client-friendly source previews with evidence gaps shown as gaps, not as a generic confidence score.

Home falls back to V6 only when V7 cannot be reached or has no loaded pack for that tenant.

## Product Insights

1. V7 fixes the prior "rollup only" problem. The canvas can show actual loaded records for each dimension, not only counts such as loaded records, files, or confidence.
2. The 82 percent-style confidence display should not be the primary trust signal. V7 gives stronger signals: row count, source file count, explicit evidence gaps, source validation status, graph health, and retrieval chunk eligibility.
3. Lakeshore should be treated as a holding-company structure. Enterprise revenue should roll up from portfolio companies, while holding-company corporate IT can own shared services and corporate budgets.
4. Systems and infrastructure now need to be read as landscapes, not isolated apps. V7 separates applications, infrastructure/cloud, data/analytics, integrations, and bridge rows so Home/Moves can assemble current-state options.
5. Graph exists as a governed Postgres layer. It is ready for relationship browsing and health checks, but graph visual decisions should consume clean V7 slices rather than define the source of truth.
6. Chunk registry exists, but embedding/search backfill still requires separate proof before retrieval claims become production-grade.

## Validation State

| State | Status | Evidence |
| --- | --- | --- |
| Local V7 payload generated | Pass | `v7-azure-load-payload.json` |
| Azure V7 load committed | Pass | ACA job `job-v7-intel-load-0703-va07x09` |
| Load readback reconciled | Pass | `v7-azure-validation-summary.json` |
| Home V7 code checks | Pass | TypeScript, ESLint, focused Jest in release worktree |
| Deployed ACA image updated | Pending | To be filled after deploy |
| Signed-in Home browser proof | Pending | To be filled after deploy |
| Home aVa V7 response proof | Pending | To be filled after deploy |
| Azure AI Search / embedding backfill | Not run | Separate retrieval lane required |

## Artifact Locations

- Azure load report: `/Users/anand/Downloads/abarva-v7-azure-load-20260703/v7-azure-validation-summary.html`
- Azure load summary JSON: `/Users/anand/Downloads/abarva-v7-azure-load-20260703/v7-azure-validation-summary.json`
- Product release record: `docs/releases/records/2026-07-03-home-v7-azure-cutover.md`
