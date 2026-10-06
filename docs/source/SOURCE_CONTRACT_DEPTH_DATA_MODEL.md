# Source Contract Depth Data Model

Status: candidate for the controlled synthetic contract-depth load.

This is the binding between a dense contract intake package, the governed data
layers, and the Source Contract 360 tabs. The page is a projection of these
layers. It must not read CSV files, preview JSON, or invent fallback content at
render time.

## Layer 1: Client intake package

The package is organized by evidence ownership and native source grain. Every
populated row carries `tenant_key`, `dataset_version`, a native row identifier,
and a contract reference.

| Intake lane | Native files | What it establishes |
| --- | --- | --- |
| Contract record | `contracts.csv`, `contract_clauses.csv`, `contract_page_text.csv` | Legal identity, archetype, term, renewal, commercial terms, clause/page citations, and a plain-English contract overview. |
| Scope and relationships | `cmdb_applications.csv`, `cmdb_application_scope.csv` | Named applications, business functions, hosting, criticality, and declared contract-to-application edges. |
| Commercial evidence | `monthly_spend.csv`, `invoice_line_detail.csv`, `pricing_bridge.csv` | Commitment, invoice, paid, actual, pricing scenarios, and monthly commercial history. |
| Usage and service evidence | `saas_usage.csv`, `sla_performance.csv`, `ticket_volumetrics.csv`, `batch_job_volumetrics.csv` | Entitlement, consumption, service metrics, tickets, and operating volume. |
| Change and governance evidence | `change_orders.csv`, `qbr_scorecards.csv`, `evidence_manifest.csv` | Change history, operating reviews, source-file identity, and evidence status. |
| Optimization intelligence | `optimization_opportunities.csv`, `negotiation_findings.csv`, `negotiation_levers.csv` | Structured findings, asks, rationale, value state, owners, timing, and evidence references. |
| Archetype-specific optional lane | `resource_model.csv` | Staffing/resource facts when the archetype requires them. Empty is valid for a cloud consumption contract. |

`contract_page_text.csv` in the synthetic package is reviewed demo text derived
from the package facts. It is not a substitute for a restricted source PDF and
must remain labeled as synthetic demo content.

## Layer 2: Source adapters

`source.contract_depth_adapter_row` is the immutable-ish intake record for each
adapted source row. The adapter normalizes native names into the current Source
contract while retaining:

- `adapter_name`, `source_file_name`, `source_row_id`, and `source_row_number`;
- `source_hash` and `package_sha256`;
- the full normalized `payload`;
- `tenant_key`, `dataset_version`, and `load_run_id`;
- adapter quality state.

The dense package currently previews as 93 Layer-2 rows across 18 adapter
families. A package identity mismatch fails before any database mutation.

## Layer 3: Canonical model

The loader writes the canonical Source objects and their lineage. The important
objects are:

| Canonical object | Source of truth for |
| --- | --- |
| `source.vendor` | Vendor identity and vendor reference. |
| `source.contract` | One governed contract header, archetype, term, renewal, owners, and commercial identity. |
| `source.contract_term` | Clause-level terms with source section/page references. |
| `source.contract_scope` | Declared application/service scope and relationship fields. |
| `source.contract_consumption_observation` | Monthly committed, invoiced, paid, and actual spend. |
| `source.contract_performance_observation` | Period metrics, breaches, and service-credit state. |
| `source.contract_service_credit` | Credit calculations and claim/recovery state. |
| `source.source_record_snapshot` | Full row-level lineage for every adapted source record. |
| `source.canonical_fact_assertion` | Typed numeric facts and aggregates used by read models. |
| `source.optimization_opportunity` | One governed action candidate, its evidence, amount state, stage, owner, deadline, and structured negotiation context. |
| `source.opportunity_evidence` | The exact source-row IDs backing an opportunity. |
| `source.optimization_case` and `source.case_opportunity` | The contract-level decision case and its ordered opportunities. |
| `source.evidence_requirement` and status tables | Required, satisfied, blocked, or not-applicable evidence by opportunity. |

