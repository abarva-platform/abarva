# Home ECL Page Prompts And Architecture Experience

**Status:** design contract for Home V2 page prompts and executive architecture experience.
**Date:** 2026-08-28.
**Depends on:** `docs/architecture/home-ecl-executive-narrative-v2-design-2026-08-28.md`.
**Implementation prompt pack:** `docs/architecture/home-v2-implementation-prompt-pack-2026-08-30.md`.

This document defines what each Home page is trying to answer, what data it may use, and how
architecture, systems, organization, interviews, vendor, technology, and data views should be
presented to a newly hired business or technology executive.

The core shift: Home must not begin with tables. It begins with a clear executive map of the
enterprise, then lets the reader drill from conceptual blocks to logical systems to physical detail.
Accuracy and relevant detail matter more than visual flourish.

The implementation prompt pack is the operational contract for build agents. This document defines
the design intent; the prompt pack enumerates page prompts, source/layer inputs, packet sections,
visual dataset refs, and the first build slice.

## Audience Modes

Home has two primary executive readers.

| Reader | First question | Primary view |
| --- | --- | --- |
| New business executive | How does this enterprise create value, who owns it, and what systems/vendors constrain my book of business? | Business blocks, operating model, value and risk dependencies |
| New technology executive | What architecture do I inherit, where are the dependencies, and what must be stabilized or modernized? | Conceptual architecture, logical system maps, physical platform/data layers |

Every Home page should let the reader switch between:

- **Business lens:** segment, function, owner, process, value, risk.
- **Technology lens:** application, platform, data product, integration, vendor, hosting.
- **Evidence lens:** source, confidence, review state, missing data, last refresh.

## Architecture Experience

Architecture starts conceptual and becomes inspectable.

### Level 1 - Conceptual Architecture

The first architecture view is a block map by business book and operating domain.

For Meridian-like healthcare:

| Block | Shows | Examples |
| --- | --- | --- |
| Health Plan / Payer Book | member enrollment, claims, provider network, care management, risk adjustment, Stars/HEDIS, actuarial, broker/member engagement | Facets, HealthRules, claims platforms, EDI gateways, RAF and Stars tools |
| Provider / Delivery Book | acute, ambulatory, clinical, revenue cycle, lab, pharmacy, imaging, patient access, clinical operations | Epic, imaging, lab, pharmacy, patient scheduling, RCM systems |
| Back Office | HR, finance, supply chain, legal, procurement, facilities, shared services | Workday, Infor/Lawson, UKG, Coupa/Ariba, BlackLine, Concur |
| Data, Analytics & AI | source systems, ingestion, warehouses, marts, reporting, SAS/advanced analytics, AI usage and governance | Epic Cogito, Clarity/Caboodle, Netezza, SQL marts, Tableau, Power BI, SAS |
| Infrastructure & Hosting | SaaS, cloud, private cloud, data centers, integration engines, identity, network, storage | AWS/Azure, data centers, virtualization, MFT, HL7/integration, IAM |
| Vendor & Commercial Spine | strategic vendors, contracts, BPO/service providers, renewal and leverage exposure | Epic, cloud vendors, Workday, Optum, R1, consulting/BPO vendors |

Each block must show:

- count of major systems or platforms.
- top 3 anchors by materiality.
- owner function.
- hosting mix.
- critical dependencies.
- known gaps.
- "open logical view" action.

### Level 2 - Logical Architecture

Clicking a conceptual block opens a logical system map. This is not a canvas of every row. It is a
clustered view of systems by capability and data flow.

For example, Back Office should show:

```text
Back Office
  HR          -> Workday HCM, UKG, learning, recruiting, identity feeds
  Finance     -> ERP/GL, planning, close, treasury, AP, expense, fixed assets
  Supply Chain-> procurement, inventory, materials management, vendor onboarding
  Shared Ops  -> service management, document management, workflow, knowledge
```

Each system block must show:

- system name.
- system role.
- vendor.
- owner function.
- deployment/hosting model.
- criticality.
- lifecycle/watch state.
- key upstream/downstream relationships.
- contracts and vendor exposure when known.
- volumetric only where meaningful: users, transaction volume, report count, ETL/job count, data
  volume, integrations.

### Level 3 - Physical Architecture

Clicking a system, platform, or data product opens physical detail:

