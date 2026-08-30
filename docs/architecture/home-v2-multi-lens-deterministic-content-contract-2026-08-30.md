# Home V2 Multi-Lens Deterministic Content Contract

**Status:** design and prompt contract for the Home V2 content layer.
**Date:** 2026-08-30.
**Scope:** Meridian-first Home pages, generated from governed ECL context.
**Companions:**

- `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`
- `docs/architecture/home-v2-implementation-prompt-pack-2026-08-30.md`
- `docs/architecture/home-ecl-page-prompts-and-architecture-experience-2026-08-28.md`
- `docs/architecture/ECL_PRODUCT_DETERMINISTIC_NEEDS_2026_08_22.md`

## Decision

Home V2 will use a **multi-lens deterministic content layer**. Claude does not receive one generic
Home packet and invent the posture for every tab. Each page receives:

1. a governed source-family summary for every loaded workbook or source-room family.
2. deterministic category summaries compiled from ECL typed views, measures, relationships, and
   product projections.
3. a page-specific evidence packet with named source/layer reads.
4. a page-specific writer lens that tells Claude which executive hat to wear.
5. a strict output schema whose claims cite governed evidence.

The writer lens changes judgment posture and voice. It does **not** change allowed facts. Claude may
explain, synthesize, and prioritize; it may not create counts, relationships, system maps,
financial values, maturity scores, or architecture links.

## Why This Exists

The current failure mode is not simply poor wording. The page context is uneven: some pages receive
rich application, platform, contract, and data-workload context; other pages fall back to generic
empty language or ask the user to confirm evidence that is already present in the ECL layer.

That is a content substrate failure. Home must know, per page:

- what source families exist.
- what each source family contains.
- which facts are claimable.
- which facts are only context.
- which gaps are real.
- which architecture or data-flow views must refuse.
- which executive posture the prose should use.

## Layer Contract

| Layer | Name | Home V2 responsibility |
| --- | --- | --- |
| Layer 1 | Client intake / source room | Client-owned extracts, workbooks, documents, and interview records. Home never reads these directly. |
| Layer 2 | Source adapters | Preserve workbook, sheet, row, source field, normalized value, basis, and review state. |
| Layer 3 | ECL canonical substrate | Owns objects, relationships, measures, vendors, contracts, documents, interviews, risks, and typed counts. |
| Layer 4 | Home projections and serving views | Compile page packets, deterministic visual datasets, and generated narrative claims. |
| Layer 4 UI | Home pages | Render only published, refused, or deferred page states; no silent fallback prose. |

## Deterministic Summary Substrate

Home needs a summary substrate between raw ECL rows and Claude. The substrate should be small enough
for a prompt, but broad enough to prevent keyhole reasoning.

| Summary | Grain | Required fields | Used by |
| --- | --- | --- | --- |
| `home_source_family_summary` | one source file/workbook tab/source-room family | source family, owner, grain, row count, critical populated fields, blank/unknown fields, sample anchors, review state, product impact | all page packets, What Has Been Loaded, data browser |
| `home_category_summary` | one business/technology/commercial/data category | denominator, count, top dimensions, measures, gaps, representative objects, source refs | page copy, architecture blocks, data browser facets |
| `home_interview_theme_summary` | role level + function + theme | excerpts, speaker role, function, urgency, agreement/disagreement, cited objects, consent/attribution state | Leadership Perspective, Strategy, Our Business |
| `home_architecture_block_summary` | conceptual business block | applications, platforms, contracts, data flows, owners, top anchors, hosting mix, lifecycle/risk, unresolved links | Current-State Architecture, Technology & Data |
| `home_data_zone_summary` | data architecture zone | source systems, ingestion modes, platforms, marts, reports, ETL/script counts, users, volume, governance gaps | Current-State Data Flow, Data Assets & Integrations |
| `home_page_packet` | one Home surface/page | page question, writer lens, included summaries, deterministic claims, visual datasets, gaps, admission result | Claude writer and renderer |
| `home_chapter_claim` | one publishable sentence/claim | page key, claim text, source refs, basis, confidence, source hash, verifier state | rendered Home narrative |

