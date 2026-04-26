# Source Event Page Blueprint
**Route:** /source/events/[id]
**Surface:** source
**Primary user:** Procurement lead / Commercial director
**Primary question:** "How do we make the right commercial/vendor decision?"
**Primary agent:** Nexus
**Supporting agents:** Sentinel, Atlas
**Demo data readiness:** partial (AMS outsourcing scenario seed — Wave 19)

## Job-to-be-Done
The Source Event page is the commercial decision hub for a single sourcing event. It gives the procurement lead everything needed to evaluate vendor options, assess commercial risk, respond to BAFO opportunities, and make a defensible sourcing decision — all in one surface.

**First 10 seconds:** User sees: (1) which event this is and what stage it is at, (2) how many vendors are in play, (3) what commercial risks are outstanding, (4) what Nexus recommends as the next commercial action.

## Data Contract
**Required:** Event commercial brief, pricing normalization data, vendor comparison (named vendors), risk exceptions, BAFO opportunities, commercial readiness score, actions/missions, linked programme badge, Tower/Intelligence signals.
**Available today:** AMS outsourcing scenario — apex-retail-ams-outsourcing-2026 (Wave 16-19 seed):
  - 4 vendors: Northstar Systems, BluePeak Technologies, Horizon Advisory, Meridian Systems
  - 5 risk exceptions (cost escalation, SLA ambiguity, contract term risk, data sovereignty, transition risk)
  - BAFO opportunity: Northstar and BluePeak shortlisted
  - Commercial readiness: partial (3/5 criteria met)
  - Actions/missions: 5 active
  - Linked programme: APX-CDP-2026 (CDP Activation)
  - Tower/Intelligence signals: 4 signals (cost pattern, risk exception, SLA risk, market benchmark)
