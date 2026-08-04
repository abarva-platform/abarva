# Source Sourcing Context Depth Contract

## Purpose

Source already has enough SkyHarbor v3 data to demonstrate vendor concentration,
contract value, actual spend, auto-renew posture, basic alternatives, application
dependencies, and initial sourcing opportunities.

It is not yet deep enough to defend every renewal strategy, supplier comparison,
SLA recovery case, consumption variance, or new sourcing-event recommendation.
This contract adds the missing sourcing context without redesigning the data
platform.

## Architecture Boundary

This is a Layer 2 and Layer 3 extension that Layer 4 Source can project.

| Layer                            | Role                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Layer 1 client intake            | Accept native exports from ERP, procurement, CLM, CMDB, ITSM, SaaS management, cloud billing, PMO, FP&A, and supplier-risk systems. |
| Layer 2 Source adapters          | Map each intake tab or API extract into sourcing context records with lineage and quality state.                                    |
| Layer 3 canonical Source context | Own vendor, contract, service, scope, spend, performance, renewal, market, and event facts.                                         |
| Layer 4 Source product           | Render portfolio pages, Contract 360, renewal views, sourcing opportunities, event rooms, and aVa narratives.                       |

Source pages do not own the data. Claude and aVa may explain findings but do not
calculate spend, leakage, SLA recovery, value, or scores.

## Connected Sourcing Context

A defensible sourcing decision needs six connected information sets:

```text
vendor
+ contract terms
+ actual spend and consumption
+ service/application scope
+ operational performance
+ renewal, market and sourcing-event context
```

Every important row carries:

```text
tenant_key
source_system
source_record_id
as_of_date
effective_date
confidence
relationship_method
evidence_reference
load_run_id
quality_state
```

Role references are allowed. Employee names, personal emails, phone numbers, and
employee IDs are not part of this contract.

## PostgreSQL Objects

The migration `20260803160000_source_sourcing_context_depth_contract.sql` adds
the following tenant-scoped tables under `source`.

### Core Entities

| Table                             | Grain                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `source.vendor`                   | One governed supplier record per legal vendor.                                            |
| `source.contract`                 | One agreement, order form, SOW, or amendment.                                             |
| `source.contract_term`            | One commercial, legal, renewal, benchmark, termination, or AI-specific term.              |
| `source.contract_price_component` | One rate, price component, band, minimum commitment, overage, credit cap, or support fee. |
| `source.service`                  | One service, platform, managed service tower, or product covered by vendor scope.         |
| `source.sourcing_event`           | One renewal, optimization, sourcing, RFI, RFP, RFQ, BAFO, or direct-award event.          |
| `source.sourcing_event_supplier`  | One supplier participating in one event.                                                  |

### Relationships