The source-family summary is context, not claim evidence by itself. A business claim still requires a
cited object, measure, relationship, document extraction, interview excerpt, or product signal.

## Multi-Cap Writer Model

Claude must be asked to wear the right hat for the page. The same evidence packet can support
different executive views, but the lens controls what the page optimizes for.

| Lens | Used on | What Claude optimizes for | What it must not do |
| --- | --- | --- | --- |
| CEO / board strategy adviser | Executive Brief | boardroom verdict, business consequence, top decisions, risk/value tradeoffs | lead with system inventory or platform jargon |
| Business strategy partner | Our Business, Strategy & Value Creation | value model, market/book-of-business logic, funded priorities, operating constraints | infer strategy from technology counts |
| Operating-model adviser | How We Operate | accountability, process ownership, workforce/process constraints, handoffs | turn org charts into decorative hierarchy |
| Expert CTO / enterprise architect | Technology & Data, Current-State Architecture | conceptual-to-logical-to-physical architecture, dependencies, hosting, lifecycle, data/AI constraints | write McKinsey-style generalities without naming systems |
| Data and analytics architect | Current-State Data Flow, Data Assets & Integrations | source-to-consumption zones, marts, reports, ETL/script/user/volume context, topology/refusal | treat movements, reports, jobs, users, and TB as one denominator |
| CFO / value-governance partner | Performance & Value | budget, run/change spend, measured vs blocked value, finance attestation, claimability | calculate ROI or savings in prose |
| Interview synthesis lead | Leadership Perspective | C-suite vs director-level themes, direct excerpts, disagreements, priorities, AI ambition | promote testimony to fact without corroboration |
| Transformation/risk committee lead | What Needs Attention | ranked decisions, owners, evidence needed, due dates, module handoffs | output generic action lists |
| Data steward / source reviewer | What Has Been Loaded, Browse The Record | source coverage, mappings, unknowns, conflicts, slice/dice usability | produce executive conclusions from browse rows |

## Page Contracts

| Home page | Writer lens | Required source/layer context | Required display |
| --- | --- | --- | --- |
| Executive Brief | CEO / board strategy adviser | all category summaries, top findings, Source/Tower/Moves handoffs, interview themes, critical gaps | verdict, three reasons, proof ribbon, top decisions |
| Our Business | Business strategy partner | enterprise profile, segments/books, operating model, KPIs, contracts, leadership themes | value model map, business blocks, constraints, known gaps |
| Strategy & Value Creation | Business strategy partner | strategic priorities, programs, budgets, expected/measured value, AI bets, interviews | strategy tree, funded bets, value proof status |
| How We Operate | Operating-model adviser | org ownership, functions, processes, workforce, systems by function, director interviews | org/function map, accountability matrix, process constraints |
| Technology & Data | Expert CTO / enterprise architect | applications, deployments, infrastructure, hosting, vendors, data workloads, risks | architecture narrative plus run-map and system drilldowns |
| Performance & Value | CFO / value-governance partner | budget/spend, KPI measures, Tower value chain, Source commercial value, claim gates | value bridge, metric cards, proof and blocked-value rail |
| Leadership Perspective | Interview synthesis lead | C-suite interviews, director interviews, function, theme, quote, contradiction, AI ambition | theme matrix, excerpts, alignment/disagreement view |
| What Needs Attention | Transformation/risk committee lead | risks, controls, support-end, renewal exposure, blocked claims, unresolved lineage | ranked decision queue with owner and evidence needed |
| Current-State Architecture | Expert CTO / enterprise architect | `application_v`, `application_deployment_v`, `technical_component_v`, business functions, vendors, contracts, relationships | conceptual blocks -> logical system maps -> physical passports |
| Current-State Data Flow | Data and analytics architect | source systems, ingestion, platforms, marts, reports, ETL/script counts, users, volume, topology gate | zone diagram with arrows or designed refusal |
| What Has Been Loaded | Data steward / source reviewer | source family summaries, adapter status, row counts, known/unknown/conflict states | source readiness map and product impact |
| Browse The Record | Data steward / source reviewer | source rows, workbook/sheet/row lineage, typed objects, measures, relationships | OLAP-style slice/dice browser, table second |
| Applications & Systems | Expert CTO / enterprise architect | application identity, owner, function, vendor, hosting, criticality, lifecycle, spend, users, contracts | portfolio browser and system passport |
| Vendor Contracts | CFO / sourcing/commercial partner | vendors, contracts, scope links, renewal, TFC, benchmark rights, documents, invoice/SLA | commercial spine and contract detail |
| Infrastructure & Platforms | Expert CTO / infrastructure leader | platforms, environments, data center/cloud, capacity, DR, support end, hosted apps/data products | hosting/platform map and risk/watch list |
| Data Assets & Integrations | Data and analytics architect | flows, data products, platforms, reports, ETL jobs, scripts, users, volumes, governance | data-zone map and workload browser |

