# Workspace Chip Ladders — Per-Phase Action Chips

| Field | Value |
|---|---|
| **Work Package** | W-5.3 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-chips-all-phases.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-5.2 (first-message scaffolds P0–P5), W-3.1 (`03-interactions-shell.md`), W-1.1 (`01-anatomy-shell.md`) |
| **References** | `02-state.md` (state names), `agent-training/00-global-behavioral-rules.md` |
| **Author** | Claude Code |

---

## Overview

Action chips are suggested interaction buttons that appear in `ws-chat-chip-list` directly below Nexus's first message in the Workspace chat lane. They let the user initiate specific workflow steps or surface specific artifacts without typing.

### How chips work

- Chips are rendered by the `ws-chat-chip-list` element, positioned below the message list and above the chat input in the chat lane.
- Chips are **state-dependent** — the set of visible chips changes based on phase, gate state, artifact completeness, and view mode.
- In `past` and `handed-off` view modes, all chips are hidden (chat lane is read-only per `02-state.md`).
- In `future` view mode, chips are hidden (per W-5.1 §2.3).
- Only `current` view mode renders chips.
- Chips are re-evaluated on every page load and on every state-change event that could affect their `shows_when` conditions.

### Chip stability rules

1. **Stable IDs**: Every chip has a stable `chip_id` in the format `ws-chip-p{N}-{action}`. These IDs are referenced in analytics events and must not change once shipped.
2. **One chip set at a time**: No more than 6 chips are shown simultaneously. If multiple `shows_when` conditions are satisfied, chips are shown in the priority order listed in each phase's table (top row = highest priority).
3. **Gate chip takes precedence**: When the gate-review chip `shows_when` condition is met, it always appears in position 1 of the chip set.
4. **Chip click mechanics**: A chip click fires the action in the `nexus_action` column, which may be a chat message, a panel focus action, an upload flow trigger, or a scroll target. The underlying interaction ID from Layer 3 is referenced in `interaction_id`.
5. **Upload chip**: The upload-evidence chip always maps to `INT-WS-CHAT-03` (the attach button interaction). It is shown when Nexus identifies a missing evidence artifact that requires upload.

---

## P0 — Originate phase chips

The Workspace P0 canvas is a brief-review surface. P0 work happens primarily in the Originate page (`/strategic-moves/new`). When a promoted P0 brief is viewed in the Workspace (rare — it has already been promoted to P1), the chips are minimal.

For the common case of an **active P0 origination in progress** (Workspace hosting a P0 draft view), the following chips apply.

| `chip_id` | Label | `shows_when` | `hides_when` | `interaction_id` | `nexus_action` |
|---|---|---|---|---|---|
| `ws-chip-p0-draft-hypothesis` | Draft hypothesis | P0 step 1 not complete; `GC-P0-1` not met | P0 step 1 complete | `chat-message` | Nexus opens the step P0.1 scaffold conversation: "Let's draft the bet hypothesis. What outcome are you targeting — one sentence?" |
| `ws-chip-p0-classify-archetype` | Classify archetype | P0 step 2 not complete; `GC-P0-2` not met | P0 step 2 complete | `chat-message` | Nexus initiates archetype classification, presenting the classifier output or asking clarifying questions if signal is insufficient. |
| `ws-chip-p0-name-sponsor` | Name a sponsor | P0 step 3 not complete; `GC-P0-3` not met | P0 step 3 complete | `chat-message` | Nexus runs ACL lookup and presents sponsor candidates with evidence citations, per AH-P0-1. |
| `ws-chip-p0-upload-evidence` | Upload a document | Any P0 step in `in-progress` state AND no upload on record | An upload has been submitted | `INT-WS-CHAT-03` | Opens the file attach dialog. After upload, Nexus extracts content and prepopulates the relevant brief section draft. |
| `ws-chip-p0-review-gate` | Review gate criteria | All 5 hard `GC-P0` criteria met OR `gateState = 'partial'` or `'ready'` | `gateState = 'incomplete'` with more than 2 criteria unmet | `chat-message` | Nexus surfaces the gate summary: which criteria pass, which are unmet, and what action closes each gap. |
| `ws-chip-p0-seed-value-hyp` | Seed value hypothesis | P0 step 6 not complete; `GC-P0-4` not met | P0 step 6 complete | `chat-message` | Nexus presents the value lever selection prompt: "Which value levers are most likely here — cost reduction, revenue growth, cycle time, defect reduction, or risk?" |

**Total chips defined: 6 (P0). Not all 6 show simultaneously — state-dependent, maximum 4 visible at once.**

