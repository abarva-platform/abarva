# AbarVa Founder Demo Route Checklist

**Generated:** 2026-04-26
**Slice:** DEMO2
**Audience:** Founder / Boardroom demo operator
**Source:** `src/lib/qa/founder-demo-route-checklist.ts`

This checklist documents the eleven canonical routes to walk during a
founder or seed-round demo of the AbarVa platform. Each route is listed
with its purpose, primary agent, a suggested talking point, the expected
component, a readiness caveat, and a fallback strategy if the route is
blocked on demo day.

---

## Summary

| Status   | Count |
|----------|-------|
| Ready    | 6     |
| Partial  | 5     |
| Deferred | 0     |
| Blocked  | 0     |
| **Total**| **11**|

---

## Route 1 — /home

| Field               | Value |
|---------------------|-------|
| **Route**           | `/home` |
| **Purpose**         | Executive entry point — establishes the agentic operating model and surfaces the platform mission before any tenant context is loaded. |
| **Primary Agent**   | Nexus |
| **Validation Status** | ready |
| **Expected Component** | `src/components/home/AgenticHomeEntry.tsx` |
| **Readiness Caveat** | None — route is fully rendered and design-canon compliant. |
| **Fallback If Blocked** | Show a screenshot of the home screen captured during the 2026-04-26 smoke run. |

**Talking Point**

> This is the front door every operator sees. Within seconds they understand that four specialist AI agents — Nexus, Atlas, Sentinel, and Steward — are coordinating on their behalf. The interface is intentionally calm: one headline, one call-to-action, no noise.

---

## Route 2 — /platform/admin

| Field               | Value |
|---------------------|-------|
| **Route**           | `/platform/admin` |
| **Purpose**         | Platform administration hub — lets the operator see all tenant accounts, agent health, and global system controls in one place. |
| **Primary Agent**   | Steward |
| **Validation Status** | ready |
| **Expected Component** | `src/components/admin/StewardSetupControlCenter.tsx` |
| **Readiness Caveat** | None — surface renders with deterministic seed data. |
| **Fallback If Blocked** | Navigate to /platform/admin/production-readiness as a substitute to demonstrate Steward governance depth. |

**Talking Point**

> Steward is the reliability and governance agent. From this hub a platform operator can see every tenant, inspect agent dispatch queues, and confirm that the runtime safety gates are in position before going live.

---

## Route 3 — /platform/admin/production-readiness

| Field               | Value |
|---------------------|-------|
| **Route**           | `/platform/admin/production-readiness` |
| **Purpose**         | Production readiness tracker — gives the operator a live, component-by-component view of platform readiness across ten dimensions before any go-live decision. |
| **Primary Agent**   | Steward |
| **Validation Status** | ready |
| **Expected Component** | `src/components/admin/ProductionReadinessLivePanel.tsx` |
| **Readiness Caveat** | Live CI and Vercel polling tokens are absent in the demo environment; liveStatus is correctly reported as unavailable rather than fabricated. |
| **Fallback If Blocked** | Show the static production-readiness.json manifest in docs/build/ to demonstrate the canonical readiness schema. |

**Talking Point**

> Before we take a single enterprise client live, Steward produces a readiness report across functionality, data readiness, agent readiness, tenant isolation, test coverage, and deployment health. The tracker is honest about what is deferred — no fake green indicators.

---

## Route 4 — /platform/admin/build-progress

| Field               | Value |
|---------------------|-------|
| **Route**           | `/platform/admin/build-progress` |
| **Purpose**         | Build progress tracker — shows the founder exactly which of the eleven build waves have merged, which slices are complete, and what the next action is. |
| **Primary Agent**   | Steward |
| **Validation Status** | ready |
| **Expected Component** | `src/lib/admin/build-progress` |
| **Readiness Caveat** | None — reads from the deterministic build-waves.json manifest; no live GitHub or Vercel polling. |
| **Fallback If Blocked** | Open docs/build/build-waves.json directly and narrate the completed-wave list. |

