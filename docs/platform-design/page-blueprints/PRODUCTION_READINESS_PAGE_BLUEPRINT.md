# Production Readiness Page Blueprint
**Route:** /platform/admin/production-readiness
**Surface:** admin
**Primary user:** Founder / Platform operator / Steward admin
**Primary question:** "Can we demo, pilot, or productionize AbarVa — and what blocks us?"
**Primary agent:** Steward
**Supporting agents:** Atlas
**Demo data readiness:** rich (PROD8 manifest — Wave 16/17)

## Job-to-be-Done
The Production Readiness page is the definitive platform status surface. It tells the founder exactly where AbarVa stands against three tiers — demo, pilot, production — with specific, evidence-backed blockers for each tier that is not yet reached. It uses the PROD8 manifest as its single source of truth.

**First 10 seconds:** Operator sees: (1) demo readiness: READY, (2) pilot readiness: PARTIAL (2 blockers), (3) production readiness: BLOCKED (5 explicit blockers), (4) what the component readiness table shows, (5) what Steward says needs to happen next.

## Data Contract
**Required:** Demo readiness status, pilot readiness status with specific blockers, production readiness with 5 explicit blockers, component readiness table, test/evidence basis, live status caveat, next five actions.
**Available today:** PROD8 manifest (Wave 16/17):
  - Demo readiness: READY (all routes 200, seed loaded, Vercel deployed)
  - Pilot readiness: PARTIAL — 2 blockers: (1) no real client data pipeline, (2) connector integrations deferred
  - Production readiness: BLOCKED — 5 blockers: (1) no live data ingestion, (2) no production auth hardening, (3) connector integrations not live, (4) governance enforcement deferred, (5) live monitoring not wired
  - Component readiness: multi-row table covering all surfaces and key infrastructure
  - Test evidence: 161+ tests green (Wave 14), route smoke, static manifest