---

## P1 — Charter canvas chips

| `chip_id` | Label | `shows_when` | `hides_when` | `interaction_id` | `nexus_action` |
|---|---|---|---|---|---|
| `ws-chip-p1-confirm-sponsor` | Confirm sponsor commitment | `charter.sponsor_commitment_evidence` is null; `ws-canvas-p1-sponsor-signoff-status = 'not_requested'` | `charter.sponsor_commitment_evidence` is populated | `chat-message` | Nexus asks: "Has [sponsor_candidate_name] formally committed to sponsoring this Move? If yes, how was that confirmed — written email, verbal in a session, or signed charter element?" Per AH-P1-1, does not accept "they're basically in." |
| `ws-chip-p1-map-stakeholders` | Map stakeholders | `ws-canvas-p1-charter-section-2-status != 'complete'` | `ws-canvas-p1-charter-section-2-status = 'complete'` | `chat-message` | Nexus opens the stakeholder mapping conversation: "Who has decision rights, who contributes, and who can block? I'll draft the map from your org data — let's start with who approves scope changes." |
| `ws-chip-p1-lock-metrics` | Lock success metrics | `ws-canvas-p1-charter-section-3-status != 'complete'` AND sponsor commitment is confirmed | `ws-canvas-p1-charter-section-3-status = 'complete'` | `chat-message` | Nexus asks: "What is the primary metric we'll track to determine if this Move succeeded? I'll map it to the P0 hypothesis — and flag if it needs a data source confirmed in P2." |
| `ws-chip-p1-request-signoff` | Request sponsor sign-off | `ws-canvas-p1-sponsor-signoff-status = 'not_requested'` AND all charter sections complete | `ws-canvas-p1-sponsor-signoff-status != 'not_requested'` | `chat-message` | Nexus provides the sign-off request template and instructs: "Click 'Request Signoff' in the sponsor widget, or paste the sponsor's confirmation here and I'll record it." |
| `ws-chip-p1-review-gate` | Review gate criteria | `gateState = 'partial'` or `'ready'` | `gateState = 'incomplete'` with 2+ unmet criteria | `chat-message` | Nexus surfaces the P1 gate summary: 3 criteria, which pass, which unmet, and what closes each. Per §5 of `05-first-messages-p1.md`. |
| `ws-chip-p1-upload-org-chart` | Upload org chart | ACL lookup returned no results AND sponsor commitment not yet confirmed | Sponsor commitment evidence is populated | `INT-WS-CHAT-03` | Opens file attach dialog for org chart upload. After upload, Nexus runs sponsor candidate identification from the chart and presents results. |

**Total chips defined: 6 (P1). Maximum 4 visible simultaneously, gate chip takes position 1 when gate-ready.**

---

## P2 — Discover & Diagnose canvas chips

| `chip_id` | Label | `shows_when` | `hides_when` | `interaction_id` | `nexus_action` |
|---|---|---|---|---|---|
| `ws-chip-p2-capture-baseline` | Capture baseline metric | `ws-canvas-p2-baseline-panel-status = 'not-started'` or `'in-progress'` AND `ws-canvas-p2-baseline-panel-status != 'attested'` | `ws-canvas-p2-baseline-panel-status = 'attested'` | `chat-message` | Nexus asks: "For [primary_success_metric], what is the current value? I'll need: the number, the source system, the extract date, and the time window. Which of these do you have?" Per AH-P2-1. |
| `ws-chip-p2-upload-baseline` | Upload baseline data | `ws-canvas-p2-baseline-panel-status` is `not-started` or `in-progress` AND no uploaded baseline document on record | Baseline upload is on record | `INT-WS-CHAT-03` | Opens file attach dialog. Nexus accepts spreadsheet, CSV, PDF, or document. After upload, extracts baseline metric values and presents for attestation. |
| `ws-chip-p2-analyze-root-cause` | Analyze root causes | `ws-canvas-p2-baseline-panel-status = 'attested'` AND `ws-canvas-p2-rootcause-panel-status != 'complete'` | `ws-canvas-p2-rootcause-panel-status = 'complete'` | `chat-message` | Nexus opens the root cause conversation: "With the baseline confirmed, what is causing [metric] to be at [baseline_value]? Walk me through what happens in the process — I'll help identify the mechanism, not just the symptom." Per AH-P2-4. |
| `ws-chip-p2-assess-data-ready` | Assess data readiness | `ws-canvas-p2-datareadiness-panel-status = 'not-started'` AND baseline is attested | `ws-canvas-p2-datareadiness-panel-status = 'complete'` | `chat-message` | Nexus lists the required data assets for the archetype and asks about access status for each: "For each data asset, is access CONFIRMED, PENDING (awaiting approval), or BLOCKED (no path)?" Per AH-P2-2. |
| `ws-chip-p2-make-decision` | Make continue/discontinue decision | All discovery panels `complete` or `attested` | `ws-canvas-p2-decision-panel-status = 'decided'` | `chat-message` | Nexus reviews the evidence and presents the recommendation (continue or discontinue per R5 authority). If discontinue signals are present, Variant D fires. |
| `ws-chip-p2-review-gate` | Review gate criteria | `gateState = 'partial'` or `'ready'` | `gateState = 'incomplete'` with 3+ unmet criteria | `chat-message` | Nexus surfaces all 5 P2 hard gate criteria, which pass, which are unmet, and the specific action to close each. |

