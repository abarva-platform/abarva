# Home V2 Implementation Prompt Pack

**Status:** implementation contract for the Home V2 rebuild.
**Date:** 2026-08-30.
**Scope:** Meridian-first Home surfaces served from ECL.
**Companions:**

- `docs/architecture/home-ecl-executive-narrative-v2-design-2026-08-28.md`
- `docs/architecture/home-ecl-page-prompts-and-architecture-experience-2026-08-28.md`
- `docs/architecture/ECL_PRODUCT_DETERMINISTIC_NEEDS_2026_08_22.md`

This pack exists so Home is no longer redesigned from screenshots or loose narrative preference.
Each page has a declared executive question, source/layer inputs, prompt context, deterministic
visual contract, and proof bar.

## Non-Negotiable Rules

1. Home is a Layer 4 product projection. It does not own source truth.
2. Every visible fact must reconcile to ECL source/context/commercial/review/projection rows.
3. Claude may write prose from a validated packet. It may not invent numbers, relationships,
   datasets, chart values, system maps, owners, or architecture links.
4. Visuals are deterministic renderers over named datasets. Claude may choose a `dataset_ref`;
   code owns the dataset and renderer.
5. Architecture starts conceptual, then drills to logical and physical. It does not start as an
   app table.
6. The data browser is slice/dice first and table second. It must not dump every column by default.
7. Admission gates remain above architecture and data-flow experiences. A pretty diagram cannot
   replace a refusal.
8. Unknown, missing, unreviewed, synthetic, and conflicting states are visible states. They never
   become zero.

## Completed Versus Not Done

| Area | State | Evidence / caveat |
| --- | --- | --- |
| ECL default read path | Complete for default Home route | Home reads ECL by default for Meridian. |
| Deterministic Home narrative write/read seam | Complete mechanically | Writer rows exist, readback proves row linkage; quality bar still not met. |
| Chapter terminal-state contract | Complete in contract, partially rendered | Published/refused/deferred is the rule; empty CXO prose is not acceptable. |
| Criticality/count normalization | Complete in code | Visible Home counts normalize tier labels before display. |
| Data-flow endpoint labels | Complete in code | Endpoint refs resolve to application/platform names before falling back. |
| Evidence id resolution | In progress | Runtime packet must include deterministic writer ids so visible claims resolve. |
| CXO narrative quality | Not complete | Current prose is grounded but not partner-quality. |
| Architecture wheel/run-map | Not complete | The mockup proved the shape; it is not a shippable renderer. |
| Data browser V2 | Not complete | Existing browser is useful but not a true slice/dice workbench. |
| Org chart/interview surfaces | Not complete | They need first-class source adapters and packet sections. |

## Source And Layer Map

The source data may arrive as workbooks, CSV extracts, document extractions, interview transcripts,
or module-produced signals. Home consumes the governed layer, not raw files.

| Source family | Layer 1 grain | Layer 2 adapter obligation | Layer 3/ECL substrate | Home serving/projection use |
| --- | --- | --- | --- | --- |
| Getting Started / Review | one assessment packet and review event | preserve tenant, assessment, as-of, review state | `ecl_review.review_event`, `ecl_source.source_file` | freshness, status, missing-source banners |
| Strategy and Operating Model | segment, priority, value driver | map declared strategy to business objects and measures | `ecl_context.object`, `ecl_context.measure`, relationships | Our Business, Strategy, Executive Brief |
| Operations, Workforce and KPIs | process, role, KPI, volume | preserve function/process/owner mapping and unknowns | business/process objects, measures, relationships | How We Operate, Performance |
| Health Plan Applications | one application/service | declare application identity; separate deployments | `application_v`, relationships, measures | payer run-map, app register |
| Clinical Applications | one application/service | declare application identity; separate deployments | `application_v`, relationships, measures | provider run-map, app register |
| Shared Applications | one application/service | declare application identity; separate deployments | `application_v`, relationships, measures | back-office run-map, app register |
| Data, Analytics and Reporting | data product, mart, report/tool, ETL/script count | preserve counts by function/tool/platform; unknown is not zero | data objects, measures, relationships | data architecture zones, data browser |
| Infrastructure and Hosting | platform/deployment/environment | map hosting, capacity, resilience, support dates | `technical_component_v`, `application_deployment_v` | physical architecture, infra page |
| Finance, Budget and Programs | budget, actual, forecast, initiative | map metric definitions and value states | measures, program/business objects | Performance, Strategy, Tower signal handoff |
| Risk, Controls and Compliance | risk/control/exception | link risk to affected object by FK | risk/control objects, relationships | Needs Attention, risk callouts |
| Vendors and Contracts | vendor, contract, service line, document term | keep contract scope, renewal, TFC, benchmark, document proof | `ecl_commercial.*`, vendor objects | Vendor Contracts, commercial spine |
| Commercial Performance and Value | invoice, SLA, benchmark, lever | map variance and value measures to metric dictionary | invoice/SLA/measure rows | Performance, Vendor Contracts |
| AI Portfolio and Governance | use case/tool/policy/control | link AI use case to workflow, data, risk, owner | AI objects, relationships, measures | Technology, Strategy, Intelligence handoff |
| AI Usage and Value | tool usage by population/function | preserve active/licensed users, adoption, spend | measures and tool objects | Performance, Technology |
| Interviews | interview/session/excerpt/theme | separate role-level testimony from deterministic fact | interview evidence, themes, cited relationships | Leadership, Strategy, Our Business |

