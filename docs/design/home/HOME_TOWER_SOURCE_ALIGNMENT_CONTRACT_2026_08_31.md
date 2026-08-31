# Home Design Alignment Contract

Status: execution contract for the Home refresh.

This document defines how Home aligns with the published Tower command center and the Source workbench. It is deliberately visual and behavioral. Data ownership remains governed by the Enterprise Information Architecture: Layer 1 intake and Layer 3 canonical truth drive facts; Home is a Layer 4 projection.

## Why This Exists

Home currently has the right evidence discipline but the wrong product posture. It still reads like a long briefing document with cards attached. Tower now reads like an executive operating room: compact, canvas based, metric led, and drillable. Source reads like a sourcing workbench: dense, filterable, and evidence inspectable.

Home must sit between those two:

- Executive pages use Tower's boardroom grammar.
- Architecture, data flow, and record browsing use Source's workbench grammar.
- Every click changes the active canvas. A long scroll page is not an acceptable default experience.

## Shared Visual System

Home should reuse the same visual vocabulary as Tower and Source:

| Element | Contract |
| --- | --- |
| Canvas shell | Fixed product canvas with internal scroll regions, not a document page with endless body scroll. |
| Background | Warm neutral surface, with white analytical panels and restrained borders. |
| Typography | Serif for verdicts and page titles; sans for analytical copy; mono for evidence, counts, provenance, and table labels. |
| Color meaning | Teal means verified/ready; amber means gap/watch/deferred; red means risk/refusal/blocker; blue means navigation or selected state. |
| Cards | Use for metrics, repeated rows, drawers, and framed tools only. Do not nest cards inside cards. |
| Tables | Dense, sticky-header, scan-first tables for browsable data and evidence queues. |
| Charts | Only for deterministic datasets with named denominators and traceable source rows. |
| Drawers | Used for provenance, source-row detail, claim evidence, and drilldown. |

## Tower Patterns Home Must Adopt

| Tower pattern | Home equivalent |
| --- | --- |
| Compact tab bar with URL-addressable state | Home top-level page/section tabs or rail entries must update the URL hash/query and replace the canvas. |
| First-screen verdict | Every executive story section opens with a boardroom thesis, not a vendor/system/count trivia lead. |
| Metric rail | Every executive section shows 3-5 deterministic scale/proof/trust metrics beside the thesis. |
| Proof strip | Home shows evidence basis, claim state, freshness, source-family coverage, and gap/refusal state. |
| Decision queue | Home "What needs attention" renders owner-bound actions, not generic concerns. |
| Drawers | Clicking a metric, claim, diagram node, table row, or question opens evidence/provenance. |
| Empty state | If a governed read model is empty or refused, Home renders the refusal/gap payload, not an attractive blank page. |

## Source Patterns Home Must Adopt

| Source pattern | Home equivalent |
| --- | --- |
| Workbench layout | Architecture, data flow, application register, vendor contracts, infrastructure, and data assets render as workbenches. |
| Slice first, table second | Browse pages begin with dimensions/facets and then a table, not an unfiltered dump. |
| Current selection canvas | Selecting a function, segment, system, vendor, or source file refreshes the main canvas and detail drawer. |
| Evidence trace | Every figure can be traced to source file, sheet/file name, source row, canonical object, projection row, and claim reference where applicable. |
| No legacy comparison by default | Builder reconciliation panels stay out of CXO surfaces. Operator routes may expose them. |

## Home Surface Types

Home has three surface families. Each uses a different layout contract.

| Surface family | Pages | Layout |
| --- | --- | --- |
| Executive story | Executive Brief, Our Business, Strategy & Value Creation, How We Operate, Technology & Data, Performance & Value, Leadership Perspective, What Needs Attention | Boardroom canvas: thesis, metric rail, evidence ribbon, claim bands, decision questions, provenance drawer. |
| Architecture workbench | Current-State Architecture, Current-State Data Flow | Conceptual first, then logical, then physical. Admission gate stays above the visual. |
| Record browser | What Has Been Loaded, Browse The Record, Applications & Systems, Vendor Contracts, Infrastructure & Platforms, Data Assets & Integrations | Source-style browser: family selector, filters, column presets, table, row drawer, CSV export. |

## Executive Story Contract

Each executive story page must render as a single canvas, not as a stacked document chapter.

Required regions:

1. Header: page title, guiding question, status, as-of date.
2. Thesis panel: one business-led statement in plain executive language.
3. Metric rail: 3-5 deterministic metrics with named denominators.
4. Evidence ribbon: source families, claim count, gap count, freshness, and attestation state.
5. Body canvas: 2-4 claim groups max, each with evidence source adjacent.
6. Decision strip: the questions or actions a new executive should take from the page.
7. Drawer: source rows, canonical refs, prompt/context refs, and verification outcome.

