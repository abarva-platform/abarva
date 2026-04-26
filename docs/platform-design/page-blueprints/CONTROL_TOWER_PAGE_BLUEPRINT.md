# Control Tower Page Blueprint
**Route:** /tenant/[slug]/tower
**Surface:** control_tower
**Primary user:** Executive / Programme sponsor / CTO / CFO
**Primary question:** "Are AI investments creating enterprise value, scaling safely, and improving work?"
**Primary agent:** Atlas
**Supporting agents:** Nexus, Sentinel
**Demo data readiness:** deterministic_only (same seed for all tenants — Wave 2 seed)

## Job-to-be-Done
The Control Tower page is Atlas's executive briefing surface. It gives the executive a structured, evidence-backed view of AI investment health across portfolio, adoption, value, risk, cost, and productivity dimensions. It is a read-and-decide surface — not a chat interface. The executive should come away knowing whether investments are on track and what the top 3 pressure points are.

**First 10 seconds:** User sees: (1) Atlas executive brief naming the current portfolio value question, (2) top 5 scorecard metrics (portfolio / adoption / value / risk / cost), (3) top 3 pressure cards requiring attention, (4) clear lens tabs for deeper analysis.

## Data Contract
**Required:** Atlas executive brief, portfolio scorecard, adoption scorecard, value scorecard, risk scorecard, cost scorecard, productivity indicators, pressure cards (max 3), lens mode content for each of 6 tabs, Tech/Data Readiness tab.
**Available today:** Deterministic Wave 2 seed:
  - Portfolio: 6 programmes (Apex Retail), 5 active, coverage data
  - Adoption: deterministic adoption rate signals
  - Value: deterministic value realization indicators
  - Risk: deterministic risk exposure signals
  - Cost: deterministic cost-consumption signals (Wave 2 ACT11)
  - Productivity: deterministic productivity indicators
  - Pressure cards: evidence gap, cost anomaly, SLA risk (max 3)