**Missing:** Live GitHub/Vercel polling, real production deployment verification, live monitoring.
**Evidence basis:** PROD8 manifest. Static read model. Not live monitoring.
**Must not claim:** production_ready = true, live monitoring passing, live client data loaded.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Platform Admin] [Production Readiness]                     |
+-----------------------------------------------------------------------+
| STEWARD BRIEF                                                          |
| "AbarVa is demo-ready. Pilot requires 2 blockers resolved.            |
|  Production requires 5 blockers resolved. This is a static manifest — |
|  not live monitoring."                                                 |
| [deterministic caveat — static manifest, not live monitoring]          |
+-----------------------------------------------------------------------+
| READINESS TIER STRIP                                                   |
| [Demo: READY] [Pilot: PARTIAL — 2 blockers] [Prod: BLOCKED — 5]       |
+-----------------------------------------------------------------------+
| PILOT BLOCKERS                                                         |
| [1] No real client data pipeline                                        |
| [2] Connector integrations deferred                                    |
+-----------------------------------------------------------------------+
| PRODUCTION BLOCKERS                                                    |
| [1] No live data ingestion                                             |
| [2] No production auth hardening                                       |
| [3] Connector integrations not live                                    |
| [4] Governance enforcement deferred                                    |
| [5] Live monitoring not wired                                          |
+-----------------------------------------------------------------------+
| COMPONENT READINESS TABLE                                              |
| Component        | Demo | Pilot | Production | Notes                  |
| Programs surface | READY| PARTIAL| BLOCKED   | seed only              |
| Source surface   | READY| PARTIAL| BLOCKED   | AMS scenario only      |
| Intelligence     | READY| PARTIAL| BLOCKED   | deterministic seed     |
| Control Tower    | READY| PARTIAL| BLOCKED   | deterministic seed     |
| Auth (Clerk)     | READY| PARTIAL| BLOCKED   | test users only        |
| Database         | READY| PARTIAL| BLOCKED   | no live ingestion      |
| Connectors       | N/A  | BLOCKED| BLOCKED   | all deferred           |
| Monitoring       | N/A  | BLOCKED| BLOCKED   | deferred               |
+-----------------------------------------------------------------------+
| TEST / EVIDENCE BASIS                                                  |
| 161+ tests green (Wave 14). Route smoke: 16 routes 200.               |
| Static manifest basis. No live CI polling.                             |
+-----------------------------------------------------------------------+
| NEXT FIVE ACTIONS                                                      |
| 1. Configure real client data pipeline for pilot                        |
| 2. Activate at least one connector integration                         |
| 3. Harden Clerk auth for production tenant isolation                  |
| 4. Wire governance enforcement (dataset approval workflow)             |
| 5. Set up live monitoring and alerting                                 |
+-----------------------------------------------------------------------+
```

## Workflow Sequence
1. Operator lands on Production Readiness — reads Steward brief (overall tier status)
2. Operator reviews readiness tier strip — sees demo/pilot/production statuses
3. Operator reviews pilot blockers — understands what is needed for pilot
4. Operator reviews production blockers (5) — understands full production path
5. Operator reviews component readiness table — checks surface-by-surface
6. Operator reads test/evidence basis — verifies evidence basis for claims
7. Operator reads next five actions — prioritizes next steps

**Unlocks next step:** Pilot blockers resolved → pilot readiness becomes READY.
**Blocks progress:** All 5 production blockers must be addressed before production deployment.

## Agent-Centric Requirements
- Steward brief: Specific tier statement: "Demo: READY. Pilot: PARTIAL — 2 blockers. Production: BLOCKED — 5 blockers." Must not claim production_ready without evidence.
- Context used: PROD8 manifest, component readiness table, test suite results, blocker list.
- Confidence: "Static manifest basis — not live monitoring. Claims are based on last manifest update."
- Missing inputs: Live CI status, Vercel deployment polling, live health checks.
- Recommended next action: "Configure real client data pipeline to unblock pilot readiness."
- 3 choices + custom: Not on this page — this is a status surface, not a decision surface.
- Caveat always visible: "This page reflects a static manifest. Live monitoring is deferred."

## Visual Canon
- Warm off-white (#F8F7F4) base
- Georgia serif for Steward brief
- DM Sans for tables, lists, labels
- Tier strip: green (READY), amber (PARTIAL), red (BLOCKED) — honest status
- Component table: green/amber/red per cell
- No fake all-green, no "production_ready" claim without blockers resolved
- No teal, no full-page dark mode, no sparkles
- Above fold: Steward brief + readiness tier strip + pilot blockers
- Production blockers prominent — not hidden below fold

## Interaction Model
- Tabs: None — single page with sections
- Drawers: Blocker detail (click blocker → detail drawer with evidence and resolution path)
- Same-canvas updates: None
- Drilldowns: Component name → relevant surface route; Architecture → /platform/admin/architecture
- Empty state: Not applicable — PROD8 manifest always populates
- Blocked/deferred state: production_ready = false always preserved until blockers resolved

## Acceptance Criteria
- [ ] production_ready is NEVER claimed as true when blockers exist
- [ ] Demo readiness shows as READY
- [ ] Pilot readiness shows exactly 2 blockers
- [ ] Production readiness shows exactly 5 explicit blockers (not vague "N/A")
- [ ] Component readiness table present with at least 8 rows
- [ ] Test evidence basis visible (161+ tests, route smoke count)
- [ ] Next five actions listed
- [ ] Live monitoring NOT claimed as active (must be "deferred")
- [ ] Deterministic/static manifest caveat visible
- [ ] Steward brief present with specific tier statement

## Route Ownership
- Route file: src/app/(maestro)/platform/admin/production-readiness/page.tsx (expected)
- Expected shell: AdminCanonShell + AbarVaAppShell
- Expected components: StewardBrief, ReadinessTierStrip, BlockerList, ComponentReadinessTable, TestEvidenceBasis, NextActionsPanel
- Legacy risk: Low — PROD8 (Wave 17) established this page as the unified readiness control plane
