# Programs Page Blueprint
**Route:** /tenant/[slug]/programs
**Surface:** programs
**Primary user:** Procurement lead / Programme director
**Primary question:** "Which programs are active, where are they in the journey, and what needs action?"
**Primary agent:** Nexus
**Supporting agents:** Sentinel, Steward, Atlas
**Demo data readiness:** rich (Apex Retail — 6 programmes, 5 active, 1 complete, 146 deliverables, 30 rich tier)

## Job-to-be-Done
The Programs page is the portfolio command surface. It gives the lead a structured view across all active AI transformation programmes — showing phase, gate status, evidence readiness, deliverable progress, and what action the programme needs next.

**First 10 seconds:** User sees: (1) how many active programmes exist, (2) which phase each is in, (3) which programmes have gate blockers or pending workshop outcomes, (4) a Nexus portfolio brief summarizing overall portfolio health.

## Data Contract
**Required:** Programme list with phase, gate status, health/evidence readiness score, next workshop date, deliverable count, mission/action count, linked source events.
**Available today:** Apex Retail seed — 6 programmes (Contact Center AI, CDP Activation, Store Associate Productivity, Demand Forecasting, Supply Chain Optimization, Workforce Intelligence). 5 active, 1 complete.
**Missing:** Meridian and Arcturus programme seeds (thin/shell_only). Live gate completion events.
**Evidence/source basis:** deterministic seed from Wave 19 Apex Retail programme set.
**Must not claim:** Live programme state changes, real gate approvals, real stakeholder sign-off.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Apex Retail · Full Demo] [tenant badge]                    |
+-----------------------------------------------------------------------+
| PORTFOLIO HEADER STRIP                                                 |
| 6 Programs  |  5 Active  |  1 Complete  |  146 Deliverables  |  30 Rich|
+-----------------------------------------------------------------------+
| PHASE FILTER BAR: [All] [P1 Discovery] [P2 Design] [P3 Build]         |
|                   [P4 Pilot] [P5 Synthesis] [P6 Complete]              |
+------------------------------------------+----------------------------+
| PROGRAM CARDS GRID (2-col or 3-col)      | NEXUS BRIEF SIDEBAR        |
|                                          |                            |
| [CDP Activation · P5 Synthesis]          | "Portfolio is in active    |
|  Gate: 3 pending | 14 deliverables       |  synthesis phase. CDP      |
|  Evidence: 36% | Workshop 5 upcoming    |  Activation needs your     |
|  [Source: AMS] [Actions: 3]              |  attention for gate sign-  |
|                                          |  off. 3 programmes have    |
| [Contact Center AI · P3 Build]           |  pending next workshops."  |
|  Gate: On track | 22 deliverables        |                            |
|  Evidence: 58% | Workshop 3 complete     | [deterministic caveat]     |
|  [Actions: 1]                            |                            |
|  ...                                     | RECOMMENDED ACTION:        |
|                                          | "Open CDP Activation →     |
|                                          |  review Workshop 5 gate"   |
+------------------------------------------+----------------------------+
```

## Workflow Sequence
1. User lands on Programs — sees portfolio header strip with aggregate counts
2. User reads Nexus brief sidebar — understands which programmes need attention
3. User filters by phase (e.g. P5 Synthesis) to narrow to active decision points
4. User selects programme card — navigates to Programme Detail page
5. User reviews gate blockers, evidence gaps, next workshop — acts

**Unlocks next step:** Programme card shows gate status — click opens Programme Detail.
**Blocks progress:** Thin/shell_only tenants have no programme cards to display; Nexus shows low-context disclosure.

## Agent-Centric Requirements
- Nexus brief: "Your portfolio has [N] active programmes. [Name] is approaching a gate decision." Must name programmes and tenant.
- Context used: all 6 programme seeds, phase/gate state, deliverable counts, mission queue.
- Confidence: "Deterministic seed — Apex Retail. Not live portfolio data."
- Missing inputs: Live gate completion events, real stakeholder sign-off.
- Recommended next action: "Review CDP Activation gate — 3 items pending." Shown as action chip.
- 3 choices + custom: Appears when user clicks "What should I do next?" on a programme card — Nexus offers 3 workshop actions.
- Low-context disclosure: If tenant = meridian/arcturus → "No programme data seeded for [tenant]. Switch to Apex Retail for the full experience."

## Visual Canon
- Warm off-white (#F8F7F4) base (AbarVa design system)
- Georgia serif for programme names and brief headings
- DM Sans for metadata and labels
- Black/ghost button pattern for primary CTAs
- No teal (#14B8A6), no full-page dark mode, no sparkles, no generic chat-first panel
- Phase filter bar: sticky below secondary sub-nav
- Above fold: portfolio header strip + at least 2 programme cards + Nexus brief
- Below fold: remaining programme cards
- Programme cards use consistent height — phase badge, gate indicator, evidence bar, action count

## Interaction Model
- Tabs: Phase filter bar (All / P1-P6) — filters cards in place without navigation
- Drawers: Nexus brief full detail (expand sidebar to full drawer)
- Same-canvas updates: Phase filter updates card grid without page reload
- Drilldowns: Programme card click → /tenant/[slug]/programs/[program-slug]
- Empty state: "No programmes seeded for [tenant]. Viewing Apex Retail requires tenant selection."
- Blocked/deferred state: Programmes with no gate data show "Evidence pending" badge

## Acceptance Criteria
- [ ] No 403 for apex-retail admin user on /tenant/apex-retail/programs
- [ ] Programme cards show phase badge (P1-P6)
- [ ] Evidence coverage percentage visible per programme card
- [ ] Portfolio header strip shows: programme count, active count, deliverable count
- [ ] Nexus brief names the tenant and at least one programme
- [ ] Deterministic seed caveat visible
- [ ] Phase filter bar present and functional
- [ ] CDP Activation card links to correct programme detail route
- [ ] No generic agent guidance ("I can help you with anything")
- [ ] No fake live gate approval

## Route Ownership
- Route file: src/app/(maestro)/tenant/[slug]/programs/page.tsx (expected)
- Expected shell: AbarVaAppShell / MaestroChrome with secondary sub-nav
- Expected components: ProgramPortfolioHeader, ProgramCard, PhaseFilterBar, NexusBriefSidebar, ProgramGrid
- Legacy risk: Medium — check for TopBar.tsx usage on this route; must use canonical shell