## Executive Signal Packet V2

The packet passed to Claude must be assembled by code and validated before the model call.

| Packet section | Context passed | May support visible claims? |
| --- | --- | --- |
| `enterprise_profile` | industry, scale, geography, revenue band, workforce, locations, attestation | Yes, when source-backed |
| `business_value_model` | segments, books of business, value drivers, operating economics, missing economics | Yes |
| `strategic_bets` | priorities, funded programs, expected value, owner, status, dependencies | Yes |
| `operating_model` | functions, processes, owners, workforce, pain points, handoffs | Yes |
| `technology_estate` | applications, deployments, hosting, criticality, lifecycle, vendors, dependencies | Yes |
| `data_and_analytics` | source systems, ingestion, data platforms, marts, reports, ETL/script counts, users, volume | Yes |
| `commercial_exposure` | vendors, contracts, renewals, TFC, benchmark rights, scope-to-system links | Yes |
| `value_and_performance` | KPI, spend, benefits, baselines, actuals, forecasts, finance state | Yes |
| `risk_and_controls` | risks, controls, exceptions, affected objects, severity, owner | Yes |
| `leadership_voice` | role, function, excerpt, theme, alignment, conflict, consent | Yes as perspective |
| `known_gaps` | missing source, unknown fields, unresolved relationships, unreviewed states | Yes as limitations |
| `source_summaries` | one summary per source/workbook family: grain, rows, material fields, examples, gaps | No by itself |
| `visual_datasets` | registered dataset refs and metadata only | No by itself |

`source_summaries` answer the "145+ files" problem: the model receives breadth, but it cannot turn
a source-summary count into a business claim unless a deterministic `sig_*` or `ctx_*` supports it.

## Home Surface Prompt Inventory

