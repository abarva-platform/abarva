# AbarVa Data Ingestion & Integration Architecture

**How data enters AbarVa, how it stays honest, and how the ingestion surface itself becomes a selling point.**

This spec specifies the three data-loading workflows that AbarVa supports — automated pipeline, client-uploaded template, and expert-authored — and the architecture underneath that makes all three safe, scalable, and traceable.

Ingestion is not a utility layer. For an enterprise platform claiming "every engagement makes every future engagement smarter," ingestion is the front door of that compounding. If data enters AbarVa badly, everything downstream (signals, patterns, cohort benchmarks, evidence weights, recommendations) is poisoned. If data enters AbarVa *visibly well*, clients trust the platform before they've even seen its outputs.

This document extends — and in two places supersedes — the Tower spec's Packet 8 (Upload & Integrations). Wherever extension vs supersede applies, the text is flagged.

Reads alongside:
- `docs/specs/tower/design-spec.md` Packet 8 (current-state ingestion surface, being extended here)
- `docs/specs/programs/design-spec.md` (Programs-side ingestion paths)
- `docs/specs/platform/data-layer-future-state.md` Packet 5 (evidence provenance, which ingestion feeds)
- `docs/specs/platform/design-system.md` (UI patterns for all surfaces described)
- `docs/specs/platform/agent-architecture.md` (agent behaviors that consume ingested data)

## Document structure

Six packets across three tracks.

**Track A · Foundation** (Packets 1-2)
1. Why ingestion is strategic · three workflows · what the showcase layer has to accomplish
2. The segment catalog · browseable library by industry × function × data source, retail fully populated

**Track B · Workflows** (Packets 3-5)
3. Template library architecture · versioning, composition, industry-specific overlays
4. Pipeline automation · S3 / Snowflake / API / Databricks connectors, schema discovery, drift handling, quality gates
5. Authoring mode · expert-authored engagements, draft persistence, bulk duplication, test-drive flag

**Track C · Integrity** (Packet 6)
6. Lineage, provenance, source-class differentiation

---

# PACKET 1 · Why Ingestion is Strategic

## 1.1 The wrong way to think about ingestion

Most B2B SaaS treats ingestion as a solved problem: "We support CSV upload and a few OAuth integrations." Ingestion is filed under "onboarding" — a friction layer between the prospect and the product.

That framing is wrong for AbarVa. Three reasons.

**Reason 1 · Ingestion is where trust is won or lost.**

A Fortune 50 CTO deciding whether to let AbarVa touch their portfolio data is not asking "does CSV upload work?" They're asking: "Can I see what data you've asked for, what you're doing with it, whether my classifications stay private, what happens if the data is wrong, and how I'd pull the plug if I needed to?"

Every one of those questions is answered (or dodged) by the ingestion surface. If AbarVa's Data & Integrations screen shows transparency — clear data classes, visible lineage, explicit data quality gates, obvious rollback paths — the CTO leans forward. If it shows a blank drag-drop zone and a list of 6 OAuth integrations, the CTO looks elsewhere.

**Reason 2 · Ingestion is where the segment knowledge shows.**

When a retail CTO navigates to "Add data source" and sees 12 retail-specific data sources organized by store operations, merchandising, supply chain, and customer experience — with pre-built templates for each — that CTO knows AbarVa has thought about retail. When the same screen shows a generic list of "Microsoft 365, Snowflake, Other..." it's obvious AbarVa is a generic tool being retrofitted.

The **segment catalog** (Packet 2) exists because of this. It's not a feature tacked on; it's the differentiator visible in the first minute.

**Reason 3 · Ingestion is where compounding begins.**

The "every engagement makes every future engagement smarter" claim is only true if engagement data enters AbarVa in structured, provenanced, typed form. Free-text descriptions don't compound. Cost numbers without source metadata don't compound. Attestations without attester identity don't compound.

Ingestion architecture is the mechanism that turns raw client data into compounding intelligence. Cutting corners here means the Genome stays thin forever.

## 1.2 The three workflows AbarVa supports

Ingestion isn't one thing. It's three distinct workflows, each with its own UX, scale characteristics, and integrity model.

### Workflow 1 · Automated pipeline

Continuous sync from source systems. Client authorizes a connection (OAuth, service account, S3 bucket access); AbarVa's ingestion pipeline pulls, classifies, transforms, and routes data to Tower/Programs tables on a schedule.

**Scale:** Thousands of records per sync, incremental updates, historical backfill available.

**Latency:** Near-real-time to daily, depending on source.

**Who initiates:** Client IT/data team (one-time setup), runs autonomously thereafter.

**Integrity profile:** High structural trust (source is authoritative system), high freshness, medium contextual trust (raw data lacks situational context).

**Primary use cases:**
- Cloud billing → cost pillar continuous updates
- Microsoft 365 admin → adoption metrics daily refresh
- ServiceNow → AI inventory + operational data
- S3/Snowflake data lake → client's own analytics outputs routed to Tower
- Model monitoring platforms (Arize, Evidently) → drift signals

### Workflow 2 · Client upload

Client exports data from source systems (or manually compiles) and uploads via the Tower/Programs UI. Templates are pre-defined per data type; the upload flow validates, previews, and commits.

**Scale:** Tens to low-hundreds of records per upload, snapshot in time.

**Latency:** On-demand, driven by client willingness to refresh.

**Who initiates:** Client business user (usually sponsor, ops lead, or data-savvy manager).

**Integrity profile:** Medium structural trust (templates enforce shape), medium freshness (depends on refresh cadence), medium contextual trust.

**Primary use cases:**
- Initial portfolio seed (Tier 1 demo path)
- Use cases that aren't in any single source system
- Attestation submissions
- Risk register updates
- One-off artifacts (AI policy documents, vendor invoices via unstructured parse)

This is Tower Packet 8's primary focus today.

### Workflow 3 · Expert authoring

