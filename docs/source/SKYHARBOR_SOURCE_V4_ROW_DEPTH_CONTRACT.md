# Synthetic Airline Source v4 Row Depth Contract

**Status:** build contract for the next synthetic Source package.

This document defines what "rich synthetic data" means for the Source v4 pressure-test package.
The package must be designed backward from executive questions, but every row must also look like it
came from a real system of record rather than a hand-authored demo table.

## Non-Negotiable Standard

Every generated row must satisfy four tests:

1. **System-native shape:** the row carries the identifiers, statuses, dates, dimensions and audit
   fields that the named source system would normally export.
2. **Business usefulness:** the row can answer at least one pressure-test question or support a
   drill-down from an answer.
3. **Lineage:** the row can be traced to an extract, report/API, source object and synthetic
   generation rule.
4. **Honest evidence state:** unavailable, inferred, partial, disputed and reviewed values are
   marked as such. The generator must not fill every field simply because it can.

Rows that are only plausible filler are not allowed. If a row does not support an answer, a join, a
quality finding, an evidence trail or a realistic exception pattern, it should not exist.

## Required Row Anatomy

Every structured extract row, normalized row and canonical load row must include:

| Field                         | Requirement                                                                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant_key`                  | Synthetic tenant key.                                                                                                                                                                                      |
| `dataset_id`                  | Immutable dataset id, expected to identify Source v4.                                                                                                                                                      |
| `dataset_version`             | `v4`.                                                                                                                                                                                                      |
| `source_system`               | Specific system, not a generic department. Examples: SAP Ariba Contracts, Coupa, Icertis, ServiceNow, SAP S/4HANA, Oracle Fusion, SAP Fieldglass, Microsoft Entra, Azure Cost Management, AWS CUR, LeanIX. |
| `source_module`               | Module or data area, such as CLM, Sourcing, AP, MM, ITSM, SAM, CMDB, APM, VMS, Cost Management.                                                                                                            |
| `source_object`               | Native object/report/table name, such as Ariba Contract Workspace, Coupa Invoice Export, ServiceNow `cmdb_ci_business_app`, SAP `EKPO`, AWS CUR line item.                                                 |
| `source_record_id`            | Native durable row identifier or deterministic synthetic equivalent.                                                                                                                                       |
| `source_record_url_or_path`   | Native URL/path when realistic; otherwise synthetic file/report path.                                                                                                                                      |
| `extract_job_id`              | Deterministic extract job id.                                                                                                                                                                              |
| `extract_method`              | API, report export, scheduled file drop, data warehouse extract, document-library export.                                                                                                                  |
| `extract_timestamp`           | Extract timestamp, not just the business period.                                                                                                                                                           |
| `as_of_date`                  | Business as-of date for snapshot rows.                                                                                                                                                                     |
| `period_start` / `period_end` | Required for monthly/history rows.                                                                                                                                                                         |
| `business_owner_role`         | Role accountable for the business meaning. No employee names.                                                                                                                                              |
| `technical_owner_role`        | Role accountable for the extract. No employee names.                                                                                                                                                       |
| `quality_state`               | `accepted`, `reviewed`, `partial`, `inferred`, `disputed`, `missing_evidence`, or `blocked`.                                                                                                               |
| `evidence_state`              | `source_record`, `document_clause`, `system_metric`, `inferred_from_relationship`, `self_reported`, `not_available`.                                                                                       |
| `synthetic_generation_rule`   | Formula/scenario key used by the generator.                                                                                                                                                                |
| `scenario_thread_id`          | Planted business story or `portfolio_baseline`.                                                                                                                                                            |
| `row_hash`                    | Deterministic hash over business fields and lineage fields.                                                                                                                                                |

No generated row may contain employee names, personal email addresses, phone numbers or employee IDs.
Use `role_ref`, `role_title`, `worker_ref`, `team_ref`, `function_ref` and `portfolio_ref`.

## Source-System Depth Requirements

### Supplier Master

Systems: SAP Ariba SLP, Coupa Supplier Management, Oracle Supplier Portal, ServiceNow Vendor Risk.

Minimum depth per supplier row:

- supplier id, legal name, normalized display name and parent/vendor family
- supplier category, commodity code, country/region, diversity/sustainability flags if available
- onboarding status, qualification status, preferred/restricted state and effective dates
- risk tier, cyber/privacy risk state, latest review date and next review date
- relationship owner role, procurement owner role and vendor-management segment
- source-system status history marker; do not make every supplier active/current

### Contract Workspace / Contract Header

Systems: SAP Ariba Contracts, Coupa CLM, Icertis, DocuSign CLM, Ironclad, SharePoint legal repository.

Minimum depth per contract family row:

- contract id, workspace id, supplier id, legal entity, contract family id
- agreement type, document role, parent/child instrument relationship
- executed date, effective date, expiration date, renewal type, notice deadline, auto-renew flag
- annual value, committed value, currency, pricing model and commercial confidence
- owner roles for procurement, legal, IT service owner and finance approver
- source of commercial value, whether value came from contract, tracker, AP, or review
- document availability: full, partial, missing, disputed, superseded
- review state and reviewer role

Contract values from multiple sources must not be collapsed with `max()`. If values disagree, mark
the contract as disputed until a reviewed winner is declared.

### Legal Instruments, Clauses and Evidence Spans

Systems: CLM repository, SharePoint, Box, Google Drive, DocuSign, Adobe Sign.

Minimum depth per document/evidence row:

- file id, file name, document role, parent document id, contract id, SOW id, amendment id
- content hash, version, execution status, signature status and document date
- clause type, page number, section heading, span offsets and extraction confidence
- extracted value, value type, unit/currency, obligation owner role and due/trigger date
- extraction method, extractor version, prompt version, model id and human review state
- conflict group id where competing extractions exist

Tier 1 contracts require clause-to-page proof. Tier 2 contracts require selected commercial proof.
Tier 3 contracts may explicitly carry `document_availability = not_available`.

### Purchase Orders, Invoices, Payments and Accruals

Systems: SAP S/4HANA, Oracle Fusion, Coupa P2P, Ariba Buying, Workday Financials.

Minimum depth per financial line:

- supplier id, contract id if present, PO number, PO line, invoice id, invoice line
- GL account, cost center, business unit, company code, tax code where applicable
- service period start/end, posting date, invoice date, payment date/status
- line description, quantity, unit price, net amount, tax, gross amount, currency
- matching state: matched to active contract, mapped by supplier, off-contract, disputed, blocked
- commitment amount, actual spend, accrual/adjustment flags and reason codes
- approver role and AP processing state, not approver name

Rows must include normal enterprise messiness: late invoices, credits, adjustments, missing contract
refs, partial PO coverage, split cost centers and duplicate invoice controls.

### SaaS License and Usage

Systems: Microsoft Entra/M365 Admin Center, ServiceNow SAM, Zylo, Productiv, Okta, vendor admin
exports, GitHub/Atlassian admin exports.

Minimum depth per monthly usage row:

- product/SKU id, contract id, vendor id, tenant/subscription/workspace id
- assigned seats, active users, inactive users, paid seats, overage seats
- role/persona/team/function references with no personal identity
- usage metric name, usage count, last activity band and month
- unit cost, committed amount, actual cost and allocation basis
- renewal/true-up linkage and recoverability state
- usage evidence state: admin export, API metric, inferred, not available

AI/dev-tool rows must distinguish usage-supported value from finance-validated or claimable value.
Copilot, Claude Code, Now Assist and Workday agent examples require before/after metrics before any
productivity value can be claimable.

### Cloud Consumption

Systems: Azure Cost Management, AWS Cost and Usage Report, GCP Billing Export, Apptio Cloudability,
CloudHealth.

Minimum depth per monthly cloud row:

- billing account, subscription/account/project id, service name, meter, region, resource group/tag
- commitment id, reserved-instance/savings-plan marker, amortized cost and actual cost
- usage quantity, unit, list cost, negotiated rate, credit/discount type and overage
- application/platform/service allocation method and confidence
- forecast state and optimization recommendation state

Do not convert under-consumption into savings until commercial recoverability and forecast are known.

### Service Performance, SLAs and Credits

Systems: ServiceNow ITSM/SLA Management, vendor scorecard, Datadog, Splunk, Jira Service Management.

Minimum depth per metric row:

- contract id, service id/application id, metric name, target, actual, unit and period
- breach count, severity mix, incident/request/change counts where relevant
- credit eligibility, credit calculated, credit claimed, credit recovered and claim state
- root-cause category, vendor responsibility marker and dispute status
- source report/API and review state

The data must include earned-but-unclaimed credits, disputed credits and non-creditable misses.

### Workforce, Rate Cards and SOW Delivery

Systems: SAP Fieldglass, Beeline, Coupa Services Maestro, vendor invoices, SOW tracker.

Minimum depth per workforce/rate row:

- SOW id, work order id, role, level, location, rate card id and rate effective dates
- worker reference only, no name/email/employee id
- bill rate, currency, hours, utilization, blended rate, onshore/offshore mix
- approved rate, billed rate, variance, approval state and reason code
- change order id and whether rate-card amendment exists

Rows should expose rate drift, mix shift and change-order cumulative exposure.

### Sourcing Events and Supplier Responses

Systems: SAP Ariba Sourcing, Coupa Sourcing Optimization, Oracle Sourcing, Ivalua, Jaggaer.

Minimum depth per event/response row:

- event id, event type, stage, round, lot/package, requirement id and scoring weight
- invited supplier id, response id, response status, submitted timestamp and BAFO marker
- commercial line item, unit, volume assumption, price, transition cost, optional/excluded cost
- technical/commercial/risk score, evaluator role, exception type and clarification state
- normalized cost basis, comparability flag and unresolved gap reason

Rows must support “lowest headline price changed after normalization” as a planted story.

### Application, Platform and Scope Mapping

Systems: ServiceNow CMDB/APM, LeanIX, Apptio, CMDB export, EA repository.

Minimum depth per scope row:

- application/platform/service id, business capability, criticality, lifecycle, hosting model
- contract id, vendor id, relationship method, confidence and review state
- relationship source: explicit contract scope, CMDB provider, invoice/service mapping, inference
- retirement/modernization milestone and dependency where relevant

V4 must increase explicit scope relationships. Inferred rows are allowed, but they must be labeled.

## Required Planted Story Threads

Every v4 row should map to one of these story threads or to `portfolio_baseline`:

| Thread                             | Required cross-domain evidence                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `saas_rationalization`             | SaaS contract, renewal, license assignment, active usage, unit cost, application owner, recoverability clause.      |
| `managed_service_value_leakage`    | SOW, rate card, work order, invoice, SLA miss, service credit, auto-renewal, transition lead time.                  |
| `cloud_commitment_exposure`        | Cloud commitment, monthly consumption, forecast state, reserved capacity, application allocation, renewal decision. |
| `app_retirement_contract_conflict` | Contract scope, application lifecycle, retirement milestone, renewal/notice deadline, bridge recommendation.        |
| `ai_value_proof_gap`               | AI tool license, usage, DORA/baseline metric, claimed benefit, finance validation state, Tower claim state.         |
| `supplier_bafo_normalization`      | Sourcing event, supplier response, exception, normalized cost, score, award recommendation.                         |
| `evidence_conflict_resolution`     | Two or more extractions or systems asserting different values, conflict state, reviewer decision.                   |

The generator should plant connected patterns, not one-off anomalies. A story passes only when it can
be reached through at least three Cube views or product surfaces.

## Question-Backward Acceptance Contract

Each hard question must declare:

| Element                  | Required content                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Question                 | The executive or analyst question.                                                  |
| Intent                   | What decision the question supports.                                                |
| Required facts           | Exact facts and source systems needed.                                              |
| Grain                    | Contract, invoice line, monthly usage, SLA period, supplier response, etc.          |
| Cube view/drill path     | The governed view and hierarchy expected to answer it.                              |
| Visualization            | Table, waterfall, time series, scatter, Sankey, heatmap, funnel or evidence drawer. |
| Evidence                 | Source record and clause/page evidence requirement.                                 |
| Allowed conclusion       | What the system may say if data supports it.                                        |
| Prohibited overstatement | What the system must not claim.                                                     |
| Gap behavior             | How to answer when evidence is missing.                                             |

Initial v4 coverage target:

| Domain                                        | Questions |
| --------------------------------------------- | --------: |
| Executive portfolio and concentration         |        12 |
| Vendor 360                                    |        15 |
| Contract economics and commercial terms       |        20 |
| Spend, invoices and commitments               |        18 |
| SaaS/cloud consumption and utilization        |        15 |
| SLA, incidents and service credits            |        15 |
| Renewals, notice periods and leverage         |        15 |
| Application/platform dependencies             |        10 |
| Workforce and rate cards                      |        10 |
| Cyber/vendor risk                             |         5 |
| Sourcing events, supplier comparison and BAFO |        10 |
| AI adoption, productivity and value proof     |        10 |
| Evidence lineage, conflict and missing proof  |         5 |

## Data Quality Gates

The v4 package cannot be accepted unless:

- row-depth validator passes for every structured extract
- every field in the client template maps to a specific source system, report/API and joining key
- every row has lineage, quality state and evidence state
- row counts reconcile by extract, normalized sheet, Postgres table/view and Cube result
- contract annual value reconciles to the v4 manifest
- no personal names, emails, phones or employee ids are present
- explicit and inferred relationships are counted separately
- value/savings claims are not generated unless evidence permits
- planted story coverage is complete
- at least 150 question contracts have expected answer shapes and prohibited-overstatement rules

## What Rich Does Not Mean

Rich does not mean:

- all optional fields are populated
- every source agrees
- every contract has a PDF
- every usage metric proves value
- every invoice maps to a contract
- every recommendation is a savings claim

Rich means the data behaves like enterprise data: specific, joined, imperfect, auditable and useful
for decisions.
