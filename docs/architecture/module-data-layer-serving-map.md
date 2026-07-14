# Module Data Layer Serving Map

Status: official runtime map and promotion checklist.

This document answers one question directly: which data layer powers each
product module today, which layer is the target source of truth, and what must
happen before Home, Intelligence, Moves, Source, and Tower can safely read the
new canonical tenant data by default.

## Executive Answer

The new enterprise data layer is built and deployed through inactive candidate
versions. It is not yet the default active runtime source for Home or the other
modules.

Current truth:

```text
Canonical tenant input files
-> canonical data build
-> inactive candidate tenant data versions
-> candidate preview/admin proof
```

Target truth:

```text
Canonical tenant input files
-> canonical data build
-> reviewed inactive candidate
-> promotion gate
-> Active Tenant Access Layer
-> Home Summary Snapshot and module context packets
-> Home / Intelligence / Moves / Source / Tower default runtime reads
```

No Home visual redesign should be treated as complete until the target truth is
browser-proven.

## Canonical Input Location

The only governed filesystem root for active tenant input files is:

```text
datasets/tenant-inputs/active/<tenant-key>/current/
```

The universal template set is:

```text
datasets/tenant-inputs/templates/universal/standard-2026-07/
```

The registry that declares active tenants, active packets, retired tenants, and
the Azure landing convention is:

```text
datasets/tenant-inputs/tenant-input-registry.json
```

The logical Azure landing convention is:

```text
container:  tenant-inputs
raw:        tenant-inputs/{tenant_key}/{intake_id}/raw/
validated:  tenant-inputs/{tenant_key}/{intake_id}/validated/
archive:    tenant-inputs/archive/{tenant_key}/{intake_id}/
filename:   {tenant_key}__{template_name}__{as_of_yyyymmdd}__{source_owner}__r{revision}.csv
```

Raw uploads are not runtime truth. The build must consume validated packets
after quality checks, source lineage checks, placeholder rejection, and operator
approval.

Some current template filenames still carry legacy version labels as file
identifiers. They are not architecture names and must not be used to describe
the data-layer design.

## Universal Template Domains

The universal tenant template must capture all tenant types through common
domains, not tenant-specific schemas:

| Domain | Purpose |
| --- | --- |
| enterprise_profile | Legal/display name, mission, vision, HQ, revenue, employee count, locations, segments, strategy, leadership, business model, as-of/source. |
| business_functions | Enterprise function/capability map and criticality. |
| org_ownership | Executive, business, technology, data, and process ownership. |
| workforce_roles | Personas, teams, role capacity, operating model, managed-service scope. |
| applications_systems | Application/system inventory, current/future scope, lifecycle, criticality, business owner, technology owner, vendor, platform/database, hosting. |
| data_assets_integrations | Data products, marts, warehouses, lakehouses, integrations, interfaces, semantic layers, reporting assets, analytics products. |
| infrastructure_platforms | Data centers, cloud, platforms, networks, security zones, databases, appliances, hosting, resilience posture. |
| vendors_contracts | Vendors, contracts, services, renewal dates, obligations, scope, commercial terms. |
| spend_value | Cost baseline, value pools, budgets, benefits, leakage, source-of-value caveats. |
| programs_initiatives | Business/technology initiatives, priorities, dependencies, status, sponsors. |
| ai_automation_use_cases | AI, automation, LLM, workflow use cases, readiness, dependency, risk. |
| risks_controls | Operational, technology, data, security, compliance, transformation, sourcing risks and controls. |
| relationships | Explicit graph edges across functions, systems, vendors, data, programs, risks, metrics, and owners. |
| evidence_sources | Source inventory, file provenance, authority, as-of date, sensitivity, confidence. |
| metrics_outcomes | KPI definitions, baselines, targets, outcome measures, Tower-ready metrics. |
| industry_context_patterns | Industry-specific patterns and external context captured as evidence-backed context, not hardcoded claims. |
| expert_lenses | CDAO/CIO/CFO/CPO/COO-style perspectives and question lenses. |
| service_scope_managed_services | Managed-service towers, activities, service boundaries, delivery scope. |
| operational_process_evidence | Process maps, workflow evidence, incident/process traces, workshop artifacts. |