Someone with consulting expertise (Anand, a Maestro, or a client's senior strategist) sits down and authors realistic engagement data directly into AbarVa. Not data entry — authoring. Rich context, stakeholder quotes, political constraints, known blockers.

**Scale:** 10-50 engagements per authoring session, deep per engagement.

**Latency:** N/A — authoring is the event.

**Who initiates:** Expert user.

**Integrity profile:** Highest contextual trust (expert judgment captured), medium structural trust (no source system backing it), variable freshness (snapshot of expert's understanding at time of authoring).

**Primary use cases:**
- Anand's personal test-drive workflow: creating 10+ engagements per client to stress-test Nexus module UX (see Packet 5)
- Maestros capturing engagement context that isn't in any source system
- Seeding a new client's Tower before automated pipelines are configured
- Teaching the Genome through high-quality synthetic patterns authored by experts

Workflow 3 is largely absent from Tower Packet 8 and needs first-class treatment. It's also the workflow that produces the richest Genome training data.

### The three workflows are not substitutes

They are complements. A mature AbarVa deployment runs all three concurrently:

- Pipeline pulls raw telemetry from 8 source systems daily
- Client uploads quarterly attestations and monthly risk register updates
- Maestros author engagement context during Program phases, enriching what pipeline and upload can't capture

All three flow into the same data layer, but each carries its own `source_class` property (Packet 6) that downstream systems use to weight trust appropriately.

## 1.3 The showcase argument

Here's the specific claim that grounds Packet 2:

> "The Data & Integrations surface is the first screen that makes a Fortune 50 CTO feel AbarVa understands their world."

Why this claim matters: in the 30-minute Prat-style demo, the attention budget is brutal. Every screen has to earn its real estate. The Data & Integrations surface can't be a utility screen the CTO glances past — it has to be a moment where they lean forward.

For that to happen, the screen has to show three things simultaneously:

1. **Breadth** — "They've cataloged dozens of data sources, not six."
2. **Specificity** — "They've organized those data sources by MY industry, with templates for MY functions."
3. **Rigor** — "They show me data quality gates, source classes, lineage, rollback paths — the things my team actually worries about."

A screen that shows all three simultaneously takes about 90 seconds to comprehend. A screen that shows only one of them is a wasted slot.

## 1.4 What makes AbarVa's ingestion different from competitors

Most enterprise SaaS ingestion is built around "connectors we have" — an inventory-driven approach. AbarVa's ingestion is built around **"problems we solve"** — an outcome-driven approach.

The difference shows up concretely:

A connector-driven product shows: "Connect Snowflake" → "Connect S3" → "Connect Microsoft Graph" → "Upload CSV"

AbarVa's outcome-driven product shows: "What portfolio data do you want to bring into AbarVa?" → [Cost / Adoption / Inventory / Risk / Attestation] → "For cost, we can pull from: Azure Billing, AWS Cost Explorer, GCP, Snowflake cost views, FinOps tools, or CSV template. Here's what each gets you." → [client chooses path] → [guided setup per path]

The outcome-driven framing means every data source is tagged by which Tower pillar it populates, what Program phase it informs, which cohort benchmarks it improves. The catalog isn't a list of connectors — it's a map from business needs to data paths.

This is harder to build. It's also the reason a CTO feels "you understand what I'm trying to do" vs "you have tools I could use."

## 1.5 Foundational principles for every ingestion path

Six principles govern all three workflows and the architecture underneath.

**Principle 1 · Transparency by default.**

Every ingested record shows where it came from, when, via which path, with what transformations. No black boxes. If the user can't trace a number back to its source in 2 clicks, the ingestion failed its integrity test.

**Principle 2 · Preview before commit.**

No ingestion path (upload, authoring, even pipeline) writes to the canonical Tower/Programs tables without an explicit commit step. Previews show exactly what will land, with validation flags on any rows that would fail.

**Principle 3 · Rollback is always available.**

Any ingestion event is reversible for 30 days. A bad CSV upload doesn't permanently poison the portfolio. Rollback is a right-click away.

**Principle 4 · Data classes travel with data.**

Every record carries a `data_class` property: `client_private`, `anonymizable_cohort`, or `platform_generic`. Ingestion determines the class based on source + client policy; downstream systems enforce access accordingly. This ties directly to the Data Layer spec's tenancy-as-property model.

**Principle 5 · The catalog is the interface.**

Users find the right ingestion path by browsing the segment catalog (Packet 2), not by reading a docs page. If a client has to read documentation to figure out how to ingest their data, AbarVa has failed.

**Principle 6 · Authoring is first-class.**

Expert-authored data is as legitimate as pipeline-ingested data — sometimes more so. The authoring surface is designed as a workbench, not as a limping fallback. (Packet 5.)

## 1.6 Out of scope for this spec

To keep scope tight:

- **Data warehouse architecture** — this spec covers how data enters AbarVa, not how it's stored once inside. Storage is in the Data Layer Future State spec.
- **Analytics/BI export** — how clients get data *out* of AbarVa into their own BI tools is a separate spec (future).
- **Reverse ETL** — pushing AbarVa-derived signals back into client systems (e.g., writing a Tower signal into a client's Jira as a ticket) is a future integrations capability, not covered here.
- **Real-time streaming** — Tower today operates on minute-to-daily latency. Sub-minute real-time streaming is a post-Series-A investment.

## 1.7 Decisions locked in Packet 1

| # | Decision | Rationale |
|---|---|---|
| 1.L1 | Ingestion is a strategic surface, not a utility layer | Where trust is won or lost |
| 1.L2 | Three workflows (pipeline / upload / authoring), all first-class | Each serves a distinct real need |
| 1.L3 | Data & Integrations surface is a 90-second "you understand my world" moment | Demo leverage, not just onboarding |
| 1.L4 | Outcome-driven framing beats connector-driven framing | Maps to business needs, not tool inventory |
| 1.L5 | Every record has data class + source class + lineage | Non-negotiable integrity |
| 1.L6 | Preview-before-commit on every path | Prevents bad writes |
| 1.L7 | 30-day rollback window on all ingestion events | Reversibility as safety |
| 1.L8 | Authoring workflow gets equal architectural weight as pipeline | Expert input is a real workflow |
| 1.L9 | This spec extends Tower Packet 8 where compatible, supersedes where not | Reconciliation discipline |
| 1.L10 | Catalog browsing is the entry point, docs are the backup | Interface over documentation |

## 1.8 Open decisions for later packets

- Catalog taxonomy and retail population detail · Packet 2
- Template versioning and inheritance · Packet 3
- Pipeline schema discovery and drift handling · Packet 4
- Authoring workbench UX and test-drive flag · Packet 5
- Provenance chain structure and source-class rules · Packet 6

---

## Packet 1 · Checkpoint

**STATUS · Track A, Packet 1 of 6 complete**

Foundation established. Three workflows differentiated. Showcase argument grounded. Integrity principles locked. Ready for Packet 2 (segment catalog).

---

# PACKET 2 · The Segment Catalog

The showcase layer. What a Fortune 50 CTO sees when they navigate to "Data & Integrations" and why they lean forward.

## 2.1 Catalog taxonomy

Data sources in AbarVa are organized along three axes simultaneously:

**Axis 1 · Industry** — the client's vertical (Retail, Financial Services, Healthcare, CPG, Industrial, Technology, Public Sector).

**Axis 2 · Function** — where in the operating model the data lives (Front Office, Middle Office, Back Office) and which sub-function (Customer Experience, Merchandising, Supply Chain, Finance, HR, Risk, Technology, etc.).

**Axis 3 · Source type** — what kind of system the data comes from (SaaS application, cloud billing, data warehouse, data lake, document repository, email, BI platform, custom API, manual spreadsheet).

Every data source in the catalog is tagged on all three axes. A single source may appear in multiple filter views. "Azure OpenAI API billing" appears under every industry (it's horizontal) but primarily under Technology function and Cloud billing source type.

This three-axis tagging means a client filtering "Retail + Customer Experience + Any source" sees 12-18 relevant sources, while "Any industry + Finance + Cloud billing" sees 8-10 sources, and "Retail + Everything + Everything" sees 50+ sources. The catalog grows with AbarVa; at launch it ships with retail fully populated (below) and the other industries stubbed for expansion.

## 2.2 Catalog surface layout

The catalog is not a list. It's a browseable, filterable, searchable interface that adapts to the client's context.

```
┌────────────────────────────────────────────────────────────────────┐
│ DATA & INTEGRATIONS · CATALOG                                      │
│  ──────────────────────────────────────────────────────────────    │
│                                                                    │
│  ◉ Filter by:                                                      │
│    Industry: [Retail ▼]                                           │
│    Function: [All ▼]                                              │
│    Source type: [All ▼]                                           │
│    Populates: [All ▼]  (Tower pillar or Program phase)            │
│                                                                    │
│  ◉ Search: [                                        ] [🔍]         │
│                                                                    │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                    │
│  32 data sources matching Retail + All functions + All sources    │
│                                                                    │
│  ▼ STORE OPERATIONS (8 sources)                                   │
│                                                                    │
│    ┌───────────────────────────────────────────────────────────┐  │
│    │ [🏪] UKG Dimensions / WorkForce                           │  │
│    │      Workforce management, scheduling, time & attendance  │  │
│    │      Populates: Adoption (store associate AI tools),      │  │
│    │                 Inventory (deployed workforce AI)         │  │
│    │      Paths: [API] [CSV template] [Manual authoring]       │  │
│    │      Setup time: ~30 min API / ~5 min CSV                 │  │
│    │      [See details →]                                      │  │
│    └───────────────────────────────────────────────────────────┘  │
│                                                                    │
│    ┌───────────────────────────────────────────────────────────┐  │
│    │ [📊] Zebra MotionWorks / Store telemetry                  │  │
│    │      Store associate productivity, task completion,       │  │
│    │      motion-capture data                                  │  │
│    │      Populates: Value (productivity gains), Adoption      │  │
│    │      Paths: [API] [S3 data export] [Manual authoring]     │  │
│    │      [See details →]                                      │  │
│    └───────────────────────────────────────────────────────────┘  │
│                                                                    │
│    [... 6 more in Store Operations ...]                           │
│                                                                    │
│  ▼ MERCHANDISING (6 sources)                                      │
│  ▼ SUPPLY CHAIN (7 sources)                                       │
│  ▼ CUSTOMER EXPERIENCE (5 sources)                                │
│  ▼ FINANCE & OPERATIONS (4 sources)                               │
│  ▼ TECHNOLOGY / IT (6 sources)                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Key design decisions

**Grouped by function, not alphabetized.** A CTO scanning for "what's here for store ops" wants all store ops sources together. Alphabetical ordering optimizes for "I know the exact product name" — not the discovery case.

**Collapsible sections.** With 32+ sources in retail, the page is long. Collapsible sections let users scan function headers first, expand what's relevant.

**Path-visible cards.** Every source card shows which ingestion paths it supports (API / CSV / S3 / Authoring) right there — no click required to see "wait, is this connector or template?"

**Populates tag.** Every source shows which Tower pillars or Program phases it feeds. This is the outcome-driven framing in practice — the client sees "this gets me adoption data" not just "this connects to UKG."

**Setup time estimate.** "~30 min API / ~5 min CSV" sets expectations. Transparency reduces friction and builds trust.

## 2.3 Retail catalog · fully populated

Retail is the exemplar industry because Apex Retail is the demo anchor and Prat (target design partner) is retail. Other industries follow the same structure; details populate over time.

### Store Operations (8 data sources)

**1 · UKG Dimensions / WorkForce**
- Function: Store Operations
- Source type: SaaS application
- Populates: Adoption, Inventory
- Paths: API (OAuth), CSV template, Authoring
- Setup complexity: 30 min API / 5 min CSV
- Data provided: workforce scheduling, shift management, time/attendance, associate profiles, AI tool usage by associate

**2 · Zebra MotionWorks + Reflexis**
- Function: Store Operations
- Source type: SaaS + sensor telemetry
- Populates: Adoption, Value
- Paths: API, S3 bulk export, Authoring
- Setup complexity: 1-2 hours API / 10 min S3 / 5 min authoring
- Data provided: task completion rates, store motion telemetry, operational efficiency metrics

**3 · Microsoft 365 Copilot (Store Associate deployment)**
- Function: Store Operations (Associate Productivity)
- Source type: SaaS admin API
- Populates: Adoption, Cost
- Paths: API (OAuth + Graph), CSV
- Setup complexity: 30 min API / 5 min CSV
- Data provided: MAU/DAU per associate, copilot query volume, license assignment, per-seat cost

**4 · Theatro / Relay (Comms platforms)**
- Function: Store Operations
- Source type: SaaS application
- Populates: Adoption
- Paths: API, CSV
- Setup complexity: 30 min / 5 min
- Data provided: store-team communication volume, AI-summary usage

**5 · Retail Orchestration Platforms (Manhattan Active, Blue Yonder Store Ops)**
- Function: Store Operations
- Source type: SaaS
- Populates: Inventory, Adoption
- Paths: API, CSV template
- Setup complexity: 1 hr / 10 min
- Data provided: store process automation, task AI coverage

**6 · Visual merchandising AI (Trigo, Standard AI, AiFi)**
- Function: Store Operations → Loss Prevention / Checkout
- Source type: Custom / vendor API
- Populates: Inventory, Value, Risk
- Paths: API, CSV, Authoring
- Setup: varies
- Data: shrink reduction metrics, computer vision event logs

**7 · Store audit & compliance platforms**
- Source type: SaaS
- Populates: Risk, Inventory
- Paths: CSV, API
- Data: compliance check results, AI-assisted store audits

**8 · Custom store analytics (S3 data lake)**
- Source type: S3 / Snowflake
- Populates: All pillars depending on tables
- Paths: S3 bucket access, Snowflake connection, schema discovery
- Setup: 1-4 hours depending on data complexity
- Data: whatever the client has built internally

### Merchandising (6 data sources)

**9 · o9 Solutions / Blue Yonder Demand Planning**
- Function: Merchandising + Supply Chain
- Populates: Inventory, Value (forecast accuracy)
- Paths: API, S3 export, CSV
- Setup: 2 hours / 30 min / 10 min
- Data: demand forecasting models deployed, forecast accuracy, SKU-level AI coverage

**10 · Dynamic pricing platforms (Revionics, DemandTec, Revionics.IO, Competera)**
- Function: Merchandising → Pricing
- Populates: Inventory, Value
- Paths: API, CSV, Authoring
- Setup: 1 hr / 5 min / 5 min
- Data: AI-driven pricing decisions per SKU, markdown optimization metrics

**11 · Assortment optimization (Oracle Retail, SAS, JDA)**
- Function: Merchandising
- Populates: Inventory
- Paths: API, CSV
- Data: AI-assisted assortment decisions, category-level AI coverage

**12 · Product content generation (Jasper, Writesonic, custom LLM)**
- Function: Merchandising → Content
- Populates: Adoption, Cost, Risk (shadow AI!)
- Paths: API (if sanctioned), CSV, Authoring (for shadow cases)
- Data: AI-generated product descriptions volume, cost per piece of content

**13 · Buying + trend analysis platforms (Trendalytics, First Insight, EDITED)**
- Function: Merchandising → Buying
- Populates: Inventory, Value
- Paths: API, CSV
- Data: AI-informed buying decisions, trend prediction accuracy

**14 · Image + catalog AI (Syte, ViSenze, Vue.ai)**
- Function: Merchandising → Catalog
- Populates: Adoption, Value
- Paths: API, CSV
- Data: visual search, catalog enrichment usage

### Supply Chain (7 data sources)

**15 · SAP IBP / Oracle SCM / Blue Yonder**
- Function: Supply Chain Planning
- Populates: Inventory, Value
- Paths: API, S3, CSV
- Setup: 2-4 hours API / 30 min CSV
- Data: planning AI coverage, forecast accuracy, inventory optimization metrics

**16 · Project44 / FourKites / Shippeo (Visibility)**
- Function: Supply Chain Execution
- Populates: Inventory, Value, Risk
- Paths: API, CSV
- Data: AI-driven ETA predictions, disruption detection metrics

**17 · Warehouse AI (Symbotic, Locus Robotics, 6 River Systems, GreyOrange)**
- Function: Supply Chain → Fulfillment
- Populates: Inventory, Adoption, Value
- Paths: API, CSV, Authoring
- Data: robotic fulfillment coverage, productivity gains

**18 · Transportation management AI (C.H. Robinson's Navisphere, Uber Freight, Convoy)**
- Function: Supply Chain → Transportation
- Populates: Inventory, Cost
- Paths: API, CSV
- Data: AI-matched shipments, cost savings

**19 · Inventory optimization (ToolsGroup, Logility, RELEX)**
- Function: Supply Chain + Merchandising
- Populates: Inventory, Value
- Paths: API, S3, CSV
- Data: ML-driven safety stock, replenishment recommendations

**20 · Supply chain risk AI (Everstream, Interos, Resilinc)**
- Function: Supply Chain → Risk
- Populates: Risk, Inventory
- Paths: API, CSV
- Data: disruption predictions, supplier risk scores

**21 · Returns management AI (Optoro, Returnly, Happy Returns)**
- Function: Supply Chain → Reverse Logistics
- Populates: Inventory, Value, Risk
- Paths: API, CSV, Authoring (for fraud detection patterns)
- Data: returns fraud detection, reverse logistics AI coverage

### Customer Experience (5 data sources)

**22 · Contact center AI (Genesys + Google CCAI, NICE, Cresta, Observe.AI)**
- Function: Customer Experience → Contact Center
- Populates: Adoption, Value, Risk
- Paths: API, CSV
- Setup: 1-2 hours API / 10 min CSV
- Data: intent routing metrics, agent assist usage, AHT reduction, CSAT correlation

**23 · Marketing AI (Salesforce Einstein, Adobe Sensei, Braze, Persado)**
- Function: Marketing + Customer Experience
- Populates: Adoption, Value, Cost
- Paths: API, CSV
- Data: AI-driven campaign performance, personalization metrics

**24 · Personalization platforms (Dynamic Yield, Bloomreach, Algolia AI)**
- Function: Customer Experience → Digital
- Populates: Adoption, Value
- Paths: API, CSV
- Data: recommendation engine coverage, conversion impact

**25 · Conversational commerce (Ada, Gorgias, Zendesk AI)**
- Function: Customer Experience → Digital Service
- Populates: Adoption, Value, Cost
- Paths: API, CSV
- Data: conversational AI deflection, resolution rates

**26 · Customer data platforms (Segment, mParticle, Treasure Data) with AI extensions**
- Function: Customer Experience → Data Foundation
- Populates: Inventory, Adoption
- Paths: API, CSV
- Data: AI model deployment against customer data, segment activation

### Finance & Operations (4 data sources)

**27 · Azure / AWS / GCP billing**
- Source type: Cloud billing APIs
- Populates: Cost (infrastructure), Inventory (deployed AI)
- Paths: API (OAuth), CSV export
- Setup: 30 min per cloud
- Data: all AI infrastructure spend, tagged by service/project

**28 · FinOps platforms (Cloudability, CloudHealth, Apptio)**
- Source type: SaaS
- Populates: Cost
- Paths: API, CSV
- Data: normalized cloud AI spend across providers

**29 · SaaS expense management (Zylo, Vendr, Torii, Blissfully, ZIP)**
- Source type: SaaS
- Populates: Cost, Inventory (shadow AI detection!)
- Paths: API, CSV
- Setup: 30 min API
- Data: all AI tool subscriptions including "shadow" AI detected via expense records — critical for the Apex Shadow AI demo signal

**30 · General ledger / ERP (SAP, Oracle, Workday, NetSuite)**
- Source type: ERP
- Populates: Cost, Value
- Paths: API, CSV, custom integration
- Data: AI-related GL entries, cost center allocation

### Technology / IT (6 data sources)

**31 · Cloud AI platforms (Azure OpenAI, AWS Bedrock, GCP Vertex, Anthropic, OpenAI direct)**
- Source type: AI platform APIs
- Populates: Cost, Adoption, Inventory
- Paths: API, CSV, Authoring
- Setup: 15-30 min per provider
- Data: token consumption, model deployment, API spend by application

**32 · Model monitoring (Arize, Evidently, Fiddler, WhyLabs)**
- Source type: SaaS
- Populates: Risk (drift, performance)
- Paths: API, CSV
- Data: model performance metrics, drift detection events

**33 · MLOps platforms (Databricks MLflow, SageMaker, Vertex AI, Weights & Biases)**
- Source type: ML platform
- Populates: Inventory, Risk, Cost
- Paths: API, CSV
- Data: deployed model registry, training costs, versioning

**34 · Code assist (GitHub Copilot, Amazon Q, Codeium, Cursor)**
- Source type: Developer tools
- Populates: Adoption, Cost, Value
- Paths: API (admin), CSV
- Data: developer copilot adoption, productivity metrics

**35 · Security & governance (Dynatrace AI, Splunk AI, Microsoft Purview)**
- Source type: Security platforms
- Populates: Risk, Inventory
- Paths: API, CSV
- Data: AI system audit logs, governance policy violations

**36 · ITSM (ServiceNow, Jira Service Management)**
- Source type: ITSM
- Populates: Inventory, Risk
- Paths: API, CSV
- Data: AI deployment tickets, incident AI coverage

### Generic cross-industry (not retail-specific, available to all industries)

**37 · S3 / Azure Data Lake / GCS bucket access**
- Source type: Object storage
- Populates: Any (depends on content)
- Paths: S3 access + schema discovery pipeline
- Setup: 1-4 hours (varies widely)
- Data: client's raw/processed data lake contents, schema-inferred routing

**38 · Snowflake / Databricks / BigQuery**
- Source type: Data warehouse
- Populates: Any (query-based)
- Paths: Read-only connection + query templates
- Setup: 30 min - 2 hours
- Data: client's warehouse tables, materialized as ingested rows

**39 · Generic CSV / Excel / JSON upload**
- Source type: Manual
- Populates: Any (via template routing)
- Paths: Upload + template match + Nexus parse fallback
- Setup: 5 min per file
- Data: anything templated; unstructured handled by Nexus

**40 · Unstructured documents (PDF, DOCX, PPTX)**
- Source type: Document
- Populates: Programs artifacts, Intelligence research base
- Paths: Upload + Nexus parse
- Setup: 5 min per document
- Data: extracted fields, attached as artifact references

## 2.4 Other industries · stubbed

The same taxonomic structure applies to other industries. Each will populate over time as AbarVa signs design partners in those verticals. At launch, stubs describe what each industry's catalog will cover:

**Financial Services (Banking + Capital Markets + Insurance)** — ~50 expected sources across Front Office (customer, advisory, trading), Middle Office (risk, compliance), Back Office (operations, finance). Core + unique: core banking, trading platforms, risk engines, compliance systems (Actimize, NICE, SAS), wealth management AI, insurance underwriting AI.

**Healthcare (Provider + Payer + Life Sciences)** — ~45 expected sources. Provider: EHR (Epic, Cerner/Oracle), clinical decision support, ambient clinical documentation (Abridge, Nuance, Suki), imaging AI, revenue cycle AI. Payer: claims AI (Gainwell, Cognizant), prior auth automation, member experience. Life Sciences: clinical trials AI, pharmacovigilance, commercial analytics.

**CPG (Consumer Packaged Goods)** — ~35 expected sources. Trade promotion AI, shopper analytics, sales force automation, R&D platforms, manufacturing AI.

**Industrial (Manufacturing + Energy + Utilities)** — ~40 expected sources. OT/IT convergence, predictive maintenance, quality AI, energy management AI, asset performance management.

**Technology (Horizontal SaaS + Semi + Hardware)** — ~30 expected sources. Largely overlaps with cross-industry — plus developer productivity, customer health, product analytics.

**Public Sector** — ~25 expected sources. Government-specific (citizen services AI, benefits processing, fraud detection), defense-adjacent (appropriate guardrails).

Each stub becomes a full catalog as AbarVa grows.

## 2.5 Catalog source record schema

Every source in the catalog is a structured record:

```yaml
source_id: uuid
name: string  # "UKG Dimensions"
slug: string  # "ukg-dimensions"
display_name: string
tagline: string  # one-line description

# Taxonomic tags (multiple allowed per axis)
industry_tags: [retail, financial_services, ...]  # empty = cross-industry
function_tags: [store_operations, merchandising, ...]
source_type_tags: [saas_application, cloud_billing, ...]

# What it populates
populates_tower_pillars: [adoption, cost, ...]
populates_program_phases: [3, 4, ...]  # relevant Nexus phases
populates_intelligence_products: [cost, technology, ...]

# Ingestion paths
paths:
  api:
    supported: true
    auth_type: oauth2  # or service_account, api_key, custom
    setup_time_minutes: 30
    incremental_sync: true
    historical_backfill: true
    rate_limits: "1000 req/hr"
  csv:
    supported: true
    template_id: "retail_adoption_ukg_v1"
    setup_time_minutes: 5
  s3:
    supported: false
  authoring:
    supported: true
    template_id: "retail_adoption_authoring_v1"

# Metadata
vendor_name: string
vendor_url: string
documentation_url: string
support_contact: string

# Trust + governance
default_data_class: client_private  # or anonymizable_cohort, platform_generic
pii_risk: medium  # low, medium, high
phi_risk: low
compliance_flags: [pci, ccpa]  # only if applicable

# Lifecycle
added_at: timestamp
last_verified_at: timestamp
status: active  # active, beta, deprecated
```

This schema lets the catalog be data-driven. Adding a new source means authoring a source record, not writing UI code.

## 2.6 Search and discovery

The catalog supports three navigation modes:

**Mode 1 · Browse by function.** Default view. Collapsible sections grouped by function under the filtered industry.

**Mode 2 · Filter by outcome.** "I want cost data" → filter by populates_tower_pillars:cost. Shows all sources that feed cost data.

**Mode 3 · Search by name.** Text search across source names, vendor names, taglines. Typo-tolerant (fuzzy matching).

All three modes share the same result card pattern.

## 2.7 Source detail page

Clicking "See details →" on a source card opens a full-page detail view:

```
┌────────────────────────────────────────────────────────────────────┐
│ < Back to catalog                                                  │
│                                                                    │
│  [Vendor logo]  UKG Dimensions / WorkForce                         │
│  Workforce management, scheduling, time & attendance               │
│                                                                    │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                    │
│  ▼ What AbarVa gets from this source                              │
│                                                                    │
│  Populates:                                                        │
│  • Tower · Adoption (store associate AI tool usage)                │
│  • Tower · Inventory (deployed workforce AI deployments)           │
│  • Programs · Phase 3 Diagnosis (workforce-related engagements)    │
│  • Intelligence · People (workforce capacity context)              │
│                                                                    │
│  Specific data fields:                                             │
│  • Associate-level AI tool assignments                             │
│  • MAU/DAU per AI tool per associate                               │
│  • Workforce scheduling impact from AI assist                      │
│  • Shift coverage metrics                                          │
│                                                                    │
│  ▼ How to connect                                                 │
│                                                                    │
│  Choose your path:                                                 │
│                                                                    │
│  [■] API connection (recommended)                                  │
│       Setup: ~30 minutes · OAuth required                          │
│       Your IT team authorizes AbarVa's OAuth app.                 │
│       Continuous sync every 4 hours.                               │
│       [Start API setup →]                                         │
│                                                                    │
│  [■] CSV template                                                  │
│       Setup: ~5 minutes                                            │
│       Download the UKG export template.                            │
│       Export from UKG, upload, commit.                             │
│       [Download template] [Start upload →]                        │
│                                                                    │
│  [■] Authoring                                                     │
│       Setup: ~5-15 minutes per use case                           │
│       Author associate-level AI adoption manually.                 │
│       Useful for test-drive or if API/CSV not available.           │
│       [Start authoring →]                                         │
│                                                                    │
│  ▼ Governance                                                      │
│                                                                    │
│  Default data class: Client-private                                │
│  PII handling: associate names stored encrypted, roles in-clear    │
│  Retention: per client policy, default 36 months                   │
│                                                                    │
│  [Configure governance defaults →]                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Detail page is structured consistently across all sources; values pull from the source record schema.

## 2.8 The catalog as a selling point

Return to the showcase argument. When a CTO lands on the catalog:

- 30 seconds in: "There are 32 retail sources organized by my functions." (Breadth)
- 60 seconds in: "Each source tells me which data pillars it populates and how long setup takes." (Specificity)
- 90 seconds in: "Each source shows governance defaults, data class, PII handling." (Rigor)
- 120 seconds in: "I can drill into any source and see exactly what data AbarVa will see." (Transparency)

At this point the CTO is not thinking "can this tool work?" They're thinking "these people have done their homework." That's the moment we're engineering for.

## 2.9 Decisions locked in Packet 2

| # | Decision | Rationale |
|---|---|---|
| 2.L1 | Three-axis taxonomy: industry × function × source type | Matches how CTOs think about their data landscape |
| 2.L2 | Every source tagged by what it populates (pillars, phases, products) | Outcome-driven framing |
| 2.L3 | Catalog grouped by function, not alphabetized | Optimizes for discovery, not lookup |
| 2.L4 | Every source shows available paths + setup time + populates | Transparency at glance |
| 2.L5 | Retail fully populated at launch (~40 sources); other industries stubbed | Demo anchor + scalable growth |
| 2.L6 | Each source is a structured record with governance defaults | Data-driven catalog, no code changes to add sources |
| 2.L7 | Three navigation modes: browse / filter by outcome / search | Different discovery patterns |
| 2.L8 | Source detail page shows governance, data class, PII handling | Enterprise rigor visible |
| 2.L9 | Setup time estimates visible before committing to a path | Expectation-setting reduces friction |
| 2.L10 | Every source supports at least one path (authoring always available as fallback) | No dead ends |

## 2.10 Open decisions for later packets

- Template versioning model · Packet 3
- S3 / Snowflake schema discovery and drift handling · Packet 4
- Authoring UX depth · Packet 5
- Lineage and source-class propagation · Packet 6

---

## Packet 2 · Checkpoint

**STATUS · Track A, Packet 2 of 6 complete**

Segment catalog specified. Retail exemplar fully populated (40 sources across 6 functions). Taxonomy and source schema defined. Browse/filter/search modes specified. Detail page layout locked.

---

# TRACK B · WORKFLOWS (Packets 3-5)

Track B specifies how each of the three workflows actually operates: template library (Workflow 2 backbone), pipeline automation (Workflow 1), and authoring mode (Workflow 3).

---

# PACKET 3 · Template Library Architecture

Templates are the backbone of the client-upload workflow and also the structural basis for pipeline ingestion (pipelines conform to template schemas after classification). This packet specifies how templates are structured, versioned, composed, and validated.

## 3.1 Why templates aren't just "CSV with headers"

A template in AbarVa is more than column headers. It's a versioned, typed, validated contract between a data source and the destination tables. Templates carry:

- **Schema** — columns, types, required vs optional
- **Validation rules** — value constraints, format rules, business logic
- **Data dictionary** — per-column documentation, examples, common pitfalls
- **Transformations** — how uploaded columns map to destination fields (some direct, some computed, some enriched)
- **Governance** — default data class per field, PII/PHI classification
- **Lineage metadata** — every row ingested carries template_id + template_version + upload_timestamp

Treating templates as a library with this structure lets AbarVa evolve schemas over time without breaking existing uploads and without surprising users.

## 3.2 Template taxonomy

Templates are organized hierarchically:

**Base templates** (5 universal):
- Inventory · one row per AI use case
- Adoption · one row per use case per measurement month
- Cost · one row per vendor or use case per month
- Risk · one row per use case per risk
- Attestation · one row per attestation event

These match Tower Packet 8.5 baseline.

**Industry overlays** — extend base templates with industry-specific fields:
- Retail Inventory overlay adds: store_count_deployed, SKU_coverage, location_footprint
- Healthcare Inventory overlay adds: clinical_setting, PHI_risk_classification, FDA_regulatory_status
- Financial Services Inventory overlay adds: regulated_use_case, SR_11_7_applicable, model_validation_status

**Source-specific templates** — pre-configured for common data sources:
- UKG Adoption template (retail) — pre-mapped from UKG export format
- Microsoft 365 Copilot Adoption template — pre-mapped from Graph API export
- Azure Billing Cost template — pre-mapped from Azure Cost Management export

**Specialized templates** — for edge cases:
- Shadow AI Inventory template — captures unmanaged tools detected via expense audit
- Vendor Invoice template — for one-off invoice uploads (Jasper, Abridge, etc.)
- AI Policy Document template — for ingesting client AI governance documents

## 3.3 Template record schema

Every template is a versioned record:

```yaml
template_id: uuid
slug: "retail_adoption_ukg"
display_name: "Retail Adoption · UKG"
version: semver  # 1.0.0, 1.1.0, etc.
parent_template: "adoption_base_v2"  # inherits from base
industry_scope: [retail]  # empty = universal
source_scope: [ukg_dimensions]  # empty = not source-specific

# Schema
columns:
  - name: use_case_id
    type: string
    required: true
    description: "Unique use case identifier"
    example: "apex-store-associate-ai"
    destination_field: "engagements.id"
    validation:
      pattern: "^[a-z0-9-]+$"
      must_exist_in: engagements  # foreign key validation
  
  - name: measurement_month
    type: date
    required: true
    format: "YYYY-MM"
    description: "Month of the measurement in YYYY-MM format"
    example: "2026-04"
    destination_field: "metric_observations.observation_date"
    validation:
      min_date: "2023-01"
      max_date: "now"
  
  - name: monthly_active_users
    type: integer
    required: true
    description: "Count of associates who used this AI tool in the month"
    example: 127
    destination_field: "metric_observations.value"
    destination_metric_key: "monthly_active_users"
    validation:
      min: 0
      max: 100000
  
  # ... more columns

# Transformations
transformations:
  - type: lookup
    source_column: vendor
    lookup_table: vendors
    if_not_found: "create_new"
    
  - type: compute
    name: adoption_penetration_pct
    formula: "monthly_active_users / licensed_seats * 100"
    destination_metric_key: "adoption_penetration_pct"

# Data quality gates
quality_gates:
  - rule: "no duplicate (use_case_id, measurement_month) pairs in upload"
    severity: error
    action: reject
  
  - rule: "monthly_active_users <= licensed_seats"
    severity: warning
    action: flag_for_review
  
  - rule: "adoption_penetration_pct > 100 is usually wrong"
    severity: warning
    action: flag_for_review

# Governance
default_data_class: client_private
pii_fields: []
phi_fields: []
compliance_notes: "No PII if associate_id is hashed; raw associate names OK in client_private class"

# Metadata
created_at: timestamp
last_updated: timestamp
deprecation_status: null  # or "deprecated_in_v1_5"
replacement_template: null
```

## 3.4 Template versioning

Templates follow SemVer:

- **Major** (1.0 → 2.0) — breaking change (column removed, column renamed, required status changed). Old uploads that match v1 continue to work; new uploads use v2.
- **Minor** (1.0 → 1.1) — additive change (new optional column, new validation rule). Backwards-compatible.
- **Patch** (1.0.0 → 1.0.1) — documentation, example, or non-semantic fix.

Upload records always persist `template_id + template_version`. If a template is later updated, historical uploads retain provenance to the exact version used.

Breaking changes in templates trigger:
1. New major version published
2. Previous version marked "deprecated_in_vNN" with migration notes
3. Existing uploads unaffected (schema history preserved)
4. New uploads use new version by default; users can pin to old version if needed
5. 180-day sunset on old major version before removal

## 3.5 Template inheritance

Industry overlays inherit from base templates:

```
adoption_base_v2
├── columns: use_case_id, measurement_month, monthly_active_users, licensed_seats, ...
├── validation: standard base rules
│
├── retail_adoption_v2 (overlay)
│   └── adds: store_count_engaged, associates_trained_pct
│
├── healthcare_adoption_v2 (overlay)
│   └── adds: clinical_setting, provider_role_mix
│
└── fs_adoption_v2 (overlay)
    └── adds: regulated_role_coverage, model_governance_compliance
```

Inheritance rules:
- Overlay inherits all base columns, validation, transformations
- Overlay can add new columns but cannot remove base columns
- Overlay can add new validation rules but cannot weaken base rules
- Major-version of base propagates to overlays (retail_adoption_v2 matches adoption_base_v2)

Source-specific templates further inherit from industry overlays:

```
retail_adoption_v2
├── retail_adoption_ukg_v1 (source-specific)
│   └── pre-mapped columns from UKG export format
│
├── retail_adoption_microsoft365_v1
│   └── pre-mapped from Graph API CSV export
│
└── retail_adoption_generic_v1
    └── generic template (no source mapping)
```

## 3.6 Template UX · download and upload flows

### Template download UX

From the segment catalog source detail page, user clicks "Download template":

```
┌────────────────────────────────────────────────────────────────────┐
│  Download template: Retail Adoption · UKG                          │
│  Version 1.2.0 · Last updated March 15, 2026                       │
│                                                                    │
│  Template contains:                                                │
│  • 12 columns (8 required, 4 optional)                             │
│  • 1 example row                                                   │
│  • Data dictionary (included as second sheet)                      │
│  • Validation rules (documented inline)                            │
│                                                                    │
│  Format:                                                           │
│    ◉ Excel (.xlsx) — recommended, has validation + data dict      │
│    ○ CSV (.csv) — simple, no validation                           │
│    ○ JSON (.json) — API-style, for programmatic upload           │
│                                                                    │
│  [Download template]  [Preview schema]                             │
│                                                                    │
│  Advanced:                                                         │
│  [Link to API docs]   [Download all related templates as zip]     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Excel download includes:
- Sheet 1 · the template with headers, one example row in light gray, Excel data validation on typed columns
- Sheet 2 · data dictionary with column-by-column documentation
- Sheet 3 · validation rules reference
- Sheet 4 · change log (if template has versions)

### Upload flow · extends Tower Packet 8.6

The upload flow is as specified in Tower Packet 8.6 with these additions:

**Step 0 · Template detection.** If the uploaded file name matches a known template pattern (e.g., "retail_adoption_ukg_2026_04.xlsx"), the system detects the template. If the filename is ambiguous, the system offers a template picker before the preview step.

**Step 3 (Preview) enhancement:** The preview now shows:
- Template detected: "Retail Adoption · UKG v1.2.0"
- Column mapping visualization (expected vs uploaded columns)
- Fuzzy-matched unmapped columns with "Did you mean...?" suggestions
- Data quality flags per row
- Summary stats: "134 rows, 2 warnings, 0 errors"

**Step 4 (Confirm) enhancement:** User sees:
- Rows to ingest
- Data class to be applied (client_private by default)
- Lineage metadata preview (template_id, template_version, upload_timestamp, user)
- Rollback commitment (30 days)

## 3.7 Handling uploads that don't match a template

Sometimes a user uploads something that doesn't conform to any template. The flow:

1. **Auto-detect attempt.** System tries fuzzy matching against known templates. If confidence > 0.8, proceed with that template and show confidence level.

2. **Nexus-assisted classification.** If no template matches with confidence, Nexus parses the file, proposes a mapping, and asks the user to confirm. ("This looks like Cost data with 134 rows. I see vendor, month, and amount columns. Shall I map these to the Cost template?")

3. **Manual mapping fallback.** User can explicitly choose a template and map columns themselves.

4. **Authoring fallback.** If the data doesn't fit any template, the system offers to open it as a starting point in Authoring mode (Packet 5).

## 3.8 Template library management

Templates are managed in a dedicated admin surface at `/admin/templates`. AbarVa team (initially just Anand) can:

- Browse all templates
- Create new templates
- Edit existing templates (triggers version bump)
- Deprecate templates
- See usage metrics (how many uploads used which template)

Users (clients) cannot author templates. Template authoring is AbarVa-gated to prevent a proliferation of near-duplicate templates.

Exception: **client custom templates**. In post-demo phase, enterprise clients may have data shapes that AbarVa's templates don't cover. A controlled authoring workflow lets a client request a custom template; AbarVa creates it, scoped to that client. This is a Tier 4 feature (beyond design-partner-readiness).

## 3.9 The initial template library (launch)

At AbarVa launch / demo, the template library contains:

**Base templates (5):** Inventory, Adoption, Cost, Risk, Attestation (v2).

**Retail overlays (5):** retail_inventory, retail_adoption, retail_cost, retail_risk, retail_attestation (v2).

**Retail source-specific templates (~15):** Covering the top retail-integrated sources from Packet 2:
- retail_adoption_ukg_v1
- retail_adoption_microsoft365_v1
- retail_cost_azure_v1
- retail_cost_aws_v1
- retail_cost_snowflake_v1
- retail_adoption_copilot_store_associate_v1
- retail_inventory_servicenow_v1
- retail_risk_arize_v1
- retail_inventory_custom_s3_v1
- retail_cost_saas_expense_v1 (for Shadow AI detection)
- retail_adoption_contact_center_ai_v1
- retail_value_marketing_ai_v1
- ... (additional templates populated over time)

**Other industries:** stub templates only at launch; populated as design partners sign.

**Cross-industry:** 
- generic_inventory, generic_adoption, etc. (base-industry-neutral overlays)
- shadow_ai_inventory_v1 (for any industry)

Total at launch: ~25-30 templates. Expected to grow to 100+ within 6 months post-design-partner.

## 3.10 Decisions locked in Packet 3

| # | Decision | Rationale |
|---|---|---|
| 3.L1 | Templates are versioned, typed, validated contracts — not just CSV headers | Structural basis for all ingestion |
| 3.L2 | SemVer on templates, 180-day deprecation window | Evolution without breakage |
| 3.L3 | Three-level inheritance: base → industry overlay → source-specific | Specificity without duplication |
| 3.L4 | Template record schema is data-driven (admin-authored, not code) | New templates without deploys |
| 3.L5 | Excel download is preferred format (validation + data dict embedded) | Better user experience |
| 3.L6 | Upload flow detects template by filename, then by column shape, then by Nexus parse | Graceful fallback chain |
| 3.L7 | Non-matching uploads fall back to manual mapping or authoring mode | No dead ends |
| 3.L8 | Clients cannot author templates (prevents drift); AbarVa manages library | Quality over freedom |
| 3.L9 | Retail has ~15 source-specific templates at launch; other industries stubbed | Demo anchor + growth path |
| 3.L10 | Every ingested row carries template_id + template_version in lineage | Auditability |

---

## Packet 3 · Checkpoint

**STATUS · Track B, Packet 3 of 6 complete**

Template library architecture specified. Versioning, inheritance, governance, UX flows all defined. Initial library inventory locked (~25-30 templates at launch). Ready for Packet 4 (pipeline automation).

---

# PACKET 4 · Pipeline Automation

The hardest workflow to build and the highest-leverage once it's running. Pipeline automation is what turns AbarVa from "manual data entry tool" into "continuously-updating intelligence platform."

This packet specifies: the pipeline architecture, the S3 / Snowflake / Databricks connector patterns, schema discovery, drift handling, backfill strategy, data quality gates, and classification routing.

## 4.1 Pipeline architecture at a glance

Every automated pipeline follows the same 7-stage flow:

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   
│  Source  │ → │ Extract  │ → │ Discover │ → │ Classify │ → 
└──────────┘   └──────────┘   └──────────┘   └──────────┘   
                                                              
┌──────────┐   ┌──────────┐   ┌──────────┐                    
│Transform │ → │ Validate │ → │  Route   │ → [Tower/Programs]
└──────────┘   └──────────┘   └──────────┘                    
```

**Stage 1 · Source.** The originating system. Could be S3 bucket, Snowflake table, SaaS API, cloud billing endpoint, etc.

**Stage 2 · Extract.** Pull data from source. Handles auth, pagination, incremental vs full sync, rate limiting.

**Stage 3 · Discover.** Infer schema from extracted data (on first run or when source schema changes). Identify column types, likely semantic meanings, PII indicators.

**Stage 4 · Classify.** Determine which template(s) this data matches. High-confidence auto-routes; low-confidence queues for review.

**Stage 5 · Transform.** Apply template transformations (lookups, computations, enrichments). Map source columns to destination fields.

**Stage 6 · Validate.** Run data quality gates. Reject or flag rows that fail. Emit metrics on quality.

**Stage 7 · Route.** Commit to destination tables (Tower metric_observations, signals, engagements, etc.) with full lineage.

Each stage is instrumented for observability. Failures at any stage stop the pipeline and alert operators, rather than silently corrupting data.

## 4.2 Connector types

Four connector patterns cover ~95% of enterprise data sources:

### Pattern 1 · SaaS API connector

For sources with published APIs (Microsoft Graph, ServiceNow, Salesforce, Snowflake, etc.).

**Auth:** OAuth 2.0 preferred; service account / API key as fallback.

**Extract method:** REST or GraphQL calls; paginate through results; incremental via updated_at or change tokens.

**Sync cadence:** Configurable per source. Defaults: daily for most, 4-hourly for high-priority, real-time (webhooks) for event streams where available.

**Backfill:** One-time initial pull to configurable history depth (default 24 months).

**Rate limit handling:** Exponential backoff, per-source quotas, pause-and-resume on throttle.

### Pattern 2 · Cloud billing connector

For cloud cost data (Azure Cost Management, AWS Cost Explorer, GCP Billing).

**Auth:** Cross-account IAM role or service account with cost-read permissions.

**Extract method:** Native cost APIs or exported reports from designated S3/GCS bucket.

**Sync cadence:** Daily (cloud billing settles ~24 hours).

**Backfill:** Up to 12 months history on initial connection.

**Special logic:** AI cost allocation — tagging analysis to separate AI-related infrastructure spend from general cloud spend. Client configures tag rules; pipeline applies them.

### Pattern 3 · Data lake / warehouse connector

For client-owned data in S3, Snowflake, Databricks, BigQuery, Azure Data Lake.

**Auth:** Read-only credentials, storage access keys, or federated identity.

**Extract method:** Direct query (SQL for warehouse) or file listing + read (S3 / lake).

**Sync cadence:** Configurable; defaults to hourly for warehouse, daily for lake.

**Schema discovery:** Critical here. Client points AbarVa at a bucket/database; AbarVa crawls the structure, samples data, infers meaning. See 4.4.

**Backfill:** Depends on data volume; may be one-time historical import or rolling window.

**Large-data handling:** For very large data volumes, AbarVa creates pre-aggregated views rather than ingesting raw records. Aggregation logic is template-driven.

### Pattern 4 · File drop connector

For sources that can't push via API but can land files in a shared location (SFTP, S3 prefix, email attachment forwarding).

**Auth:** Source-side (they control the drop); AbarVa watches.

**Extract method:** Polling or event-driven (S3 Event Notification, SFTP watcher, email webhook).

**Sync cadence:** On arrival.

**Format:** Expected to match a template; fallback to Nexus parse for unstructured files.

## 4.3 Connection setup UX

From the source detail page (Packet 2.7), user clicks "Start API setup →". The guided flow:

```
┌────────────────────────────────────────────────────────────────────┐
│ Connect Microsoft 365 Copilot                                      │
│                                                                    │
│ Step 1 of 4 · Prerequisites                                        │
│                                                                    │
│ Before you connect, make sure:                                     │
│ ✓ You have Microsoft 365 Global Admin access                       │
│ ✓ Your org allows OAuth app consent for third-party apps          │
│ ✓ You're authorized to share this data with AbarVa                │
│                                                                    │
│ [Continue]   [I need help with this]                              │
└────────────────────────────────────────────────────────────────────┘

Step 2 of 4 · OAuth consent
  [opens Microsoft consent screen in popup]
  User grants permissions
  Redirects back with auth token

Step 3 of 4 · Configure sync
  Sync cadence: [Every 4 hours ▼]
  Historical backfill: [Last 12 months ▼]
  Data scope: [All Copilot deployments ▼]
  Data class default: [Client-private ▼]
  [Save and start first sync]

Step 4 of 4 · First sync in progress
  [Progress indicator]
  Discovered schema: [12 tables, 180K rows expected]
  Classifying: [matching to retail_adoption_microsoft365_v1 template]
  Transforming + validating: [98% rows passed, 2% flagged for review]
  Routing to Tower: [Adoption pillar populated]
  
  ✓ Connection active
  [View data in Tower]  [Configure further]
```

The UX shows the entire pipeline running the first time, transparently. On subsequent syncs, the flow is quiet unless something breaks.

## 4.4 Schema discovery

When a client connects an S3 bucket, Snowflake database, or lake, AbarVa doesn't know what's there. Schema discovery bridges from "here's a bucket" to "here's what we can ingest."

### Discovery steps

**Step 1 · Enumeration.** Crawl the structure. For S3: list prefixes, identify file formats. For Snowflake: list databases, schemas, tables. For Databricks: catalogs, schemas, tables.

**Step 2 · Sampling.** For each table/file, sample N rows (default 1000). Infer column types. Detect null rates, uniqueness, distribution shape.

**Step 3 · Semantic classification.** Use a combination of column name patterns, value patterns, and Nexus parse to guess the semantic meaning. Column "annual_revenue" with large numeric values → likely a revenue metric. Column "vendor_name" with string values → likely vendor identifier. Column "created_dt" with timestamps → likely creation date.

**Step 4 · Template matching.** For each candidate table, compute match score against known templates. A table with columns `[use_case_id, measurement_month, monthly_active_users, licensed_seats]` matches `adoption_base_v2` with high confidence.

**Step 5 · Mapping proposal.** Generate a proposed mapping for each table: "This table looks like Adoption data. Proposed mapping to adoption_base_v2 template (confidence: 85%)."

**Step 6 · Review UI.** Present the proposals to the client. Client accepts, rejects, or refines each mapping.

**Step 7 · Materialization.** Accepted mappings become live pipelines. AbarVa generates the ETL logic per table.

### Discovery UI

```
┌────────────────────────────────────────────────────────────────────┐
│ Schema discovery complete · s3://apex-retail-data-lake/             │
│                                                                    │
│ Found 47 tables/files across 6 prefixes.                           │
│                                                                    │
│ ▼ ai_usage/ (8 tables)                                            │
│                                                                    │
│ ✓ ai_usage/copilot_daily_usage.parquet                            │
│   Looks like: Adoption data                                        │
│   Template match: adoption_base_v2 (85% confidence)                │
│   Rows: 127,000 · Updated daily                                    │
│   [Accept] [Reject] [Refine mapping]                              │
│                                                                    │
│ ? ai_usage/vendor_spend_monthly.csv                                │
│   Looks like: Cost data (possibly)                                 │
│   Template match: cost_base_v2 (62% confidence)                    │
│   Rows: 4,800 · Updated monthly                                    │
│   Issues: "vendor" column has unusual values                      │
│   [Review and map manually]                                       │
│                                                                    │
│ ✗ ai_usage/experimental_logs.json                                  │
│   No clear template match.                                         │
│   [Skip]  [Open in authoring mode]  [Custom map]                  │
│                                                                    │
│ ▼ analytics/ (12 tables)                                          │
│ ▼ operations/ (9 tables)                                          │
│ ▼ archive/ (18 tables — automatically skipped)                     │
│                                                                    │
│ Summary: 24 tables ready to map, 8 need review, 15 archived       │
│ [Accept all high-confidence]  [Review one-by-one]                 │
└────────────────────────────────────────────────────────────────────┘
```

Discovery is powerful but supervised. Client approves before any mapping goes live.

## 4.5 Drift handling

Source schemas change. New columns appear. Old columns disappear. Data types shift. Without drift handling, pipelines break silently.

### Drift detection

Every sync, the pipeline compares the current source schema to the known (previous) schema. Detects:

- **New columns** — added by source, not in mapping
- **Removed columns** — previously mapped, now missing
- **Type changes** — column was string, now integer (or vice versa)
- **Distribution shifts** — column values have changed significantly (e.g., null rate jumped from 5% to 80%)

### Drift response

Four behaviors based on severity:

**New columns, low relevance** (e.g., internal metadata) — logged, ignored, no user notification.

**New columns, possibly relevant** — flagged, user shown: "Source has added column `ai_confidence_score`. Would you like to map this?"

**Removed columns, required in template** — pipeline pauses, user alerted: "Source removed column `monthly_active_users` which was required. Your pipeline is paused until you resolve."

**Type changes** — pipeline pauses, user alerted: "Column `license_cost` changed from INT to STRING. This may break downstream metrics. Review before resume."

**Distribution shifts** — not pipeline-breaking, but flagged as potential data quality issue: "Null rate on `vendor_name` jumped from 3% to 67%. Something may be wrong at source."

### Drift handling UX

A "Pipeline Health" tab shows status of all active pipelines, drift alerts, and remediation actions. Pipelines with unresolved drift issues don't silently write bad data — they pause and wait for human review.

## 4.6 Data quality gates

Before any row commits to destination tables, it passes through the template's quality gates (defined in Packet 3.3).

### Gate types

**Schema gates** — required columns present, types match, no malformed values.

**Business logic gates** — value constraints (MAU ≤ licensed seats, cost > 0, etc.).

**Referential gates** — foreign keys resolve (use_case_id exists in engagements table).

**Statistical gates** — outliers within N standard deviations, null rates under threshold, duplicate check.

### Gate severity

Three severity levels per gate:

- **Error** — row is rejected; must be fixed at source or in template
- **Warning** — row is accepted but flagged; visible in Data Quality tab for review
- **Info** — row accepted, noted in log for monitoring

### Quality report

After every sync, a quality report is generated:

```
┌────────────────────────────────────────────────────────────────────┐
│ Sync Report · Retail Adoption · UKG                                │
│ Completed: 2026-04-21 03:14 · Duration: 47 seconds                 │
│                                                                    │
│ Rows processed: 1,847                                              │
│ Rows committed: 1,823 (98.7%)                                      │
│ Rows rejected: 12 (0.65%)                                          │
│ Rows flagged: 12 (0.65%)                                           │
│                                                                    │
│ Rejections:                                                        │
│  • 8 rows · missing required column `measurement_month`            │
│  • 4 rows · invalid format in `associate_id`                       │
│                                                                    │
│ Warnings:                                                          │
│  • 12 rows · MAU exceeds licensed seats                            │
│                                                                    │
│ [Download rejection details]  [Review warnings in Data Quality]    │
└────────────────────────────────────────────────────────────────────┘
```

High rejection rates (>5%) trigger an alert. Consistent warnings over multiple syncs trigger a "recurring data quality issue" surface.

## 4.7 Backfill strategy

Initial pipeline connection triggers backfill. Strategy depends on source:

**Recent-history defaults:**
- Adoption data: 12 months
- Cost data: 12 months  
- Inventory data: point-in-time (current state only)
- Risk data: 6 months
- Attestation data: 24 months (historical record is valuable)

**Configurable depth:** Client can extend or shorten. Deeper backfill = longer initial sync.

**Staged commitment:** Backfill data commits in monthly batches to destination tables. Client sees progress: "Backfilling April 2026..." "Backfilling March 2026..." etc. Can cancel mid-backfill.

**Quality gates still apply:** Backfilled rows pass the same gates as live rows. Bad historical data doesn't enter.

## 4.8 Classification routing

After extract + discover + transform, classification decides where data lands.

### Classification logic

Given a row of ingested data with known template mapping:

1. Route to the destination table specified in template.destination_field
2. Apply data_class (default from source, overridable per row)
3. Attach lineage metadata (source_id, pipeline_run_id, template_id, template_version, upload_timestamp, ingested_by)
4. If row populates Tower pillar metrics, compute derived metrics per template transformations

### Multi-destination routing

Some source data populates multiple destinations. Example: an adoption record feeds:
- `metric_observations.monthly_active_users` (raw value)
- `metric_observations.adoption_penetration_pct` (computed)
- Signal detection engine (checks: is adoption below cohort threshold?)
- Engagement pillar_states.adoption (denormalized for query performance)

Templates define all destinations; routing fans out the single source row accordingly.

## 4.9 Pipeline monitoring and operations

Operations layer for when things go wrong.

### Dashboards

**Pipeline Health** — all active pipelines, current status, last sync, success rate, drift alerts.

**Data Quality** — rejection rates over time, warning trends, recurring issues by template.

**Lineage explorer** — pick a row in Tower, trace back to source pipeline, source record, source timestamp.

### Alerting

Automated alerts for:
- Pipeline failure
- Sustained high rejection rate (>5% over 3 consecutive syncs)
- Drift requiring user action
- Missing expected data (pipeline ran but returned zero rows when history shows steady volume)

Alerts route to client's designated data owner email and/or Slack.

### Operator tooling

AbarVa team tools (admin-only):
- Manually trigger a pipeline run
- Reset a pipeline's state (for recovery from broken runs)
- Inspect raw extracted data (for debugging)
- Override classification decisions (for edge cases)

## 4.10 Build sequencing for pipelines

Pipelines aren't a single sprint. They build up over milestones:

**Milestone 1 (Demo):** No automated pipelines. All demo data is seed-loaded.

**Milestone 2 (Post-demo, weeks 1-4):** First SaaS API connectors — Microsoft Graph, ServiceNow, basic cloud billing. ~3-5 pipelines operational.

**Milestone 3 (Design partner, months 1-3):** Expanded SaaS coverage (10+ connectors), first S3/Snowflake schema discovery implementation, basic drift handling.

**Milestone 4 (Scale, months 3-6):** Production-grade discovery, full drift handling, file-drop connectors, 25+ pipeline patterns.

**Milestone 5 (Year 1):** Partner-authorized connectors, custom pipeline SDK for enterprise clients, real-time streaming where applicable.

## 4.11 Decisions locked in Packet 4

| # | Decision | Rationale |
|---|---|---|
| 4.L1 | 7-stage pipeline architecture (source → extract → discover → classify → transform → validate → route) | Consistent observability and error handling |
| 4.L2 | Four connector patterns (SaaS API, cloud billing, lake/warehouse, file drop) cover ~95% of enterprise needs | Focused build scope |
| 4.L3 | Schema discovery is supervised — client approves mappings before live | No silent miscategorization |
| 4.L4 | Drift detection per sync; breaking drift pauses pipeline, silent drift logs | Data integrity over uptime |
| 4.L5 | Quality gates at three severity levels (error / warning / info) | Granular quality control |
| 4.L6 | Every row carries lineage metadata: source, pipeline, template, timestamp | Full auditability |
| 4.L7 | Backfill is configurable, staged, cancelable, gated like live data | Client control + integrity |
| 4.L8 | Multi-destination routing (one source row fans out to table + derived + signals) | Template-driven |
| 4.L9 | Pipeline Health + Data Quality + Lineage Explorer are three named operator surfaces | Operations matter as much as ingestion |
| 4.L10 | Pipelines build across 5 milestones, demo ships with zero automated pipelines | Realistic scope |

---

## Packet 4 · Checkpoint

**STATUS · Track B, Packet 4 of 6 complete**

Pipeline automation architecture specified. Four connector patterns, seven-stage pipeline flow, schema discovery, drift handling, quality gates, backfill strategy, classification routing, operator tooling. Ready for Packet 5 (authoring mode).

---

# PACKET 5 · Authoring Mode

The workflow AbarVa is most likely to underinvest in, and the one that matters most for:
- Anand's personal test-drive workflow (creating 10+ engagements per client)
- Maestros capturing engagement context during live engagements
- Pre-pipeline data entry for new clients
- High-quality Genome training data generated by experts

This packet treats authoring as a first-class workflow — a workbench, not a fallback form.

## 5.1 The authoring workflow

Authoring Mode is how expert users create, edit, and enrich AbarVa data directly — without a source system behind it and without the structure of a CSV template.

### Who uses it

- **Anand** · creating test-drive engagements to stress-test Nexus module UX
- **Maestros** · capturing in-engagement context that doesn't live in any source system (stakeholder quotes, political landscape, executive sponsor preferences, prior attempt history)
- **Client sponsors / owners** · filling in context around their own use cases that AbarVa's connectors can't reach
- **AbarVa operators** · seeding new clients before automated pipelines are configured

### What it authors

Authoring Mode creates:

- Engagements (use cases, programs) with full context
- People (stakeholders, sponsors, owners) with relationship context
- Attestations with rich rationale
- Signals (rare — usually auto-detected, but manual signal creation available)
- Genome patterns (expert-contributed patterns marked for Steward review)
- Intelligence thread seeds (initial research context to bootstrap a thread)

### What distinguishes it from CSV upload

**CSV upload** is structural. You fill in predefined fields, one row per entity, many rows at once.

**Authoring** is rich and narrative. You fill in an engagement with:
- Structured fields (sponsor name, vendor, cost — what a CSV would have)
- Rich-text context (stakeholder quotes, situational notes, known blockers)
- Relational links (this engagement was influenced by that signal, sponsors this program's steering committee)
- Confidence markers (what you know for sure vs what you're inferring)
- Authorial provenance (this was authored by [name], on [date], with [level of confidence])

CSV rows don't have any of that. Authoring does.

## 5.2 The authoring workbench

The authoring surface at `/author` is a dedicated workbench, not a modal popup.

```
┌────────────────────────────────────────────────────────────────────┐
│ AUTHORING · APEX RETAIL                                            │
│  ────────────────────────────────────────────────────────────────  │
│                                                                    │
│  ◉ Test Drive Mode · On                                           │
│    Engagements authored here excluded from portfolio aggregates.   │
│    Clean up anytime.  [Settings]                                   │
│                                                                    │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                    │
│  LIBRARY                                                           │
│   ▸ Drafts (3)                                                     │
│   ▸ In review (1)                                                  │
│   ▸ Published (12)                                                 │
│   ▸ Templates (8)                                                  │
│                                                                    │
│  [+ New engagement]  [+ From template]  [+ Bulk from pattern]     │
│                                                                    │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                    │
│  DRAFTS                                                            │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ Computer Vision Loss Prevention · Store Operations        │    │
│  │ Draft · Last edited 12 min ago · 67% complete             │    │
│  │ Sponsor: [pending] · Owner: Rachel Owusu                  │    │
│  │ [Continue editing]  [Preview]  [Delete draft]             │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ Dynamic Pricing · Merchandising                            │    │
│  │ Draft · Last edited 2 hours ago · 45% complete            │    │
│  │ [Continue editing]                                        │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Workbench states

Four lifecycle states per authored entity:

**Draft** — work in progress, not visible outside authoring surface, persists across sessions, auto-saves, no validation blocks.

**In Review** — author has marked the entity as "ready to publish." If test-drive mode, goes live immediately on publish. If production mode, Maestro or admin reviews before going live.

**Published** — live in Tower/Programs. Visible to the client. Fully participates in signals, cohort comparisons, etc. (unless test-drive mode flagged).

**Archived** — no longer active but preserved for historical context.

### Auto-save and persistence

Drafts auto-save every 5 seconds of inactivity, every 60 seconds regardless. Session continuity means you can close the browser and come back hours or days later to exactly where you were.

Drafts can be resumed, duplicated, exported, imported. Draft data is scoped per client-workspace; you can be authoring engagements for Apex simultaneously with engagements for another test client.

## 5.3 Authoring an engagement · the flow

The core authoring experience — creating a single engagement.

### Step 1 · Start point

User clicks "+ New engagement" and chooses a start point:

**Blank** — empty canvas, all fields to fill in. Slowest but most flexible.

**From template** — pick a pattern archetype (Contact Center AI, Demand Forecasting, Dynamic Pricing, etc.) that pre-populates typical fields and structure. Faster, still editable.

**From similar engagement** — pick an existing engagement (in this client or another) and duplicate. Rename, adjust specifics. Fastest for test-drive when creating variations.

**From Genome pattern** — pick a published Genome pattern and instantiate it for this client. The pattern's archetype fields pre-populate; client-specific context gets filled in.

### Step 2 · Core context panel

Left panel (fixed 320px) for core fields:

```
┌─────────────────────────────────────┐
│ ENGAGEMENT                          │
│                                     │
│ Name *                              │
│ [_________________________________] │
│                                     │
│ Archetype                           │
│ [Contact Center AI ▼]               │
│                                     │
│ Industry · Function · Objective     │
│ Retail · Front · Optimize           │
│                                     │
│ Lifecycle stage *                   │
│ ◉ Active                           │
│ ○ Steady-state                      │
│ ○ Sunset                            │
│ ○ Backlog                           │
│                                     │
│ Current phase                       │
│ [5 · Build/Deploy ▼]                │
│                                     │
│ PEOPLE                              │
│                                     │
│ Sponsor *                           │
│ [Search or add person... ]          │
│                                     │
│ Owner                               │
│ [Search or add person... ]          │
│                                     │
│ Team size                           │
│ [8]                                 │
│                                     │
│ TECHNICAL                           │
│                                     │
│ Primary vendor                      │
│ [Genesys + Google CCAI ▼]           │
│                                     │
│ Monthly cost (USD)                  │
│ [52000]                             │
│                                     │
│ [+ Add vendor]                      │
│ [+ Add integration]                 │
│                                     │
└─────────────────────────────────────┘
```

### Step 3 · Rich context area

Center panel for narrative and unstructured context:

```
┌────────────────────────────────────────────────────────────────┐
│ SITUATIONAL CONTEXT                                            │
│                                                                │
│ ◉ Problem statement                                            │
│ [Rich text area with AI-assist from Nexus]                    │
│  ↳ "Contact center handling 2M calls/month. Average handle     │
│     time 6:42. First-call resolution 68%. 4 of 5 reps say      │
│     they spend too much time on routine inquiries..."          │
│                                                                │
│ ◉ Business drivers                                             │
│ [rich text]                                                    │
│                                                                │
│ ◉ Stakeholder landscape                                        │
│ [rich text]                                                    │
│  ↳ "Priya (sponsor) is excited — her ops team has been asking  │
│     for this. CFO is skeptical after failed 2024 RPA project.  │
│     IT VP wants to sign off but bandwidth-constrained..."      │
│                                                                │
│ ◉ Political constraints                                        │
│ [rich text]                                                    │
│  ↳ "CFO hates ambiguity on ROI timing. Any charter must show   │
│     value within 6 months or it's dead..."                     │
│                                                                │
│ ◉ Known blockers                                               │
│ [rich text]                                                    │
│                                                                │
│ ◉ Prior attempt history                                        │
│ [rich text]                                                    │
│                                                                │
│ [+ Add section]                                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Step 4 · Right rail · AI assist

Right panel (320px) where Nexus (or a dedicated authoring assistant) helps:

- Suggest fields the author might be missing ("You haven't specified a go-live date. Want to add one?")
- Offer genome pattern matches ("This engagement looks like it matches the 'Contact Center AI Staged Rollout' pattern. Want me to pull in typical fields?")
- Detect inconsistencies ("You've set current phase to 5 but haven't specified phase 4 artifacts. Want to backfill?")
- Suggest stakeholders ("In similar engagements, VP Customer Experience typically signs off as sponsor. Is that Priya?")

### Step 5 · Publish

When author is satisfied, they click "Mark as In Review" or "Publish directly" (if test-drive mode).

Publishing triggers:
- Data commits to destination tables
- Lineage records `authored_by` + `authored_at` + `source_class=expert_authored`
- If test-drive flagged, `test_drive_mode=true` flag added
- Nexus opens a new Program instance if engagement is in an active phase
- Atlas surfaces the new use case in Tower dashboard (respecting test-drive exclusions)

## 5.4 Test Drive Mode

The critical workflow for Anand (and eventually any expert user) to create 10+ engagements rapidly without polluting real portfolio data.

### How it works

**Toggle at workspace level.** At the top of the authoring surface, "Test Drive Mode · On/Off" toggle. When on:

- All authored engagements get `test_drive_mode=true` flag on their record
- Tower aggregate queries exclude test-drive records by default
- Programs surface shows test-drive programs with a distinctive visual marker (small badge in top-right of Program page)
- Nexus interactions within test-drive engagements are marked `training_exclusion=true` so the Genome doesn't learn from throwaway content
- Cohort benchmark computations exclude test-drive records
- Signals detected within test-drive portfolios don't fire real alerts (but can be used for signal-logic testing)

### Why this matters

Anand sits down to test-drive. Creates 12 engagements across Apex to stress-test Nexus's module UX. Each engagement generates realistic-seeming interactions. Without test-drive isolation:

- Apex's Tower dashboard now shows portfolio of 12 fake engagements mixed with 4 real
- Shadow AI signal computation includes fake test-drive data
- Cohort benchmarks get polluted
- Genome learns from throwaway test-drive patterns
- Eventually test-drive engagements become permanent clutter

Test Drive Mode prevents all of this. Authoring operates at full fidelity; data is isolated at the infrastructure layer.

### Cleanup

**Bulk cleanup.** From the authoring surface, "Clean up test-drive engagements" — shows all test-drive records, user bulk-selects and deletes. One-click for Anand to reset after a test-drive session.

**Auto-archive.** Test-drive engagements older than 30 days (configurable) auto-archive unless explicitly promoted to production. Keeps the surface clean.

**Promotion to production.** If a test-drive engagement turns out to be useful (e.g., Anand authored a pattern that's genuinely worth having in Apex's real portfolio), one-click "Promote to production" removes the test-drive flag, makes it permanent, and the Genome learning exclusion lifts.

### Visual treatment

Test-drive engagements carry a subtle but persistent visual marker:

- Top-right corner of any Program page: "TEST DRIVE" badge (amber, small, type.meta)
- Authoring surface: entire chrome tinted slightly to signal test-drive context
- Tower drill-downs into test-drive use cases show a banner: "This is a test-drive use case, not included in portfolio aggregates."

Never confused with real engagements. Always clear which mode you're in.

## 5.5 Bulk duplication

For Anand's test-drive workflow specifically: creating 10+ variations of similar engagements should be fast.

### Pattern-based bulk creation

From "+ Bulk from pattern":

```
┌────────────────────────────────────────────────────────────────┐
│ Bulk-create engagements from pattern                           │
│                                                                │
│ Pattern:                                                       │
│ [Contact Center AI ▼]                                          │
│                                                                │
│ How many engagements to create?                                │
│ [12]                                                           │
│                                                                │
│ Variations:                                                    │
│  Vary by industry segment (retail vs finance vs healthcare)   │
│  ☑ Use Retail (default)                                       │
│                                                                │
│  Vary by lifecycle stage:                                      │
│  ☑ Active (4 engagements)                                     │
│  ☑ Steady-state (6 engagements)                               │
│  ☑ Sunset (1 engagement)                                      │
│  ☑ Backlog (1 engagement)                                     │
│                                                                │
│  Vary by phase (active engagements only):                      │
│  ☑ Phase 1-2: 1 engagement                                    │
│  ☑ Phase 3-4: 1 engagement                                    │
│  ☑ Phase 5-6: 2 engagements                                   │
│                                                                │
│  Vary by attainment % (steady-state only):                     │
│  ☑ Spread: 40% (1) · 62% (1) · 75% (2) · 94% (2)              │
│                                                                │
│ Output:                                                        │
│ [Preview all 12 proposed engagements]                         │
│                                                                │
│ [Cancel]  [Generate 12 drafts]                                │
└────────────────────────────────────────────────────────────────┘
```

After generation:
- 12 draft engagements created, each pre-populated with realistic variations
- Author reviews each in the drafts panel
- Author refines individual engagements with specific details
- Author publishes as a batch (test-drive flag preserved)

This turns a 5-hour manual exercise into a 45-minute refinement exercise.

## 5.6 Authoring integration with Nexus

During authoring, Nexus is available in the right rail to help. Nexus authoring mode is distinct from Nexus program mode:

**Program mode Nexus** — embedded in a Program page, scoped to that engagement's phase. Answers "how do I close Phase 3?"

**Authoring mode Nexus** — embedded in authoring surface, scoped to the draft. Answers "what fields am I missing? What patterns might apply? Does this engagement look realistic?"

### Authoring Nexus capabilities

- Pattern suggestion: "This looks like a Contact Center AI engagement. Want me to pull in typical fields from that pattern?"
- Field completion: "Typical engagements of this archetype have sponsor role = VP Customer Experience. Is Priya Sethi that?"
- Consistency check: "You've set current phase to 5, but phase 4 artifacts are empty. Want me to help backfill?"
- Realism check: "Your cost is $500K/month. For contact center AI at a 680-seat deployment, typical costs are $30-$80K/month. Is $500K intentional?"
- Narrative assist: "You wrote the problem statement. Want me to draft business drivers based on what you have?"

### Nexus does not author for you

Important boundary: Nexus in authoring mode is a collaborator, not an autogenerator. Every field is author-controlled. Nexus suggests; the author decides. This matters because:

- If Nexus just generates engagements, the Genome ends up learning from Nexus's own output (circular reinforcement)
- Expert authoring is valuable precisely *because* it's expert — not a language model generating plausible text
- Auditability: authored_by metadata needs to reliably reflect the human author

## 5.7 Authoring for non-engagement entities

Authoring mode extends beyond engagements to other entity types:

### Author a person

Create stakeholder profiles with role, relationships, preferences, prior attempt history. Used when a client has sponsors and owners not in any HR system connection.

### Author a signal

Rare but supported. If a Maestro detects a signal manually ("I noticed during today's interview that Apex has no AI governance committee — that's a risk"), they can author it directly rather than waiting for automated detection. Signals authored manually are marked `source_class=expert_authored` and treated slightly differently by Atlas (shown, but with "authored signal" context).

### Author a Genome pattern candidate

Maestros can contribute patterns they've observed. Authored patterns go to Pattern Steward (AbarVa role) for review, anonymization check, and promotion through lifecycle (Observed → Hypothesized → Supported → Strong per Data Layer spec Packet 4.2).

### Author an Intelligence thread seed

For bootstrapping a new Sentinel thread with expert context before opening it to live research. The author writes an initial framing + research hypotheses; Sentinel picks up the thread from that seed.

## 5.8 Authoring templates

Distinct from upload templates (Packet 3). Authoring templates are starting points for authoring mode — not schemas, but pre-filled drafts.

Examples:

**"Contact Center AI · Large Retailer" template.** Pre-fills: archetype, typical sponsor role, typical vendor options, typical cost band, typical phase timeline, common blockers, pattern references.

**"Shadow AI Consolidation · Retail" template.** Pre-fills: archetype (consolidation program), typical triggering signal (Shadow AI), typical stakeholders, typical scope structure.

**"Sunset with Bias Review · HR Use Case" template.** Pre-fills: sunset reason structures, bias review findings, replacement process notes.

Authoring templates grow as AbarVa accumulates patterns. Initially ~10 templates; grows to 50+.

## 5.9 Lineage and provenance for authored data

Every authored entity carries strong provenance:

```yaml
authored_entity:
  id: uuid
  entity_type: engagement | person | signal | pattern | thread_seed
  
  lineage:
    source_class: expert_authored
    source_authority: high  # based on author's role
    authored_by:
      user_id: uuid
      name: string
      role: string  # maestro, admin, founder, client_expert
    authored_at: timestamp
    authored_for_client: uuid
    test_drive_mode: boolean
    confidence_level: high | medium | speculative
    last_modified_by: user_id
    last_modified_at: timestamp
    
  approvals:
    - approver: user_id
      role: string
      approved_at: timestamp
      notes: string
```

Atlas, Sentinel, and Nexus read these fields when deciding how to surface authored content:

- High-confidence expert-authored engagements treated at same trust level as pipeline-ingested data
- Speculative authored content shown with a "Speculative · authored by [name]" marker
- Test-drive-flagged content excluded from portfolio aggregates
- Author-attributed patterns cite the author when referenced

## 5.10 Authoring mode build sequencing

Authoring mode is not demo-blocking. Build sequence:

**Milestone 1 (Demo):** Minimal authoring — Anand uses direct DB seed scripts for Apex. No UI authoring mode.

**Milestone 2 (Post-demo, week 1-2):** Basic authoring surface. Single-engagement authoring with core fields. Draft persistence. Manual test-drive flag via setting.

**Milestone 3 (Design partner, month 1-2):** Full workbench UX. Bulk duplication. Pattern-based creation. Authoring Nexus. Test Drive Mode toggle with visual treatment.

**Milestone 4 (Scale, month 3-6):** Non-engagement entity authoring (persons, signals, patterns, thread seeds). Pattern Steward workflow for Genome contribution. Approval workflows for production authoring.

For Anand's test-drive workflow specifically: Milestone 2 delivery (basic single-engagement authoring with test-drive flag) is the unlock moment. Milestone 3 makes it fast at scale.

## 5.11 Decisions locked in Packet 5

| # | Decision | Rationale |
|---|---|---|
| 5.L1 | Authoring is first-class workflow, not fallback | Expert input is core to product |
| 5.L2 | Four lifecycle states (Draft / In Review / Published / Archived) | Matches real editorial workflows |
| 5.L3 | Auto-save every 5 seconds, full session continuity | No lost work ever |
| 5.L4 | Test Drive Mode flag excludes from Tower aggregates, cohort computations, Genome training | Clean separation of stress-test data |
| 5.L5 | Test-drive engagements have persistent visual marker (amber "TEST DRIVE" badge) | Never confused with real |
| 5.L6 | Bulk creation from pattern with configurable variations | 10+ engagements in 45 minutes not 5 hours |
| 5.L7 | Authoring Nexus collaborates but does not autogenerate | Preserves expert authorship + prevents Genome circularity |
| 5.L8 | Non-engagement entities (persons, signals, patterns, thread seeds) also authorable | Comprehensive expert input |
| 5.L9 | All authored entities carry strong provenance: author, confidence, test-drive flag | Integrity at scale |
| 5.L10 | Build sequencing: M1 none, M2 basic, M3 full workbench, M4 comprehensive | Matches realistic scope |

---

## Packet 5 · Checkpoint

**STATUS · Track B, Packet 5 of 6 complete**

Authoring mode specified as first-class workflow. Workbench UX, lifecycle states, Test Drive Mode, bulk duplication, Nexus integration, provenance all defined. Anand's 10+ engagements test-drive workflow mapped end-to-end. Ready for Packet 6 (lineage, provenance, source-class differentiation).

---

# TRACK C · INTEGRITY (Packet 6)

Track C closes the spec with the integrity layer — lineage, provenance, and source-class differentiation. These are what make the three workflows safe to combine in one platform.

---

# PACKET 6 · Lineage, Provenance, Source-Class Differentiation

Every record in AbarVa — whether it came from a pipeline, a CSV upload, or an authoring session — carries a traceable chain back to its origin. This packet specifies the structure of that chain, the differentiation between source classes, and how agents use this information to weight trust.

## 6.1 Why lineage matters

Without lineage, AbarVa has no defense against:

- **Signal false positives.** Atlas flags a contradiction. User asks "why?" AbarVa can't point to specific records. User loses trust.

- **Dispute handling.** Client says "that cost number is wrong." AbarVa can't show where the number came from. Client's data team can't diagnose.

- **Rollback precision.** A bad pipeline run poisoned 2,000 records. Without lineage, AbarVa has to roll back everything from the last 24 hours. With lineage, AbarVa rolls back exactly the affected 2,000.

- **Provenance for agents.** Sentinel claims "strong evidence" for a pattern. Without traceable provenance, the "strong" label is a hand-wave. With it, user clicks through to see the 7 sources.

- **Compliance and audit.** Enterprise clients have to answer "where did this number come from" for their internal and regulatory audits. AbarVa's data has to be audit-ready.

Lineage is not a backend nicety. It's a user-visible trust mechanism.

## 6.2 Lineage record structure

Every row in every destination table (Tower metric_observations, Programs engagements, signals, attestations, etc.) has an associated lineage record.

```yaml
lineage:
  # Identity
  lineage_id: uuid
  destination_table: string  # "metric_observations"
  destination_row_id: uuid   # FK to the row this lineage describes
  
  # Origin
  source_class: enum
    # pipeline_ingested - came from automated pipeline
    # csv_uploaded - came from CSV/Excel upload
    # unstructured_parsed - came from Nexus parse of document
    # expert_authored - authored by expert user
    # api_posted - posted via direct API (less common)
    # signal_derived - computed from another signal
    # pattern_derived - computed from Genome pattern match
  
  source_identifier:
    # For pipeline_ingested:
    pipeline_id: uuid  # e.g., "retail_adoption_ukg_pipeline_apex"
    source_system: string  # "UKG Dimensions"
    source_record_id: string  # UKG's internal ID
    pipeline_run_id: uuid
    
    # For csv_uploaded:
    upload_id: uuid
    filename: string
    row_number_in_file: integer
    uploaded_by: user_id
    
    # For expert_authored:
    authored_entity_id: uuid
    authored_by: user_id
    
    # ... etc. per source_class
  
  # Template used (if any)
  template_id: uuid
  template_version: string
  
  # Transformation trail
  transformations_applied:
    - transformation_id: uuid
      transformation_type: string  # lookup, compute, enrich
      input_columns: [string]
      output_field: string
      transformation_timestamp: timestamp
  
  # Validation
  validation_passed: boolean
  validation_warnings: [string]
  data_quality_score: number  # 0-1, computed
  
  # Timestamps
  extracted_at: timestamp  # when pulled from source
  ingested_at: timestamp   # when committed to AbarVa
  
  # Integrity
  data_class: enum  # client_private, anonymizable_cohort, platform_generic
  pii_fields_present: [string]
  phi_fields_present: [string]
  sensitivity_classification: enum  # none, PII, PHI, SOX, PCI, multi
  
  # Authorship
  source_authority: enum  # high, medium, low
  confidence_level: enum  # high, medium, speculative
  
  # Lifecycle
  is_superseded: boolean  # true if a later record replaced this
  superseded_by: uuid  # FK to the replacing lineage
  rollback_window_expires_at: timestamp
```

This is a rich record. Storage cost is trivial compared to trust value.

## 6.3 Source class differentiation

The `source_class` field distinguishes how data got into AbarVa. Each class has different trust profiles that downstream systems respect.

### pipeline_ingested

- **Structure trust:** High — source is authoritative system
- **Freshness:** High (continuous sync)
- **Contextual trust:** Medium — raw data lacks situational context
- **Typical use:** metric_observations, cost data, adoption counts

### csv_uploaded

- **Structure trust:** Medium — template enforces shape
- **Freshness:** Variable — depends on client refresh discipline
- **Contextual trust:** Medium
- **Typical use:** Initial portfolio seed, periodic refreshes, one-off snapshots

### unstructured_parsed

- **Structure trust:** Medium-low — Nexus parse can misinterpret
- **Freshness:** Variable
- **Contextual trust:** Medium — document content may include context
- **Typical use:** Vendor invoices, policy documents, ad-hoc reports

### expert_authored

- **Structure trust:** Medium — no source system validation
- **Freshness:** Snapshot of author's understanding
- **Contextual trust:** High — expert captures judgment, stakeholder dynamics, political context
- **Typical use:** Engagement context, stakeholder landscape, Genome pattern candidates, test-drive data

### api_posted

- **Structure trust:** High (if API contract enforced)
- **Freshness:** High
- **Contextual trust:** Low-medium — depends on poster
- **Typical use:** Integrations where client systems push to AbarVa directly

### signal_derived

- **Structure trust:** Depends on underlying signal
- **Freshness:** As fresh as underlying
- **Contextual trust:** Derived
- **Typical use:** Computed metrics, rollups, cohort aggregations

### pattern_derived

- **Structure trust:** Depends on pattern maturity
- **Freshness:** Pattern age
- **Contextual trust:** High for Strong-state patterns, decreasing for less mature
- **Typical use:** Projected metrics, predicted outcomes, cost/effort estimates from patterns

## 6.4 How agents use source class

Each agent adjusts behavior based on source class.

### Atlas

- Weights metric values by source class when computing aggregates
  - A pipeline-ingested cost value counts fully
  - A test-drive authored cost value is excluded entirely
  - A low-confidence unstructured-parsed value is included with flag
- Shows source class in the UI when user drills into any number
  - "Cost: $84K/month · pipeline, Azure Billing, synced 4hr ago"
  - "Cost: $84K/month · authored by Anand, 12 days ago"
- Avoids firing high-confidence signals when underlying data has mixed source classes
  - Critical signal requires at least 3 source-consistent data points
  - Mixed-source signals flagged as "needs review"

### Sentinel

- Cites source class on every piece of evidence
  - "Evidence: moderate — based on 3 pipeline-ingested sources from Azure Billing"
  - "Evidence: speculative — single expert-authored observation"
- Weights cross-client cohort comparisons by source class
  - Authored data in peer engagements counts less than pipeline data
  - Pattern matches weighted by pattern maturity, which depends on source class
- Refuses to promote threads to Programs if only speculative expert-authored data backs the thread

### Nexus

- Shows Maestro the source class for every Program field
  - "Sponsor: Priya Sethi · authored by Anand · authored_date: April 14, 2026"
  - "Monthly cost: $52K · pipeline from Azure Billing · synced: 6 min ago"
- When suggesting Phase artifacts, uses source class to weight confidence
  - "Based on 4 authoritative sources, typical Phase 3 diagnosis artifacts include..."
  - "Based on patterns in the Genome with strong maturity..."

## 6.5 The lineage explorer UI

The lineage explorer is a dedicated surface accessible from any number or record in AbarVa.

Click any number (e.g., "$2.3M Shadow AI exposure") → "View lineage":

```
┌────────────────────────────────────────────────────────────────────┐
│ LINEAGE · Shadow AI Annual Exposure                                │
│ Current value: $2,300,000                                          │
│                                                                    │
│ ─────────────────────────────────────────────────────────────── │
│                                                                    │
│ Computed from 3 underlying records:                                │
│                                                                    │
│ ● Jasper · $800,000/year                                          │
│   Source: SaaS Expense Audit (pipeline)                            │
│   Last synced: 2026-04-12 14:22                                    │
│   Pipeline: saas_expense_pipeline_apex                             │
│   Template: shadow_ai_inventory_v1                                 │
│   Data class: client_private                                       │
│   Source authority: high                                           │
│   [View source record]                                             │
│                                                                    │
│ ● Abridge · $900,000/year                                         │
│   Source: CSV upload                                               │
│   Uploaded by: Rohan Mehra                                         │
│   Uploaded at: 2026-04-08 09:14                                    │
│   Filename: "specialty_health_division_ai_tools.xlsx"              │
│   Template: shadow_ai_inventory_v1                                 │
│   Data class: client_private (flagged PHI-adjacent)                │
│   Source authority: medium                                         │
│   [View original file]                                             │
│                                                                    │
│ ● Grammarly Business · $600,000/year                              │
│   Source: Expert authored                                          │
│   Authored by: Ava Chen                                            │
│   Authored at: 2026-04-10 16:38                                    │
│   Confidence: medium                                               │
│   Rationale: "Verified with Priya; predates current policy."      │
│   Source authority: medium-high                                    │
│   [View authored record]                                           │
│                                                                    │
│ ─────────────────────────────────────────────────────────────── │
│                                                                    │
│ Computation:                                                       │
│   SUM(annual_cost_usd) WHERE contradiction_type = 'shadow_ai'     │
│   AND client_id = 'apex-retail-group'                              │
│   AND is_active = true                                             │
│                                                                    │
│ Last recomputed: 2026-04-21 03:42 (8 min ago)                      │
│                                                                    │
│ [Trigger recomputation]  [See aggregate history]                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

The lineage explorer is where trust becomes tangible. A CTO clicking through this is AbarVa's most powerful credibility moment.

## 6.6 Rollback mechanics

Lineage enables precise rollback.

### Rollback scope

- **Single row** — undo one authoring action or one uploaded row
- **Upload batch** — undo all rows from a specific upload
- **Pipeline run** — undo all rows ingested in a specific pipeline run
- **Time window** — undo all ingestions in a time range (for bulk recovery)

### Rollback flow

User navigates to "Data & Integrations" → "Uploads" (or "Pipelines") → picks the event → "Roll back."

```
┌────────────────────────────────────────────────────────────────────┐
│ Roll back upload                                                    │
│                                                                    │
│ Upload: "retail_adoption_ukg_2026_04.xlsx"                         │
│ Uploaded: 2026-04-20 10:14 by Rohan Mehra                          │
│                                                                    │
│ This upload committed 134 rows across:                             │
│  • metric_observations (128 rows)                                  │
│  • attestations (6 rows)                                           │
│                                                                    │
│ What rolling back will do:                                         │
│  • Mark 134 rows as superseded                                     │
│  • Remove them from aggregate computations                         │
│  • Log rollback event for audit                                    │
│  • Do NOT delete rows — preserved for audit                        │
│                                                                    │
│ Downstream effects:                                                │
│  • Adoption pillar recomputes without these rows                   │
│  • 2 signals that depend on these rows will re-evaluate            │
│  • Cohort comparisons will recompute                               │
│                                                                    │
│ [Cancel]  [Roll back with reason]                                  │
│                                                                    │
│ Reason for rollback (required):                                    │
│ [_______________________________________________________]         │
└────────────────────────────────────────────────────────────────────┘
```

Rollback is reversible within its own 30-day window (i.e., roll back the rollback). Soft-delete semantics throughout.

### Rollback window

Default 30 days after ingestion. After 30 days, rollback is no longer available through the normal UI — requires admin intervention. This balances flexibility against the risk of undoing too much historical data.

## 6.7 Cross-workflow lineage scenarios

Real situations where lineage matters:

**Scenario 1 · Pipeline overwrites authored data.**

Anand authored "Monthly cost: $84K" for Demand Forecasting (expert_authored). Later, pipeline connects to Snowflake and pulls actual cost data: "$91K." What happens?

- Pipeline's value takes precedence (higher structure trust for this field)
- Authored value is marked superseded, not deleted
- Lineage explorer shows: "Currently shows $91K from pipeline. Previously showed $84K authored by Anand (superseded)."
- If pipeline later fails, the superseded authored value can be restored as fallback

**Scenario 2 · Authored data fills gap pipeline can't cover.**

Pipeline covers cost (from Azure Billing) and adoption (from M365 admin). But "political constraints" field has no source system. Authored-only data coexists with pipeline data on the same engagement, differentiated by source class.

**Scenario 3 · Test-drive engagement promoted to production.**

Anand authored a test-drive engagement. Turns out it's useful; promotes to production. Lineage preserves the authored provenance but lifts the test-drive flag. Engagement now participates in aggregates.

**Scenario 4 · Pipeline drift changes historical data.**

Pipeline's source system changes schema. New data for April 2026 comes in with different units than prior months. Lineage shows: "April 2026+ data uses new schema (detected 2026-04-15). Historical data in prior schema. See transformation notes."

All four scenarios are gracefully handled by the lineage structure.

## 6.8 Data class propagation

Data class (`client_private` / `anonymizable_cohort` / `platform_generic`) propagates through transformations.

### Rules

1. **Default at ingestion:** determined by source + client policy
2. **Transformation preserves or downgrades:** A computation over client_private data produces client_private results. A computation cannot upgrade data class (can't produce platform_generic from client_private).
3. **Aggregation can upgrade:** An aggregate over many clients' data can be marked anonymizable_cohort IF the aggregation strictly loses individual identifiability. Specific rules: n ≥ 3, no re-identifiable fields, no small-count slices.
4. **Client can override downward:** Client can mark specific records as "never anonymizable" for extra protection.

### Enforcement

Queries respect data class at the graph level. A query for "cohort median AI spend" can only include rows marked anonymizable_cohort OR rows from the querying client. Client_private data from other clients is invisible.

Data class is enforced at the query planner, not at the application layer. Defense in depth.

## 6.9 Audit logging

Every ingestion event generates an audit log entry:

- Who initiated (user, pipeline, system)
- What was ingested (counts, tables, templates)
- When
- Any validation failures
- Any rollback events

Audit logs are:
- Immutable (append-only)
- Retained for compliance window (default 7 years, client-configurable)
- Exportable for client's internal audits
- Filterable by user, time range, table, source class

Audit logs are distinct from lineage records — lineage describes each row; audit logs describe each ingestion *event*.

## 6.10 Decisions locked in Packet 6

| # | Decision | Rationale |
|---|---|---|
| 6.L1 | Every destination row has an associated lineage record | Trust mechanism, not backend nicety |
| 6.L2 | Seven source classes with differentiated trust profiles | Honest representation of data origin |
| 6.L3 | Agents (Atlas, Sentinel, Nexus) adjust behavior based on source class | Trust propagates through reasoning |
| 6.L4 | Lineage explorer UI accessible from any number or record | User-visible integrity |
| 6.L5 | Rollback operates at single row, batch, pipeline run, or time window granularity | Precise recovery |
| 6.L6 | Rollback window default 30 days; soft-delete semantics | Flexibility without risk |
| 6.L7 | Data class propagates through transformations; cannot be upgraded except by valid aggregation | Defense in depth |
| 6.L8 | Audit logs separate from lineage, 7-year retention, immutable append-only | Compliance-ready |
| 6.L9 | Superseded records preserved, not deleted — full history available | Audit integrity |
| 6.L10 | Pipeline vs authored vs upload have different rules for conflict resolution | Honest cross-workflow handling |

---

## Packet 6 · Checkpoint

**STATUS · Track C, Packet 6 of 6 complete**

Lineage record structure defined. Source class differentiation across 7 classes. Agent behaviors adjusted by source class. Lineage explorer UI specified. Rollback mechanics across 4 granularities. Data class propagation rules locked. Audit logging separated from lineage. Cross-workflow scenarios mapped.

**DATA INGESTION & INTEGRATION SPEC COMPLETE.**

---

## Spec summary

### Files
- `/mnt/user-data/outputs/abarva-data-ingestion-integration-spec.md` · **COMPLETE (6/6 packets)**

### Coverage
- **6 packets** across 3 tracks (Foundation / Workflows / Integrity)
- **~60 decisions locked**
- **3 workflows** specified as first-class: automated pipeline, client upload, expert authoring
- **40 data sources** cataloged for retail; 6 other industries stubbed for growth
- **~25-30 templates** at launch, with versioning + inheritance model
- **4 connector patterns** (SaaS API, cloud billing, data lake/warehouse, file drop)
- **Test Drive Mode** specified for Anand's 10+ engagement stress-test workflow
- **7 source classes** with differentiated trust profiles
- **Lineage explorer UI** for user-visible provenance

### How this is used going forward

This spec unlocks three things:

1. **The Data & Integrations catalog becomes a 90-second demo selling point** — showing Prat (or any Fortune 50 CTO) that AbarVa has cataloged their industry with specific sources, templates, and governance defaults.

2. **Anand's test-drive workflow becomes real** — Test Drive Mode lets him author 10+ engagements per client to stress-test Nexus module UX without polluting real portfolio data. Bulk creation from pattern makes the 10+ engagements a 45-minute exercise not 5 hours.

3. **The claim "every engagement makes every future engagement smarter" becomes technically grounded** — because every engagement enters AbarVa with structured provenance, source class, lineage, and data class that allow the Genome and cohort layers to compound intelligently.

### Relationship to other specs

- **Tower spec Packet 8** — extended and (in two places) superseded by this spec. The catalog model in Packet 2 here replaces the simpler "Integrations / Uploads / Templates / Data Quality tabs" from Tower Packet 8.3. The template library in Packet 3 here expands on Tower Packet 8.5's five-template list. Tower Packet 8 remains valid as a surface-level spec; this document is the architectural truth.

- **Data Layer Future State spec** — directly feeds that spec's provenance model (Packet 5). Source classes here map to evidence weights there. Lineage records here are the graph nodes that the future-state provenance chain traverses.

- **Agent Architecture spec** — informs how Atlas, Sentinel, and Nexus use source class to weight trust. Extends those agents' behaviors specifically for lineage and provenance awareness.

- **Page Design Backlog** — adds the catalog surface, authoring workbench, lineage explorer, and pipeline health dashboard as Tier 2 design work.

### Phased build

- **Milestone 1 (Demo):** Zero pipelines. Manual DB seed for Apex. No authoring UI. Current Tower Packet 8 upload flow stays.
- **Milestone 2 (Post-demo, weeks 1-4):** First 3-5 pipelines (Microsoft Graph, ServiceNow, cloud billing). Basic authoring surface. Test Drive Mode flag.
- **Milestone 3 (Design partner, months 1-3):** Full catalog surface. Expanded templates. Schema discovery. Lineage explorer. Authoring workbench full experience.
- **Milestone 4 (Scale, months 3-6):** Comprehensive pipeline coverage. Non-engagement entity authoring. Pattern Steward workflow. Custom client templates.
- **Milestone 5 (Year 1):** Real-time streaming. Enterprise custom connectors. Reverse ETL.

---
