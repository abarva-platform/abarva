# Integrated Healthcare Template And Synthetic Data Walkthrough

Status: client-facing orientation draft
Audience: client executives, data owners, procurement, IT, analytics, and transformation leads
Scope: synthetic integrated-healthcare example only; not a live-client fact set

## Purpose

This walkthrough explains how AbarVa uses the universal tenant-input templates and why the synthetic healthcare example exists.

The example is not presented as a real client record. It is a teaching asset:

- show the structure of the intake templates;
- show the level of detail that makes the platform useful;
- show how raw evidence becomes canonical objects, relationships, metrics, and product views;
- help client data owners understand what they would provide and which fields can remain unknown until evidence exists.

## How To Position This With Clients

Use the templates as the contract and the synthetic data as an example fill, not as a benchmark or factual claim.

Suggested language:

> These files are synthetic examples built to show the intake pattern and expected depth. Your team would not be asked to hand-author all of this from scratch. You provide source extracts, registers, contract artifacts, and SME answers; AbarVa maps them into this template set, validates them, and flags gaps before anything becomes product-visible.

Do not describe any synthetic row as an actual client fact. Do not imply that generated vendor terms, spend, staffing, metrics, or systems are verified until a client source record supports them.

## Template Model

The approved template set is:

`datasets/tenant-inputs/templates/universal/standard-2026-07-v3`

Clients normally interact through intake workstreams, not all canonical files at once:

- Enterprise profile and operating model
- Business functions and ownership
- Applications, data, integrations, infrastructure
- Vendor contracts and managed services
- Spend, programs, risks, controls, metrics, and evidence sources
- AI/automation value and usage evidence where applicable

The manifest is the source of truth for required columns and order:

`datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json`

## Integrated Healthcare Example Volumetrics

These counts describe the repo-local synthetic example after integration. They are useful for explaining shape and density, not for making external performance claims.

| Layer                            | Artifact / Source                                                    |                                                                    Current Volume | What It Demonstrates                                                                                                    | Drill Path                                                     |
| -------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| L1 intake templates              | 19 universal CSV templates plus supporting source-appendix workbooks |                                                   19 required canonical templates | Client-owned source collection, organized by owner and evidence type                                                    | Template -> source extract -> evidence request                 |
| L1 synthetic healthcare example  | `datasets/tenant-inputs/active/meridian-health/current`              |                                                     24 CSV files, 3,887 data rows | What a filled integrated-healthcare packet can look like                                                                | Function -> system -> vendor -> spend -> metric                |
| L2 source adapters               | Mapping profiles for each intake family                              |                     24 active healthcare CSV families including source appendices | Field normalization without product ownership of source files                                                           | CSV row -> mapping profile -> canonical object candidate       |
| L3 canonical object candidates   | Graph node index from reconciliation dry run                         |                                 1,496 indexed node rows in the dry-run node index | Deterministic object identities across functions, systems, vendors, data assets, risks, programs, metrics, and evidence | Object -> object type -> source file -> source row             |
| L3 relationship graph candidates | `12_relationships.csv` plus reconciliation output                    |                          2,302 relationship rows, 2,302 candidates, 0 quarantined | Resolved object-to-object graph without placeholder nodes                                                               | Function -> owner -> system -> vendor -> risk/control          |
| L3 metrics and outcomes          | `14_metrics_outcomes.csv`                                            |                                                                    50 metric rows | KPI and outcome definitions with owner, source, baseline, target, and calculation basis                                 | Metric -> business function -> data source -> evidence         |
| L3 vendor and contracts          | `07_vendors_contracts.csv`                                           |                                                           72 vendor/contract rows | Commercial register shape: owner, term dates, renewal, spend, model, supported systems/functions, risk                  | Vendor -> contract -> supported systems -> renewal exposure    |
| L3 data and integration paths    | `05_data_assets_integrations.csv`                                    |                                                   520 integration/data-asset rows | System-to-system and data-domain connectivity                                                                           | Source system -> target system -> data asset -> quality status |
| L3 analytics/cube examples       | SQL Server mart/cube system rows and AI source appendices            | 17 data-platform maturity rows, 18 AI value ledger rows, 18 KPI outcome feed rows | Cube/mart-oriented drill paths without making BI tools the source of truth                                              | Mart/cube -> metric -> function -> owner                       |
| L4 product projections           | Not refreshed in this repo-local change                              |                                                       0 runtime projection writes | Products must consume governed L3 projections, not active CSV files directly                                            | L3 candidate -> approved projection job -> product read model  |