Opening rule:

- Executive Brief and Our Business cannot open on one vendor, one contract, one system, one tool, or one count unless the page contract explicitly asks for that narrow object.
- The first sentence must explain the enterprise's operating model, economic model, strategic tension, or leadership decision.
- A vendor, tool, contract, or system may appear in the lead only after the enterprise-level frame has been stated.

## Architecture Workbench Contract

Architecture starts conceptual and drills down.

Required flow:

1. Conceptual: business segment blocks and functional system blocks. The user sees how provider/delivery, plan, ambulatory, and shared enterprise blocks run.
2. Logical: application groups by function/capability, ownership, data domain, and integration role.
3. Physical: named systems, deployment model, hosting, vendor/product, criticality, lifecycle, version or volume where relevant.

Examples of expected blocks:

- Back office operations: HR, finance, supply chain, identity, collaboration, legal, procurement, and service management.
- Provider and delivery: EHR, clinical departmental systems, revenue cycle, scheduling, imaging, lab, pharmacy, care management, and patient access.
- Plan operations: claims, enrollment, benefits, authorization, provider network, member engagement, actuarial, and quality.
- Data and analytics: source systems, integration layer, landing layer, warehouses/lakehouse/marts, reporting and consumption, advanced analytics.

Rules:

- Counts must come through typed views such as `application_v`, `application_deployment_v`, `business_object_v`, and `technical_component_v`, never raw canonical object counts.
- Admission gates remain authoritative. A conceptual diagram cannot hide a refused topology or unresolved endpoint condition.
- Each block must expose "why it matters", "systems in the block", "owners", "deployment posture", "known gaps", and "source rows".

## Record Browser Contract

The record browser is the bridge between the Excel-like intake and the product surfaces.

Required behavior:

- Family picker across active source datasets.
- Column presets by family, with a user-toggleable column panel.
- Filters for business segment, function, owner, hosting model, lifecycle, cloud/on-premise, vendor, risk, quality state, and attestation state when present.
- Constant-column flags: a constant measurement is called out; provenance constants are explicitly exempted.
- Table rows preserve source file, source row, canonical ID, projection ID, mapping state, and data-quality state.
- CSV export exports the filtered table and the active filter contract.

## Content Context Contract

Claude must not be asked to infer the enterprise from a thin packet. The deterministic Home writer must provide:

- Enterprise profile and leadership/priorities.
- Business segment spine and revenue/P&L ownership.
- Source-family summaries for every active intake family.
- Cross-domain segment table.
- Interview excerpts, grouped by executive lens and theme.
- Applications, infrastructure, data, vendors/contracts, spend/value, programs, metrics, AI, risk/control, service scope, process evidence, and relationships.
- Explicit gaps and refusal payloads.

The model may interpret only the verified packet. It may not calculate counts, money, percentages, or classifications. Those are deterministic inputs.

## UI Acceptance Gates

The Home refresh is not complete until these are proven:

| Gate | Acceptance |
| --- | --- |
| Canvas navigation | Clicking every Home rail/top-level item replaces the main canvas and updates URL state. |
| No long-scroll default | Executive Story does not expose all sections as one continuous scroll by default. |
| Executive lead quality | No executive section opens on vendor/system/tool trivia unless page contract allows it. |
| Evidence trace | Every displayed metric has a denominator and traceable source/projection refs. |
| Refusal integrity | Refused/deferred sections render explicit terminal states; absent from page is failure. |
| Architecture gate | A refused architecture/data-flow view renders the refusal payload instead of a diagram. |
| Record browser | Filters, column presets, row drawer, and export work against current source data. |
| Visual parity | Screenshots of Home, Tower, and Source share shell, token, density, and interaction grammar. |

## Implementation Order

1. Finish the Home deterministic content gate so the applied content is worth styling.
2. Rework Home shell into a Tower-style fixed canvas with page-level navigation.
3. Rebuild Executive Story sections into compact boardroom canvases.
4. Upgrade Architecture and Data Flow into conceptual/logical/physical workbenches.
5. Upgrade Browse The Record into the Source-style dataset browser.
6. Capture browser proof for all Home surfaces and package prompt/context/output provenance.

## Non-Goals

- Do not move product facts into Home.
- Do not make Claude calculate facts.
- Do not use architecture visuals to mask missing topology evidence.
- Do not ship operator/proof vocabulary on the CXO surface.
- Do not copy Tower content; copy the product grammar.