| Surface | Prompt intent | Required packet sections | Source/layer reads | Deterministic visual or table |
| --- | --- | --- | --- | --- |
| Executive Brief | State the boardroom verdict and the first three decisions. | all sections, prioritized by materiality | `serving.home_executive_brief`, Source/Tower/Moves signals | verdict rail, decision queue, proof ribbon |
| Our Business | Explain how the enterprise creates value before naming systems. | enterprise_profile, business_value_model, commercial_exposure, leadership_voice | strategy/operations/context measures; contract scope | business model blocks, value-driver map |
| Strategy & Value Creation | Show funded bets, value proof, and what remains aspirational. | strategic_bets, value_and_performance, leadership_voice | program measures, Tower value signals, interviews | strategy tree, investment/value bridge |
| How We Operate | Show how work moves through functions, processes, owners, vendors, systems. | operating_model, technology_estate, leadership_voice | org/process/application relationships | org/function map, accountability matrix |
| Technology & Data | Explain the inherited architecture and where complexity concentrates. | technology_estate, data_and_analytics, risk_and_controls | typed application/deployment/component views | enterprise run map, technology layer stack |
| Performance & Value | Separate measured value, claimable value, blocked value, and unmeasured outcomes. | value_and_performance, commercial_exposure, risk_and_controls | metric definitions, measures, Tower serving signals | value bridge, scorecards, proof rail |
| Leadership Perspective | Show what leaders said, where they agree, and where testimony conflicts with records. | leadership_voice, known_gaps | interview evidence and cited object relationships | interview theme matrix, quote drawer |
| What Needs Attention | Rank the few decisions or investigations with owner and evidence needed. | known_gaps, risk_and_controls, commercial_exposure, value_and_performance | gap flags, risk/control relationships, Source/Tower actions | decision queue |
| Current-State Architecture | Start conceptual by business block; drill to logical and physical. | technology_estate, operating_model, commercial_exposure, known_gaps | `application_v`, `application_deployment_v`, `technical_component_v`, relationships | conceptual run map -> logical map -> passport |
| Current-State Data Flow | Show source-to-consumption zones and topology fitness/refusal. | data_and_analytics, technology_estate, known_gaps | data objects, movement relationships, measures | zones and arrows; refusal if unfit |
| What Has Been Loaded | Show received material, usable context, gaps, and product impact. | source_summaries, known_gaps | source files, adapters, review events, projection counts | readiness map by source family |
| Browse The Record | Let the user slice/dice workbook and canonical rows by dimension and grain. | source_summaries, technology_estate, commercial_exposure, evidence states | workbook browser serving view, typed views, source refs | compact OLAP browser with row drawer |
| Applications & Systems | Show systems by business block/function, then named system detail. | technology_estate, operating_model, commercial_exposure | `application_v`, relationships, measures | portfolio table, system passport |
| Vendor Contracts | Show commercial spine and vendor exposure by scope and leverage. | commercial_exposure, value_and_performance, risk_and_controls | `ecl_commercial.*`, source projections, document extraction | vendor map, contract detail |
| Infrastructure & Platforms | Show hosting, platforms, resilience, support dates, and hosted workloads. | technology_estate, data_and_analytics, risk_and_controls | `technical_component_v`, `application_deployment_v`, measures | platform map, risk/watch list |
| Data Assets & Integrations | Show how data moves, where it lands, and where it is consumed. | data_and_analytics, technology_estate, known_gaps | data/product/report/ETL measures and relationships | data-zone map, consumption table |

## Page Prompt Text

These are the controlled prompt intents. They are not permission for page code to call the model.
They define what the deterministic writer may ask Claude to do after the packet is validated.

### Executive Brief

```text
Brief a newly appointed CXO. Lead with the answer, not the dataset. Use only supplied packet facts,
signals, and limits. State the boardroom verdict, the three reasons it matters, the top unresolved
proof limits, and the next decisions. Do not expose internal module names, schemas, provider flags,
row types, or build vocabulary.
```

### Our Business

```text
Explain how the enterprise creates value. Start with business model, segments, customers or members,
delivery model, and economics where supplied. Use systems, vendors, and data only as enabling
constraints. If revenue mix, member/patient volumes, or operating economics are missing, state the
gap as a limitation and do not replace it with technology counts.
```

### Strategy & Value Creation

```text
Explain which bets are funded, what value has been measured, what remains only expected, and what
evidence is required next. Use Tower value signals and program measures only when their source state
supports the claim. Do not infer transformation priorities from application counts or vendor spend.
```

### How We Operate

```text
Show the operating model as organization -> function -> process -> system -> vendor -> metric.
Separate executive strategy testimony from director-level tactical process testimony. Where owners,
processes, or decision rights are missing, name the affected domains instead of presenting an
unowned map.
```

### Technology & Data

```text
Explain the current architecture in three levels: conceptual business blocks, logical capability
maps, and physical system/platform passports. Count applications through application_v and
deployments through application_deployment_v. Do not count raw objects as applications. Show
critical dependencies, hosting mix, lifecycle/watch state, and relationship gaps.
```

### Performance & Value

```text
Separate measured performance, target performance, forecast value, claimable value, blocked value,
and unknown value. Every number must carry metric definition, basis, value state, quality state, and
evidence reference. Do not calculate savings or ROI from prose.
```

### Leadership Perspective