| Table                                          | Grain                                                                                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source.contract_scope`                        | One contract-to-scope relationship. Scope may be application, platform, capability, workflow, location, data product, integration, initiative, or service. |
| `source.vendor_application_relationship`       | One vendor-to-application relationship with explicit confidence and method.                                                                                |
| `source.vendor_platform_relationship`          | One vendor-to-platform relationship with explicit confidence and method.                                                                                   |
| `source.contract_initiative_dependency_detail` | One contract-to-initiative dependency. Named with `_detail` because live SkyHarbor already has a `source.contract_initiative_dependency` read-model view.  |

### Facts and Observations

| Table                                     | Grain                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `source.vendor_spend_observation`         | One vendor or contract spend observation by period and financial owner.        |
| `source.contract_consumption_observation` | One contract/month/service/cost-center consumption observation.                |
| `source.contract_performance_observation` | One service metric by contract and period.                                     |
| `source.contract_service_credit`          | One earned, claimed, recovered, or waived credit event.                        |
| `source.contract_milestone`               | One milestone, delivery obligation, payment trigger, or transition date.       |
| `source.vendor_risk_observation`          | One supplier risk observation from a named source and as-of date.              |
| `source.market_benchmark`                 | One market, pricing, supplier, rate, SLA, or commercial benchmark observation. |

### Deterministic Conclusions

| Table                         | Grain                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `source.sourcing_opportunity` | One deterministic opportunity with value range, confidence, evidence, and next action. |
| `source.renewal_decision`     | One renewal decision posture for one contract as of a decision window.                 |
| `source.commercial_variance`  | One variance between contract, invoice, consumption, benchmark, or budget values.      |

Document originals, clause spans, and extracted facts remain in `doc.file`,
`doc.page`, `doc.span`, and `doc.extraction`. Review activity should reuse
`governance.review_event`. Narrative and artifact output should reuse
`narrative.finding_result` and `narrative.artifact` where available.

## Relationship Methods

Scope and dependency relationships must declare how they were established.

| Method                    | Meaning                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `explicit_contract_scope` | Stated in agreement, SOW, order form, amendment, or pricing schedule.   |
| `reviewed_mapping`        | Confirmed by client SME or mapped from an authoritative system.         |
| `vendor_based_inference`  | Inferred because an application or platform references the same vendor. |
| `name_based_inference`    | Inferred from product, service, or scope name similarity.               |
| `unresolved`              | Relationship has not been established.                                  |

Source can render inferred rows as discovery leads, not contractual fact.

## Client Intake Workbook

The operational extraction package generated by
`scripts/source/build-source-operational-extraction-package.mjs` writes a ZIP to
`/Users/anand/Downloads/AbarVa_Source_Operational_Extraction_Package_v1.zip`.
It is deliberately more concrete than a data dictionary:

1. `AbarVa_Source_Client_Data_Request.xlsx` - the client-facing extraction
   playbook.
2. `SkyHarbor_Source_Normalized.xlsx` - the normalized synthetic intake file
   ready for loader testing.
3. `SkyHarbor_Source_Synthetic_System_Extracts.zip` - source-system shaped
   exports from SAP Ariba, SAP S/4HANA, ServiceNow, Fieldglass, LeanIX, Entra
   ID/M365, Azure Cost Management, and SharePoint/CLM equivalents.
4. `source_mapping_manifest.json` - row counts, file hashes, field lineage, and
   acceptance gates.

The client request workbook contains:

| Tab                          | Purpose                                                                                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `00_READ_ME`                 | Extraction rules, PII rules, required lineage, and signoff requirement.                                                                                                                                                      |
| `01_SOURCE_SYSTEM_INVENTORY` | Specific source systems, modules, access methods, reports/APIs, owners, and join identifiers.                                                                                                                                |
| `02_FIELD_SOURCE_MAP`        | One row per normalized target column with exact source system, object/report/API, navigation/export instruction, source field name, joining key, transformation, data owner, refresh cadence, and synthetic generation rule. |

The normalized decision tabs are:

| Tab                     | Grain                                          | Primary owner                              |
| ----------------------- | ---------------------------------------------- | ------------------------------------------ |
| `03_Vendors`            | One legal supplier.                            | Vendor management / procurement operations |
| `04_Contracts`          | One agreement.                                 | Procurement, CLM, legal                    |
| `05_Contract_Scope`     | One contract-to-scope relationship.            | Application, architecture, service owners  |
| `06_Spend_Consumption`  | One contract/month/cost-center observation.    | ERP/AP/FP&A/TBM                            |
| `07_Performance_SLA`    | One contract/metric/period observation.        | ITSM/service owners                        |
| `08_Renewal_Commercial` | One contract decision posture.                 | Vendor management / category lead          |
| `09_Sourcing_Events`    | One sourcing or renewal event.                 | Procurement / business sponsor             |
| `10_Event_Requirements` | One requirement for an event.                  | Business owner / SME                       |
| `11_Event_Suppliers`    | One supplier in an event.                      | Procurement                                |
| `12_Event_Responses`    | One supplier response or scored response line. | Evaluation team                            |

Every normalized row carries `extract_date`, `load_run_id`, `is_synthetic`,
`source_system`, `source_record_id`, and `as_of_date`.

The package validation command is:

```bash
npm run source:sourcing-context:package:validate
```

It fails if any normalized column lacks an operational source-system mapping,
if required lineage is blank, if synthetic row counts drift, or if contract
annual value no longer reconciles to `$1.4805B`.

## Cube Consumption Layer

Cube consumes only governed consumption views:

```text
consumption.sourcing_vendor_v1
consumption.sourcing_contract_v1
consumption.sourcing_contract_scope_v1
consumption.sourcing_spend_monthly_v1
consumption.sourcing_performance_v1
consumption.sourcing_opportunity_v1
consumption.sourcing_event_v1
consumption.sourcing_event_supplier_v1
consumption.sourcing_context_coverage_v1
```

The model is in `cube/model/source_sourcing.yml`. It defines eight cubes and
nine executive/analytical views for concentration, renewal exposure, scope
confidence, spend/consumption, performance/credits, opportunity pipeline, event
execution, and supplier comparison.

Tenant filtering is enforced in `cube/cube.py` through `query_rewrite`; every
query must include `securityContext.tenant_key`.

The PostgreSQL consumption views also enforce tenant access directly through
`source.can_read_sourcing_tenant(tenant_key)`. This is deliberate: Cube,
Superset, and read-only SQL users must see the same tenant-scoped boundary.
The migration grants only the new Source context tables and `consumption.sourcing_*`
views; it does not broaden access to existing `source` schema objects.

## Lab And Production Path

The easier and safer route is:

1. Apply `20260803160000_source_sourcing_context_depth_contract.sql` in the
   lab/test Azure PostgreSQL database.
2. Run `npm run source:sourcing-context:verify-live -- --tenant=skyharbor_global`
   against lab.
3. Review the package validation output and lab readback output.
4. Promote once to production through the controlled migration/operator lane.

The apply script is target-gated:

```bash
SOURCE_CONTEXT_MIGRATION_TARGET=lab npm run source:sourcing-context:migrate:apply
```

Production promotion requires explicit reviewed approval:

```bash
SOURCE_CONTEXT_MIGRATION_TARGET=production \
SOURCE_CONTEXT_PRODUCTION_APPROVED=true \
npm run source:sourcing-context:migrate:apply
```

This worktree does not apply production mutations. Production means the Azure
PostgreSQL database used by `app.abarva.ai`, not local files or local Postgres.

## Visuals Enabled

| Visual                | Required data                                                          |
| --------------------- | ---------------------------------------------------------------------- |
| Concentration Pareto  | Vendor, contract value, actual spend                                   |
| Renewal timeline      | Expiration, notice deadline, auto-renew, as-of date                    |
| Leverage matrix       | Alternatives, benchmark rights, criticality, spend                     |
| Lock-in heatmap       | Applications, platforms, skills, geography, modernization dependencies |
| Commitment waterfall  | Commitments, invoices, consumption, overage, credits                   |
| Opportunity portfolio | Deterministic findings, timing, confidence, evidence                   |
| Contract optimization | Terms, scope, performance, volumes, clauses                            |
| New sourcing event    | Baseline, requirements, suppliers, evaluation, response and decision   |

## Current SkyHarbor Enhancement Targets

The next synthetic data deepening should add:

1. Monthly spend and consumption by contract.
2. Notice deadlines and governed as-of-date logic.
3. Contract-level benchmarking and alternatives.
4. Contract-to-application relationship confidence.
5. Operational performance and SLA records.
6. Service-credit calculations.
7. Modernization and retirement dependencies.
8. Renewal recommendation and decision windows.
9. A small set of sourcing events.
10. Long-form clause evidence for selected contracts.

## Quality Gates

A Source finding is not board-grade unless it states:

- deterministic calculation basis
- source table or document evidence
- relationship method
- confidence
- quality state
- missing context
- accountable role
- next evidence request where needed

The system must distinguish:

```text
contracted value
actual spend
consumption
earned credits
claimed credits
recovered credits
estimated opportunity
approved opportunity
```

No missing value should be rendered as zero unless the source record explicitly
establishes zero.
