# Intelligence Page Blueprint
**Route:** /tenant/[slug]/intelligence
**Surface:** intelligence
**Primary user:** Procurement lead / Programme director / Executive
**Primary question:** "What patterns, risks, evidence gaps, and opportunities is Sentinel detecting — and what should we do next?"
**Primary agent:** Sentinel
**Supporting agents:** Nexus, Atlas
**Demo data readiness:** deterministic_only (same output for any tenant — Wave 2 seed)

## Job-to-be-Done
The Intelligence page is Sentinel's command surface. It shows the patterns Sentinel has detected across programmes, source events, and commercial signals — and recommends the next evidence-gathering or governance action for each pattern. This is a read-and-act surface, not a chat interface.

**First 10 seconds:** User sees: (1) how many patterns Sentinel has detected, (2) the top pattern with severity and affected area, (3) what Sentinel recommends for the most critical pattern, (4) what evidence or data is available to support each signal.

## Data Contract
**Required:** Sentinel brief, active pattern list with severity/type/affected area, insight canvas with mode switching, evidence/source basis per pattern, affected programmes/source events, recommended next action per pattern.
**Available today:** Deterministic intelligence patterns (Wave 2 seed):
  - Pattern types: evidence gap, cost anomaly, SLA risk, market benchmark signal, adoption risk
  - Affected programmes: APX-CDP-2026 and others (deterministic)
  - Evidence basis: seed-only — no live signal ingestion