**Total chips defined: 6 (P2). Discontinue-risk state: `ws-chip-p2-make-decision` shows in position 1 and `ws-chip-p2-review-gate` is hidden until the decision is made.**

---

## P3 — Design Future State canvas chips

| `chip_id` | Label | `shows_when` | `hides_when` | `interaction_id` | `nexus_action` |
|---|---|---|---|---|---|
| `ws-chip-p3-trace-root-causes` | Trace root causes | `ws-canvas-p3-rootcause-trace-panel` has at least one untrace item AND `ws-canvas-p3-untrace-warning` is active | All trace items have `traced` or `approved` status | `chat-message` | Nexus opens the trace conversation: "P2 identified [N] root causes. For each one, we need a design element that addresses it. Let's start with the first: [first_untrace_root_cause]. What does the future state do differently to eliminate this root cause?" Per AH-P3-1. |
| `ws-chip-p3-define-op-model` | Define operating model | `ws-canvas-p3-operatingmodel-panel-status = 'not-started'` AND at least 1 trace item is `traced` | `ws-canvas-p3-operatingmodel-panel-status = 'complete'` | `chat-message` | Nexus opens the operating model conversation: "For each role impacted by the design, we need a today→tomorrow statement. Who does this process today — and what changes for them? This must come before we name any tools." Per R6 (AH-P3-2). |
| `ws-chip-p3-define-solution-arch` | Define solution architecture | `ws-canvas-p3-operatingmodel-panel-status` is `in-progress` or `complete` AND `ws-canvas-p3-design-panel-status = 'not-started'` | `ws-canvas-p3-design-panel-status` is `in-progress` or `complete` | `chat-message` | Nexus: "With the operating model shift defined, I can now surface the technology and AI capabilities that enable it. Want me to propose options, or do you have a vendor in mind?" Tool names are acceptable here per R6 §6.3 in `05-first-messages-p3.md`. |
| `ws-chip-p3-request-design-signoff` | Request design sign-off | All 4 P3 panels have content AND `ws-canvas-p3-design-panel-status != 'signed-off'` | `ws-canvas-p3-design-panel-status = 'signed-off'` | `chat-message` | Nexus: "The design, operating model, and risk sections are complete. The next step is sponsor sign-off on the future-state design. Has [sponsor_name] reviewed the design? I can produce a sponsor briefing document." Per AH-P3-3. |
| `ws-chip-p3-upload-evidence` | Upload evidence | Any P3 panel has `in-progress` status AND a document evidence gap is noted | No open evidence gaps | `INT-WS-CHAT-03` | Opens file attach dialog. Accepts process maps, architecture diagrams, stakeholder interview notes. Nexus extracts relevant content after upload. |
| `ws-chip-p3-review-gate` | Review gate criteria | `gateState = 'partial'` or `'ready'` | `gateState = 'incomplete'` with both hard criteria unmet | `chat-message` | Nexus surfaces P3 gate status: 2 hard criteria (design signed off, full root cause trace), 2 soft criteria. Names what is missing and the action that closes each. |

**Total chips defined: 6 (P3). Tool-first risk: `ws-chip-p3-define-op-model` shows in position 1 when a tool name was detected in the session without operating model context (R6 probe).**

---

## P4 — Roadmap & Business Case canvas chips

