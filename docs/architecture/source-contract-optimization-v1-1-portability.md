# Source Contract Optimization V1.1 Portability

## Problem We Are Solving

Large enterprises usually know what they pay a vendor, but they cannot quickly prove whether an incumbent contract should be renewed, renegotiated, re-scoped, recovered against, or recompeted. The relevant facts live across contract repositories, procurement systems, AP/ERP, ITSM, usage platforms, finance planning tools, and operational owners. A sourcing leader therefore gets a static vendor page, a pile of PDFs, and a spreadsheet exercise instead of a defensible decision path.

Source Contract Optimization turns that fragmented evidence into a shared four-ledger decision record:

- **Recoverable leakage:** money that should come back or stop because invoices, SLA credits, rate cards, duplicate charges, or off-contract spend prove leakage.
- **Avoided cost:** future spend not incurred because renewal uplift, shelfware, excess scope, consumption, or staffing demand is reduced before the commitment is made.
- **Negotiated improvement:** agreed commercial improvements such as price, term, index cap, volume tier, service credit, benchmark right, termination right, or scope concession.
- **Realized value:** finance-confirmed value only. Estimates, targets, and variance are not realized value.

The product promise is not “AI says save 20%.” The product promise is: AbarVa shows what is provable now, what is commercially addressable, what evidence is missing, what workflow must happen next, and when a value claim becomes finance-confirmed.

## Layer Contract

Source optimization follows the product information architecture:

1. **Client Intake:** client-owned files and extracts, organized by source owner and source system. Examples: CLM exports, PDF agreements, SOWs, order forms, invoice lines, PO lines, ITSM SLA reports, usage/entitlement reports, supplier offers, finance-confirmed value records.
2. **Source Adapters:** one adapter per intake tab/source family. Adapters preserve raw rows and parse source-specific fields into normalized evidence observations.
3. **Canonical / Semantic Source Model:** shared contract, vendor, event, ledger, and evidence records. This layer is tenant-scoped and does not contain product-page formatting.
4. **Products:** Contract 360, Door 1 workflow, Tower handoff, and aVa all consume the same shared optimization decision record and evidence observations.

No product page owns the evidence. Contract 360 renders it; Door 1 acts on it; Tower confirms realized value; aVa explains it.

## Shared Decision Record

Every tenant must resolve optimization into the same contract:

```text
tenant_key
dataset_version
contract_id
vendor_id
optimization_state
recoverable_leakage
avoided_cost
negotiated_improvement
realized_value
evidence_status
evidence_refs
confidence
owner
next_action
door1_event_id
tower_claim_refs
```

`recoverable_leakage`, `avoided_cost`, `negotiated_improvement`, and `realized_value` are nullable. Missing proof is represented as `EVIDENCE_MISSING`, `WORKFLOW_REQUIRED`, or `NOT_ESTABLISHED`; it is never represented as `$0`.

## Shared Evidence Classes

Tenant adapters may vary, but the normalized evidence classes must be shared:

```text
invoice
payment
rate_card
sla
service_credit
contract_term
renewal
usage
cloud_consumption
workforce
change_order
scope
benchmark
supplier_offer
approved_agreement
finance_value_confirmation
```

Each evidence observation must carry:

```text
tenant_key
dataset_version
contract_id
vendor_id
ledger_kind
evidence_class
evidence_status
grain
period_start / period_end where applicable
source_system
source_table
source_record_id
source_document_id / page / span where applicable
amount_usd where quantified
quantity / unit where relevant
confidence
review_state
evidence_refs
payload
```

## Critical Data by Grain

| Evidence family                     |                        Minimum grain |                                          History |      Refresh expectation | Ledger use                                         |
| ----------------------------------- | -----------------------------------: | -----------------------------------------------: | -----------------------: | -------------------------------------------------- |
| Executed agreement / MSA            |               document + clause span | current active term plus prior term if available | on upload/version change | contract_term, renewal, negotiated_improvement     |
| SOW / order form / pricing schedule |           line item + effective date |                     current term plus amendments | on upload/version change | scope, rate_card, contract_term                    |
| Change order / amendment            |                     change order row |                                    full SOW life | on upload/version change | change_order, avoided_cost, negotiated_improvement |
| Invoice lines                       |        invoice line + service period |                             12-24 months minimum |                  monthly | invoice, payment, recoverable_leakage              |
| PO lines                            |             PO line + service period |                             12-24 months minimum |                  monthly | payment, invoice match, scope coverage             |
| Rate card                           |  SKU/role/rate line + effective date |                     current and prior rate cards | on upload/version change | rate_card, recoverable_leakage                     |
| SLA/service credits                 | monthly service metric + credit rule |                             12-24 months minimum |                  monthly | sla, service_credit, recoverable_leakage           |
| Usage/entitlement                   |              SKU/user/workload/month |                             12-24 months minimum |                  monthly | usage, cloud_consumption, avoided_cost             |
| Supplier offers/benchmarks          |   supplier/round/normalized bid line |    current event and relevant benchmark snapshot |             event-driven | supplier_offer, benchmark, negotiated_improvement  |
| Finance value confirmation          |        value claim + metric + period |            baseline, target, actual, attestation |        monthly/quarterly | finance_value_confirmation, realized_value         |

## Source-System Adapter Examples