**Missing:** Live signal ingestion, real-time pattern detection, live evidence stream.
**Evidence basis:** Deterministic Wave 2 seed. Same output regardless of tenant (thin/shell_only tenants same as rich).
**Must not claim:** Live Sentinel analysis, real signal detection, real evidence collection.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Apex Retail · Full Demo]                                   |
+-----------------------------------------------------------------------+
| SENTINEL BRIEF                                                         |
| "Sentinel has detected 5 patterns across your portfolio. Top signal:  |
|  Evidence gap in CDP Activation (P5) — 9 deliverables without         |
|  full evidence. Recommend: evidence upload campaign before gate."      |
| [deterministic seed caveat — not live signal detection]                |
+-----------------------------------------------------------------------+
| ACTIVE PATTERN STRIP                                                   |
| [Evidence Gap · High · CDP] [Cost Anomaly · Med · AMS] [SLA Risk · Med]|
| [Market Benchmark · Low] [Adoption Risk · Med]                         |
+-----------------------------------------------------------------------+
| INSIGHT CANVAS MODE TABS                                               |
| [Summary] [Evidence] [Programs] [Actions] [Signals]                   |
+-----------------------------------------------------------------------+
|                                                                        |
| [MODE: Summary — default]                                              |
|  Sentinel narrative across all 5 patterns. What is detected.           |
|  What evidence supports each. What confidence level.                   |
|                                                                        |
| [MODE: Evidence]                                                       |
|  Evidence dataset drawer. Which deliverables have evidence.            |
|  Which source events have commercial evidence.                          |
|  Evidence basis: deterministic only.                                   |
|                                                                        |
| [MODE: Programs]                                                       |
|  Patterns mapped to programmes. Severity per programme.               |
|  Click programme → drilldown to programme detail.                     |
|                                                                        |
| [MODE: Actions]                                                        |
|  Recommended actions per pattern. Priority-ordered.                   |
|  Each action has: what, why, evidence basis, urgency.                  |
|                                                                        |
| [MODE: Signals]                                                        |
|  Raw signal list from seed data. Each: type, source, date, value.     |
|  Distinction: signals are seed-based, not live telemetry.              |
|                                                                        |
+-----------------------------------------------------------------------+
| EVIDENCE/SOURCE BASIS DRAWER (hidden by default)                       |
| [Open: View Evidence Basis] → shows which seed data underpins each    |
|  pattern.                                                              |
+-----------------------------------------------------------------------+
```

## Workflow Sequence
1. User lands on Intelligence — reads Sentinel brief (top pattern highlighted)
2. User reviews active pattern strip — selects pattern of interest
3. User reads insight canvas (Summary mode, default) — understands all patterns
4. User switches to Evidence mode — reviews which deliverables have evidence gaps
5. User switches to Programs mode — sees which programmes are affected
6. User switches to Actions mode — gets priority-ordered action list
7. User follows recommended action → navigates to programme or source event
8. User opens evidence basis drawer to verify data sources

**Unlocks next step:** Evidence gaps identified → navigate to Programme Detail to upload evidence.
**Blocks progress:** Live signal ingestion not available — patterns are deterministic seed only.

## Agent-Centric Requirements
- Sentinel brief: "Sentinel has detected [N] patterns. Top pattern: [name] affecting [programme/area]. Confidence: seed-based, not live." Must be specific, not generic.
- Context used: Wave 2 deterministic pattern seed, programme seed, source scenario, evidence ledger state.
- Confidence: "Deterministic seed — not live signal detection. Patterns are fixed until live ingestion is wired."
- Missing inputs: Live signal stream, real evidence ingestion, live programme state.
- Recommended next action per pattern: "Upload evidence for 9 CDP Activation deliverables before gate review."
- 3 choices + custom: In Actions mode per pattern: (1) Address highest-severity gap first, (2) Escalate cost anomaly to commercial team, (3) Defer SLA risk review to post-gate. + Custom.
- Low-context disclosure for thin tenants: "Sentinel patterns are deterministic and not tenant-specific in this release. All tenants see the same seed patterns. Live tenant-specific patterns require live signal ingestion."

## Visual Canon
- Warm off-white (#F8F7F4) base
- Georgia serif for Sentinel brief
- DM Sans for pattern labels, canvas content
- Sentinel identity: navy badge, no teal
- No full-page dark mode, no sparkles
- "Ask Sentinel" must NOT be the primary affordance — it is a drawer, hidden by default
- Above fold: Sentinel brief + active pattern strip + mode tabs
- Below fold: insight canvas content (depends on mode)
- Pattern severity indicators: red (high), amber (medium), blue (low) — no fake all-green

## Interaction Model
- Tabs: 5 mode tabs (Summary / Evidence / Programs / Actions / Signals) — switch canvas content
- Drawers: Evidence basis drawer (secondary affordance, not primary); "Ask Sentinel" drawer (hidden by default — accessible via button, not the page hero)
- Same-canvas updates: Mode tab switch updates canvas content without navigation
- Drilldowns: Pattern → programme detail; Programme chip → /tenant/[slug]/programs/[slug]
- Empty state: Not applicable — deterministic seed always produces patterns
- Blocked/deferred state: Live signals deferred → "Live signal ingestion deferred. Showing seed patterns."

## Acceptance Criteria
- [ ] Sentinel brief visible naming top pattern and affected area
- [ ] Deterministic seed caveat visible (not "live Sentinel analysis")
- [ ] Active pattern strip shows at least 5 patterns
- [ ] 5 mode tabs present (Summary / Evidence / Programs / Actions / Signals)
- [ ] "Ask Sentinel" is NOT the primary affordance — must be a secondary drawer
- [ ] No generic agent panel ("I can help you with anything")
- [ ] Evidence mode shows evidence gap count for CDP Activation
- [ ] Actions mode shows priority-ordered action list
- [ ] At least one pattern links to a programme

## Route Ownership
- Route file: src/app/(maestro)/tenant/[slug]/intelligence/page.tsx (expected)
- Expected shell: IntelligenceRouteShell (Wave 20 SHELL7) + AbarVaAppShell
- Expected components: SentinelBrief, ActivePatternStrip, InsightCanvasModeBar, InsightCanvas, EvidenceSourceBasisDrawer, AskSentinelDrawer
- Legacy risk: Medium — verify IntelligenceRouteShell from Wave 20 is mounted; no TopBar.tsx
