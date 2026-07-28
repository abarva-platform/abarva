---
contract_id: standard-product-scope-v1
status: boundary_freeze_candidate
release_lane: global-control-lane
scope_type: standard_product_commitment
owner: AbarVa product and data governance
effective_date: 2026-07-28
source_of_truth: docs/product/STANDARD_PRODUCT_SCOPE.md
depends_on:
  - docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md
runtime_completion_rule: >-
  A capability is included in the standard product only when it is implemented
  and live-proven, or explicitly marked unavailable and removed from the
  included commitment.
---

# Standard Product Scope

## Purpose

This document freezes what the standard AbarVa product includes before any team expands the platform
into client-specific analytics, custom connectors, or bespoke advisory work.

The standard product is not an unlimited data-science or reporting service. AbarVa processes and
connects the agreed evidence, publishes a governed Knowledge baseline, exposes standard intelligence
and analytics, and supports repeatable sourcing and transformation decisions. Client-specific
analytical products, source-system remediation, and ongoing analytical labor are optional services.

## Operating Boundary

All standard product work follows the Enterprise Information Architecture:

1. Client intake is organized by the people or systems that own the data.
2. Source adapters normalize intake into canonical objects.
3. The canonical enterprise model is the source of truth.
4. Home, Tower, Moves, Source, Intelligence, Learn, Cube, Superset, and Observable are projections.

No product owns data. Products consume approved canonical facts, relationships, evidence, metrics,
and publications.

## Included Standard Capabilities

| Area | Included standard capability | Runtime status |
| --- | --- | --- |
| Knowledge foundation | Source registration, parsing, normalization, entity/fact/relationship resolution, evidence lineage, review, immutable publication, active baseline, rollback, projections, and reconciliation. | Partially implemented for the current foundation path; live activation still requires the open proof gates listed below. |
| Client onboarding | Processing agreed client-staged extracts and interview outputs using supported file formats, standard mappings, and evidence-led validation. | Included as a standard process; client-facing onboarding packs and live pilot proof remain separate evidence. |
| Standard enterprise context | Applications, business capabilities, infrastructure, vendors, contracts, programs, risks, workforce, metrics, relationships, evidence gaps, conflicts, and freshness. | Included where source data is supplied, accepted, and published. Missing data must remain visible as a gap. |
| Knowledge experience | Brief, Explore, Relationships, Evidence, Operations and Vendor Intelligence, gaps, freshness, conflicts, deferred information, and unavailable states. | UI/UX lane exists; product proof must bind each surface to the active baseline and projection hash. |
| aVa | Baseline-bound, audited reasoning using approved Knowledge and visible evidence. | Included only when responses expose or bind the same baseline/projection identity as the source projections. |
| Cube | Standard semantic models and reusable governed measures. | Included for standard measures with Cube-to-PostgreSQL parity proof. Measures without canonical comparison remain unavailable, not implied. |
| Superset | Standard dashboards and analytical drill-down over governed data. | Included after read-only identity, governed datasets, dashboard deployment, and baseline/projection/metric parity proof. |
| Observable | Standard curated narrative views where included in the package. | Optional in the standard package until it proves the same governed metric payload as Cube and PostgreSQL. |
| Source module | Existing-contract optimization and new sourcing-event workflow using the shared Knowledge foundation. | Included as workflow ownership; Source may receive opportunity signals but must not duplicate Knowledge or analytics ownership. |
| Standard vendor intelligence | Renewal windows, supported applications, capabilities touched, contract inventory, supplied spend summaries, incident/SLA summaries, concentration, transformation exposure, evidence coverage, and freshness. | Included only from approved source data and governed metrics. Raw operational analytics remain excluded unless supplied in standard extracts. |
| Standard reporting | Predefined executive and analyst views. | Included for standard views only; bespoke dashboards and custom measures are optional. |
| Refresh | Agreed periodic refresh using unchanged supported extracts and the same governed path. | Included when input versions, parser versions, baseline IDs, and projection hashes reconcile. |
| Governance | Tenant isolation, review policy, lineage, baseline versions, reconciliation, audit proof, and rollback evidence. | Mandatory for all standard capabilities. |

## Supported Standard Source Inputs

The standard product accepts agreed files or exports, not open-ended live operational access.