- environments/deployments.
- hosting account/subscription/data center.
- database/platform technology.
- integration endpoints.
- data products/marts/reports fed.
- user/usage volume.
- support model and owner.
- contract/license coverage.
- resilience, capacity, support-end/EOL dates.
- source lineage and review state.

Physical detail is not the first page. It is the drill path.

## Data & Analytics Architecture

The data architecture page should render as zones with arrows, not as disconnected cards.

Required zones:

1. **Sources:** core operational systems, SaaS apps, claims, clinical, ERP, workforce, external feeds.
2. **Ingestion:** batch, API, HL7/FHIR/EDI, MFT, streaming, CDC, manual file.
3. **Data Platforms:** warehouses, lakehouse, ODS, marts, SQL Server estates, Netezza/Teradata when
   present, cloud data platforms.
4. **Engineering & Transformation:** ETL tools, orchestration, SQL jobs, scripts, data quality,
   lineage.
5. **Analytics & Consumption:** Tableau, Power BI, Cognos/BO, SSRS, SAS, actuarial models, embedded
   dashboards, report catalogs.
6. **Governance & Risk:** catalog, data owners, PHI/PII, access model, quality controls, unresolved
   lineage.

Each zone shows counts and named anchors, then drills to detail. Volumetrics are counts, not fake
precision:

- reports by tool and function.
- ETL jobs by tool/platform and mart.
- scripts by function and owner.
- data volumes by platform when provided.
- users by tool/function when provided.
- critical data products and marts.

If a client has not provided report inventory, ETL inventory, user counts, or volume, the page must
say which measurement is missing. It must not show zero as if zero was measured.

## Slice/Dice Browser

The browser should behave like a compact OLAP/slice viewer, not a long list.

Required controls:

| Control | Purpose |
| --- | --- |
| Dataset selector | Applications, platforms, contracts, data flows, reports, interviews, measures, risks |
| Lens selector | Business, technology, vendor, owner, risk, value, evidence |
| Dimension dropdowns | Function, book of business, owner, vendor, hosting, criticality, lifecycle, tool, data domain |
| Measure selector | Annual cost, contract value, users, flows, reports, ETL jobs, incidents, value, risk count |
| Grain selector | Enterprise, segment, function, capability, system, platform, vendor, contract |
| Evidence filter | source-recorded, document-extracted, interview-derived, calculated, model-inferred, unknown |
| Review filter | reviewed, not reviewed, conflict, gap, synthetic |

Default view should be summary-first:

1. selected slice headline.
2. top drivers.
3. exception/gap callouts.
4. compact table of the underlying rows.
5. click-through to object detail and lineage.

Do not show all dimensions as columns by default. Columns should change with lens and grain.

## Workbook Data Browser

Home also needs a plain, trusted way to browse the source workbooks themselves. This is different
from the executive architecture pages. It is for inspecting the received/current workbook data in a
tabular form with practical filters and column presets.

The UI may look like an Excel workbook browser, but the product must not read Excel files directly.
The data path is:

```text
client workbook / source extract
  -> Layer 2 adapter preserves workbook, sheet, row, source column, normalized value
  -> Layer 3 source record / object / measure / relationship rows
  -> serving workbook browser view
  -> Home data browser
```

Required browser structure:

| Area | Behavior |
| --- | --- |
| Workbook selector | Choose one of the client-facing intake workbooks or source families |
| Sheet selector | Shows the tabs/sheets inside that workbook |
| Lens selector | Business, technology, ownership, vendor, finance, risk, evidence, all columns |
| Dimension filters | Business group, book of business, function, owner, vendor, hosting model, criticality, lifecycle, review state |
| Column presets | Essentials, ownership, technology/hosting, commercial, usage/volume, evidence, all fields |
| Search | Search across visible rows without changing source truth |
| Summary strip | Row count, known/unknown count, reviewed/not-reviewed count, conflicts, gaps |
| Table | Stable columns, sortable, horizontally scrollable, with pinned identity and source columns |
| Row drawer | Shows original workbook field/value, normalized canonical mapping, source row, basis, review state, lineage |

Default dimensions:

