# Enterprise Data Flow Map

Generated: 2026-08-21
Scope: read-only audit of product route roots and read-model surfaces across Home, Tower, Moves, Source, Intelligence, Setup/Admin.

## Ground Rules

- This map is an evidence artifact, not a repair. No migrations, data-plane writes, loader runs, source refactors, or test edits were performed.
- The governing data model is `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md:15-36`: Layer 3 canonical enterprise model owns truth, and Layer 4 products are projections only.
- Tenant identity is registry-first. `datasets/tenant-inputs/tenant-input-registry.json:30-130` is treated as the authoritative active/retired tenant registry for this sweep.
- Every claim below is backed by `file:line` evidence or explicitly marked `unverified`.

## Tenant-Key Reality

The checkout currently contains multiple tenant-key contracts.

| Source | Evidence | Keys / behavior | Finding |
| --- | --- | --- | --- |
| Tenant input registry | `datasets/tenant-inputs/tenant-input-registry.json:30-130` | Active: `apex-retail`, `first-capital-financial`, `lakeshore-holdings`, `lakeshore-industries`, `meridian-health`, `skyharbor-air`; retired: `northstar-clinical` | Authoritative list for this audit. |
| Enterprise context schema | `src/lib/enterprise-context/schema.ts:1-17` | `apexretail`, `meridian`, `arcturus`; aliases include registry-shaped values for some tenants | Competing app-style list; `arcturus` is not a registry tenant key. |
| Shared tenant aliases | `src/lib/tenant/aliases.ts:20-107`, `src/lib/tenant/aliases.ts:152-154` | `CANONICAL_TENANT_KEYS` is derived from alias profiles; `arcturus` maps to canonical `first-capital` | Canonical value differs from registry key `first-capital-financial`. |
| Enterprise profile read model | `src/lib/enterprise-data/enterprise-profile/enterprise-profile-read-model.ts:31-45` | `firstcapital`, `arcturus`, `first-capital`, `first-capital-financial` all map to `first-capital` | Product-facing alias contract conflicts with registry for First Capital. |
| Admin tenant resolver | `src/lib/admin/admin-tenant.ts:30-37` | `arcturus` maps to `first-capital`; `meridian` remains `meridian` | Admin setup uses another app-to-data mapping surface. |
| Agent shared mapper | `src/lib/agent/tools/intelligence/_shared.ts:49-79` | Comments explicitly map app keys to broker and inventory substrate keys | Confirms app-style keys are intentionally translated at runtime, but not reconciled to one registry contract. |

## Product Route Chains

### Home

- Route root: `src/app/(maestro)/home/page.tsx:1-17`
- Chain observed: Home imports and calls `readSkyHarborAiSuccessHome()` from `@/lib/home/readSkyHarborAiSuccessHome`.
- Source-of-truth status: no tracked reader implementation was found by `rg` for `readSkyHarborAiSuccessHome` beyond the route import/call.
- Related runtime reader: `src/lib/home/local-cxo-runtime.ts:86-117` defines local CXO contexts for First Capital and Meridian, including `datasets/tenant-inputs/meridian-health/approved-content/home`. `src/lib/home/local-cxo-runtime.ts:460-489` builds dynamic candidate roots from active and non-active tenant paths. `src/lib/home/local-cxo-runtime.ts:560-635` reads approved Home JSON from canonical and legacy directories.
- Finding: Home has at least one route root whose tracked source does not resolve to a live canonical read in this sweep, plus a separate local runtime that reads file-system projections directly.

### Tower

- Route root: `src/app/(maestro)/tower/page.tsx:54-72`
- Chain observed: active client/requested client candidates -> `loadTowerMartCommandView`.
- Live reader: `src/lib/cio-tower/tower-mart-view-model.ts:260-284` canonicalizes tenant candidates and reads `cio_tower.mart_command_center`. `src/lib/cio-tower/tower-mart-view-model.ts:287-352` reads `cio_tower.mart_value_funnel`, `cio_tower.mart_program_decision_lanes`, `cio_tower.mart_ai_portfolio`, `cio_tower.mart_cxo_actions`, `cio_tower.mart_evidence_lineage`, and `cio_tower.mart_required_field_gaps`.
- Source-of-truth status: product reads Tower marts. The upstream canonical lineage of the mart values was not re-proven in this read-only route sweep.

### Moves / Strategic Moves

