# Program Detail Page Blueprint
**Route:** /tenant/[slug]/programs/[program-slug]
**Surface:** programs
**Primary user:** Procurement lead / Programme director
**Primary question:** "How do we move this program to the next decision/gate?"
**Primary agent:** Nexus
**Supporting agents:** Sentinel, Atlas, Steward
**Demo data readiness:** rich/deterministic for APX-CDP-2026 (Wave 18-19)

## Job-to-be-Done
The Program Detail page is the flagship AbarVa experience. It shows the full programme journey — phases, gates, workshops, deliverables, evidence, actions, and agent guidance — and makes clear what the next decision is and what is needed to reach it.

**First 10 seconds:** User sees: (1) which programme this is (APX-CDP-2026 — CDP Activation), (2) which phase it is in (P5 Synthesis), (3) what gate is pending (3 items outstanding), (4) what Nexus recommends as the next step.

## Data Contract
**Required:** Programme executive brief, phase journey (6 phases), gate status with pending items, workshop outcomes (Workshop 5), deliverables by phase (14 total), evidence coverage (36%), action/mission strip, linked source event badge.
**Available today:** APX-CDP-2026 — Apex Retail CDP Activation. Full deterministic seed from Wave 18-19.
  - 6 phases: Discovery, Design, Build, Pilot, Synthesis, Complete
  - Active phase: P5 Synthesis
  - Gate: 3 items pending (stakeholder sign-off, evidence review, commercial readiness)
  - Workshop 5 outcomes: documented
  - 14 deliverables across phases
  - Evidence coverage: 36% (5 of 14 deliverables with full evidence)
  - Actions: 5 active (Nexus: 2, Sentinel: 1, Atlas: 1, Steward: 1)
  - Linked source event: apex-retail-ams-outsourcing-2026 (AMS outsourcing)