| Input family | Typical source owner | Standard examples | Standard expectation |
| --- | --- | --- | --- |
| Enterprise identity and organization | Enterprise architecture, HR, operating model owner | Business units, functions, roles, decision owners, geography, legal entities. | Client stages the extract or interview output; AbarVa maps to canonical objects. |
| Applications and platforms | CMDB, enterprise architecture, application portfolio owner | Application inventory, lifecycle, criticality, hosting, integrations, owners. | Partial inventories are acceptable if coverage gaps are visible. |
| Infrastructure and cloud | Infrastructure, cloud platform, data center, FinOps owners | Cloud accounts/subscriptions, data centers, private cloud, network, resilience, hosting. | Used for dependency and exposure intelligence, not detailed performance monitoring. |
| Data and analytics | Data office, analytics platform, BI owners | Data products, warehouses, marts, lineage, BI tools, AI/ML platforms, data quality. | Used to explain readiness, lineage, and bottlenecks. |
| Vendors and contracts | Procurement, vendor management, legal, finance | Vendor register, contract metadata, renewal dates, service scope, key obligations, amendments. | Routine metadata is standard; deep legal interpretation and custom taxonomies are optional. |
| Spend and budget | Finance, IT finance, procurement | Budget categories, supplier spend, run/change spend, initiative budgets where supplied. | Money is deterministic and quoted only when source lineage reconciles. |
| Incidents and SLA summaries | Service management, vendor management, operations | Ticket volume summaries, SLA attainment, recurring incident themes, service credits where supplied. | Summary-level operational evidence is standard; ticket-level analytics is optional. |
| Programs and initiatives | PMO, transformation office, sponsors | Program inventory, stage, owner, target outcome, dependencies, evidence gates. | Used for transformation exposure and Moves/Source handoff. |
| Risks and controls | Risk, security, compliance, audit | Risk register, controls, findings, evidence status, exceptions. | Source-backed risks may be published; interpreted or high-impact claims require review. |
| Interviews and workshops | CXO sponsors, functional owners, technical owners | Priorities, constraints, decisions, operating pain, evidence needed. | Treated as evidence with speaker role and confidence, not as hard fact unless confirmed. |

## Standard Entities

The standard canonical model includes these entity classes when supported by accepted evidence:

| Entity | Standard use |
| --- | --- |
| Organization | Enterprise, business unit, operating company, function, owner group. |
| Business capability | What the enterprise must be able to do. |
| Business process | Operational process or value stream step. |
| Application | Application, system, product, or major custom platform. |
| Platform | Infrastructure, cloud, data center, database, network, AI/ML, and integration platform. |
| Data product | Data domain, data set, mart, warehouse, lakehouse asset, report, model input. |
| Vendor | Supplier or service provider. |
| Contract | Agreement, order, statement of work, amendment, renewal, service obligation. |
| Program | Transformation program, sourcing program, remediation program, AI initiative. |
| Risk and control | Risk, control, finding, gap, exception, remediation. |
| Metric | Definition and observation for spend, service, operational, value, adoption, quality, and risk measures. |
| Evidence | Source file, row, document, interview, extract, or approved assertion. |

## Standard Relationships

Relationships are first-class canonical facts. They are not UI-only edges.

| Relationship pattern | Example |
| --- | --- |
| Organization owns capability | Operations owns irregular-operations recovery. |
| Capability depends on application | Contact-center resolution depends on CRM and telephony. |
| Application hosted on platform | Revenue system hosted on private cloud or public cloud. |
| Application integrates with application | Crew scheduling integrates with operations recovery. |
| Vendor provides application or service | Vendor provides managed services for a portfolio of applications. |
| Contract governs vendor/service | Master agreement or SOW governs support scope and renewal date. |
| Program changes application/capability | Modernization program changes data foundation or operating model. |
| Risk applies to application/program/vendor | End-of-life platform risk applies to a critical application. |
| Metric measures capability/program/vendor | SLA attainment measures provider performance. |
| Evidence supports fact or relationship | Contract row, CMDB row, or interview supports the assertion. |

Routine inventory relationships can be accepted through governed batches when source-derived and
evidence-backed. Commercial conclusions, KPI interpretations, target-state assertions, and
high-impact dependency claims require defer or individual review.

## Standard Cube Metrics

Cube defines reusable governed measures over the approved projection tables. It does not invent
business conclusions.