## Claude Prompt Envelope

Every page writer receives the same envelope shape:

```json
{
  "tenant": "meridian-health",
  "assessment_id": "assessment-dense-source-room-20260823",
  "page_key": "technology_data",
  "decision_question": "What enables the business, and where is complexity or dependency concentrated?",
  "writer_lens": {
    "hat": "expert_cto_enterprise_architect",
    "voice": "technology-native, business-readable",
    "prioritize": ["system blocks", "dependencies", "hosting", "data workload evidence", "risks"],
    "avoid": ["generic strategy prose", "builder vocabulary", "unsupported links"]
  },
  "source_family_summaries": [],
  "category_summaries": [],
  "deterministic_claims": [],
  "interview_excerpts": [],
  "visual_datasets": [],
  "known_gaps": [],
  "admission_result": null,
  "output_schema": "home_page_claim_v2"
}
```

Claude instruction:

```text
You are writing for the named executive lens. Use only facts, measures, relationships, interview
excerpts, and gaps present in the packet. Do not infer missing relationships, counts, financial
values, maturity scores, owners, systems, platforms, or architecture links.

If the page can be answered, return `terminal_state="published"` with concise executive prose and
claim-level citations. If the admission gate refuses, return `terminal_state="refused"` and render
the failed rule, measurement, evidence needed, and supported alternative. If the source family is
known but insufficient for the page, return `terminal_state="deferred"` with the missing evidence
and owner role. Never return an absent page or generic empty headline as success.
```

Output schema:

```json
{
  "terminal_state": "published | refused | deferred",
  "headline": "string",
  "lead": "string",
  "claims": [
    {
      "claim_id": "string",
      "text": "string",
      "source_refs": ["string"],
      "basis": "source_recorded | document_extracted | interview_derived | calculated | model_inferred",
      "confidence": "high | medium | low",
      "quality_state": "passed | warning | blocked"
    }
  ],
  "exhibits": [
    {
      "dataset_ref": "string",
      "why_this_exhibit": "string",
      "required_denominator": "string"
    }
  ],
  "questions_for_the_room": ["string"],
  "actions": [
    {
      "action": "string",
      "owner_role": "string",
      "evidence_needed": "string"
    }
  ],
  "evidence_boundary": "string"
}
```

## Architecture Design

Architecture must start conceptual, then drill down.

| Level | Question | View | Must include |
| --- | --- | --- | --- |
| Conceptual | What business blocks does this enterprise run on? | six-block enterprise run map | Health Plan/Payer, Provider/Delivery, Back Office, Data/Analytics/AI, Infrastructure/Hosting, Vendor/Commercial Spine |
| Logical | Which systems run each block? | capability/system map | named systems, owners, vendors, function, hosting, criticality, lifecycle, data dependencies |
| Physical | What is each system/platform in the estate? | system/platform passport | deployments, SaaS/cloud/on-prem/mainframe, environment, region/data center, volume, users, contracts, support end, lineage |