- Route root: `src/app/(maestro)/strategic-moves/page.tsx:18-33`
- Chain observed: product module gate -> tenancy -> `getStrategicMovePortfolio(ctx, { limit: 100, includeArchived: true })`.
- Live reader: `src/lib/programs/queries.ts:166-197` calls the Programs read adapter. `src/lib/data-plane/read-adapters/programsReadAdapter.ts:120-241` reads the `engagements` table through Supabase-compatible or Azure adapters, scoped by `client_id`.
- Source-of-truth status: live reader found; Programs/Moves still reads from the existing `engagements` read layer, not from a product-owned dataset.

### Source

- Route roots: `src/app/(maestro)/source/page.tsx:1-14`, `src/app/(maestro)/source/portfolio/page.tsx:17-60`, `src/app/(maestro)/source/vendor-portfolio/page.tsx:11-49`
- Chain observed: `/source` redirects to `/source/portfolio`; portfolio gates tenancy and calls `listSourcingEvents`; vendor portfolio gates tenancy and calls `listContractVendor360`.
- Live reader: `src/lib/source/data-model/read-adapter.ts:1-14` declares Azure Postgres only, schema-qualified SQL, and no Supabase/public fallback. `src/lib/source/data-model/read-adapter.ts:37-257` reads Source, Tower, and doc schema tables including `source.contract_vendor_360`, `source.contract_360`, `source.vendor_contract_portfolio`, `source.contract_application_scope`, `source.contract_financial_exposure`, `source.contract_operational_performance`, `source.contract_initiative_dependency`, `source.application_vendor_exposure`, `tower.metric_observation`, `tower.value_claim`, `tower.metric_provenance`, `doc.extraction`, and Source PDF evidence tables.
- Negative result: the portfolio event list was only traced to `listSourcingEvents` in this sweep; its implementation chain is recorded in `orphans.json` as not fully traced.

### Intelligence

- Route root: `src/app/(maestro)/intelligence/page.tsx:28-66`
- Chain observed: local app-key alias helper -> `getEnterpriseLandscapeViewModel`.
- Runtime behavior: `src/lib/home/enterprise-landscape-view-model.ts:91-240` builds a mostly static/authored enterprise landscape, including a hardcoded snapshot value of `Applications: 900`.
- Separate read models exist: `src/lib/enterprise-context/intelligence-read-model.ts:120-205` maps enterprise-context tables and builds tenant overviews; `src/lib/intelligence/context-read-model.ts:245-323` reads context inventory, records, chunks, facts, and evidence tables.
- Finding: the Intelligence route root observed in this sweep does not directly use the enterprise-context read models. It renders the enterprise landscape view model.

### Setup / Admin

- Admin route root: `src/app/(maestro)/admin/page.tsx:23-46`
- Setup files route root: `src/app/(maestro)/setup/files/page.tsx:11-17`
- Chain observed: active/admin tenant resolution -> inventory substrate mapping -> source file and workspace/vault projections.
- Readers: `src/lib/workspace-explorer/tenant-vault-adapter.ts:49-69` assembles Source artifacts, Move artifacts, and generated artifacts. `src/lib/context-ingestion/tenant-context-read-model.ts:207-418` reads clients, context chunks, egress audit rows, source files, and evidence map rows.
- Source-of-truth status: mixed. Some panels read DB-backed setup/context tables; others enumerate artifact directories and generated outputs.

## Read-Model Inventory

The current checkout does not match the prompt's "20 read-model files" count. A narrow source/script sweep found 14 non-test read-model files; a broad repository sweep found 24 read-model path hits including tests and generated/auxiliary files. This mismatch is preserved as a conflict instead of being smoothed over.

