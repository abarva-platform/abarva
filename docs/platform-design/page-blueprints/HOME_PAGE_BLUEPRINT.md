# Home Page Blueprint
**Route:** /home
**Surface:** home
**Primary user:** Procurement lead / Programme director
**Primary question:** "What needs my attention across AbarVa right now?"
**Primary agent:** Nexus
**Supporting agents:** Sentinel, Steward, Atlas
**Demo data readiness:** thin (no rich home-page seed exists today)

## Job-to-be-Done
The home page is the daily command centre. It surfaces the most urgent items across all surfaces — programmes, source events, intelligence signals — so the user knows where to start without navigating to each surface.

**First 10 seconds:** User should see: (1) how many active programmes need action, (2) whether any commercial events have critical signals, (3) what Nexus recommends doing next.

## Data Contract
**Required:** Active programme list, gate statuses, active source event list, commercial signals, intelligence patterns, active agent missions.
**Available today:** Apex Retail programme seed (6 programmes), AMS source scenario, deterministic intelligence patterns.
**Missing:** Real-time cross-surface aggregation, live signal feed.
**Must not claim:** Live data, real commercial signals, real programme state changes.

## Layout

```
+----------------------------------------------------------+
| AbarVa Nav [tenant badge] [Apex Retail · Full Demo]       |
+----------------------------------------------------------+
| NEXUS BRIEF -- "Here is what needs attention today..."    |
| [deterministic seed caveat]                               |
+--------------------+-------------------------------------+
| TOP PROGRAMMES     | ACTIVE MISSIONS                      |
| [phase + gate]     | [Nexus / Sentinel / Steward / Atlas] |
+--------------------+-------------------------------------+
| SOURCE ALERTS      | INTELLIGENCE PATTERNS                |
| [commercial risk]  | [Sentinel top pattern]               |
+--------------------+-------------------------------------+
| NEXT BEST ACTION [Nexus recommendation]                   |
+----------------------------------------------------------+
```

## Workflow Sequence
1. User lands on home — sees Nexus brief oriented to current portfolio state
2. User reviews top programmes — clicks into programme needing gate action
3. User reviews Source alerts — clicks into commercial event for BAFO follow-up
4. User reviews active missions — understands what agents are working on

**Unlocks next step:** Nexus brief populated with cross-surface data.
**Blocks progress:** No home-page seed currently. Data thin.

## Agent-Centric Requirements
- Nexus brief: "Here is what needs attention across [tenant] today." Must name the tenant and top 1-2 items.
- Context used: programme seeds, source scenario, deterministic signals.
- Confidence: "Deterministic seed — not live portfolio state."
- Missing inputs: live cross-surface aggregation.
- Recommended next action: "Review CDP Activation gate — 3 items pending."
- 3 choices: Not on home page — home is overview, not decision.
- Low-context disclosure: If no programme data → "No programmes seeded for [tenant]. View Apex Retail demo."

## Visual Canon
- Warm off-white (#FBFAF7) base
- Black/navy typography
- Dark-blue accent for active items
- No full-page dark mode
- No teal, no sparkles, no large avatars
- Above fold: Nexus brief + top programmes + top source alert
- Below fold: Intelligence patterns, mission list, next action

## Interaction Model
- Tabs: None at top level — home is a summary view
- Drawers: Mission details (click a mission for detail drawer)
- Same-canvas updates: None — home is static deterministic
- Drilldowns: Programme card → /tenant/[slug]/programs/[slug]; Source alert → /source/events/[id]
- Empty state: "No data seeded for [tenant]. Switch to Apex Retail for demo."
- Blocked/deferred state: Deferred items show with "seed pending" badge

## Acceptance Criteria
- [ ] Nexus brief names the tenant
- [ ] At least one programme with gate status visible
- [ ] At least one source alert or mission visible
- [ ] Deterministic caveat visible
- [ ] No fake live data claim
- [ ] Agent guidance is not generic
- [ ] No 403 for apex-retail admin user

## Route Ownership
- Route file: src/app/(maestro)/home/page.tsx (if exists)
- Expected shell: AbarVaAppShell or MaestroChrome
- Expected components: Nexus brief panel, Programme summary strip, Source alert strip
- Legacy risk: Low (home page appears to be a simple route)
