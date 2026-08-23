# Enterprise Context Ledger - Physical Schema Design

Status: proposed physical schema contract. No migration or data load is authorized by this document.

This document translates the right-sized ECL target model into database objects. It does not reopen the conceptual architecture. The point is to make the next build falsifiable: table names, columns, keys, constraints, indexes, and proof gates.

SQL draft artifacts:

| Artifact                                                                           | Purpose                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql`                    | Draft DDL for the five schemas, 16 governed tables, projection manifest, constraints, indexes, and RLS enablement.                                            |
| `docs/architecture/sql-drafts/ecl_physical_schema_v1_fk_negative_probe.sql`        | Disposable negative probe that intentionally inserts bad rows and expects FK/check failures.                                                                  |
| `docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql`          | Draft DDL for the first product projection tables: Home landscape, Source contract/vendor 360, Tower command center, and Intelligence context pack.           |
| `docs/architecture/sql-drafts/ecl_product_projection_tables_v1_negative_probe.sql` | Disposable negative probe for projection contracts: Home refusal payload, Tower gate reason, Source contract FK, and Intelligence context-pack FK.            |
| `docs/architecture/sql-drafts/ecl_metric_dictionary_seed_v1_draft.sql`             | Draft seed for deterministic metrics used by Home, Source, Tower, Intelligence, D&A volumetrics, and cubes.                                                   |
| `docs/architecture/sql-drafts/ecl_semantic_pilot_positive_smoke_v1.sql`            | Disposable positive smoke that inserts a tiny valid ECL slice and first product projection rows.                                                              |
| `docs/architecture/sql-drafts/ecl_semantic_pilot_positive_smoke_v1.proof.md`       | Readback proof from the local disposable positive smoke run.                                                                                                  |
| `docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql`                   | Draft DDL for compact cube/read-model layer: cube manifests, cube slices, FK-backed metric references, and FK-backed measure lineage across all target cubes. |
| `docs/architecture/sql-drafts/ecl_cube_positive_smoke_v1.sql`                      | Disposable positive smoke that inserts one slice for each target cube.                                                                                        |
| `docs/architecture/sql-drafts/ecl_cube_negative_probe_v1.sql`                      | Disposable negative probe for cube admission payloads, manifest FK, blocked-slice gap flags, non-empty measures, invented metrics, and invented measure IDs.  |
| `docs/architecture/sql-drafts/ecl_cube_smoke_v1.proof.md`                          | Readback proof from the local disposable cube smoke and negative probe.                                                                                       |
| `scripts/ecl/build_workbook_pilot_ecl_sql.py`                                      | First real builder slice: reads the applications/data/infra workbook and emits local ECL load SQL.                                                            |
| `outputs/ecl-workbook-builder-pilot-2026-08-22/README.md`                          | Readback proof for the generated workbook-builder load.                                                                                                       |
| `scripts/ecl/build_commercial_contract_slice.py`                                   | Commercial source-room builder: reads aligned contract-depth extracts and emits local ECL commercial/projection/cube load SQL.                                |
| `outputs/ecl-commercial-contract-supply-correction-2026-08-22/README.md`           | Readback proof for the generated commercial-source ECL load.                                                                                                  |
| `docs/architecture/ECL_PRODUCT_DETERMINISTIC_NEEDS_2026_08_22.md`                  | Product/page deterministic needs contract for Home, Tower, Source 360, and Intelligence projections.                                                          |
| `docs/architecture/ECL_LAYER_CUBE_EXECUTION_TRACKER_2026_08_22.md`                 | Execution tracker with phases, percent complete, proofs, layers, projections, cubes, QA, and sunset.                                                          |

Local proof on 2026-08-22: the draft DDL loaded successfully into a disposable Postgres 18.4 database, and the negative probe confirmed expected rejection for missing relationship endpoint, relationship self-loop, unknown numeric zero, missing contract object, and review event without subject. This is local syntax/integrity proof only; it is not Azure proof and not migration authorization.

Projection proof on 2026-08-22: core DDL plus product projection DDL loaded successfully into a disposable Postgres 18.4 database with 22 total ECL tables. The projection negative probe confirmed expected rejection for admitted projection manifest with refusal payload, refused Home projection without refusal payload, admitted Home projection with refusal payload, gated Tower claim without gate reason, Source contract projection without contract FK, and Intelligence projection without context-pack FK.

Positive smoke proof on 2026-08-22: core DDL, projection DDL, metric dictionary seed, and a tiny valid semantic pilot loaded successfully into disposable Postgres 18.4. Readback confirmed 8 objects, 7 relationships, 7 measures, 1 commercial contract, 2 context packs, and first projection rows for Home, Source contract 360, Source vendor 360, Tower command center, and Intelligence context pack.

Cube smoke proof on 2026-08-22: cube DDL loaded with the core/projection schema into disposable Postgres 18.4. Readback confirmed 26 total ECL tables, 37 metric definitions, one manifest and one slice for each of the nine target cubes, 29 FK-backed cube metric rows, and 10 FK-backed cube measure rows. Negative probes rejected admitted cube manifest with refusal payload, cube slice without manifest, blocked slice without gap flags, cube slice without measures, invented primary metric key, invented cube metric key, and invented cube measure ID.

Workbook-builder proof on 2026-08-22: `scripts/ecl/build_workbook_pilot_ecl_sql.py` read the applications/data/infra workbook, emitted local load SQL, and loaded successfully into disposable Postgres 18.4 with the ECL schema. Readback confirmed 201 source records, 217 objects, 276 relationships, 316 measures, 2 Home projection rows, 22 data analytics cube slices, 110 cube metric FK rows, 110 cube measure FK rows, and 0 JSON metric drift. The object mix now separates 71 base applications from 60 application deployments, with 0 base application display names carrying environment suffixes and 0 deployments missing a `DEPLOYMENT_OF` relationship. This proves the first builder slice only; it does not populate `ecl_commercial`, because the workbook does not contain contract/service-line/invoice/SLA grain.

Commercial-source proof on 2026-08-22: `scripts/ecl/run_commercial_contract_proof.py` now runs the whole local commercial proof as one command: rebuild artifacts, validate source-room rows, run planted validator failures, write field lineage, write dense scope requirements, write client extraction mapping, write product consumption mapping, validate document quality, load disposable Postgres, capture DB proof, run acceptance checks, and refresh the proof-bundle manifest. The runner pins `LANG`, `LC_ALL`, and the individual `LC_*` categories to `C.UTF-8` for disposable Postgres commands, so proof replay does not depend on the caller's shell locale. The underlying builder, `scripts/ecl/build_commercial_contract_slice.py`, read the aligned Meridian contract-depth source-room extracts, wrote a corrected local source room under `outputs/ecl-commercial-contract-supply-correction-2026-08-22/source_room/SP08_Vendor_Contract`, emitted ECL load SQL, and loaded successfully into disposable Postgres 18.4 with the ECL schema. Readback confirmed 67 source files, 564 source records, 55 documents, 235 document extractions, 46 objects, 49 relationships, 75 measures, 5 contracts, 20 service lines, 44 contract-scope links, 40 invoice lines, 90 SLA observations, 5 Source contract 360 rows, 5 Source vendor 360 rows, 5 Source value-lever rows, 5 gated Tower rows, 20 commercial Source/Tower cube slices, 160 cube metric FK rows, 160 cube measure FK rows, and 0 JSON metric drift. The 55 synthetic contract documents are generated as 13-page evidence files, with loaded readback showing line-count min/avg/max of 189 / 195.69 / 203 after replacing field-dump prose with contract-style language. Document extraction offsets are computed from the generated markdown source text: 235 distinct spans, 28 distinct confidence values, and 0 fallback spans. `scripts/ecl/validate_commercial_source_room.py` checks 12 extract files and 564 source rows before load; it initially caught 8 stale RCM invoice supplier references after re-vendoring, the generator now writes the normalized R1 supplier ID, and the final bad-row report has 0 issues. `scripts/ecl/write_commercial_client_extraction_mapping.py` documents all 12 commercial source-room extracts for client/operator execution, including source owner, source system, row grain, join keys, product consumers, do-not-collect rules, acceptable blanks, quality gates, and example export shape. `scripts/ecl/write_commercial_product_consumption_mapping.py` maps commercial supply to 7 deterministic product consumers: Source Contract 360, Source Vendor 360, Source Value and Sourcing Opportunities, Tower action queue, Home architecture/vendor lineage context, Intelligence context pack, and Source/Tower cubes, with basis rules and gate/refusal notes. `scripts/ecl/validate_commercial_document_quality.py` checks all 55 client-visible synthetic contract documents and writes `commercial_document_quality_*` reports; the final quality report has 0 issues, 0 visible extraction-anchor labels, and 0 snake_case prose leaks. Planted validator failures on temp copies produced 1 `unknown_supplier_id` issue and 1 `unknown_service_tower` issue, both with exit status 1; `scripts/ecl/write_commercial_validator_planted_failures.py` now retains the planted bad-row CSVs and summaries in the proof bundle. `scripts/ecl/write_commercial_field_lineage.py` emits 394 field-level mappings covering payload preservation plus promoted fields into ECL source, context, commercial, projection, and cube consumers. Commercial arithmetic checks showed 0 rate-card reconciliation failures, 0 invoice arithmetic failures, and 0 invoice rate annualization failures. A synthetic directional market benchmark extract now adds 20 service-tower benchmark rows, 10 governed market-benchmark measures, 5 distinct contract-level benchmark variance values, 20 distinct source-row benchmark variance values, benchmark payloads on all 5 Source Contract 360 rows, benchmark metric payloads on all 5 Tower rows, 35 benchmark cube metric rows, and 35 benchmark cube measure FK rows. Source rows are explicitly tagged `benchmark_confidence = synthetic_directional` and `benchmark_generation_basis = contract_level_directional_band_plus_service_tower_spread`; ECL benchmark measures use `basis = model_inferred`, `quality_state = estimated`, and `review_state = not_reviewed`. DB proof shows 10 market-benchmark measure rows with `model_inferred` basis and 0 with `source_recorded` basis, so synthetic market rates cannot pass as client-recorded facts. The commercial protection assessment adds 5 profiles with 5 distinct scores, 3 weak-contract examples, and protection payloads on all 5 Source Contract 360 rows; the deliberate spread includes 1 no-benchmarking-right contract, 1 uncapped-exit-cost contract, 1 auto-renew/long-notice contract, and 1 contract with modeled shortfall exposure. Protection is promoted out of JSON into 25 governed measure rows: notice window, termination-for-convenience estimate, and minimum commitment are backed by 15 MSA clause extractions; protection score and modeled shortfall exposure remain computed/source-record backed. Protection score has 0 document-backed rows. Cube proof includes 70 protection cube metric rows and 70 protection cube measure FK rows, with 0 cube metric unit failures. Money provenance checks showed 0 owner-confirmed or claimable money rows backed by unverified document extractions, 10 estimated clause-money rows backed by unverified MSA spans, and 0 contract-money rows using `document_extracted` basis. Planted failures rejected both an invented cube metric key through `cube_slice_metric_definition_fk` and a contract scope row whose scoped application object did not exist through `contract_scope_object_fk`. `scripts/ecl/write_commercial_scope_dense_requirements.py` writes 29 dense-Meridian required application/platform additions from unresolved contract scope names; this records source-room requirements, not old-file design authority. `scripts/ecl/write_commercial_proof_bundle_manifest.py` writes `proof_bundle_manifest.json` after proof execution with git SHA, dirty-state hash, tenant list, environment metadata, 30 proof/report artifact hashes, and 67 source-room file hashes. Scope reconciliation found only 15 of 44 links exactly match the old active application file, so dense Meridian must add/reconcile those named systems before fixture approval. This proves local source-room-to-ECL supply only; it is not Azure proof, client attestation, product route integration, or browser QA.

Commercial-source value-lever update on 2026-08-23: the projection DDL now includes `ecl_projection.source_value_levers`, a tenant-scoped Source 360 value/opportunity projection with contract, contract-object, vendor-object, snapshot, manifest, and primary metric-definition FKs. The commercial proof builder writes 5 rows: 2 evidence-request rows, 1 renewal-leverage row, 1 exit-economics row, and 1 shortfall-recovery row. All 5 are `gated`, all carry zero `claimable_value_usd`, and DB proof confirms 0 primary metric drift plus 5 model-inferred benchmark payloads. Source page fact supply is now 11 of 14 rows; Events, Compare, and Approvals remain explicitly missing because their workflow/review producers do not exist yet. Product route repointing and browser QA remain closed gates.

Commercial event/review update on 2026-08-23: the projection DDL now includes `ecl_projection.source_event_workspace`, a tenant-scoped Source 360 Events/Approvals projection with contract, contract-object, vendor-object, snapshot, manifest, and `ecl_review.review_event` FKs. The core review-event table now has a tenant/assessment/id unique key so projections can enforce tenant-composite review-event references. The commercial proof builder writes `source_review_queue.csv` as the 13th commercial source-room extract, promotes it to 10 `ecl_review.review_event` rows, and projects 10 Source event-workspace rows: 5 Events rows and 5 Approvals rows. All 10 are gated with owner role, due date, gate reason, and required evidence; no approval is inferred from complete source data. DB proof confirms 10 review events, 10 event-workspace rows, 5 Events rows, 5 Approvals rows, 10 gated rows, and 0 review-event drift. Source page fact supply is now 13 of 14 rows; Compare remains explicitly missing until vendor-response and evaluation extracts exist. Product route repointing and browser QA remain closed gates.

## Database And Azure Names

Use new names. Do not reuse `tenant-v3`, `standard-2026-07-v3`, `tower-standardized-v1`, `approved-content`, or product-owned cube names for the replacement path.

| Environment       | Database name                                    |
| ----------------- | ------------------------------------------------ |
| Lab/design        | `enterprise_context_ledger_lab`                  |
| Client preprod    | `enterprise_context_ledger_<client_key>_preprod` |
| Client production | `enterprise_context_ledger_<client_key>_prod`    |

| Azure concern             | Candidate name/prefix                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Client intake landing     | `client-intake/<client_key>/<assessment_id>/`                                             |
| Workbook folders          | `client-intake/<client_key>/<assessment_id>/workbooks/<workbook_number>_<business_name>/` |
| Source-room extracts      | `client-intake/<client_key>/<assessment_id>/source-room/<source_system_or_owner>/`        |
| Proof bundles             | `proof/<client_key>/<assessment_id>/<run_id>/`                                            |
| Intake validation job     | `job-ecl-intake-validate-<env>`                                                           |
| Adapter/context build job | `job-ecl-context-build-<env>`                                                             |
| Context pack job          | `job-ecl-pack-build-<env>`                                                                |
| Projection build job      | `job-ecl-projection-build-<env>`                                                          |
| Intake queue              | `ecl-intake-<env>`                                                                        |
| Projection queue          | `ecl-projection-<env>`                                                                    |

Client preprod and production must have separate databases, storage prefixes or containers, queues, identities, indexes, and proof bundles.

## Schemas

| Schema           | Purpose                                                                              |
| ---------------- | ------------------------------------------------------------------------------------ |
| `ecl_source`     | Raw files, source rows, documents, extraction facts.                                 |
| `ecl_context`    | Object spine, relationships, metric definitions, measures, snapshots, context packs. |
| `ecl_commercial` | Deep Source 360 and Tower commercial evidence.                                       |
| `ecl_review`     | Human decisions, contradiction handling, blocked states, corrections.                |
| `ecl_projection` | Disposable product read models and rebuild manifests.                                |

Core target: 16 governed tables plus disposable projection tables. If the count grows, the default answer is no until the field improves AI reasoning, Source 360, Tower, Moves, Home, Intelligence, or client decision support.

## Shared Rules

Use `uuid` physical IDs for joins and stable business keys for display/import.

Foreign keys are mandatory in the physical model:

- All relationship endpoints use composite FKs to `ecl_context.object`.
- Contract, scope, invoice, SLA, measure, document extraction, snapshot, context pack, and projection references use real FKs.
- Tenant/assessment-scoped child rows use composite FKs that include `tenant_key` and `assessment_id` where the parent is assessment-scoped.
- Review events do not use a weak polymorphic `subject_id` alone. They use nullable subject FK columns plus a one-subject check.
- Display names, folder names, and source-native IDs may be preserved as attributes or native references, but they do not satisfy relationship integrity.

Common columns on tenant-scoped governed tables:

| Column            | Type           | Rule                                                                                                      |
| ----------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `id`              | `uuid`         | Primary key, default `gen_random_uuid()`.                                                                 |
| `tenant_key`      | `text`         | Required. Comes from the tenant/client registry, not folder inference.                                    |
| `assessment_id`   | `text`         | Required for client intake/review batches.                                                                |
| `basis`           | `text`         | Required unless raw file metadata. Check constraint.                                                      |
| `value_state`     | `text`         | Required where a business value is carried. Check constraint.                                             |
| `review_state`    | `text`         | Required where a value can be accepted/rejected. Check constraint.                                        |
| `confidence`      | `numeric(5,4)` | Optional numeric confidence from 0 to 1.                                                                  |
| `attributes_json` | `jsonb`        | Long-tail fields only. Do not bury money, state, object type, metric key, or relationship endpoints here. |
| `created_at`      | `timestamptz`  | Default `now()`.                                                                                          |
| `updated_at`      | `timestamptz`  | Default `now()`.                                                                                          |

Use check constraints rather than Postgres enum types for the first implementation so vocabulary evolution does not require type surgery.

### Basis Vocabulary

```text
source_recorded
document_extracted
interview_derived
calculated
model_inferred
owner_confirmed
unknown
```

### Value State

```text
known
estimated
unknown
not_applicable
conflicting
```

### Scenario

```text
current
target
planned
actual
baseline
forecast
benchmark
retired
candidate
```

### Review State

```text
not_reviewed
in_review
confirmed
corrected
rejected
blocked
superseded
```

## Core Tables

### 1. `ecl_source.source_file`

Preserves the received artifact, whether workbook, CSV extract, document, interview transcript, telemetry export, or generated synthetic source-room file.

| Column          | Type          | Required | Notes                                                                                                                                 |
| --------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `uuid`        | yes      | PK.                                                                                                                                   |
| `tenant_key`    | `text`        | yes      | Registry-derived.                                                                                                                     |
| `assessment_id` | `text`        | yes      | Intake/review batch.                                                                                                                  |
| `source_type`   | `text`        | yes      | `cmdb`, `erp`, `ppm`, `clm`, `grc`, `bi`, `etl`, `ai_telemetry`, `document`, `interview`, `manual_workbook`, `synthetic_source_room`. |
| `source_owner`  | `text`        | no       | Client team or system owner.                                                                                                          |
| `file_name`     | `text`        | yes      | Original name.                                                                                                                        |
| `blob_uri`      | `text`        | yes      | Immutable landing/proof URI.                                                                                                          |
| `file_hash`     | `text`        | yes      | SHA-256.                                                                                                                              |
| `source_date`   | `date`        | no       | Business date represented by the source.                                                                                              |
| `received_at`   | `timestamptz` | yes      | Default `now()`.                                                                                                                      |
| `access_class`  | `text`        | yes      | `public_demo`, `internal`, `client_confidential`, `restricted`.                                                                       |
| `quality_state` | `text`        | yes      | `accepted`, `partial`, `blocked`, `superseded`.                                                                                       |
| `metadata_json` | `jsonb`       | no       | File-level parse metadata.                                                                                                            |

Constraints:

- Unique `(tenant_key, assessment_id, file_hash)`.
- Check `source_type`, `access_class`, and `quality_state`.

Indexes:

- `(tenant_key, assessment_id, source_type)`.
- `(tenant_key, file_hash)`.

### 2. `ecl_source.source_record`

Stores the original source row/session/object at native grain. Do not reshape all source fields into SQL columns.

| Column           | Type      | Required | Notes                                                                               |
| ---------------- | --------- | -------- | ----------------------------------------------------------------------------------- |
| `id`             | `uuid`    | yes      | PK.                                                                                 |
| `tenant_key`     | `text`    | yes      | Denormalized for RLS and query speed.                                               |
| `assessment_id`  | `text`    | yes      | Intake/review batch.                                                                |
| `source_file_id` | `uuid`    | yes      | FK to `ecl_source.source_file(id)`.                                                 |
| `native_id`      | `text`    | no       | Source-native row/object ID.                                                        |
| `record_type`    | `text`    | yes      | `business_application`, `contract_header`, `invoice_line`, `interview_answer`, etc. |
| `row_number`     | `integer` | no       | Row number where applicable.                                                        |
| `payload_json`   | `jsonb`   | yes      | Preserved source payload.                                                           |
| `parse_state`    | `text`    | yes      | `parsed`, `partial`, `failed`, `ignored`.                                           |
| `parse_notes`    | `text`    | no       | Short failure or caveat.                                                            |

Constraints:

- FK `(source_file_id)` references `ecl_source.source_file(id)`.
- Unique `(source_file_id, record_type, native_id)` when `native_id is not null`.

Indexes:

- `(tenant_key, assessment_id, record_type)`.
- GIN on `payload_json`.

### 3. `ecl_source.document`

Document registry for contracts, SOWs, SLA reports, invoices, attestations, and interview records.

| Column           | Type      | Required | Notes                                                                                             |
| ---------------- | --------- | -------- | ------------------------------------------------------------------------------------------------- |
| `id`             | `uuid`    | yes      | PK.                                                                                               |
| `tenant_key`     | `text`    | yes      | Registry-derived.                                                                                 |
| `assessment_id`  | `text`    | yes      | Intake/review batch.                                                                              |
| `source_file_id` | `uuid`    | yes      | FK to `ecl_source.source_file(id)`.                                                               |
| `document_key`   | `text`    | yes      | Stable review key, e.g. `DOC-CON-0001`.                                                           |
| `document_type`  | `text`    | yes      | `contract`, `sow`, `invoice`, `sla_report`, `attestation`, `interview_notes`, `architecture_doc`. |
| `title`          | `text`    | yes      | Business label.                                                                                   |
| `file_hash`      | `text`    | yes      | SHA-256.                                                                                          |
| `page_count`     | `integer` | no       | Required for paged docs when available.                                                           |
| `effective_date` | `date`    | no       | Document effective date.                                                                          |
| `access_class`   | `text`    | yes      | Sensitivity class.                                                                                |
| `review_state`   | `text`    | yes      | Review state.                                                                                     |

Constraints:

- Unique `(tenant_key, assessment_id, document_key)`.
- FK `(source_file_id)` references `ecl_source.source_file(id)`.

Indexes:

- `(tenant_key, document_type, review_state)`.
- `(tenant_key, file_hash)`.

### 4. `ecl_source.document_extraction`

Structured facts extracted from documents with page/span proof. Clause text is not stored wholesale.

| Column                     | Type           | Required | Notes                                                               |
| -------------------------- | -------------- | -------- | ------------------------------------------------------------------- |
| `id`                       | `uuid`         | yes      | PK.                                                                 |
| `tenant_key`               | `text`         | yes      | Registry-derived.                                                   |
| `assessment_id`            | `text`         | yes      | Intake/review batch.                                                |
| `document_id`              | `uuid`         | yes      | FK to `ecl_source.document(id)`.                                    |
| `field_key`                | `text`         | yes      | `renewal_notice_days`, `termination_fee`, `sla_uptime_target`, etc. |
| `extracted_value`          | `text`         | yes      | Structured extracted value.                                         |
| `normalized_value_json`    | `jsonb`        | no       | Typed parsed value where useful.                                    |
| `page_number`              | `integer`      | no       | Citation page.                                                      |
| `span_reference`           | `text`         | no       | Cell/page/span locator.                                             |
| `basis`                    | `text`         | yes      | Usually `document_extracted`.                                       |
| `confidence`               | `numeric(5,4)` | no       | 0 to 1.                                                             |
| `human_verification_state` | `text`         | yes      | `unverified`, `verified`, `corrected`, `rejected`.                  |

Constraints:

- FK `(document_id)` references `ecl_source.document(id)`.
- Check `human_verification_state`.
- If `human_verification_state = 'unverified'`, downstream dollar claims must not be marked `owner_confirmed`.

Indexes:

- `(tenant_key, document_id, field_key)`.
- `(tenant_key, human_verification_state)`.

### 5. `ecl_context.object`

The context object spine. Applications, vendors, contracts, functions, platforms, programs, risks, controls, AI tools, AI use cases, and data products all live here first.

| Column             | Type           | Required | Notes                                             |
| ------------------ | -------------- | -------- | ------------------------------------------------- |
| `id`               | `uuid`         | yes      | PK.                                               |
| `tenant_key`       | `text`         | yes      | Registry-derived.                                 |
| `assessment_id`    | `text`         | yes      | Intake/review batch.                              |
| `object_key`       | `text`         | yes      | Stable business key, e.g. `APP-0001`, `VEN-0014`. |
| `object_type`      | `text`         | yes      | Controlled vocabulary.                            |
| `display_name`     | `text`         | yes      | Business-readable name.                           |
| `business_domain`  | `text`         | no       | Function/domain label.                            |
| `lifecycle_state`  | `text`         | yes      | Scenario/state vocabulary.                        |
| `source_record_id` | `uuid`         | no       | FK to source record.                              |
| `basis`            | `text`         | yes      | Basis vocabulary.                                 |
| `value_state`      | `text`         | yes      | Value state vocabulary.                           |
| `review_state`     | `text`         | yes      | Review state vocabulary.                          |
| `confidence`       | `numeric(5,4)` | no       | 0 to 1.                                           |
| `attributes_json`  | `jsonb`        | no       | Long-tail attributes.                             |
| `created_at`       | `timestamptz`  | yes      | Default `now()`.                                  |
| `updated_at`       | `timestamptz`  | yes      | Default `now()`.                                  |

Core object types:

```text
enterprise
business_segment
business_function
organization
process
application
application_deployment
data_platform
data_product
infrastructure
vendor
contract
program
metric
risk
control
ai_program
ai_use_case
ai_tool
persona
```

Constraints:

- Unique `(tenant_key, assessment_id, object_type, object_key)`.
- FK `(source_record_id)` references `ecl_source.source_record(id)`.
- Check object type, basis, lifecycle, review state, and value state.

Indexes:

- `(tenant_key, assessment_id, object_type)`.
- `(tenant_key, display_name)`.
- `(tenant_key, business_domain)`.
- GIN on `attributes_json`.

### 6. `ecl_context.relationship`

All relationship endpoints are object IDs. No display-name endpoints.

| Column              | Type           | Required | Notes                           |
| ------------------- | -------------- | -------- | ------------------------------- |
| `id`                | `uuid`         | yes      | PK.                             |
| `tenant_key`        | `text`         | yes      | Registry-derived.               |
| `assessment_id`     | `text`         | yes      | Intake/review batch.            |
| `from_object_id`    | `uuid`         | yes      | FK to `ecl_context.object(id)`. |
| `relationship_type` | `text`         | yes      | Controlled vocabulary.          |
| `to_object_id`      | `uuid`         | yes      | FK to `ecl_context.object(id)`. |
| `direction_label`   | `text`         | no       | Optional readable label for UI. |
| `source_record_id`  | `uuid`         | no       | FK to source record.            |
| `basis`             | `text`         | yes      | Basis vocabulary.               |
| `value_state`       | `text`         | yes      | Value state vocabulary.         |
| `review_state`      | `text`         | yes      | Review state vocabulary.        |
| `confidence`        | `numeric(5,4)` | no       | 0 to 1.                         |
| `attributes_json`   | `jsonb`        | no       | Long-tail evidence.             |

Starter relationship types:

```text
HAS_FUNCTION
OWNED_BY
SUPPORTED_BY
SUPPLIED_BY
COVERED_BY
HOSTED_ON
DEPLOYMENT_OF
INTEGRATES_WITH
PRODUCES
CONSUMES
DEPENDS_ON
CHANGES
MITIGATES
CONTROLS
MEASURED_BY
USED_BY
FUNDED_BY
```

Constraints:

- FK `(from_object_id)` and `(to_object_id)` reference `ecl_context.object(id)`.
- FK `(source_record_id)` references `ecl_source.source_record(id)`.
- Check `from_object_id <> to_object_id`.
- Check relationship type, basis, review state, and value state.

Indexes:

- `(tenant_key, assessment_id, relationship_type)`.
- `(tenant_key, from_object_id)`.
- `(tenant_key, to_object_id)`.

### 7. `ecl_context.metric_definition`

Metric dictionary. This prevents every workbook from inventing slightly different labels for the same measure.

| Column             | Type   | Required | Notes                                                             |
| ------------------ | ------ | -------- | ----------------------------------------------------------------- |
| `id`               | `uuid` | yes      | PK.                                                               |
| `tenant_key`       | `text` | yes      | Use `global` for shared definitions.                              |
| `metric_key`       | `text` | yes      | Stable key, e.g. `annual_spend_usd`.                              |
| `metric_name`      | `text` | yes      | Business-readable name.                                           |
| `definition`       | `text` | yes      | Short definition.                                                 |
| `unit`             | `text` | yes      | `USD`, `USD_M`, `users`, `TB`, `jobs`, `reports`, `percent`, etc. |
| `directionality`   | `text` | yes      | `higher_is_better`, `lower_is_better`, `neutral`.                 |
| `cadence`          | `text` | yes      | `monthly`, `quarterly`, `annual`, `point_in_time`.                |
| `aggregation_rule` | `text` | yes      | `sum`, `avg`, `max`, `min`, `latest`, `none`.                     |

Constraints:

- Unique `(tenant_key, metric_key)`.

Indexes:

- `(metric_key)`.

### 8. `ecl_context.measure`

Analytical observations: spend, value, KPI, data volume, report counts, ETL counts, AI usage, user counts, SLA values, capacity, risk exposure.

| Column                   | Type      | Required | Notes                                                            |
| ------------------------ | --------- | -------- | ---------------------------------------------------------------- |
| `id`                     | `uuid`    | yes      | PK.                                                              |
| `tenant_key`             | `text`    | yes      | Registry-derived.                                                |
| `assessment_id`          | `text`    | yes      | Intake/review batch.                                             |
| `subject_object_id`      | `uuid`    | yes      | FK to object measured.                                           |
| `metric_key`             | `text`    | yes      | FK to metric definition by `(tenant_key, metric_key)`.           |
| `value_number`           | `numeric` | no       | Numeric value when known.                                        |
| `value_text`             | `text`    | no       | Text value when appropriate.                                     |
| `unit`                   | `text`    | yes      | Must match metric definition unless exception.                   |
| `period_start`           | `date`    | no       | Observation period.                                              |
| `period_end`             | `date`    | no       | Observation period.                                              |
| `scenario`               | `text`    | yes      | Scenario vocabulary.                                             |
| `source_record_id`       | `uuid`    | no       | FK to source record.                                             |
| `document_extraction_id` | `uuid`    | no       | FK to extraction when document-backed.                           |
| `basis`                  | `text`    | yes      | Basis vocabulary.                                                |
| `value_state`            | `text`    | yes      | Unknown is not zero.                                             |
| `quality_state`          | `text`    | yes      | `usable`, `estimated`, `conflicting`, `blocked`, `insufficient`. |
| `review_state`           | `text`    | yes      | Review state vocabulary.                                         |
| `attributes_json`        | `jsonb`   | no       | Long-tail details.                                               |

Constraints:

- FK `(subject_object_id)` references `ecl_context.object(id)`.
- FK `(tenant_key, metric_key)` references `ecl_context.metric_definition(tenant_key, metric_key)`.
- FK `(source_record_id)` references `ecl_source.source_record(id)`.
- FK `(document_extraction_id)` references `ecl_source.document_extraction(id)`.
- Check exactly one of `value_number` or `value_text` is populated when `value_state = 'known'`.
- Check `value_number is null` when `value_state in ('unknown', 'not_applicable')`.

Indexes:

- `(tenant_key, assessment_id, metric_key)`.
- `(tenant_key, subject_object_id, metric_key)`.
- `(tenant_key, scenario, period_end)`.

### 9. `ecl_context.snapshot`

Governed point-in-time context state.

| Column           | Type          | Required | Notes                                                               |
| ---------------- | ------------- | -------- | ------------------------------------------------------------------- |
| `id`             | `uuid`        | yes      | PK.                                                                 |
| `tenant_key`     | `text`        | yes      | Registry-derived.                                                   |
| `assessment_id`  | `text`        | yes      | Intake/review batch.                                                |
| `snapshot_key`   | `text`        | yes      | Stable build key.                                                   |
| `snapshot_type`  | `text`        | yes      | `baseline`, `review_pack`, `approved_context`, `projection_source`. |
| `source_hash`    | `text`        | yes      | Hash across source files/records used.                              |
| `context_hash`   | `text`        | yes      | Hash across object/relationship/measure state.                      |
| `created_by_job` | `text`        | yes      | ACA job/run ID.                                                     |
| `quality_state`  | `text`        | yes      | `passed`, `warning`, `blocked`.                                     |
| `proof_uri`      | `text`        | yes      | Proof bundle URI.                                                   |
| `created_at`     | `timestamptz` | yes      | Default `now()`.                                                    |

Constraints:

- Unique `(tenant_key, assessment_id, snapshot_key)`.

Indexes:

- `(tenant_key, assessment_id, snapshot_type, created_at desc)`.

### 10. `ecl_context.context_pack`

Retrieval-safe and product-safe packs built from a snapshot. This is what aVa and products consume, not raw rows.

| Column            | Type          | Required | Notes                                                      |
| ----------------- | ------------- | -------- | ---------------------------------------------------------- |
| `id`              | `uuid`        | yes      | PK.                                                        |
| `tenant_key`      | `text`        | yes      | Registry-derived.                                          |
| `assessment_id`   | `text`        | yes      | Intake/review batch.                                       |
| `snapshot_id`     | `uuid`        | yes      | FK to snapshot.                                            |
| `pack_key`        | `text`        | yes      | `enterprise_orientation`, `source_360_context`, etc.       |
| `pack_version`    | `integer`     | yes      | Incremental version.                                       |
| `payload_json`    | `jsonb`       | yes      | Pack content.                                              |
| `payload_hash`    | `text`        | yes      | SHA-256.                                                   |
| `retrieval_state` | `text`        | yes      | `not_indexed`, `indexed`, `retrieved`, `cited`, `blocked`. |
| `quality_state`   | `text`        | yes      | `passed`, `warning`, `blocked`.                            |
| `proof_uri`       | `text`        | yes      | Pack proof bundle.                                         |
| `created_at`      | `timestamptz` | yes      | Default `now()`.                                           |

Constraints:

- FK `(snapshot_id)` references `ecl_context.snapshot(id)`.
- Unique `(tenant_key, assessment_id, pack_key, pack_version)`.

Indexes:

- `(tenant_key, pack_key, pack_version desc)`.
- GIN on `payload_json`.

## Deep Commercial Tables

### 11. `ecl_commercial.contract`

Contract header for Source 360, Source workflows, Tower evidence, renewal risk, and spend proof.

| Column                     | Type      | Required | Notes                                                          |
| -------------------------- | --------- | -------- | -------------------------------------------------------------- |
| `id`                       | `uuid`    | yes      | PK.                                                            |
| `tenant_key`               | `text`    | yes      | Registry-derived.                                              |
| `assessment_id`            | `text`    | yes      | Intake/review batch.                                           |
| `contract_object_id`       | `uuid`    | yes      | FK to `ecl_context.object(id)` where `object_type = contract`. |
| `vendor_object_id`         | `uuid`    | yes      | FK to vendor object.                                           |
| `contract_number`          | `text`    | no       | Client/native contract number.                                 |
| `contract_name`            | `text`    | yes      | Business label.                                                |
| `contract_type`            | `text`    | no       | MSA, SOW, subscription, support, managed service, BAA, etc.    |
| `start_date`               | `date`    | no       | Term start.                                                    |
| `end_date`                 | `date`    | no       | Term end.                                                      |
| `renewal_notice_date`      | `date`    | no       | Derived or source-recorded.                                    |
| `annualized_value_usd`     | `numeric` | no       | Typed money.                                                   |
| `total_contract_value_usd` | `numeric` | no       | Typed money.                                                   |
| `currency`                 | `text`    | yes      | Default `USD`.                                                 |
| `source_document_id`       | `uuid`    | no       | FK to document.                                                |
| `source_record_id`         | `uuid`    | no       | FK to source record.                                           |
| `basis`                    | `text`    | yes      | Basis vocabulary.                                              |
| `value_state`              | `text`    | yes      | Unknown is not zero.                                           |
| `review_state`             | `text`    | yes      | Review state vocabulary.                                       |
| `attributes_json`          | `jsonb`   | no       | Long-tail terms.                                               |

Constraints:

- FK object/document/source references.
- Check `annualized_value_usd is null` when `value_state in ('unknown', 'not_applicable')`.

Indexes:

- `(tenant_key, vendor_object_id)`.
- `(tenant_key, end_date)`.
- `(tenant_key, renewal_notice_date)`.

### 12. `ecl_commercial.contract_service_line`

What the contract buys.

| Column                   | Type      | Required | Notes                                                                             |
| ------------------------ | --------- | -------- | --------------------------------------------------------------------------------- |
| `id`                     | `uuid`    | yes      | PK.                                                                               |
| `tenant_key`             | `text`    | yes      | Registry-derived.                                                                 |
| `assessment_id`          | `text`    | yes      | Intake/review batch.                                                              |
| `contract_id`            | `uuid`    | yes      | FK to contract.                                                                   |
| `service_line_key`       | `text`    | yes      | Stable line key.                                                                  |
| `service_category`       | `text`    | yes      | Software, cloud, managed service, support, data, AI, labor, professional service. |
| `description`            | `text`    | yes      | Short business description.                                                       |
| `annualized_value_usd`   | `numeric` | no       | Typed money when available.                                                       |
| `value_state`            | `text`    | yes      | Unknown is not zero.                                                              |
| `source_record_id`       | `uuid`    | no       | FK to source record.                                                              |
| `document_extraction_id` | `uuid`    | no       | FK to extraction.                                                                 |
| `review_state`           | `text`    | yes      | Review state.                                                                     |

Constraints:

- FK `(contract_id)` references `ecl_commercial.contract(id)`.
- Unique `(tenant_key, assessment_id, contract_id, service_line_key)`.

Indexes:

- `(tenant_key, service_category)`.
- `(tenant_key, contract_id)`.

### 13. `ecl_commercial.contract_scope`

What the contract covers: applications, functions, regions, towers, services, data products, or AI use cases.

| Column                  | Type           | Required | Notes                                                                                      |
| ----------------------- | -------------- | -------- | ------------------------------------------------------------------------------------------ |
| `id`                    | `uuid`         | yes      | PK.                                                                                        |
| `tenant_key`            | `text`         | yes      | Registry-derived.                                                                          |
| `assessment_id`         | `text`         | yes      | Intake/review batch.                                                                       |
| `contract_id`           | `uuid`         | yes      | FK to contract.                                                                            |
| `scoped_object_id`      | `uuid`         | yes      | FK to covered object.                                                                      |
| `scope_type`            | `text`         | yes      | `application`, `function`, `platform`, `region`, `service`, `data_product`, `ai_use_case`. |
| `allocation_percent`    | `numeric(8,4)` | no       | Optional allocation.                                                                       |
| `allocation_amount_usd` | `numeric`      | no       | Optional allocation.                                                                       |
| `basis`                 | `text`         | yes      | Basis vocabulary.                                                                          |
| `value_state`           | `text`         | yes      | Value state.                                                                               |
| `source_record_id`      | `uuid`         | no       | FK to source record.                                                                       |
| `review_state`          | `text`         | yes      | Review state.                                                                              |

Constraints:

- FK `(contract_id)` references `ecl_commercial.contract(id)`.
- FK `(scoped_object_id)` references `ecl_context.object(id)`.
- Unique `(tenant_key, assessment_id, contract_id, scoped_object_id, scope_type)`.
- Check `allocation_percent between 0 and 100` when populated.

Indexes:

- `(tenant_key, scoped_object_id)`.
- `(tenant_key, contract_id)`.

### 14. `ecl_commercial.invoice_line`

Finance grain. This does not become a full subledger; it carries enough spend fact to support Tower and Source.

| Column                  | Type      | Required | Notes                                                |
| ----------------------- | --------- | -------- | ---------------------------------------------------- |
| `id`                    | `uuid`    | yes      | PK.                                                  |
| `tenant_key`            | `text`    | yes      | Registry-derived.                                    |
| `assessment_id`         | `text`    | yes      | Intake/review batch.                                 |
| `invoice_line_key`      | `text`    | yes      | Stable/native line key.                              |
| `vendor_object_id`      | `uuid`    | yes      | FK to vendor object.                                 |
| `contract_id`           | `uuid`    | no       | FK to contract when mapped.                          |
| `cost_center_object_id` | `uuid`    | no       | FK to function/org object when mapped.               |
| `period_start`          | `date`    | yes      | Spend period.                                        |
| `period_end`            | `date`    | yes      | Spend period.                                        |
| `amount_usd`            | `numeric` | yes      | Typed money.                                         |
| `gl_account`            | `text`    | no       | Native GL account.                                   |
| `spend_category`        | `text`    | no       | Software, cloud, labor, telecom, etc.                |
| `source_record_id`      | `uuid`    | yes      | FK to finance source row.                            |
| `basis`                 | `text`    | yes      | Usually `source_recorded`.                           |
| `value_state`           | `text`    | yes      | Must be `known` or `conflicting` when amount exists. |
| `review_state`          | `text`    | yes      | Review state.                                        |

Constraints:

- FK object/contract/source references.
- Unique `(tenant_key, assessment_id, invoice_line_key)`.
- Check `amount_usd <> 0` unless the source row explicitly represents a zero-dollar adjustment.

Indexes:

- `(tenant_key, period_end)`.
- `(tenant_key, vendor_object_id, period_end)`.
- `(tenant_key, contract_id)`.
- `(tenant_key, spend_category)`.

### 15. `ecl_commercial.sla_observation`

Performance delivered against contract or service expectations.

| Column                   | Type      | Required | Notes                                                            |
| ------------------------ | --------- | -------- | ---------------------------------------------------------------- |
| `id`                     | `uuid`    | yes      | PK.                                                              |
| `tenant_key`             | `text`    | yes      | Registry-derived.                                                |
| `assessment_id`          | `text`    | yes      | Intake/review batch.                                             |
| `contract_id`            | `uuid`    | no       | FK to contract.                                                  |
| `service_line_id`        | `uuid`    | no       | FK to service line.                                              |
| `scoped_object_id`       | `uuid`    | no       | FK to app/platform/function/service.                             |
| `metric_key`             | `text`    | yes      | FK to metric definition by `(tenant_key, metric_key)`.           |
| `target_value_number`    | `numeric` | no       | SLA target.                                                      |
| `actual_value_number`    | `numeric` | no       | Observed performance.                                            |
| `unit`                   | `text`    | yes      | Percent, hours, count, etc.                                      |
| `period_start`           | `date`    | yes      | Observation period.                                              |
| `period_end`             | `date`    | yes      | Observation period.                                              |
| `source_record_id`       | `uuid`    | no       | FK to source record.                                             |
| `document_extraction_id` | `uuid`    | no       | FK to document extraction.                                       |
| `basis`                  | `text`    | yes      | Basis vocabulary.                                                |
| `value_state`            | `text`    | yes      | Value state.                                                     |
| `quality_state`          | `text`    | yes      | `usable`, `estimated`, `conflicting`, `blocked`, `insufficient`. |
| `review_state`           | `text`    | yes      | Review state.                                                    |

Constraints:

- FK contract/service/object/metric/source/extraction references.
- At least one of `contract_id`, `service_line_id`, or `scoped_object_id` must be populated.

Indexes:

- `(tenant_key, metric_key, period_end)`.
- `(tenant_key, contract_id)`.
- `(tenant_key, scoped_object_id)`.

### 16. `ecl_review.review_event`

One review table rather than three separate review/resolution/exception tables in v1. This keeps the physical model smaller and supports corrections without turning ECL into a workflow product.

| Column                           | Type          | Required | Notes                                                                                                                                               |
| -------------------------------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                             | `uuid`        | yes      | PK.                                                                                                                                                 |
| `tenant_key`                     | `text`        | yes      | Registry-derived.                                                                                                                                   |
| `assessment_id`                  | `text`        | yes      | Intake/review batch.                                                                                                                                |
| `subject_kind`                   | `text`        | yes      | `object`, `relationship`, `measure`, `contract`, `service_line`, `scope`, `invoice_line`, `sla_observation`, `document_extraction`, `context_pack`. |
| `subject_object_id`              | `uuid`        | no       | FK to object when `subject_kind = object`.                                                                                                          |
| `subject_relationship_id`        | `uuid`        | no       | FK to relationship when `subject_kind = relationship`.                                                                                              |
| `subject_measure_id`             | `uuid`        | no       | FK to measure when `subject_kind = measure`.                                                                                                        |
| `subject_contract_id`            | `uuid`        | no       | FK to contract when `subject_kind = contract`.                                                                                                      |
| `subject_service_line_id`        | `uuid`        | no       | FK to service line when `subject_kind = service_line`.                                                                                              |
| `subject_scope_id`               | `uuid`        | no       | FK to contract scope when `subject_kind = scope`.                                                                                                   |
| `subject_invoice_line_id`        | `uuid`        | no       | FK to invoice line when `subject_kind = invoice_line`.                                                                                              |
| `subject_sla_observation_id`     | `uuid`        | no       | FK to SLA observation when `subject_kind = sla_observation`.                                                                                        |
| `subject_document_extraction_id` | `uuid`        | no       | FK to document extraction when `subject_kind = document_extraction`.                                                                                |
| `subject_context_pack_id`        | `uuid`        | no       | FK to context pack when `subject_kind = context_pack`.                                                                                              |
| `review_event_type`              | `text`        | yes      | `confirm`, `correct`, `reject`, `block`, `resolve_conflict`, `mark_unknown`, `supersede`.                                                           |
| `previous_value_json`            | `jsonb`       | no       | Prior value where relevant.                                                                                                                         |
| `new_value_json`                 | `jsonb`       | no       | Corrected/resolved value where relevant.                                                                                                            |
| `decision_basis`                 | `text`        | yes      | Basis vocabulary.                                                                                                                                   |
| `reviewer_role`                  | `text`        | no       | Business owner, IT owner, finance owner, operator, etc.                                                                                             |
| `source_document_id`             | `uuid`        | no       | FK to document when review cites a document.                                                                                                        |
| `source_record_id`               | `uuid`        | no       | FK to source record when review cites a row.                                                                                                        |
| `notes`                          | `text`        | no       | Short human explanation.                                                                                                                            |
| `created_at`                     | `timestamptz` | yes      | Default `now()`.                                                                                                                                    |

Constraints:

- Exactly one subject FK column must be populated.
- `subject_kind` must match the populated subject FK column.
- Subject FK columns reference their parent tables using tenant/assessment-scoped composite FKs where applicable.
- FK `(source_document_id)` references `ecl_source.document(id)`.
- FK `(source_record_id)` references `ecl_source.source_record(id)`.
- Check `subject_kind`, `review_event_type`, and `decision_basis`.

Indexes:

- `(tenant_key, assessment_id, subject_kind, created_at desc)`.
- `(tenant_key, review_event_type, created_at desc)`.

## Projection Tables

Projection tables are outside the 16 governed core tables. They are disposable read models. The first implementation should create only the projections required for a proof slice.

### `ecl_projection.projection_manifest`

| Column                        | Type          | Required | Notes                                                                                             |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `id`                          | `uuid`        | yes      | PK.                                                                                               |
| `tenant_key`                  | `text`        | yes      | Registry-derived.                                                                                 |
| `assessment_id`               | `text`        | yes      | Intake/review batch.                                                                              |
| `snapshot_id`                 | `uuid`        | yes      | FK to snapshot.                                                                                   |
| `projection_key`              | `text`        | yes      | `home_enterprise_landscape`, `source_vendor_360`, `tower_command_center`, etc.                    |
| `projection_version`          | `integer`     | yes      | Version.                                                                                          |
| `rebuild_command`             | `text`        | yes      | Exact command/job name.                                                                           |
| `source_hash`                 | `text`        | yes      | Snapshot/context pack hash.                                                                       |
| `projection_hash`             | `text`        | yes      | Output hash.                                                                                      |
| `row_count`                   | `integer`     | yes      | Output row count.                                                                                 |
| `quality_state`               | `text`        | yes      | `passed`, `warning`, `blocked`.                                                                   |
| `admission_status`            | `text`        | yes      | `admitted`, `refused`, or `not_applicable`. Defaults to `not_applicable`.                         |
| `admission_gate_results_json` | `jsonb`       | yes      | Empty array unless the projection is refused; refused projections must carry gate result payload. |
| `gated_claim_count`           | `integer`     | yes      | Count of gated claims carried by the projection. Defaults to 0.                                   |
| `proof_uri`                   | `text`        | yes      | Proof bundle.                                                                                     |
| `created_at`                  | `timestamptz` | yes      | Default `now()`.                                                                                  |

Admission gate rule:

- `refused` requires a non-empty gate-results payload.
- `admitted` and `not_applicable` require an empty gate-results payload.
- Product rows that implement a declared admission gate, such as Home architecture/data-flow rows, apply the same two-way rule at row level.

Initial disposable product projections:

| Projection                                 | Purpose                                                     | Required source                                      |
| ------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------- |
| `ecl_projection.home_enterprise_landscape` | Home landscape, executive context, architecture/data views. | `ecl_context.context_pack`.                          |
| `ecl_projection.source_vendor_360`         | Vendor portfolio and vendor context.                        | Objects, relationships, measures, commercial tables. |
| `ecl_projection.source_contract_360`       | Contract scope, spend, renewal, SLA, documents.             | Commercial tables plus document extraction.          |
| `ecl_projection.tower_command_center`      | Spend/value/risk/control facts.                             | Measures, commercial, risk/control relationships.    |

Do not create projections for every future product tab on day one. Add projections only when the consuming route/job and rebuild proof exist.

### Cube Read Models

Cube tables are disposable analytical read models. They are not a new source of truth.

| Table                               | Purpose                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ecl_projection.cube_manifest`      | One rebuild record per cube/version, including source hash, cube hash, slice count, quality state, admission state, and proof URI.                                          |
| `ecl_projection.cube_slice`         | One analytical slice at a declared grain. Carries dimensions, display/cache measures JSON, primary object FK, primary metric FK, value state, quality state, and gap flags. |
| `ecl_projection.cube_slice_metric`  | FK-backed list of metrics represented by a slice. References `ecl_context.metric_definition`.                                                                               |
| `ecl_projection.cube_slice_measure` | FK-backed lineage from a cube slice to the ECL measures used to build it. References `ecl_context.measure` and `ecl_context.metric_definition`.                             |