| File | Evidence | Source status |
| --- | --- | --- |
| `src/lib/context-ingestion/tenant-context-read-model.ts` | `src/lib/context-ingestion/tenant-context-read-model.ts:207-418` | Live DB reads for clients, context chunks, egress audit, source files, evidence map. |
| `src/lib/enterprise-context/intelligence-read-model.ts` | `src/lib/enterprise-context/intelligence-read-model.ts:120-205`, `src/lib/enterprise-context/intelligence-read-model.ts:745-793` | Dynamic enterprise-context table reads by tenant key. |
| `src/lib/intelligence/context-read-model.ts` | `src/lib/intelligence/context-read-model.ts:245-323` | Live context table/view reads. |
| `src/lib/context-ingestion/phs-stage-readiness-read-model.ts` | `src/lib/context-ingestion/phs-stage-readiness-read-model.ts:48-79` | Live reads of `enterprise_context_chunks` and `evidence_ledger` by `client_id`. |
| `src/lib/tower/tower-materialized-read-model.ts` | `src/lib/tower/tower-materialized-read-model.ts:190-250` | Live reads of `tower_read_model_initiatives` and `tower_read_model_vendors`. |
| `src/lib/source/contract-evidence/read-model.ts` | `src/lib/source/contract-evidence/read-model.ts:116-155` | Live reads of Source contract evidence manifests, rows, and metrics. |
| `src/lib/admin/customer-admin-read-model.ts` | `src/lib/admin/customer-admin-read-model.ts:617-765` | Mixed admin read model: audit table, substrate snapshot, and setup control model. |
| `src/lib/admin/connector-health-read-model.ts` | `src/lib/admin/connector-health-read-model.ts:1-6`, `src/lib/admin/connector-health-read-model.ts:73-95` | Deterministic seed, not live connector data. |
| `src/lib/admin/data-lineage-read-model.ts` | `src/lib/admin/data-lineage-read-model.ts:71-125`, `src/lib/admin/data-lineage-read-model.ts:184-192` | Deterministic Apex stub graph. |
| `src/lib/sentinel/pattern-graph-read-model.ts` | `src/lib/sentinel/pattern-graph-read-model.ts:134-137`, `src/lib/sentinel/pattern-graph-read-model.ts:197-208` | Deterministic stubs, not live signal data. |
| `src/lib/solutions/architecture-draft-read-model.ts` | `src/lib/solutions/architecture-draft-read-model.ts:582-637` | Deterministic seed plus caller input. |
| `src/lib/enterprise-data/enterprise-profile/enterprise-profile-read-model.ts` | `src/lib/enterprise-data/enterprise-profile/enterprise-profile-read-model.ts:31-100` | File-backed enterprise profile foundation read with conflicting alias map. |
| `src/scripts/tower/materialize-read-model.ts` | `src/scripts/tower/materialize-read-model.ts:61-92` | Mutating materializer only when explicitly `--apply`; not a product reader. |
| `src/scripts/tower/load-lakeshore-holdings-read-model.ts` | `src/scripts/tower/load-lakeshore-holdings-read-model.ts:129-170`, `src/scripts/tower/load-lakeshore-holdings-read-model.ts:466-505` | Script loader; mutating only when explicitly applied. |

## Count And Value Conflicts

- Meridian: current row-count reproduction found `datasets/tenant-inputs/active/meridian-health/current/04_applications_systems.csv` with 241 data rows, `docs/enterprise-context/generated/meridian-vnext/03-cmdb-applications-services.csv` with 240 data rows, `datasets/tenant-inputs/active/meridian-health/current/12_relationships.csv` with 1037 data rows, `docs/enterprise-context/generated/meridian-vnext/04-ci-relationships-dependencies.csv` with 820 data rows, and generated relationship graph/summary files with 360 data rows. The requested 241-vs-306 / 242-vs-540 app/relationship split was not reproduced as stated.
- Meridian 306/540: `datasets/tenant-inputs/active/meridian-health/current/SA09_AI_Tool_Usage_Feed.csv:2` and `datasets/tenant-inputs/active/meridian-health/current/SA08_AI_Benefits_Realization_Usage_Ledger.csv:2` contain 306 and 540 values, but these are usage/benefit values, not verified application counts.
- SkyHarbor: `reports/data-remediation/skyharbor-applications/latest/source-selection.md:1-10` records selected 900-row older estate, 412-app supporting source, 956 transformed template excluded from runtime, and 13-row current upgrade candidate excluded from runtime. `reports/admin-data-layer-explorer/latest/tenant-manifest-projection-audit.json:34860-34890` records the same 412/900/956/13 source-selection conflict.
- SkyHarbor 503-app / $1.54B vs 412-app / $266M: not reproduced in the current repo and local SkyHarbor evidence sweep. The artifact records this as `unverified_in_current_sweep`, not as a verified conflict.

## Negative Results

- No tracked source implementation was found for `@/lib/home/readSkyHarborAiSuccessHome` beyond the Home route import/call.
- No direct route-root use of `src/lib/enterprise-context/intelligence-read-model.ts` was found for `/intelligence`; the route uses the enterprise landscape view model instead.
- No repo evidence was found for the exact SkyHarbor 503-app / $1.54B figure pair in this sweep.
- No single tenant-key list currently reconciles registry keys, app keys, alias keys, and enterprise-context schema keys.
- Several files named read models are deterministic/stub or script surfaces rather than live product read models.

See:

- `tables.json` for table/path inventory.
- `module-chains.json` for route-to-reader chains.
- `conflicts.json` for verified and unverified conflicts.
- `orphans.json` for negative findings and untraced surfaces.
- `README.md` for reproduction commands.