```text
Summarize leadership voice as evidence. Group by role level, function, theme, urgency, alignment,
and contradiction with records. Use direct excerpts only when allowed by attribution/consent. Treat
interviews as perspective unless corroborated by source records or measures.
```

### What Needs Attention

```text
Rank the few decisions or investigations that deserve leadership attention. Each item must name the
affected business area, owner role when known, evidence needed, why it matters, and whether it hands
off to Source, Tower, Moves, or Intelligence. Do not produce generic action lists.
```

### Current-State Architecture

```text
Build an executive run map for a new business or technology leader. Start with conceptual blocks:
Health Plan/Payer, Provider/Delivery, Back Office, Data/Analytics/AI, Infrastructure/Hosting, and
Vendor/Commercial Spine. For each block, show system count, top anchors, owner function, hosting
mix, critical dependencies, and known gaps. Drill to logical systems and physical passports. Only
show links backed by relationships; otherwise mark unresolved.
```

### Current-State Data Flow

```text
Build a zone map: Sources -> Ingestion -> Data Platforms -> Engineering & Transformation ->
Analytics & Consumption -> Governance & Risk. Use counts for reports, ETL jobs, scripts, users,
and data volume only when supplied or calculated from source records. Run the admission gate first;
if it refuses, render failed rule, measurement, evidence needed, and supported alternative.
```

### Browse The Record

```text
Build a slice/dice viewer, not a dump. Default to a selected slice headline, top drivers, gaps,
compact table, and row drawer. Let the user choose dataset, lens, dimension, measure, grain,
evidence state, and review state. Columns adapt to the selected lens. Every displayed count names
its denominator and uses typed views.
```

### Applications & Systems

```text
Show application identity, not deployments as systems. Group first by business block and function,
then by named system. Include vendor, business owner, IT owner, hosting, criticality, lifecycle,
annual cost, users, contracts, key integrations, and data products when known.
```

### Vendor Contracts

```text
Show vendor -> contract -> service line -> scoped applications/functions -> spend/value/risk.
Highlight concentration, renewals, termination flexibility, benchmarking rights, SLA evidence,
document proof, commercial leverage, and gaps. A contract register row is not document proof.
```

### Infrastructure & Platforms

```text
Show SaaS, cloud, private cloud, data centers, integration/messaging, identity, network/storage,
and data-platform layers. For each platform, show hosted apps/data products, criticality, support
end, resilience, capacity, owner, and unresolved relationships. Physical detail opens on click.
```

### Data Assets & Integrations

```text
Show where information starts, lands, transforms, and is consumed. Group by source domain, ingestion
pattern, platform, mart/data product, reporting or analytics tool, consuming function, and evidence
state. Include report counts, ETL/job counts, scripts, users, volumes, PHI/regulatory flags, and
lineage gaps when present.
```

## Architecture Wheel / Run-Map Contract

The current wheel mockup is a design reference only. The shippable experience is an Enterprise Run
Map with optional radial/wheel presentation when the dataset supports it.

| Level | Renderer | Data required | What a CXO learns |
| --- | --- | --- | --- |
| Conceptual | `enterprise_run_map` or `business_wheel` | block, function, application count, top anchors, owner, hosting mix, criticality mix, gaps | What runs each book of business and where ownership/risk sits. |
| Logical | `capability_system_map` | capability/function, applications, vendors, data flows, dependencies, contracts | Which systems support each capability and how they relate. |
| Physical | `system_passport` | system, deployments, platform, environment, region/data center, integrations, data products, usage, contract, support | What the system actually is and what must be changed/stabilized. |

Required conceptual blocks:

- Health Plan / Payer
- Provider / Delivery
- Back Office
- Data, Analytics & AI
- Infrastructure & Hosting
- Vendor & Commercial Spine

The visual cannot place a system in a block by string matching. The block assignment comes from
business-function, relationship, or scope fields in ECL. Unmapped systems are rendered as an
explicit unmapped group with affected counts.

## Data Browser V2 Contract

The browser behaves like a lightweight cube viewer over source/workbook and canonical rows.