## Parse and Load Process

The non-destructive process is:

```text
1. Admin or operator places files in Azure raw landing.
2. Validation promotes files to the validated tenant-input packet.
3. Registry points to the validated packet under datasets/tenant-inputs/active.
4. npm run audit:canonical-tenant-inputs verifies active roots and retired tenants.
5. npm run audit:tenant-input-quality verifies universal template coverage and row depth.
6. npm run build:canonical-tenant-data parses source CSVs into canonical records, evidence, gaps, and relationship candidates.
7. npm run audit:canonical-data-build verifies no archive/legacy reads and no production writes.
8. npm run build:candidate-version creates inactive candidate tenant data versions.
9. npm run audit:candidate-version verifies candidate metadata and proof artifacts.
10. npm run audit:active-candidate-separation proves no default module reads changed.
11. Candidate preview is browser-proven.
12. Operator selects one safe candidate for promotion.
13. Promotion writes the Active Tenant Access Layer.
14. Home Summary Snapshot and module context packets are rebuilt from active data.
15. Home/aVa, Intelligence, Moves, Source, and Tower are browser-proven against active canonical context.
```

Steps 1 through 10 are in place for the current candidate runway. Steps 11
through 15 are the next promotion workstream.

## Current Build Proof

Latest deterministic reports:

```text
reports/canonical-tenant-inputs/latest/
reports/canonical-data-build/latest/
reports/candidate-version-build/latest/
```

Current canonical build summary:

| Measure | Count |
| --- | ---: |
| Active tenants processed | 6 |
| Accepted canonical records | 20,230 |
| Evidence attachments | 20,230 |
| Relationship candidates | 10,835 |
| Archive/legacy read violations | 0 |
| Production tenant writes | 0 |
| Active Tenant Access updates | 0 |
| Candidate promotions | 0 |

Current active tenant input packets:

| Tenant | Canonical input root | Packets | Files | CSV rows |
| --- | --- | ---: | ---: | ---: |
| Apex Retail | `datasets/tenant-inputs/active/apex-retail/current` | 1 | 20 | 4,112 |
| First Capital Financial | `datasets/tenant-inputs/active/first-capital-financial/current` | 1 | 20 | 6,132 |
| Lakeshore Holdings | `datasets/tenant-inputs/active/lakeshore-holdings/current` | 1 | 23 | 996 |
| Lakeshore Industries | `datasets/tenant-inputs/active/lakeshore-industries/current` | 1 | 55 | 3,809 |
| Meridian Health | `datasets/tenant-inputs/active/meridian-health/current` | 2 | 66 | 4,697 |
| SkyHarbor Air | `datasets/tenant-inputs/active/skyharbor-air/current` | 2 | 61 | 3,842 |

Northstar is retired/excluded and must not be processed as an active tenant.

## Candidate Version Status

All active synthetic/demo tenants have been standardized into canonical input
packets and rebuilt into inactive candidate versions.

| Tenant | Candidate status | Records | Evidence | Relationship candidates | Key depth proof |
| --- | --- | ---: | ---: | ---: | --- |
| Apex Retail | inactive | 3,589 | 3,589 | 1,690 | 182 apps/systems; 385 data assets/integrations. |
| First Capital Financial | inactive | 5,609 | 5,609 | 2,757 | 272 apps/systems; 460 data assets/integrations. |
| Lakeshore Holdings | inactive | 457 | 457 | 183 | Mid-market legal/holding-company pack; still has depth blockers. |
| Lakeshore Industries | inactive | 3,040 | 3,040 | 892 | 128 infrastructure/platform records; managed-services/process evidence present. |
| Meridian Health | inactive | 4,078 | 4,078 | 2,177 | 192 apps/systems; 432 data assets/integrations; 4 infrastructure/platform records. |
| SkyHarbor Air | inactive | 3,457 | 3,457 | 3,136 | 626 apps/systems; 570 data assets/integrations; 691 infrastructure/platform records; 410 process evidence records. |

Quality gates pass for candidate creation, but each tenant still has profile
gaps or promotion blockers. Candidate-ready is not active-runtime-ready.

## Module Serving Map

