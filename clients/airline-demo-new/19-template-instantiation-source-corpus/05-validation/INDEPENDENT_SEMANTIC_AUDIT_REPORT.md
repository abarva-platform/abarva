# Independent Semantic Audit Report

Tenant: `airline-demo-new`  
Package: `airline-demo-new-source-corpus-v1.0.0`  
Audit date: 2026-07-27  
Disposition: **HOLD / DO NOT MERGE AS FROZEN FOUNDATION**

## Executive Decision

The package now meets the requested large-airline row-count scale, but it does **not** yet pass semantic realism, relationship coherence, reconstructability or procurement-completeness review. It should remain open as a candidate until the P0 defects below are remediated and re-audited.

This is not a criticism of scale. The scale is now directionally right. The issue is that the rows still behave like generated volume, not a reconstructable operating model for a $50B+ global carrier.

## What Passed

| Area | Result | Evidence |
|---|---:|---|
| Enterprise scale counts | PASS | 1,495 apps; 6,200 integrations; 10,000 infra/cloud/mainframe rows; 1,250 data products; 6,200 BI reports; 420 vendors; 820 contracts/SOWs; 60,000 relationship candidates. |
| Technology vocabulary breadth | PASS | Mainframe, SAP ECC/S/4HANA, Teradata-scale EDW, Oracle/SQL Server, AWS, Azure, private cloud, SaaS and airline operations patterns are represented. |
| Source-family strategy | PASS | The package correctly uses a few large extract families plus representative narrative/commercial documents rather than one workbook per object. |
| Synthetic boundary | PASS | No Azure apply, DB migration, parser/source load, or product-runtime wiring is included. |

## P0 Blockers

### 1. Enterprise realism is broad, but not coherent enough

The generated estate covers airline vocabulary, but key object relationships look cyclic rather than domain-modeled. For example:

| Application family | Count | Issue |
|---|---:|---|
| Flight operations and IROPS | 110 | Rows distribute nearly evenly across Crew Operations, Airport Operations, Commercial, Corporate Finance, Technology, Cybersecurity, Service Management, Cargo, Procurement, Data and AI and Workplace. That is a generator pattern, not a plausible application estate. |
| Maintenance engineering MRO supply chain | 125 | Rows again spread evenly across unrelated functions instead of concentrating in technical operations, engineering, inventory, procurement and finance dependencies. |
| ERP finance procurement HR supply chain | 100 | Rows spread evenly across airline operations functions rather than modeling SAP/corporate-process concentration. |

Required remediation: regenerate or enrich records using domain-specific placement rules, not modulo-style distribution. Families should have believable primary functions, secondary dependencies and exception patterns.

### 2. Relationship graph is large, but not operating-chain deep

The 60,000 relationship candidates do not yet prove a real airline knowledge graph.

| Finding | Result |
|---|---:|
| Relationships total | 60,000 |
| `from_object_type=application` | 60,000 / 60,000 |
| Other source node types | 0 |
| Broken business-process endpoints | 4,000 |
| Broken endpoint values | `passenger reaccommodation` and `MRO planning` are referenced but not present in the process node set. |

This means the graph is essentially application-centric fanout. It does not yet model complete operating chains such as disruption → OCC decision → crew/aircraft constraint → cancellation → reaccommodation → baggage reroute → customer notification → voucher/refund/compensation → SLA/control/vendor/contract exposure.

Required remediation: add explicit chain IDs, sequence/order, process/capability/source nodes, and multi-hop links across capability, process, application, integration, data product, infrastructure, vendor, contract, SLA, risk and control. The audit should require sample traversals to pass.

### 3. Contract rows lack commercial/legal depth

The package has 820 contract/SOW rows, but the structured contract sample is missing core commercial/procurement fields needed for Source and Tower-quality reasoning.

Missing structured columns include:

`renewal_date`, `effective_date`, `expiration_date`, `termination_rights`, `pricing_model`, `minimum_commitment`, `rate_card_id`, `service_credit_terms`, `inflation_provision`, `change_control_terms`, `subcontracting_terms`, `data_residency`, `transition_assistance`, `sla_history_source`, `invoice_source`, `change_order_source`, `lot_id`, `proposal_id`, `bafo_revision_id`, `evaluation_criteria_id`.

Required remediation: expand the contract/SOW sample schema and populate differentiated, internally consistent commercial terms by service lot and supplier family.

### 4. Procurement event completeness is mostly prose, not structured evidence

For the Global Technology Managed Services event, the package describes proposal and BAFO expectations, but the sample corpus does not include structured proposal, BAFO, rate-card, invoice, incident, SLA-history or evaluation artifacts.

| Evidence family | Structured sample present? |
|---|---:|
| Vendor proposals | NO |
| BAFO revisions | NO |
| Rate cards | NO |
| Invoice extracts | NO |
| SLA history | Partial only via KPI/SLA catalog |
| Incident/service history | NO |
| Evaluation scorecards | NO |

Required remediation: add source-visible structured sample files for each lot: incumbent baseline, rate cards, invoice/change-order history, SLA/incident history, three differentiated proposals, pricing schedules, assumptions/exceptions, BAFO revisions, transition commitments and evaluation criteria.

### 5. Reconstructability is not proven

The package includes a hidden-truth boundary, but the current evaluator crosswalk is only a tiny illustrative sample.

| Finding | Result |
|---|---:|
| Parser-visible generated rows across major samples | 100,000+ |
| Hidden truth sample objects | 6 |
| Source-to-truth crosswalk rows | 4 |

This cannot prove that parser-visible evidence can reconstruct hidden truth, detect contradictions or surface ambiguity at enterprise scale.

Required remediation: create a real reconstruction audit set with supported objects, multi-source-supported objects, unsupported hidden-truth objects, contradictions, ambiguous identifiers, stale records, duplicates and broken relationship endpoints.

## Merge Recommendation

**Do not merge PR #5675 as the frozen Airline Demo New synthetic-source foundation yet.**

Safe next step: keep the PR open, remediate the five blockers above, regenerate the affected source samples and rerun this semantic audit. The package can merge only after:

1. Domain coherence passes on applications, infrastructure, data, contracts and process maps.
2. Relationship graph contains valid, multi-hop operating chains with zero broken endpoints.
3. Contract/SOW/procurement fields support real Source decisioning.
4. Procurement event evidence exists as structured files, not just narrative commitments.
5. Source-to-truth reconstructability is measured and passes with intentional imperfections.

## Boundary

This audit did not run Azure, Postgres, parser jobs, publication jobs or live product tests. It is a pre-merge semantic and structural review of the synthetic design package only.