**Missing:** Live stakeholder approvals, real workshop scheduling, live evidence ingestion.
**Evidence basis:** Wave 18-19 deterministic programme seed.
**Must not claim:** Gate approved, real stakeholder sign-off, live programme updates.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Apex Retail · Full Demo]                                   |
+-----------------------------------------------------------------------+
| EYEBROW STRIP: Programs / CDP Activation / APX-CDP-2026               |
| [Apex Retail · P5 Synthesis · Gate: 3 Pending]                        |
+----------------------+------------------------------------------------+
| PHASE JOURNEY RAIL   | MAIN CONTENT                                    |
| (left column)        | (right / primary)                               |
|                      |                                                 |
| P1 Discovery [done]  | PROGRAMME EXECUTIVE BRIEF (Nexus)               |
| P2 Design    [done]  | "CDP Activation is in Synthesis phase.          |
| P3 Build     [done]  |  Workshop 5 outcomes are documented. Gate       |
| P4 Pilot     [done]  |  requires 3 sign-offs before P6."               |
| P5 Synthesis [ACTIVE]| [deterministic caveat]                          |
| P6 Complete  [gate]  |                                                 |
|                      | GATE STATUS PANEL                               |
|                      | [!] Stakeholder sign-off: pending               |
|                      | [!] Evidence review: pending                    |
|                      | [!] Commercial readiness: pending               |
|                      |                                                 |
|                      | WORKSHOP 5 OUTCOMES CANVAS                      |
|                      | [Workshop 5 key decisions, 3 outcomes]          |
|                      |                                                 |
|                      | DELIVERABLES BY PHASE (accordion)               |
|                      | P1: 2/2 complete | P2: 3/3 | P3: 4/4           |
|                      | P4: 3/3 | P5: 2/2 done, 0 pending             |
|                      | Evidence: 5/14 with full evidence (36%)         |
+----------------------+------------------------------------------------+
| ACTION / MISSION STRIP (bottom)                                        |
| [Nexus: Review gate] [Sentinel: Pattern alert] [Atlas: Value signal]   |
| [Steward: Data gap] | [Source: AMS outsourcing chip]                   |
+-----------------------------------------------------------------------+
| CLIENT MAESTRO NEXT ACTION                                             |
| "Schedule gate review with procurement director — 3 items pending"    |
+-----------------------------------------------------------------------+
```

## Workflow Sequence
1. User arrives from Programme list or direct link — sees executive brief and phase position
2. User reviews phase journey rail — understands where programme is in lifecycle
3. User reads gate status panel — sees exactly what is blocking progress to P6
4. User opens Workshop 5 outcomes — reviews what was decided and what remains
5. User reviews deliverables by phase — checks evidence coverage gaps
6. User acts on action strip — clicks Nexus action to review gate items
7. User follows SourceEventChip → Source event page for commercial context

**Unlocks next step:** Gate items addressed; all three sign-offs obtained.
**Blocks progress:** Missing stakeholder sign-off, evidence gaps in P5 deliverables, commercial readiness TBC from Source event.

## Agent-Centric Requirements
- Nexus brief: "CDP Activation is in Synthesis. Gate requires 3 sign-offs. Evidence at 36% — not sufficient for gate passage."
- Context used: programme seed, phase state, gate items, Workshop 5 outcomes, evidence ledger, action queue, Source event link.
- Confidence: "Deterministic seed — APX-CDP-2026. Not live programme state."
- Missing inputs: Stakeholder identity for sign-off, live evidence ingestion.
- Recommended next action: "Schedule gate review. Upload missing evidence for 9 deliverables." Shown as action chip.
- 3 choices + custom: When user clicks "What should I do at the gate?": (1) Request stakeholder sign-off now, (2) Upload outstanding evidence first, (3) Escalate to procurement director. + Custom.
- Low-context disclosure: If programme seed not loaded → "Programme data unavailable. Ensure seed is applied for APX-CDP-2026."

## Visual Canon
- Warm off-white (#F8F7F4) base
- Georgia serif for programme title and brief
- Phase journey rail: left column, compact pill indicators
- Gate status: amber/red indicators for pending items — no fake green
- No teal, no full-page dark mode, no sparkles
- Above fold: eyebrow strip + programme brief + gate status visible
- Below fold: workshop canvas, deliverables accordion, action strip
- SourceEventChip: distinct chip with source icon linking to AMS event

## Interaction Model
- Tabs: None at page level — deliverables use accordion expand by phase
- Drawers: Evidence detail (click evidence bar → drawer showing evidence items); Agent mission detail (click mission chip → drawer)
- Same-canvas updates: Gate status updates inline when items are marked complete (deferred — no live state)
- Drilldowns: Phase rail phase click → scrolls to phase deliverables section; SourceEventChip → /source/events/[id]
- Empty state: Not applicable — APX-CDP-2026 is always seeded
- Blocked/deferred state: Missing evidence shows empty evidence badge with count of gaps

## Acceptance Criteria
- [ ] Programme name visible: "CDP Activation (APX-CDP-2026)"
- [ ] Phase journey rail shows 6 phases, P5 marked as active
- [ ] Gate status shows exactly 3 pending items
- [ ] Gate status NOT shown as approved when items are outstanding
- [ ] Workshop 5 outcomes visible (at least 3 outcomes)
- [ ] Deliverable count shows 14 total across phases
- [ ] Evidence coverage shows 36% (5/14)
- [ ] SourceEventChip present and links to apex-retail-ams-outsourcing-2026
- [ ] Nexus brief names the programme and phase
- [ ] Action strip shows at least Nexus + Sentinel missions
- [ ] Deterministic seed caveat visible
- [ ] No fake "gate approved" state

## Route Ownership
- Route file: src/app/(maestro)/tenant/[slug]/programs/[program-slug]/page.tsx (expected)
- Expected shell: AbarVaAppShell / MaestroChrome with secondary sub-nav and eyebrow strip
- Expected components: ProgramFlagshipPage, PhaseJourneyRail, GateStatusPanel, WorkshopOutcomesCanvas, DeliverablesAccordion, ActionMissionStrip, SourceEventChip, NexusBrief
- Legacy risk: Medium — ProgramFlagshipPage (Wave 18) must be using canonical shell, not TopBar.tsx