| `chip_id` | Label | `shows_when` | `hides_when` | `interaction_id` | `nexus_action` |
|---|---|---|---|---|---|
| `ws-chip-p4-build-roadmap` | Build roadmap | `ws-canvas-p4-roadmap-panel-status = 'not-started'` | `ws-canvas-p4-roadmap-panel-status` is `in-progress` or `complete` | `chat-message` | Nexus opens roadmap construction: "P3 produced [N] design elements — each becomes a workstream. I'll draft the roadmap structure. For the first design element, who is the named delivery owner — the individual accountable?" Per AH-P4-2. |
| `ws-chip-p4-define-tower-metrics` | Define Tower metrics | `ws-canvas-p4-towermetric-panel-status = 'not-started'` AND (`ws-canvas-p4-roadmap-panel-status != 'not-started'` OR `ws-canvas-p4-businesscase-panel-status != 'not-started'`) | `ws-canvas-p4-towermetric-panel-status` is `in-progress` or `complete` | `chat-message` | **Tower Metric Plan Authority trigger.** Nexus: "Before we complete the business case, we need to define the Tower metric plan — the measurable signals that confirm this program is succeeding post-handoff. For each value lever, I need: the measurable signal, the data source, the baseline, the target, and the timeline. Which value lever do you want to start with?" Per T-P4 mandatory behavior and AH-P4-3. |
| `ws-chip-p4-build-biz-case` | Build business case | `ws-canvas-p4-roadmap-panel-status` is `in-progress` or `complete` AND `ws-canvas-p4-businesscase-panel-status = 'not-started'` | `ws-canvas-p4-businesscase-panel-status` is `in-progress` or `complete` | `chat-message` | Nexus opens business case construction: "With the roadmap workstreams defined, I can draft the cost model and value plan. Every value claim will anchor to the P2 baseline (`FIN-BASE-P2`). Do you want me to start with the cost model or the value plan?" Per AH-P4-5. |
| `ws-chip-p4-upload-rate-card` | Upload cost data | `ws-canvas-p4-businesscase-panel-status` is `in-progress` AND business case has only ROM estimates | Org-confirmed cost data is uploaded | `INT-WS-CHAT-03` | Opens file attach dialog for rate cards, vendor quotes, or org cost data. After upload, Nexus upgrades ROM lines to `refined` or `confirmed` status. |
| `ws-chip-p4-review-gate` | Review gate criteria | `gateState = 'partial'` or `'ready'` | `gateState = 'incomplete'` with 3+ hard criteria unmet | `chat-message` | Nexus surfaces the P4 gate: 5 hard + 6 soft criteria. If `TOWER-METRICS-P4` is absent, AH-P4-4 fires first and gate review is blocked until the Tower metric plan exists. |
| `ws-chip-p4-sponsor-biz-case` | Get business case approved | `ws-canvas-p4-businesscase-panel-status != 'approved'` AND Tower metric plan is `in-progress` or `complete` | `ws-canvas-p4-businesscase-panel-status = 'approved'` | `chat-message` | Nexus: "The business case is ready for sponsor review. Has [sponsor_name] reviewed it? I need: the sponsor's name, the date, and which sections were reviewed. This is required for GC-P4-2." Per evidence rules — no self-approval of business case sign-off. |

**Total chips defined: 6 (P4). `ws-chip-p4-define-tower-metrics` is the highest-priority chip when Tower metric plan is not started and roadmap or business case work has begun. It appears in position 1 regardless of other chip conditions.**

---

## P5 — Mobilize & Handoff canvas chips