| Dimension | Applies to |
| --- | --- |
| Business group / book of business | Applications, operations, programs, spend, data/reporting |
| Function | Applications, org, processes, data assets, reports, risks, budget |
| Ownership | business owner, IT owner, vendor owner, data owner |
| Hosting | SaaS, public cloud, private cloud, on-prem, mainframe, unknown |
| Vendor | applications, platforms, contracts, tools, managed services |
| Criticality | applications, platforms, data products, processes |
| Lifecycle | active, retire, replace, consolidate, watch, unknown |
| Evidence state | source-recorded, document-extracted, interview-derived, calculated, model-inferred, unknown |
| Review state | reviewed, not reviewed, conflict, gap, synthetic/not-attested |

Column presets by source family:

| Workbook/source family | Essential columns | Useful dimensions |
| --- | --- | --- |
| Strategy and Operating Model | segment, function, priority, owner, value driver, evidence state | business group, function, owner, priority |
| Operations, Workforce and KPIs | process, function, role/team, KPI, volume, pain point | function, process, owner, KPI state |
| Health Plan Applications | application, capability, function, owner, vendor, hosting, criticality, users | plan function, vendor, hosting, criticality |
| Clinical Applications | application, clinical domain, owner, vendor, hosting, criticality, facility/site scope | provider domain, facility, vendor, hosting |
| Shared Applications | application, back office function, owner, vendor, hosting, lifecycle, spend | HR/finance/supply chain, owner, vendor |
| Data, Analytics and Reporting | source, ingestion, platform/mart, report/tool, ETL/job count, users, volume | data domain, tool, function, platform |
| Infrastructure and Hosting | platform, hosting model, environment, hosted apps, capacity, resilience, support end | on-prem/cloud, platform type, owner, risk |
| Finance, Budget and Programs | cost center, vendor, application/program, budget, actual, forecast, value state | function, vendor, program, finance state |
| Risk, Controls and Compliance | risk/control, object affected, severity, owner, status, evidence | risk domain, owner, affected system |
| Vendors and Contracts | vendor, contract, service line, scope, renewal, spend, document proof | vendor, service category, renewal window |
| Commercial Performance and Value | invoice/SLA/benchmark, contract, variance, recovery, value lever | vendor, contract, value state |
| AI Portfolio and Governance | use case, tool, owner, risk, policy, approval, model/data dependency | function, tool, risk, approval state |
| AI Usage and Value | tool, population, active users, adoption, cost, value, baseline/actual | function, tool, owner, adoption band |
| Interviews | interviewee role, function, theme, quote/excerpt, urgency, alignment, cited object | function, role level, theme, sentiment |

The browser should answer:

- "What did we receive?"
- "Which rows map to the canonical model?"
- "Which fields are missing, unknown, conflicting, or synthetic?"
- "Which business group/function/vendor/hosting model owns the concentration?"
- "Can I open the source row and see the original workbook values?"

### Counting Rule

Every count, facet total, dimension total, and summary denominator in the browser must be computed
through typed views, never directly from raw `ecl_context.object` rows. The authoritative counting
surfaces are:

- `application_v`
- `application_deployment_v`
- `business_object_v`
- `technical_component_v`

`object_type_catalog.grain` and `object_type_catalog.counting_class` are the authority for whether
something counts as an application, deployment, business object, technical component, or supporting
record. Every visible count must carry a named denominator such as `applications`, `deployments`,
`contracts`, `reports`, `interfaces`, `platforms`, or `reviewed rows`.

Reason: the canonical object table intentionally stores applications and deployments as peer
objects. A browser that slices raw objects can count applications and deployments together and show
an estate number several times too large. That error is especially dangerous in a CXO-facing browse
surface because the table appears factual even when the grain is wrong.

### Admission Rule

The architecture browser inherits the existing admission gates. It does not replace them with a
clean diagram.

`current_state_architecture` and `current_state_data_flow` must run their declared admission gates
before rendering conceptual, logical, or physical drilldowns. If the record cannot answer the
landing clause, consumption clause, topology fitness question, or required evidence basis, the page
renders the refusal payload at the level where the failure occurs:

- failed rule.
- measurement.
- evidence needed.
- supported alternative.

A conceptual map is not allowed to render as a substitute for a refused logical or data-flow view.
Finding F10 exists to protect this behavior: a correct refusal is a product feature, not an empty
state.