| Control | Required behavior |
| --- | --- |
| Dataset | applications, deployments, platforms, data flows, reports, ETL/script counts, contracts, vendors, risks, interviews, measures |
| Lens | business, technology, ownership, vendor, risk, value, evidence |
| Dimension | book, function, owner, vendor, hosting, criticality, lifecycle, tool, data domain, review state |
| Measure | annual cost, contract value, users, flows, report count, ETL jobs, incidents, risk count, value |
| Grain | enterprise, book, function, capability, system, deployment, platform, vendor, contract |
| Evidence | source-recorded, document-extracted, interview-derived, calculated, model-inferred, unknown |
| Columns | presets by lens; never all columns by default |
| Row drawer | original source row, normalized value, mapping state, basis, quality, review state, lineage |

No browser summary may query raw `ecl_context.object` without a typed-view or counting-class
constraint. This is a testable failure.

## Visual Dataset Registry

Home V2 renderers must use registered deterministic datasets.

| Dataset ref | Renderer | Producer | Admission / gate |
| --- | --- | --- | --- |
| `enterprise_run_map` | conceptual block map or wheel | Home visual dataset compiler over typed views | architecture admission required |
| `capability_system_map` | logical system map | relationships + application/platform views | relationship coverage required |
| `system_passport` | detail panel | system/deployment/platform/contracts/measures | object id required |
| `data_architecture_zones` | source-to-consumption zone map | data-flow projection + data measures | data-flow admission required |
| `workbook_slice_browser` | OLAP-style table | source/workbook lineage serving view | source lineage required |
| `organization_map` | org/function graph | org ownership adapter + interviews | owner evidence required |
| `interview_theme_matrix` | theme/excerpt matrix | interview adapter + theme compiler | attribution/consent required |
| `commercial_spine` | vendor-contract-scope map | Source projection + commercial tables | scope relationships required |
| `value_bridge` | Tower-compatible value bridge | Tower value chain serving views | metric dictionary required |
| `risk_chain` | risk/control affected-object map | risk/control relationships | FK object refs required |

If a dataset ref is missing, the UI renders a designed unavailable state with the missing producer,
not an empty chart.

## Implementation Backlog

| ID | Work item | Success proof |
| --- | --- | --- |
| H2-01 | Add Home visual dataset compiler for `enterprise_run_map` and `data_architecture_zones`. | Unit test computes counts from typed views; planted raw-object overcount fails. |
| H2-02 | Build conceptual run-map renderer and logical drilldown shell. | Browser screenshot opens on six conceptual blocks with real anchors and named denominators. |
| H2-03 | Build system passport drawer. | Clicking a system shows deployment, hosting, contract, data, risk, and source lineage. |
| H2-04 | Build data browser V2 controls and column presets. | Browser screenshot shows dataset/lens/dimension/grain filters and no all-column default dump. |
| H2-05 | Add org/interview producer and renderer stubs with truthful unavailable states. | Missing interviews render deferred, not empty CXO prose. |
| H2-06 | Wire Tower and Source signals into Home packet as signals, not prose. | Published Home claims cite Source/Tower signal ids without module-internal vocabulary. |
| H2-07 | Browser crawl all 16 Home surfaces after deploy. | 16/16 Home surfaces render, with screenshots and no unresolved deterministic evidence ids. |

## First Build Prompt

```text
Build H2-01 and H2-02 only.

Target: Home Current-State Architecture must open as an executive run map with six conceptual
blocks: Health Plan/Payer, Provider/Delivery, Back Office, Data/Analytics/AI,
Infrastructure/Hosting, Vendor/Commercial Spine.

Data rules:
- Read Home/ECL serving data only through existing ECL bundle and typed/counting semantics.
- Count applications through application_v-equivalent rows, deployments separately, and platforms
  separately.
- Do not use raw object totals.
- Do not infer links by display name.
- Every block shows: count with denominator, top three anchors by materiality, owner/function,
  hosting mix, critical dependencies, known gaps, and a logical drill action.
- If architecture admission refuses, render the refusal payload above the map.

UI rules:
- No striped blank tiles.
- No builder/schema/provider vocabulary.
- Stable desktop layout first; no overlapping text.
- Use blocks, compact metrics, and drill controls. The map must look like an executive artifact,
  not a database card grid.

Tests:
- Unit test raw deployments cannot inflate application count.
- Unit test unmapped systems appear in an explicit unmapped group.
- Browser proof captures `/home#architecture` after deploy.
```
