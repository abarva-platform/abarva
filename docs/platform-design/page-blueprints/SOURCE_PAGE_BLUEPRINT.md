# Source Page Blueprint
**Route:** /source
**Surface:** source
**Primary user:** Procurement lead / Commercial director
**Primary question:** "What sourcing events need commercial or governance attention?"
**Primary agent:** Nexus
**Supporting agents:** Sentinel, Atlas
**Demo data readiness:** thin (no source list page seed exists — AMS scenario is event-level only)

## Job-to-be-Done
The Source page is the sourcing portfolio surface. It gives the procurement lead a structured view across all active commercial events — their stage, readiness, commercial risk, outstanding inputs, and linked programmes. It provides a starting point for navigating into any specific source event for deeper commercial analysis.

**First 10 seconds:** User sees: (1) how many active sourcing events exist, (2) which events are at critical commercial stages (BAFO, evaluation, shortlist), (3) what is missing from the commercial picture, (4) Nexus guidance on where to start.

## Data Contract
**Required:** Source event list with stage, commercial readiness, vendor count, risk flags, linked programme badge, active mission count, missing input indicators.
**Available today:** AMS outsourcing scenario (apex-retail-ams-outsourcing-2026) as the anchor demo event. Minimal list-page seed.
**Missing:** Multi-event portfolio seed. Real commercial event ingestion. Live bid management system integration.
**Evidence basis:** Wave 16-19 AMS scenario seed — single event only.
**Must not claim:** Live procurement decisions, real vendor bids, real BAFO outcomes.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Apex Retail · Full Demo]                                   |
+-----------------------------------------------------------------------+
| SOURCE BRIEF (Nexus)                                                   |
| "1 active sourcing event needs commercial attention: AMS outsourcing   |
|  is at BAFO stage with 4 vendors. 5 risk exceptions open."            |
| [deterministic caveat]                                                 |
+-----------------------------------------------------------------------+
| FILTER BAR: [All] [BAFO] [Evaluation] [Shortlist] [Negotiation]       |
|             [Status: Active | Complete | Paused]                       |
+-----------------------------------------------------------------------+
| SOURCE EVENT LIST TABLE                                                |
|                                                                        |
| Event                    | Stage    | Vendors | Risks | Programme     |
| AMS Outsourcing 2026     | BAFO     |    4    |   5   | APX-CDP-2026  |
| [+ future events]        |          |         |       |               |
|                                                                        |
+-----------------------------------------------------------------------+
| NEXUS MISSION STRIP                                                    |
| [Nexus: BAFO follow-up due] [Sentinel: Risk pattern detected]         |
+-----------------------------------------------------------------------+
```

## Workflow Sequence
1. User lands on Source — sees Nexus brief summarizing active events
2. User reviews event list table — scans stage, vendor count, risk flags, linked programme
3. User clicks into AMS outsourcing event — navigates to Source Event detail page
4. User reviews Nexus mission strip — understands what agents are working on in Source

**Unlocks next step:** Source event card with stage at BAFO — click opens Source Event detail.
**Blocks progress:** No multi-event list seed. Only one AMS event seeded. Nexus shows low-context disclosure if tenant is not Apex Retail.

## Agent-Centric Requirements
- Nexus brief: "1 active source event is in BAFO stage. AMS outsourcing requires BAFO evaluation for 4 vendors. 5 risk exceptions need review." Must name the event and tenant.
- Context used: AMS scenario seed, stage data, risk count, linked programme APX-CDP-2026.
- Confidence: "Deterministic seed — Apex Retail AMS scenario. Not live procurement data."
- Missing inputs: Multi-event portfolio data, live bid status, real BAFO timelines.
- Recommended next action: "Open AMS outsourcing event — review BAFO for Northstar and BluePeak."
- 3 choices + custom: On Nexus brief "What needs attention?": (1) Review BAFO vendor comparison, (2) Review 5 open risk exceptions, (3) Check commercial readiness gate. + Custom.
- Low-context disclosure: If tenant = meridian/arcturus → "No source events seeded for [tenant]. Switch to Apex Retail for the demo experience."

## Visual Canon
- Warm off-white (#F8F7F4) base
- Georgia serif for page title and Nexus brief
- DM Sans for table labels and metadata
- No teal, no full-page dark mode, no sparkles
- Above fold: Nexus brief + event list table header + at least one event row
- Below fold: Additional events (if any), mission strip
- Event list table: compact rows, stage badge, risk indicator, programme badge chip

## Interaction Model
- Tabs: Filter bar for stage/status (All / BAFO / Evaluation / etc.) — filters table in place
- Drawers: Nexus mission detail (click mission chip → drawer)
- Same-canvas updates: Filter bar updates table rows without navigation
- Drilldowns: Event row click → /source/events/[id]
- Empty state: "No source events seeded for [tenant]. This page requires Apex Retail demo data."
- Blocked/deferred state: Future events show "Seed pending — use AMS outsourcing for demo."

## Acceptance Criteria
- [ ] Nexus brief present with event count and tenant name
- [ ] AMS outsourcing event visible in event list
- [ ] Stage column shows "BAFO" for AMS event
- [ ] Risk count (5) visible in row
- [ ] Programme badge chip (APX-CDP-2026) visible in row
- [ ] Deterministic seed caveat visible
- [ ] Filter bar present (even if only one event to filter)
- [ ] No fake live procurement data claim
- [ ] Nexus mission strip with at least one active mission

## Route Ownership
- Route file: src/app/(maestro)/source/page.tsx (expected)
- Expected shell: AbarVaAppShell / MaestroChrome with secondary sub-nav
- Expected components: SourceBrief, SourceEventListTable, FilterBar, NexusMissionStrip
- Legacy risk: Medium — verify no TopBar.tsx on this route