Cube reference rule:

- `metric_keys_json` and `measures_json` are display/cache payloads only.
- Governed metric identity comes from `cube_slice.primary_metric_key` and `cube_slice_metric.metric_key`.
- Governed measure lineage comes from `cube_slice_measure.measure_id`.
- A cube may not cite an undeclared metric key or invented measure ID.

## RLS And Access

Enable RLS on every tenant-scoped table.

Policy direction:

- Operator/service roles can write only through governed ACA jobs.
- Product runtime roles are read-only.
- Tenant isolation uses `tenant_key` from authenticated claims or managed job context.
- `access_class = 'restricted'` rows require a stricter role and must not enter generic context packs.
- Synthetic/lab rows must never be mixed with real client rows in one database.

Do not use service-role readback as tenant isolation proof. Run authenticated tenant-bound readback.

## Table-Level Ownership

| Schema/table                    | Writer                                              | Reader                                                    |
| ------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| `ecl_source.*`                  | Intake validation and adapter jobs.                 | Operators, auditors, selected review UIs.                 |
| `ecl_context.object`            | Context build job plus approved review corrections. | Product projection builders, aVa pack builders.           |
| `ecl_context.relationship`      | Context build job plus approved review corrections. | Product projection builders, graph/context pack builders. |
| `ecl_context.metric_definition` | Controlled seed/migration plus reviewed additions.  | All measure/projection builders.                          |
| `ecl_context.measure`           | Context build job plus approved review corrections. | Tower, Home, Source, Moves, Intelligence projections.     |
| `ecl_context.snapshot`          | Snapshot job only.                                  | Pack/projection jobs.                                     |
| `ecl_context.context_pack`      | Pack job only.                                      | aVa, product projection jobs, retrieval indexing.         |
| `ecl_commercial.*`              | Commercial adapter and reviewed corrections.        | Source 360, Tower, Home summaries.                        |
| `ecl_review.review_event`       | Review UI/job only.                                 | Context build and audit reports.                          |
| `ecl_projection.*`              | Projection jobs only.                               | Product runtime.                                          |