## What Clients Fill

Clients do not need to fill every field on day one. The expected pattern is:

- Provide the best available source extract or document for each workstream.
- Keep unknown values blank rather than inventing.
- Mark source date, confidence, owner, and known gaps.
- Prefer source-owned labels over AbarVa assumptions.
- Use vendor contracts, SOWs, order forms, invoices, renewal calendars, and procurement registers for commercial fields.
- Use CMDB, ITSM, data catalog, IAM, finance, PMO, and KPI sources for operating-model fields.

## What AbarVa Generates Or Derives

AbarVa can derive normalized rows and relationship candidates from client-provided evidence. The generation rule is conservative:

- generate nodes from source-backed rows;
- generate edges only when both endpoints resolve to source-backed objects;
- never create a placeholder node only to satisfy an edge;
- quarantine unresolved or empty endpoints;
- keep synthetic examples marked as synthetic planning-grade content.

## Hierarchy And Drill Paths To Show

The integrated healthcare example is strongest when shown through drill paths rather than raw row counts.

| Demo Question                           | Template Families Involved                                                                            | Expected Traversal                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| What runs a critical business function? | `01_business_functions`, `04_applications_systems`, `05_data_assets_integrations`, `12_relationships` | Function -> systems -> integrations -> data assets                          |
| Who owns the system and the data?       | `02_org_ownership`, `04_applications_systems`, `05_data_assets_integrations`                          | System -> business owner -> technology owner -> data steward                |
| Which vendors and contracts support it? | `07_vendors_contracts`, `17_service_scope_managed_services`, `12_relationships`                       | System -> vendor -> contract -> renewal/spend/risk                          |
| Which metrics depend on it?             | `14_metrics_outcomes`, `13_evidence_sources`, `12_relationships`                                      | Metric -> data source -> evidence -> owner                                  |
| Which risks or controls touch it?       | `11_risks_controls`, `09_programs_initiatives`, `12_relationships`                                    | Risk/control -> impacted systems -> mitigation program -> accountable owner |
| Where are the cubes/marts?              | `04_applications_systems`, `05_data_assets_integrations`, `19_data_analytics_platform_maturity.csv`   | Mart/cube -> source systems -> metric/report -> data platform maturity      |

## Vendor Contract Quality Bar

For procurement-facing demonstrations, the contract documents must be generated from structured contract facts, not independently written beside them.

Minimum viable contract packet:

- Master Services Agreement
- Order Form
- Statement of Work
- Pricing Exhibit
- SLA / Support Exhibit
- Data Protection Addendum
- Security Exhibit
- Renewal or Amendment document where applicable

Each packet should reconcile back to the structured register:

- vendor legal name;
- contract name and type;
- term start, term end, renewal date;
- commercial model;
- annual spend or committed value;
- supported systems and functions;
- service levels;
- audit/security/privacy obligations;
- termination and transition obligations;
- amendment supersession where applicable.

Do not show short contract stubs as procurement-grade examples. For a procurement audience, contract documents should read as coherent contract packets and should round-trip back to `07_vendors_contracts.csv`.

## Guardrails

The synthetic dataset can be shown as an example of template use only.

Closed gates unless separately approved:

- canonical/data-plane writes;
- graph materialization;
- Layer 4 projection refresh;
- runtime product activation;
- retrieval indexing;
- live-client truth claims.

## Current Repo-Local Validation

The current integrated healthcare example has passed local, report-only gates:

- `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-healthcare-integrated-quality`
- `npm run audit:tenant-graph-reconciliation -- --tenant meridian-health --out /tmp/nexus-healthcare-integrated-graph/meridian-health`

Latest graph reconciliation result:

- relationship rows: 2,302
- graph candidates: 2,302
- quarantined rows: 0

These are local validation results only. They do not mean the data has been loaded into the data plane, indexed for retrieval, refreshed into Layer 4 products, or proven at runtime.