**Talking Point**

> We track every slice of platform work in a machine-readable wave manifest. This page surfaces that manifest so investors and the founding team can see progress at a glance — no spreadsheet required.

---

## Route 5 — /tenant/apex-retail/programs

| Field               | Value |
|---------------------|-------|
| **Route**           | `/tenant/apex-retail/programs` |
| **Purpose**         | Programs list for the Apex Retail demo tenant — shows four active AI programs across Contact Center AI, CDP, Store Associate Productivity, and Demand Forecasting. |
| **Primary Agent**   | Nexus |
| **Validation Status** | ready |
| **Expected Component** | `src/lib/programs/programs-canonical-view.ts` |
| **Readiness Caveat** | None — programs render from the Apex Retail seed data installed in the demo environment. |
| **Fallback If Blocked** | Show the seed data in src/lib/programs/ to demonstrate program structure and fields. |

**Talking Point**

> Apex Retail is running four AI programs simultaneously. Nexus keeps them all coordinated: priority order, risk signals, next milestones, and the stakeholder map are visible in one view. This is what the client's program office sees every morning.

---

## Route 6 — /tenant/apex-retail/programs/[programSlug]

| Field               | Value |
|---------------------|-------|
| **Route**           | `/tenant/apex-retail/programs/[programSlug]` |
| **Purpose**         | Program detail page — deep-dives a single program showing phase timeline, deliverables, evidence panel, and agent recommendations. |
| **Primary Agent**   | Nexus |
| **Validation Status** | partial |
| **Expected Component** | `src/components/programs/ProgramCanonicalDetail.tsx` |
| **Readiness Caveat** | Content is seeded data only; live program-state ingestion, real deliverable generation, and workshop mode execution are deferred. |
| **Fallback If Blocked** | Remain on the programs list and walk the summary cards in detail rather than drilling into a specific program. |

**Talking Point**

> Click into the Contact Center AI program. You'll see the phase map, the active deliverables, and the evidence the agent used to set the current priority. The evidence panel shows exactly which source documents and data events informed each recommendation — full transparency, no black box.

---

## Route 7 — /tenant/apex-retail/tower

| Field               | Value |
|---------------------|-------|
| **Route**           | `/tenant/apex-retail/tower` |
| **Purpose**         | AI Control Tower — Atlas's portfolio-level view showing adoption, value, risk, cost-consumption, and DORA dimensions across all active programs. |
| **Primary Agent**   | Atlas |
| **Validation Status** | ready |
| **Expected Component** | `src/components/tower/ProgramPressureCards.tsx` |
| **Readiness Caveat** | None — Tower renders with the full deterministic read model including proactive pressure-card surfacing from the Atlas FM-10 slice. |
| **Fallback If Blocked** | Describe the five Tower dimensions (portfolio inventory, adoption, value, risk, DORA) using the ACT slice documentation in docs/build/slices/. |

**Talking Point**

> This is Atlas's command center. In a single glance the CTO or COO can see where AI investment is generating value, where adoption is lagging, and which programs are carrying the most technical risk. Pressure cards surface the most urgent signals automatically.

---

## Route 8 — /tenant/apex-retail/intelligence

| Field               | Value |
|---------------------|-------|
| **Route**           | `/tenant/apex-retail/intelligence` |
| **Purpose**         | Solution Intelligence canvas — Sentinel's active-pattern detection surface showing which AI solution patterns are active, which are at risk, and which are emerging across the tenant. |
| **Primary Agent**   | Sentinel |
| **Validation Status** | ready |
| **Expected Component** | `src/components/intelligence/SentinelActivePatterns.tsx` |
| **Readiness Caveat** | None — Intelligence canvas renders with the full active-pattern seed and the SentinelPatternRail is installed on the tenant pattern pages. |
| **Fallback If Blocked** | Walk the Intelligence section of the production-readiness tracker to describe the validated contract. |