| Metric family | Standard examples | Availability rule |
| --- | --- | --- |
| Inventory | application count, vendor count, contract count, data-product count, relationship count. | Available when accepted canonical rows exist and projection counts reconcile. |
| Coverage | evidence coverage, source coverage, ownership coverage, freshness coverage, completeness gaps. | Available when coverage fields or evidence references are populated. |
| Vendor exposure | applications supported by vendor, capabilities touched, renewal exposure, concentration exposure. | Available when vendor/application/contract relationships are approved. |
| Operational exposure | incident/SLA summary measures, recurring incident themes, service-risk exposure. | Available only when summary-level incident/SLA inputs are supplied and accepted. |
| Financial | supplied spend, budget, run/change split, contract value, service spend. | Available only with deterministic source lineage and reconciliation. |
| Transformation | programs at risk, programs by stage, dependency exposure, baseline readiness. | Available when programs and dependencies are accepted. |
| Risk and control | open critical gaps, controls by status, evidence gaps by domain. | Available when source-backed risks and controls are accepted. |

If a metric does not have an independent canonical comparison or accepted source data, it must be
reported as unavailable or not measured. It must not be approximated by the renderer or by a model.

## Standard Dashboards

| Dashboard | Included purpose | Boundary |
| --- | --- | --- |
| Knowledge executive brief | CXO read on what is known, missing, stale, conflicting, and ready for use. | Reads the active Knowledge baseline only. |
| Explore | Browse entities, facts, and evidence by dimension. | Does not let the product redefine canonical data. |
| Relationships | Traverse approved relationships and show gaps in relationship coverage. | Uses approved projections; future graph engines are accelerators, not source of truth. |
| Evidence | Show source files, lineage, freshness, conflicts, and deferred categories. | Does not hide missing or unreviewed evidence. |
| Operations and Vendor Intelligence | Standard vendor exposure, renewal, operational summaries, concentration, and transformation exposure. | Standard summaries only; raw ticket analytics and custom contract models are optional. |
| Standard Superset dashboard | Analyst drill-down over governed projections and standard Cube/read contracts. | No bespoke client measures or dashboards unless scoped as optional work. |
| Standard Observable narrative | Curated narrative view over the same governed metric payload, where included. | Must not diverge from Cube/PostgreSQL measure definitions. |

## Standard Source Workflows

Source owns sourcing execution. Knowledge and analytics may identify opportunities, but Source owns
the workflow after the signal.

| Workflow | Included standard scope |
| --- | --- |
| Existing-contract optimization | Diagnose agreement scope, renewal exposure, service gaps, obligations, and recoverable-value opportunities where evidence supports them. |
| New sourcing event | Prepare scope, RFP, vendor response comparison, normalized pricing, BAFO support, decision package, transition plan, and value tracking. |
| Opportunity handoff | Receive a Knowledge/Cube opportunity signal with baseline identity, evidence, and metric context. |
| Decision evidence | Preserve decision rationale, evidence, caveats, and approval boundaries. |

Source does not own the vendor master, contract master, spend truth, application inventory, or
operational metrics. Those live in the canonical model and projections.

## Responsibility Model

### Client Responsibilities

- Provide agreed extracts, documents, or interview outputs from named source owners.
- Identify data owners and accountable reviewers.
- Confirm sensitive-value disclosure mode: exact, range, indexed, trend-only, or withheld.
- Validate high-impact commercial, KPI, target-state, and dependency claims.
- Approve review batches or individual decisions before publication.
- Review source-system quality issues that block confidence.

### AbarVa Responsibilities

- Provide standard intake guidance, mappings, adapters, validation, and load process.
- Preserve lineage from every published claim back to source evidence.
- Keep products bound to the active baseline and projection identity.
- Maintain tenant isolation, review policy, reconciliation, and rollback evidence.
- Present unavailable, deferred, stale, conflicting, and incomplete states plainly.
- Avoid converting synthetic, inferred, or planning-grade content into client facts.

### Shared Responsibilities

- Agree the pilot scope, source families, refresh cadence, and acceptance evidence.
- Decide which optional accelerators are in scope.
- Review exceptions before any baseline is promoted.
- Confirm that standard reports answer the business problem before adding bespoke analytics.

## Explicitly Not Included in Standard Scope

The following are not standard product commitments:

- custom live connectors to ServiceNow, ERP, CLM, monitoring, procurement, data-center, or cloud systems;
- source-system remediation;
- ticket-level analytics across raw operational transactions;
- detailed invoice, purchase-order, or rate-card reconciliation;
- client-specific should-cost models;
- external benchmark acquisition;
- bespoke Cube measures;
- custom Superset dashboards;
- predictive pricing or renewal models;
- optimization and scenario engines;
- custom contract taxonomies;
- continuous managed reporting;
- near-real-time ingestion;
- additional tenants, business units, geographies, or source families beyond agreed scope;
- legal, procurement, finance, risk, compliance, clinical, or executive approval authority.