## Workbook Mapping Contract

Workbooks are not database schemas. They map into the ECL core:

| Workbook family            | Primary ECL target                                                                           | Notes                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Executive/business profile | `ecl_context.object`, `ecl_context.measure`, `ecl_context.relationship`                      | Enterprise, segment, function, strategic priority objects and measures.                                                    |
| Interviews                 | `ecl_source.source_file`, `source_record`, `document`, `document_extraction`, `review_event` | Interview answers become source records; only synthesized, cited facts become context objects/measures/relationships.      |
| Applications/CMDB          | `ecl_context.object`, `relationship`, `measure`                                              | Applications, owners, hosting, criticality, users, lifecycle, dependencies.                                                |
| Data and analytics         | `ecl_context.object`, `relationship`, `measure`                                              | Data platforms, marts/products, reporting/ETL/user volumetrics by function. Counts only unless item-level workflow exists. |
| Vendor and contracts       | `ecl_context.object`, `ecl_commercial.*`, `document_extraction`, `measure`                   | Deep grain required.                                                                                                       |
| Finance/budget/spend       | `ecl_commercial.invoice_line`, `ecl_context.measure`                                         | Enough invoice/GL grain for allocation and value proof; not a subledger replacement.                                       |
| Programs/value             | `ecl_context.object`, `relationship`, `measure`                                              | Programs, dependencies, funding, benefits, current/target/forecast values.                                                 |
| AI tools/use cases         | `ecl_context.object`, `relationship`, `measure`                                              | AI tools, use cases, users, adoption, risk, value hypotheses and observed usage.                                           |
| Risk/control               | `ecl_context.object`, `relationship`, `measure`                                              | Risks/controls linked to apps/functions/vendors/programs.                                                                  |
| Infrastructure/platform    | `ecl_context.object`, `relationship`, `measure`                                              | Hosting, cloud, data centers, capacity, resilience, platform volumetrics.                                                  |