**Missing:** Live bid ingestion, real BAFO responses, live vendor scores, real contract terms.
**Evidence basis:** Deterministic AMS scenario seed (Wave 16-19). Named vendors replace generic Alpha/Beta/Gamma/Delta labels.
**Must not claim:** Real vendor bids, live BAFO responses, actual procurement decision, real contract signed.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Apex Retail · Full Demo]                                   |
+-----------------------------------------------------------------------+
| EYEBROW: Source / Events / AMS Outsourcing 2026                       |
| [BAFO Stage] [APX-CDP-2026 badge] [Commercial Readiness: 3/5]         |
+-----------------------------------------------------------------------+
| EVENT COMMERCIAL BRIEF (Nexus)                                         |
| "AMS outsourcing is at BAFO stage with 4 vendors. Northstar and       |
|  BluePeak are shortlisted. 5 risk exceptions need sign-off before     |
|  contract award. Commercial readiness is partial."                    |
| [deterministic caveat]                                                 |
+-----------------------------------------------------------------------+
| 7-TAB MAIN AREA                                                        |
| [Executive Brief] [Pricing] [Vendor Comparison] [Risk]                |
| [BAFO] [Readiness] [Missions]                                          |
+-----------------------------------------------------------------------+
|                                                                        |
| [TAB: Executive Brief — default]                                       |
|  Event purpose, commercial context, decision timeline, buyer intent    |
|  Nexus executive narrative. Tower signals (4). Intelligence signals.   |
|                                                                        |
| [TAB: Pricing]                                                         |
|  Normalized pricing across 4 vendors. Market benchmark. Outlier flags.|
|  Evidence: deterministic seed normalization model.                     |
|                                                                        |
| [TAB: Vendor Comparison]                                               |
|  Northstar / BluePeak / Horizon / Meridian Systems comparison matrix  |
|  Dimensions: price, SLA, delivery, data sovereignty, risk exposure     |
|                                                                        |
| [TAB: Risk]                                                            |
|  5 risk exceptions listed: cost escalation / SLA ambiguity /          |
|  contract term / data sovereignty / transition risk                    |
|  Each: severity, owner, status, linked programme impact                |
|                                                                        |
| [TAB: BAFO]                                                            |
|  BAFO opportunity for Northstar + BluePeak. Evaluation criteria.      |
|  Nexus BAFO recommendation. What to request. Timeline.                 |
|                                                                        |
| [TAB: Readiness]                                                       |
|  Commercial readiness: 3/5 criteria met. 2 blockers listed.           |
|  Steward governance check. What is missing for full readiness.         |
|                                                                        |
| [TAB: Missions]                                                        |
|  5 active missions: Nexus (2) / Sentinel (1) / Atlas (1) / Steward(1) |
|  Each mission: status, evidence basis, next action                     |
|                                                                        |
+-----------------------------------------------------------------------+
| ACTION STRIP                                                           |
| [Request BAFO from Northstar] [Review Risk Exceptions] [Schedule eval] |
+-----------------------------------------------------------------------+
```

## Workflow Sequence
1. User arrives from Source list or programme SourceEventChip
2. User reads event commercial brief (Executive Brief tab, default)
3. User reviews pricing normalization (Pricing tab) — scans outliers
4. User reviews vendor comparison (Vendor Comparison tab) — evaluates Northstar vs BluePeak
5. User reviews 5 risk exceptions (Risk tab) — identifies unresolved items
6. User reviews BAFO opportunity (BAFO tab) — decides whether to issue BAFO
7. User checks commercial readiness (Readiness tab) — confirms blockers
8. User reviews active missions (Missions tab) — sees what agents are doing

**Unlocks next step:** BAFO issued to shortlisted vendors; risk exceptions signed off.
**Blocks progress:** Missing commercial readiness criteria; risk exceptions unresolved; BAFO not yet issued.

## Agent-Centric Requirements
- Nexus brief: "AMS outsourcing is at BAFO stage. Northstar and BluePeak are shortlisted. 5 risk exceptions are open and must be resolved before contract award." Must name vendors and event.
- Context used: AMS scenario seed, pricing model, vendor comparison matrix, risk register, BAFO criteria, commercial readiness checklist, programme link.
- Confidence: "Deterministic seed — AMS outsourcing scenario. Not a live procurement event."
- Missing inputs: Real vendor BAFO responses, live bid data, actual SLA terms.
- Recommended next action: "Issue BAFO to Northstar Systems and BluePeak Technologies. Request SLA clarification from Horizon Advisory."
- 3 choices + custom: On "What should I do next?": (1) Issue BAFO now, (2) Resolve 5 risk exceptions first, (3) Request SLA clarification from all vendors. + Custom.
- Low-context disclosure: If AMS scenario not loaded → "Source event data unavailable. Ensure Wave 16-19 seed is applied."

## Visual Canon
- Warm off-white (#F8F7F4) base
- Georgia serif for event title and commercial brief
- DM Sans for tabs, labels, table content
- No teal, no full-page dark mode, no sparkles, no generic chat-first
- Above fold: event brief + tab bar visible + BAFO/risk count visible in eyebrow
- Tabs are 7 — use compact label tabs, not full-width
- LinkedProgramBadge (APX-CDP-2026) visible in eyebrow strip
- Risk severity indicators: red (high), amber (medium), green (low) — no fake all-green
- Vendor names are specific (Northstar / BluePeak / Horizon / Meridian) — no Alpha/Beta/Gamma/Delta

## Interaction Model
- Tabs: 7 main content tabs (Executive Brief / Pricing / Vendor Comparison / Risk / BAFO / Readiness / Missions)
- Drawers: Evidence basis drawer (click evidence source → drawer); Risk detail drawer (click risk → detail)
- Same-canvas updates: Tab switch updates main content without navigation
- Drilldowns: LinkedProgramBadge → /tenant/[slug]/programs/APX-CDP-2026; Tower signal → /tenant/[slug]/tower
- Empty state: "AMS scenario data not loaded. Apply Wave 16-19 seed."
- Blocked/deferred state: Readiness criteria not met → amber indicator, not fake green

## Acceptance Criteria
- [ ] No generic vendor names (Alpha/Beta/Gamma/Delta) — must be Northstar/BluePeak/Horizon/Meridian Systems
- [ ] LinkedProgramBadge visible linking to APX-CDP-2026
- [ ] Exactly 5 risk exceptions shown on Risk tab
- [ ] BAFO tab shows Northstar and BluePeak as shortlisted
- [ ] Commercial readiness shows 3/5 (partial, not full)
- [ ] 7 tabs present in correct order
- [ ] Nexus brief names the event and stage
- [ ] Deterministic seed caveat visible
- [ ] No claim of real BAFO response or live vendor data
- [ ] Tower/Intelligence signals (4) visible on Executive Brief tab
- [ ] 5 active missions visible on Missions tab

## Route Ownership
- Route file: src/app/(maestro)/source/events/[id]/page.tsx (expected)
- Expected shell: AbarVaAppShell / MaestroChrome
- Expected components: SourceCommercialEventSection, LinkedProgramBadge, CommercialBrief, PricingNormalizationPanel, VendorComparisonMatrix, RiskExceptionList, BAFOPanel, CommercialReadinessPanel, MissionStrip
- Legacy risk: High — SourceCommercialEventSection (Wave 16-19) must use canonical shell