The negotiation finding and lever rows remain available as Layer-2 lineage and
are also linked into the corresponding Layer-3 opportunity payload. This makes
the Optimize table renderable from governed records: the ask, why the vendor
can agree, evidence basis, owner, timing, value state, and next step travel
together. A signal-stage lever has no sized dollar amount.

## Layer 4: Product read models

The layer-4 rebuild uses the active `load_run_id` and publishes the Source and
consumption projections. The contract-facing views are:

| Product surface | Read model | Required content |
| --- | --- | --- |
| Contract header / anatomy | `source.contract_360`, `source.contract_vendor_360` | Contract purpose, archetype, vendor, term, commercial thesis, scope summary, owners, and evidence boundary. |
| Story | `source.source_page_storyline_v1`, `source.contract_tab_intelligence_v1` | Plain-English situation, what matters, what is proven, what is missing, and the decision narrative. |
| Scope | `source.contract_application_scope` | Named applications, business functions, criticality, hosting, lifecycle, and declared relationship method. |
| Economics | `source.contract_financial_exposure`, `consumption.sourcing_spend_monthly_v1` | Commitment versus actual usage, invoice and payment history, pricing bridge, and separate recoverable/avoidable/negotiated/realized ledgers. |
| Performance | `source.contract_operational_performance`, `consumption.sourcing_performance_v1` | Service metrics and credits when applicable; explicit not-required state when the archetype has no performance lane. |
| Relationship | `source.contract_vendor_360`, `consumption.sourcing_contract_scope_v1` | Declared vendor, contract, owner, and application edges. Never infer CMDB/Tower dependencies. |
| Evidence | `source.contract_evidence_coverage_v1`, document read adapters | Evidence families, row counts, page/citation availability, review status, and named backfill requests. |
| Optimize | `source.contract_action_candidate_v1`, `consumption.sourcing_opportunity_v1` | Ordered levers, asks, rationale, evidence references, value state, owner, deadline, approval gate, and negotiation sequence. |
| aVa grounding | `source.ava_grounding_bundle_v1` | Only validated, tenant-scoped, provenance-bearing facts and derived context. Blocked objects never reach the model. |

All lanes must use the same active run mapping. Loading depth rows under one run
and cloud-usage rows under another makes the views appear empty even when the
database contains the rows. The operator flow therefore uses one explicit run
ID across the dense contract package, companion cloud package, document evidence
load, and layer-4 overlay, with a readback after each phase.

## Deterministic intelligence and education

The system should derive contract intelligence at load time, not during page
rendering. The stored record must include:

- archetype key and reviewed/archetype confidence;
- contract purpose and scope summaries with source references;
- commercial thesis and relationship summary;
- applicable archetype playbook and education steps;
- industry context as a separately labeled advisory input;
- negotiation findings and ordered levers;
- `source_basis`, confidence, rationale, provenance, review state, and
  `derived_from_load_run_id`.

Archetype playbooks are authored by archetype. Load-time intelligence selects
the applicable plays and records why. It must not generate a different playbook
for every similar contract. Model-generated prose is allowed only through the
governed AI path, with the full restriction prompt supplied before generation;
it is stored with review state and provenance, never scrubbed after the fact
and never treated as a fact before review.

## Dense-package acceptance result

For the controlled synthetic contract-depth package, the local preview currently
proves:

- 1 contract and 1 vendor;
- 4 declared application scope rows;
- 12 spend months and 12 invoice lines;
- 4 performance periods and 4 ticket rows;
- 6 evidence manifest rows and 6 page-text rows;
- 8 contract clauses and 1 change order;
- 4 optimization opportunities, 4 findings, and 4 structured levers;
- adapter and projection quality gates: `PASS`.

These are package-level results, not a claim that Azure has been loaded. Azure
acceptance requires the ACA Job proof bundle, Layer-2/3/4 readbacks, Tower
lineage reconciliation, and signed-in tab-by-tab product proof.