| `chip_id` | Label | `shows_when` | `hides_when` | `interaction_id` | `nexus_action` |
|---|---|---|---|---|---|
| `ws-chip-p5-confirm-team` | Confirm delivery team | `ws-canvas-p5-raci-panel-status != 'complete'` | `ws-canvas-p5-raci-panel-status = 'complete'` | `chat-message` | Nexus walks through the P4 roadmap workstreams: "For each workstream, I need a named delivery lead with confirmed availability. Starting with [first_workstream] — who is the named individual accountable for this workstream?" Per AH-P5-3 (names not roles). |
| `ws-chip-p5-assemble-package` | Assemble handoff package | `ws-canvas-p5-raci-panel-status = 'complete'` AND `ws-canvas-p5-handoffpack-panel-status != 'ready'` | `ws-canvas-p5-handoffpack-panel-status = 'ready'` | `chat-message` | Nexus: "Team assembly is complete. Now we assemble the Tower handoff package — all P0–P4 artifacts verified present, risk register consolidated, open decisions logged. Let me walk through the artifact checklist." Per AH-P5-4. |
| `ws-chip-p5-verify-readiness` | Verify execution readiness | `ws-canvas-p5-handoffpack-panel-status = 'ready'` AND readiness verification not logged | Readiness verification logged for all 3 domains | `chat-message` | Nexus: "Handoff package is assembled. Before Tower acceptance, we confirm three readiness domains: data access (per Tower metric), tooling (per workstream), and change management. Starting with data access — for each Tower metric, is the data source accessible?" |
| `ws-chip-p5-record-acceptance` | Record Tower acceptance | `ws-canvas-p5-tower-acceptance-status` is `submitted` or `acknowledged` | `ws-canvas-p5-tower-acceptance-status = 'accepted'` | `chat-message` | **Handoff-not-Acknowledgment Authority (R7) trigger.** Nexus: "To record Tower acceptance, I need four things: the name of the Tower representative who accepted, their role, the date of confirmation, and their explicit statement that the package is executable as specified. Who confirmed, and what exactly did they say?" Per AH-P5-1. |
| `ws-chip-p5-submit-package` | Submit to Tower | `ws-canvas-p5-handoffpack-panel-status = 'ready'` AND `ws-canvas-p5-tower-acceptance-status = 'not-submitted'` | `ws-canvas-p5-tower-acceptance-status != 'not-submitted'` | `chat-message` | Nexus: "The handoff package is ready to submit. Who is the named Tower receiver — the individual who will review and accept the package? Submitting is not accepting — I'll track acceptance separately." Per R7. |
| `ws-chip-p5-review-gate` | Review gate criteria | `ws-canvas-p5-tower-acceptance-status = 'accepted'` OR all team/package/readiness criteria complete | Gate closed (`moveLifecycle = 'handed_off'`) | `chat-message` | Nexus surfaces P5 gate status: 4 hard criteria (team assembled, package complete, readiness signed, Tower accepted). If `tower_acceptance_confirmed` is not met: AH-P5-5 fires and the gate cannot close. |

**Total chips defined: 6 (P5). `ws-chip-p5-record-acceptance` shows in position 1 when Tower acceptance status is `submitted` or `acknowledged` — R7 enforcement requires this chip to be prominent. `ws-chip-p5-submit-package` hides once the package is submitted, replaced by `ws-chip-p5-record-acceptance`.**

---

## Cross-phase chip state summary

| Phase | Total chips defined | Max simultaneous | Priority chip (shows first) |
|---|---|---|---|
| P0 | 6 | 4 | `ws-chip-p0-review-gate` when gate-ready; `ws-chip-p0-draft-hypothesis` on empty entry |
| P1 | 6 | 4 | `ws-chip-p1-review-gate` when gate-ready; `ws-chip-p1-confirm-sponsor` otherwise |
| P2 | 6 | 4 | `ws-chip-p2-make-decision` when discontinue signals present; `ws-chip-p2-review-gate` when gate-ready |
| P3 | 6 | 4 | `ws-chip-p3-define-op-model` when tool-first risk detected; `ws-chip-p3-review-gate` when gate-ready |
| P4 | 6 | 4 | `ws-chip-p4-define-tower-metrics` when Tower metric plan not started and work has begun |
| P5 | 6 | 4 | `ws-chip-p5-record-acceptance` when acceptance is `submitted` or `acknowledged` |

**Total chips defined across all phases: 36**

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table complete with W-5.3, date 2026-05-05, and correct dependencies | PASS |
| Each phase has exactly 6 chips defined | PASS |
| All chip IDs follow `ws-chip-p{N}-{action}` convention | PASS |
| All `interaction_id` values reference Layer 3 IDs or `chat-message` (which fires as `INT-WS-CHAT-01`) | PASS |
| P4 has a "Define Tower metrics" chip (`ws-chip-p4-define-tower-metrics`) that fires when Tower metric plan is not started | PASS |
| P5 has a "Record Tower acceptance" chip (`ws-chip-p5-record-acceptance`) that fires when status is `submitted` or `acknowledged` | PASS |
| Tower metric chip appears in position 1 (highest priority) at P4 | PASS |
| R7 acceptance chip appears in position 1 (highest priority) at P5 when applicable | PASS |
| All `shows_when` conditions reference stable state fields from `02-state.md` or canvas element IDs from Layer 1 | PASS |
| Upload chips map to `INT-WS-CHAT-03` from `03-interactions-shell.md` | PASS |
| Cross-phase summary table is accurate | PASS |
| No chip contradicts a global behavioral rule (R1–R9) | PASS |

---

## Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — 36 chips across 6 phases, state-dependent show/hide rules, Tower Metric Plan Authority chip at P4, Handoff-not-Acknowledgment chip at P5 | Claude Code |