It should not answer executive strategy questions by itself. It is the inspection surface behind
Home, Source, Tower, Moves, and Intelligence.

## Page Prompt Matrix

Each page prompt is a controlled instruction for the writer and renderer. "Prompt" here means the
page's semantic intent and allowed evidence, not necessarily a live model call.

| Surface | Executive question | Required source packet | Display pattern |
| --- | --- | --- | --- |
| Executive Brief | What should I know in my first ten minutes? | top cross-domain findings, top gaps, leadership voice, Source/Tower/Moves handoffs | boardroom verdict, 3-5 reasons, top decisions |
| Our Business | How does this enterprise create value? | segments, books of business, customers/members/patients, revenue or volume mix, owner functions, operating dependencies | business model map, value-driver blocks, evidence limits |
| Strategy & Value Creation | What bets are funded and what value is proven? | priorities, programs, business cases, investment, expected value, measured value, Tower proof state, interviews | strategy tree, funded bets, proof status, questions |
| How We Operate | How is work organized and who owns it? | org hierarchy, functions, processes, owners, workforce, pain points, interview themes | org/function map, process blocks, owner/accountability view |
| Technology & Data | What architecture enables or constrains the business? | applications, platforms, data products, integrations, hosting, criticality, lifecycle, vendor links | conceptual architecture first, then logical/physical drilldown |
| Performance & Value | Are outcomes being measured and can we prove value? | KPIs, baselines, actuals, targets, forecasts, finance attestation, blocked/gated value | value bridge, performance scorecards, proof and gap rail |
| Leadership Perspective | What do leaders say and where does it conflict with records? | interview excerpts, themes, role/function, sentiment, urgency, evidence conflicts | testimony excerpts, theme matrix, alignment/disagreement view |
| What Needs Attention | What decisions or investigations should leaders take up next? | high severity gaps, renewal exposure, EOL/support risk, blocked value, unresolved lineage | ranked decision queue with owner, due date, evidence needed |
| Current-state architecture | What systems are in place to run each business block? | system/application/platform/vendor/hosting/function relationships and admission result | conceptual blocks -> logical maps -> physical details |
| Current-state data flow | How does information move from source to consumption? | source systems, ingestion, platforms, marts, reports/tools, analytics, users, unresolved endpoints | zone diagram with arrows, topology fitness, refusal if unfit |
| What has been loaded | What materials are available and what is missing? | source files, object counts, measure counts, review states, known gaps | readiness map by source family and product impact |
| Browse the record | Can I inspect the workbook/source data by dimension and grain? | workbook rows, source fields, normalized mappings, objects, measures, relationships, source refs, review state | workbook-style slice/dice viewer with filters, column presets, compact table, and row lineage drawer |
| Applications & Systems | Which systems run the enterprise and who owns them? | application objects, functions, vendors, owners, hosting, criticality, spend, users, contracts | portfolio table plus system-block drilldown |
| Vendor Contracts | Which vendor relationships matter and why? | vendors, contracts, service lines, scope, renewals, spend, SLA/docs, Source links | vendor concentration, renewal/leverage view, contract detail |
| Infrastructure & Platforms | What physical and platform estate do we inherit? | platforms, cloud/data center, capacity, resilience, support end, hosted apps/data products | platform map, risk/watch list, hosted workload drilldown |
| Data Assets & Integrations | What data products, flows, marts, and reports exist? | source-target flows, platforms, marts, reports, BI/SAS tools, users, volume, PHI flags | data-zone map, flow table, consumption and unresolved lineage |

## Page-Specific Prompt Templates

### Current-State Architecture

```text
Build an executive architecture view for a new business or technology leader.

Start with conceptual business blocks: payer/plan, provider/delivery, back office, data and
analytics, infrastructure/hosting, vendor/commercial spine. For each block, show the named anchor
systems and vendors that materially run that part of the enterprise.

Then provide drill paths to logical system maps and physical detail. Do not begin with a flat
application table. Do not infer relationships from names. Only show a link when the ECL relationship
exists or mark it unresolved.

Every block must state what is known, what is missing, and why the missing data matters.
```

### Current-State Data Flow