| Module | Current default runtime source | New candidate/data-layer status | Target source after promotion | Current gap |
| --- | --- | --- | --- | --- |
| Home | Active Home context browser, setup-control read model, data-quality model, and deterministic Home Summary Snapshot built at request time. Candidate preview is opt-in only. | Inactive candidate read model exists and admin preview can inspect it. | Active Tenant Access Layer plus Home Summary Snapshot rebuilt from promoted canonical facts, relationships, gaps, and evidence. | Home does not read candidate data by default. The active Home context can still appear thinner than the candidate layer. |
| aVa on Home | Home KNOW / Home summary context for active Home scope; should answer only from loaded active Home context. | Candidate preview can expose read-only candidate context when explicitly enabled. | Claude-wired aVa response over active Home Summary Snapshot and Active Tenant Access context, with citations and unsupported-claim guardrails. | Needs proof that default Home aVa reads the promoted active canonical data, not old context helpers. |
| Intelligence | Advisory page reads enterprise landscape view model and Intelligence ask route resolves tenant/context through current intelligence/home binding paths and product-truth guards. | Candidate module preview/readiness artifacts exist, but Intelligence does not default to candidate context. | Module Context API packet from Active Tenant Access Layer plus evidence registry and relationship graph slices. | Needs candidate-to-active promotion and Intelligence signed-in proof. |
| Moves | Strategic Moves reads persisted move/program tables and evidence/workspace artifacts through `getStrategicMovePortfolio`, `getStrategicMoveById`, and phase routes. | Candidate module readiness/workbench previews exist as proof artifacts, not default Moves runtime truth. | Moves context packet from Active Tenant Access Layer, plus Module Memory for phase evidence, decisions, generated deliverables, and gate outcomes. | Existing Moves runtime is not yet rebuilt from canonical tenant data by default. |
| Source | Source reads persisted source events, decision queue, source artifacts, facts, and stage/gate records through Source query/read/write adapters. | Source shadow/workbench preview artifacts exist, not default Source runtime truth. | Source context packet from Active Tenant Access Layer, plus Source Module Memory for sourcing events, evidence, artifacts, approvals, vendor facts, and value handoff. | Source event runtime remains module-specific until promotion/read-model integration. |
| Tower | Tower page reads CIO Tower CXO view model, budget rollups, value states, and Tower answer context through Tower-specific read models. | Candidate Tower preview/readiness artifacts exist, not default Tower runtime truth. | Tower context packet from Active Tenant Access Layer plus Outcome Ledger for projected/committed/measured/realized value. | Tower must not calculate value from graph/context; it needs explicit Outcome Ledger / Tower metric promotion. |

## What Must Happen Next

The next workstream is:

```text
DATA-PROMOTION-PR1 - Candidate Preview Proof and Safe Promotion to Active Tenant Access
```

Required sequence:

1. Browser-prove candidate preview after the latest deploy.
2. Review candidate quality tenant by tenant.
3. Select one safe demo tenant for promotion.
4. Promote that candidate to the Active Tenant Access Layer.
5. Rebuild Home Summary Snapshot from active canonical data.
6. Prove Home and aVa read the new active data by default.
7. Then implement the polished Home executive design.

Do not treat Home UI polish as complete before step 6.

## Promotion Rules

A candidate may not become active unless all of these are true:

- Candidate preview route renders signed-in with the inactive-candidate banner.
- The candidate has source lineage, evidence attachments, canonical records,
  relationship candidates, quality gates, and promotion blockers visible.
- A human/operator chooses the candidate and acknowledges it will become active
  runtime truth.
- Active Tenant Access Layer update is explicit, auditable, and reversible.
- Home Summary Snapshot is rebuilt from promoted active canonical data.
- Modules do not silently read candidate data by default.
- Tower value claims read from Outcome Ledger / Tower metric facts, not inferred
  from graph or narrative context.

## Non-Claims

The current candidate runway does not claim:

- production tenant data has been written,
- any candidate has been promoted,
- the Active Tenant Access Layer has been updated,
- Home, Intelligence, Moves, Source, or Tower read candidate data by default,
- synthetic/planning-grade data is real client production data,
- Home UI polish proves data correctness.