**Missing:** Live AI tool telemetry, real adoption metrics, live DORA signals, live cost ingestion.
**Evidence basis:** Deterministic Wave 2 seed. Not tenant-specific in this release.
**Must not claim:** Live AI ROI, real adoption metrics, live cost data, real productivity measurement.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Apex Retail · Full Demo]                                   |
+-----------------------------------------------------------------------+
| ATLAS EXECUTIVE BRIEF                                                  |
| "Are AI investments in CDP Activation creating measurable value?       |
|  Portfolio adoption is 62% of target. Cost consumption is within      |
|  plan. Top pressure: evidence gap in P5 gate. Risk: SLA exposure      |
|  in AMS sourcing event."                                               |
| [deterministic seed caveat — not live AI telemetry]                   |
+-----------------------------------------------------------------------+
| SCORECARD STRIP (max 5 scorecards)                                     |
| [Portfolio: 5/6] [Adoption: 62%] [Value: partial] [Risk: amber]       |
| [Cost: on plan]                                                        |
+-----------------------------------------------------------------------+
| PRESSURE CARDS (max 3)                                                 |
| [!] Evidence gap — CDP P5 gate needs 9 deliverables                   |
| [!] SLA risk — AMS outsourcing unresolved SLA exception                |
| [!] Adoption gap — Store Associate Productivity below target           |
+-----------------------------------------------------------------------+
| LENS TABS                                                              |
| [Portfolio] [Adoption] [Value] [Risk] [Cost] [Productivity]           |
| [Tech/Data Readiness]                                                  |
+-----------------------------------------------------------------------+
|                                                                        |
| [TAB: Portfolio — default]                                             |
|  6 programmes overview. Phase distribution. Gate status overview.      |
|  Programme health summary.                                             |
|                                                                        |
| [TAB: Adoption]                                                        |
|  AI tool adoption by programme and team. Deterministic rates.          |
|  Gap vs target. Recommended adoption actions.                          |
|                                                                        |
| [TAB: Value]                                                           |
|  Value realization indicators. What is measurable vs deferred.         |
|  No fake ROI claims. Evidence basis stated.                            |
|                                                                        |
| [TAB: Risk]                                                            |
|  Risk exposure by programme and source event. SLA, cost, data.        |
|  Atlas risk narrative. Actions to reduce exposure.                     |
|                                                                        |
| [TAB: Cost]                                                            |
|  AI cost consumption signals (Wave 2 ACT11/ACT12).                    |
|  Tool waste signals. Cost vs budget. Deterministic only.               |
|                                                                        |
| [TAB: Productivity]                                                    |
|  AI productivity impact indicators. Work improvement signals.          |
|  DORA indicators (deferred — not live).                                |
|                                                                        |
| [TAB: Tech/Data Readiness]                                             |
|  Data readiness tier per surface. Connector status. Architecture       |
|  readiness. Links to Admin Architecture page.                          |
|                                                                        |
+-----------------------------------------------------------------------+
| ASK ATLAS DRAWER (hidden by default — secondary affordance)            |
| [Ask Atlas] button → opens drawer; NOT the hero of the page           |
+-----------------------------------------------------------------------+
```

## Workflow Sequence
1. User lands on Control Tower — reads Atlas executive brief (specific value question)
2. User scans 5 scorecards — understands portfolio health at a glance
3. User reads 3 pressure cards — identifies top action items
4. User selects lens tab (e.g., Risk) — drills into risk landscape
5. User follows pressure card action → navigates to programme or source event
6. (Optional) User opens Ask Atlas drawer for deeper interrogation

**Unlocks next step:** Pressure card identified → navigate to relevant programme or source event.
**Blocks progress:** Live AI telemetry not wired — all signals are deterministic seed.

## Agent-Centric Requirements
- Atlas brief: "Are AI investments in [specific area] creating value?" Must name a specific value question, not generic. E.g., "Are AI investments in CDP Activation and Contact Center AI creating measurable value against Apex Retail's FY26 transformation targets?"
- Context used: Wave 2 deterministic scorecard seed, programme seed, source scenario, risk signals.
- Confidence: "Deterministic seed — not live AI telemetry. Signals are fixed until live ingestion is wired."
- Missing inputs: Live AI tool usage data, real adoption metrics, live cost ingestion, DORA pipeline.
- Recommended next action: "Address evidence gap in CDP Activation P5 — gate is at risk."
- 3 choices + custom: Via Ask Atlas drawer, not on main page hero.
- "Ask Atlas" is a DRAWER: must not be the main page affordance. Main page = scorecards + pressures + lens tabs.
- Low-context disclosure: Deterministic caveat always visible. "These signals are seed-based, not live enterprise metrics."

## Visual Canon
- Warm off-white (#F8F7F4) base
- Georgia serif for Atlas brief
- DM Sans for scorecards, lens tabs, pressure cards
- Atlas identity: dark-blue/navy badge
- No teal, no full-page dark mode, no sparkles
- "Ask Atlas" is a drawer button (bottom right or secondary nav) — NOT the page hero
- Scorecards: max 5 — horizontal strip
- Pressure cards: max 3 — amber/red indicators, not fake green
- Above fold: Atlas brief + scorecard strip + pressure cards
- Lens tabs below fold or sticky above canvas

## Interaction Model
- Tabs: 7 lens tabs (Portfolio / Adoption / Value / Risk / Cost / Productivity / Tech/Data Readiness)
- Drawers: Ask Atlas (hidden by default — button trigger); Pressure card detail (click pressure card)
- Same-canvas updates: Lens tab switch updates canvas content
- Drilldowns: Pressure card → programme or source event; Tech readiness → /platform/admin/architecture
- Empty state: Not applicable — deterministic seed always produces data
- Blocked/deferred state: Live signals → "Live telemetry deferred. Showing deterministic seed."

## Acceptance Criteria
- [ ] Atlas brief names a specific value question (not generic)
- [ ] Atlas brief mentions a specific programme or investment area
- [ ] Max 5 scorecards visible in scorecard strip
- [ ] Max 3 pressure cards visible
- [ ] 7 lens tabs present
- [ ] "Ask Atlas" is a DRAWER, not the main page affordance
- [ ] Deterministic seed caveat visible
- [ ] No fake live AI ROI claim
- [ ] No fake "all green" scorecard when issues are present
- [ ] At least one pressure card links to a programme or source event

## Route Ownership
- Route file: src/app/(maestro)/tenant/[slug]/tower/page.tsx (expected)
- Expected shell: TowerRouteShell (Wave 20 SHELL7) + AbarVaAppShell
- Expected components: AtlasExecutiveBrief, ScorecardStrip, PressureCards, LensTabs, LensCanvas, AskAtlasDrawer
- Legacy risk: Medium — verify TowerRouteShell from Wave 20 is mounted; no TopBar.tsx