**Talking Point**

> Sentinel watches for recurring patterns across all of Apex Retail's AI initiatives. If a data-quality pattern is undermining three programs at once, it surfaces here before any individual program team notices. This is enterprise-level signal aggregation that no human analyst can replicate at speed.

---

## Route 9 — /tenant/apex-retail/intelligence/patterns/[patternKey]

| Field               | Value |
|---------------------|-------|
| **Route**           | `/tenant/apex-retail/intelligence/patterns/[patternKey]` |
| **Purpose**         | Pattern detail page — drill-down into a specific Sentinel detection showing evidence sources, affected programs, severity trend, and recommended remediation actions. |
| **Primary Agent**   | Sentinel |
| **Validation Status** | partial |
| **Expected Component** | `src/lib/intelligence/sentinel-pattern-detections.ts` |
| **Readiness Caveat** | Pattern detail content is seeded data only; live detection ingestion, real-time severity scoring, and automated remediation dispatch are deferred. |
| **Fallback If Blocked** | Show the active pattern list on the Intelligence canvas without drilling into a specific pattern, and narrate the evidence model. |

**Talking Point**

> Click into the top-ranked active pattern. Sentinel shows every data point that informed the detection, the programs affected, and a prioritized list of actions. The evidence trail is immutable — the founder or auditor can trace every recommendation back to source.

---

## Route 10 — /source

| Field               | Value |
|---------------------|-------|
| **Route**           | `/source` |
| **Purpose**         | Source platform entry — the data-ingestion and event-governance surface where operators configure what data flows into Nexus, Atlas, Sentinel, and Steward. |
| **Primary Agent**   | Steward |
| **Validation Status** | partial |
| **Expected Component** | `src/lib/source/` |
| **Readiness Caveat** | Source surfaces are partially implemented; admin/setup readiness contract, data readiness panel, and event canvas are code-complete but live event ingestion and authenticated route smoke automation are deferred. |
| **Fallback If Blocked** | Describe the data trust model (L0–L4 sharing levels and the five-state trust ladder) using the TRUST1 documentation in docs/build/slices/. |

**Talking Point**

> Source is where enterprise data becomes agent-grade signal. Steward governs every intake: schema validation, trust level assignment, and retention policy are set here before any agent is allowed to reason over client data.

---

## Route 11 — /source/events

| Field               | Value |
|---------------------|-------|
| **Route**           | `/source/events` |
| **Purpose**         | Event canvas — shows the live stream of data events flowing into the platform, filterable by source, type, trust level, and processing status. |
| **Primary Agent**   | Steward |
| **Validation Status** | partial |
| **Expected Component** | `src/lib/source/events` |
| **Readiness Caveat** | Event canvas renders from seed data; live event stream ingestion, real-time filtering, and authenticated persona-walk automation are deferred. |
| **Fallback If Blocked** | Show the Source admin/setup readiness contract documentation to explain the event data governance model without a live feed. |

**Talking Point**

> Every data event entering the platform is logged here. The founder can show a prospective enterprise client exactly how their existing data pipelines would connect, what the trust classification looks like, and how Steward quarantines untrusted records before agents touch them.

---

## Demo Day Preparation Notes

1. **Boot order:** Start at `/home`, then `/platform/admin`, then the Apex Retail tenant surfaces.
2. **Fallback stack:** Keep the `docs/build/` directory open in a second browser tab. Any `partial` route can be supplemented with documentation from `docs/build/slices/`.
3. **Honest framing:** Never claim live signal ingestion, real-time model inference, or production persona-walk automation unless explicitly confirmed. The `readinessCaveat` field on each route documents what is genuinely deferred.
4. **Seed data anchor:** All tenant routes use the Apex Retail demo seed (Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting).
5. **Agent narrative:** Each surface is introduced through its primary agent — Nexus (programs coordination), Atlas (portfolio control), Sentinel (pattern intelligence), Steward (governance and data trust).