| Source owner                   | Common systems                                                                                | What the adapter extracts                                                                               | Normalized classes                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Legal / Procurement Operations | Icertis, Ironclad, DocuSign CLM, Agiloft, Conga, SharePoint                                   | executed agreements, SOWs, order forms, pricing schedules, clauses, renewals, amendments, change orders | contract_term, renewal, rate_card, scope, change_order |
| Procurement / S2P              | SAP Ariba, Coupa, Oracle Procurement, Workday Strategic Sourcing, Zip                         | sourcing events, supplier responses, bid rounds, award summaries, approved savings cases                | supplier_offer, benchmark, approved_agreement          |
| AP / ERP                       | SAP S/4HANA, Oracle Fusion, Workday Financials, NetSuite, Coupa Invoice                       | invoice lines, payments, PO matching, GL coding, credits, disputes, taxes, pass-throughs                | invoice, payment                                       |
| ITSM / Service Management      | ServiceNow, Jira Service Management, PagerDuty, BMC Helix                                     | SLA performance, incident severity, breach logs, service review packs, credit eligibility               | sla, service_credit                                    |
| Usage / Consumption            | Salesforce Admin, Microsoft 365 Admin, Snowflake, AWS CUR, Azure Cost Management, GCP Billing | seats, active users, assigned users, workload, storage, compute, feature adoption, license assignment   | usage, cloud_consumption                               |
| Finance / Tower                | FP&A model, ERP GL, Apptio, Anaplan, AbarVa Tower                                             | baseline, target, actual, owner, attestation, accepted claim, caveats                                   | finance_value_confirmation, workforce                  |

## Contract PDF Extraction

Physical contract PDFs should be stored as original evidence objects in the document/source file layer and parsed into structured extraction rows. The original PDF remains the legal artifact; parsed facts are only the searchable/analytical projection.

The parser should extract, at minimum:

- Parties, agreement title, document role, parent document, contract ID, vendor ID.
- Term start/end, notice deadline, renewal mechanism, auto-renewal, termination rights.
- Scope summary, included services/products, excluded services/products, covered geographies/entities.
- Pricing schedule references, rate cards, discount tiers, indexation/cap language, minimum commits.
- SLA targets, remedies, service-credit formulas, claim windows, caps and exclusions.
- Benchmark rights, audit rights, most-favored-customer language if present, data/security obligations.
- Change-order/amendment history and cumulative value position against original SOW when present.
- Approval/signature roles and effective dates.

Each extracted fact must include document ID, page/span, extractor version, confidence, review state, and supersession lineage. If extraction cannot confidently parse a clause, it must produce a required evidence item or human review task, not an inferred value.

## Workflow Contract

### Contract 360

Contract 360 should answer: “What is this contract, why should I care, what proof do we have, and what should happen next?”

Recommended tabs:

1. **Story:** executive summary, ranking basis, strongest proof, biggest gap, recommended next action.
2. **Scope:** plain-English contract overview, covered products/services/apps, source of the scope, and unresolved scope gaps.
3. **Economics:** annual value, actual spend, committed value, invoice/rate-card exceptions, PO/invoice relationship, and what each number means.
4. **Performance:** SLA/incident/service-credit evidence. This tab must separate operational pain from recoverable credits.
5. **Relationship:** interactive contract relationship map showing agreement, scope, source feeds, evidence observations, four ledgers, Door 1 plan, and Tower proof.
6. **Evidence:** files/extracts, row/page lineage, parse status, review status, and gaps.
7. **Optimize:** four-ledger cockpit and Door 1 handoff. This tab should show values only when evidence supports them.

### Door 1

Door 1 is the fast path for incumbent optimization:

```text
Baseline -> leakage diagnosis -> commercial levers -> negotiation plan -> executive approval -> agreement -> Tower value proof
```

If a user launches Door 1 from Contract 360, the selected contract must pre-populate the workflow. If a user launches Door 1 directly, the workflow must force contract selection before optimization facts can be approved.

### Tower Handoff

Tower receives only measurement-ready claims:

- realized value amount, if finance-confirmed;
- metric definition;
- baseline/target/actual;
- owner role;
- cadence;
- caveats;
- evidence refs.

Tower must not treat recoverable leakage, avoided cost, or negotiated improvement as realized value unless Finance confirms the value claim.

### aVa

aVa should answer from the same evidence classes and decision record as the UI. It may explain, summarize, compare, and produce tables/charts, but it must not invent missing evidence. For outside-in market context, aVa can add clearly labeled advisory context, but the contract-specific values still come from governed evidence.

## Second-Tenant Portability Requirement

The feature is complete only when a second tenant can use the same code path:

- same decision-record table;
- same evidence-observation table;
- same Door 1 journey;
- same Contract 360 components;
- same Tower value gate;
- different tenant evidence produces different results;
- missing evidence stays explicit;
- zero cross-tenant reads;
- no default-to-canary behavior.

A second tenant should be loaded from the new source templates/processes and then validated by querying the shared decision/evidence tables and exercising Contract 360 and Door 1 without adding tenant-specific product logic.

## QA Gate

Do not call the capability QA-passed until all are true:

- Data reconciliation: raw rows, evidence observations, decision records, and Contract 360 read models agree.
- Value reconciliation: four-ledger amounts match the underlying detail files, not hand-entered totals.
- PDF extraction proof: extracted contract facts link back to document ID and page/span.
- Tenant proof: canary tenant and a second tenant both work through the same service and UI components.
- Browser proof: Contract 360 Story, Scope, Economics, Performance, Relationship, Evidence, Optimize, and Door 1 run without stale tenant labels or mismatched event profiles.
- aVa proof: contract-specific questions return concise answers with correct values, explicit missing evidence, and chart/table output where requested.