The Data, Analytics & AI block must not say "confirm ETL/jobs/users" when segment-level workload
rows are present. It must show:

- data platforms and warehouses/marts.
- BI/reporting tools and report counts by function/tool.
- ETL/orchestration/script counts by function/tool.
- active users by reporting or analytics tool/function.
- data volume where provided.
- unresolved lineage or missing telemetry as the narrower gap.

## Data Browser Design

The browser is a slice/dice viewer over governed source and canonical rows, not an all-column dump.

Required controls:

- dataset: applications, deployments, platforms, data flows, reports/ETL/scripts, contracts,
  vendors, risks, interviews, measures.
- lens: business, technology, ownership, vendor, risk, value, evidence.
- dimensions: book, function, owner, vendor, hosting, criticality, lifecycle, tool, data domain,
  review state.
- measure: annual cost, contract value, users, flows, reports, ETL jobs, scripts, incidents, risk
  count, value.
- grain: enterprise, book, function, capability, system, deployment, platform, vendor, contract.
- evidence state: source-recorded, document-extracted, interview-derived, calculated,
  model-inferred, unknown.

Default layout:

1. slice headline with named denominator.
2. top drivers and exceptions.
3. compact table with lens-specific column preset.
4. row drawer with original workbook/sheet/row, source field, normalized value, ECL object id,
   basis, quality state, review state, lineage, and mapped product surfaces.

## Interview Page Design

Leadership Perspective is a first-class evidence surface. It must not be a generic leadership
paragraph.

It shows:

- C-suite strategic themes.
- director-level tactical operating themes.
- direct excerpts when attribution/consent allows.
- disagreements or tensions by function.
- AI ambition and current experimentation by team.
- links from interview themes to systems, vendors, programs, risks, and data gaps when relationships
  exist.

Interview testimony is perspective unless corroborated by source records or measures.

## Verification Gates

| Gate | Required proof |
| --- | --- |
| source breadth | all source families represented in `source_family_summaries`, with included/excluded status per page |
| claim traceability | every rendered claim matches a published `home_chapter_claim` or page packet claim |
| page terminal state | every Home page renders `published`, `refused`, or `deferred`; absence is a failure |
| no fake gaps | a page may not ask for a broad source family if that family has loaded summary rows |
| counting | every count uses typed views or counting-class denominator, never raw object totals |
| architecture admission | architecture/data-flow gates render refusal before diagrams when refused |
| workload denominator | reports, ETL jobs, scripts, users, data movements, and TB remain separate denominators |
| interview basis | interview-derived claims are labelled as perspective unless corroborated |
| vocabulary | no builder/schema/provider vocabulary in CXO surface prose |
| browser proof | all 16 Home surfaces have screenshot/DOM proof after deploy |

## First Implementation Slice

Build the substrate before rewriting visuals:

1. Add or extend the Home packet compiler so every page packet includes `source_family_summaries`,
   `category_summaries`, and `writer_lens`.
2. Add a failing test where Data/Analytics workload rows exist and the Technology/Data page is not
   allowed to render "confirm ETL/jobs/users" as a broad missing-source message.
3. Add a rendered-claim test: the chapter text on each briefing page must resolve to a published
   `home_chapter_claim` row or a designed refused/deferred state.
4. Add a packet snapshot proof per page showing the source families included, source families
   excluded, and why.
5. Only then rebuild the architecture run-map and data browser.

## Definition Of Done

Home V2 content is done when:

- all 16 Home surfaces have page packets with source-family summaries and category summaries.
- all 8 briefing chapters render published/refused/deferred terminal states.
- all visible narrative claims cite published claim rows.
- the architecture page opens conceptual and drills logical/physical.
- the data-flow page shows source-to-consumption zones or a designed refusal.
- the data browser is slice/dice first, table second.
- interview excerpts are visible as evidence with role/function/theme.
- no page uses generic missing-source language when the loaded source summaries prove otherwise.
- live browser proof captures the default route and all Home surfaces after ACA deployment.