```text
Build a data architecture map using zones: sources, ingestion, data platforms, engineering and
transformation, analytics/consumption, governance/risk.

Use named systems and platforms where available. Use counts for reports, ETL jobs, scripts, users,
and volumes only when provided or calculated from source records. Unknown is not zero.

If the topology gate fails, render a refusal with the failed rule, measurement, evidence needed,
and supported alternative. Do not render a confident architecture from unresolved endpoints.
```

### Browse The Record

```text
Build a slice/dice explorer, not a long unfiltered table.

Default to a summarized slice. Let the user choose dataset, lens, grain, dimensions, measures, and
evidence state. Show top drivers and exceptions before rows. Columns must adapt to the selected
lens. Every row links to lineage and object detail.

Do not display every dimension as a column by default.
```

### Applications & Systems

```text
Show the application estate by business block and function first, then by named system.

For each system, include vendor, owner, hosting, criticality, lifecycle, spend, users, contracts,
key integrations, and data products where known. Separate application identity from deployment,
environment, platform, and database. Do not count deployments as applications.
```

### Vendor Contracts

```text
Show vendor exposure as a relationship map: vendor -> contracts -> service lines -> scoped
applications/functions -> spend/value/risk.

Highlight concentration, renewals, termination/benchmarking rights, SLA/document evidence,
commercial leverage, and gaps. Do not treat a contract register row as complete contract proof when
document extraction is missing.
```

### Infrastructure & Platforms

```text
Show hosting and platform estate by workload class: SaaS, public cloud, private cloud, data center,
integration/messaging, identity, network/storage, data platform.

For each platform, show hosted apps/data products, criticality, support end/EOL, resilience,
capacity, owner, and unresolved relationships. Physical detail should be available on click, not
forced into the conceptual view.
```

### Data Assets & Integrations

```text
Show how information moves and where it is consumed.

Group by source domain, ingestion pattern, landing/platform layer, mart/data product, reporting or
analytics tool, consuming function, and evidence state. Include report counts, ETL/job counts,
script counts, users, volumes, PHI/regulatory flags, and lineage gaps when present.
```

### How We Operate / Org Chart

```text
Build an operating model view: organization -> function -> process -> system -> vendor -> metric.

Show the org chart as accountable functions and named roles, not decoration. Include owner,
decision rights, process scope, supporting systems, pain points, and interview evidence. Where the
org chart is incomplete, show the missing owners and affected systems/processes.
```

### Leadership Perspective / Executive Interviews

```text
Show leadership voice as evidence, not sentiment decoration.

Group interview excerpts by role, function, theme, urgency, alignment, and contradiction with
records. Include direct excerpts only when attribution/consent permits. Distinguish strategic
executive themes from tactical director-level operating detail. Tie each theme to affected systems,
programs, vendors, risks, or data gaps where relationships are proven.
```

## Required Data Producers

The following producers are required before these pages are CXO-ready:

| Producer | Feeds |
| --- | --- |
| Business segment and operating model adapter | Our Business, How We Operate, Current-state architecture |
| Org ownership and role adapter | How We Operate, Applications & Systems, Browse |
| Interview adapter and theme compiler | Leadership Perspective, Strategy, Our Business, What Needs Attention |
| CMDB/application adapter | Architecture, Applications & Systems, Technology & Data |
| Deployment/hosting adapter | Architecture, Infrastructure & Platforms |
| Data/analytics/reporting adapter | Data Flow, Data Assets & Integrations, Technology & Data |
| Vendor/contract/document adapter | Vendor Contracts, Our Business, What Needs Attention |
| Tower value/risk signal producer | Performance & Value, Strategy, What Needs Attention |
| Source commercial signal producer | Vendor Contracts, Our Business, What Needs Attention |

## Acceptance Bar

The Home V2 page set is acceptable only when:

- architecture opens with conceptual business blocks, not an app table.
- each conceptual block drills to logical systems and physical/platform details.
- data architecture shows source -> ingestion -> platform -> mart/product -> consumption.
- browser uses dimension and measure selectors rather than all-column sprawl.
- browser counts through typed views and shows named denominators, never raw object totals.
- architecture and data-flow drilldowns honor admission gates and render refusals when the record
  cannot support the requested view.
- org chart and interviews are first-class evidence surfaces.
- every number and relationship reconciles to source truth.
- unknowns are explicit and never shown as zero.
- no page exposes implementation vocabulary.
- each page answers its guiding question for a new business or technology executive.