## Quality Gates

These are structural gates, not dashboard checks.

1. Relationship endpoint gate: inserting a relationship with a display name instead of an object FK must fail.
2. Unknown/zero gate: `unknown` measures cannot carry numeric zero.
3. Money provenance gate: money in `measure`, `contract`, `service_line`, or `invoice_line` must carry source/basis/value state.
4. Document extraction gate: unverified extraction cannot back an owner-confirmed dollar claim.
5. Projection disposability gate: delete one projection table or partition and rebuild it from `snapshot_id` with the same hash.
6. Tenant isolation gate: authenticated tenant A cannot read tenant B rows.
7. Conflict gate: two source rows can disagree; displayable context must either resolve via review or remain `conflicting`.
8. Assertion harness gate: expected values are compared to observed values; planted wrong assertion fails.

## Existing Estate Retirement Measurement

Current repo migration scan finds 516 `CREATE TABLE` statements under `supabase/migrations`. That number is a baseline for retirement pressure, not a target to preserve.

Phase 0 must produce:

| Question                                             | Required answer                          |
| ---------------------------------------------------- | ---------------------------------------- |
| How many current tables are replaced by ECL core?    | Count by table and owning product/layer. |
| How many become projection tables?                   | Count and projection owner.              |
| How many remain as unrelated product/runtime tables? | Count and reason.                        |
| How many can be archived after readback?             | Count and deletion wave.                 |

If the answer is "ECL adds 16 tables and retires zero", then this is not simplification. That must be reported as a blocker.

## Build Sequence

1. Write migration draft locally only for the five schemas and 16 governed tables.
2. Add schema validation tests for constraints and FK gates.
3. Seed a tiny semantic pilot: Epic Tapestry, Epic Systems, one payer app, one contract, one invoice line, one SLA observation, one interview-derived priority, one data/reporting volumetric.
4. Run planted-failure tests before success tests.
5. Build one context pack.
6. Build one disposable Home or Source projection.
7. Delete and rebuild the projection from the same snapshot.
8. Produce proof bundle with code SHA, image digest if run in ACA, source hashes, report hashes, tenant list, and environment.
9. Only then generate dense Meridian into the new schema.
10. Only after dense Meridian proof, request Wave 0 migration authorization.

No product route should be repointed until its projection has row counts, hashes, browser QA where UI is affected, tenant isolation proof, and rollback path.