## Optional Accelerators

| Accelerator | When it applies |
| --- | --- |
| Contract Intelligence Accelerator | A client wants deeper clause taxonomy, rights/obligations extraction, amendments, or legal/procurement review packs. |
| Vendor Optimization Accelerator | A client wants vendor segmentation, consolidation scenarios, service redesign, or negotiation strategy beyond standard exposure views. |
| Sourcing Event Accelerator | A client wants AbarVa to prepare and run a specific sourcing event with richer market, response, and BAFO support. |
| IT Cost Optimization Accelerator | A client wants invoice, PO, rate-card, consumption, and unit-cost reconciliation. |
| AI and Data Rights Assessment | A client wants rights, data-use, model-use, privacy, or responsible-AI review across contracts and platforms. |
| Product Roadmap Accelerator | A client wants custom modules, custom visuals, or productized capabilities not yet in standard scope. |
| Analytics Pod | A client wants recurring bespoke reporting, custom data products, continuous analysis, or managed insights. |

## Analytics-Pod Triggers

Move work into an analytics pod when any of these are true:

- the request requires a new source connector or ongoing extract operations;
- the metric is not in the standard Cube contract;
- the dashboard is bespoke to one client or business unit;
- raw ticket, invoice, PO, rate-card, log, or telemetry transactions must be analyzed;
- external benchmark data must be acquired or licensed;
- the answer requires custom modeling, prediction, optimization, or scenario simulation;
- the client asks for ongoing reporting labor rather than standard refresh.

## Product Roadmap

| Capability | Roadmap posture |
| --- | --- |
| Live enterprise connectors | Future capability or client-scoped accelerator, not standard P0/P1. |
| Apache AGE or graph engine acceleration | Future read-side optimization only after relational graph projections prove a measured need. |
| Predictive renewal and pricing models | Future capability, not standard scope. |
| Advanced optimization engines | Future capability or accelerator. |
| Client-specific contract taxonomies | Accelerator. |
| Near-real-time operations intelligence | Accelerator or future capability after source operations are funded. |

## Acceptance Evidence and Live Status

Standard product scope is not complete until evidence exists for every included runtime capability.

| Gate | Required evidence | Current status |
| --- | --- | --- |
| Knowledge baseline | Active baseline ID, content hash, source release ID, review package hash, review policy version, rollback point. | In progress for the current foundation path; activation remains blocked until all proof gates pass. |
| Projections | Projection version, projection content hash, row counts, reconciliation output. | Projection proof exists for the current foundation path; product activation proof remains open. |
| Cube parity | Metric definition version, Cube result, PostgreSQL result, parity status. | Comparable standard measures pass in the latest evidence; unavailable measures remain not measured. |
| Home/Knowledge | Signed-in proof that UI reads the active baseline without fixtures or fallback data. | Required. |
| aVa | Audit row and model-visible packet reference the same tenant, baseline, projection, and evidence identity. | Required. |
| Superset | Read-only governed identity, governed datasets, dashboard, and same baseline/projection/metric identity. | Required. |
| Observable | Same governed metric payload as Cube/PostgreSQL. | Required if Observable remains included. |
| Source handoff | Opportunity signal carries baseline identity, evidence, metric context, and clear ownership handoff into Source. | Required. |
| Rollback | Previous or empty baseline can be restored and consumers stop reading the newer baseline. | Required. |

Every downstream response or dashboard must expose or internally bind:

- `tenant_key`
- `baseline_id`
- `baseline_content_hash`
- `projection_version`
- `source_release_id`
- `review_policy_version`
- `review_package_hash`
- `refresh_run_id`
- `metric_definition_version`, where metrics are used

## Preflight Rigor Before Heavy Execution

Before running expensive or mutating Azure jobs, the implementation lane must prove:

- schema contracts compile against the target database;
- source-to-target mappings are declared;
- projection SQL dry-runs cleanly;
- ledger writes use valid enum states and are idempotent;
- accepted, published, baseline, projection, and metric counts reconcile;
- no product reads fixtures when a governed baseline is expected;
- rollback is defined before activation.

This is the control that prevents repeated long-running rebuilds caused by schema, enum, mapping, or
projection assumptions discovered only after execution.
