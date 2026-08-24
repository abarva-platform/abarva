# Moves Building-Block Spine: P2 → P3 → P4 → P5 → Tower

> Companion to `MOVES_SOLUTION_BUILDING_BLOCKS.md` (the 10 blocks) and `MOVES_ANALYTICS_LAYER_SPEC.md` (the engine). This doc is the phase-flow build spec: how the selected blocks operate *as lanes* across every phase. Validated by the 30-use-case pressure test (`reports/lakeshore-shared-services-usecase-building-block-pressure-test-2026-07-04.md`).

## Product principle

**A Move does not move through phases as one flat document stream. It moves through phases as a set of solution lanes.** The selected solution building blocks create a **spine** that runs through every phase. Each block is a **lane** that (1) shapes the current phase and (2) prepares the next phase.

AbarVa uses building blocks in two ways at every phase:
1. **In-phase guidance** — what to diagnose, design, cost, govern, or measure *right now*.
2. **Feed-forward readiness** — the evidence, decisions, templates, and pre-filled inputs the *next* phase needs. **A phase should never start blank.**

Each block tells AbarVa, per phase: *what to ask for · what to diagnose · what to design · what to cost · who should own it · what Tower should measure.*

## Example Move — Lakeshore Legal Contract Intake & Obligation Control

**Selected building blocks (the bundle):** Process redesign · Data readiness · Workflow automation · Human-in-the-loop AI · Controls / governance · Value tracking.

**Client-facing explanation:** *AbarVa identified the main parts of the solution — improve the intake process, fix missing contract data, automate routing/status, add AI-assisted triage with attorney approval, define controls, and track value through Tower.* Each of those six is a lane that progresses P2 → P3 → P4 → P5 → Tower.

---

## P2 — Understand Current State

**Purpose:** agree on what is happening today, what is broken, and what P3 must design against.

| Building block | What P2 diagnoses | Evidence AbarVa asks for | P3 input created |
|---|---|---|---|
| Process redesign | Where work enters, waits, routes, gets approved, or breaks | Process walkthrough, work queue, cycle time, exception paths | Current workflow with pain points marked |
| Data readiness | Missing fields, source-of-truth gaps, quality, ownership gaps | Required fields, source systems, missing-field analysis, obligation register | Required-field contract + data source-of-truth needs |
| Workflow automation | Manual handoffs, routing gaps, SLA/status gaps | Routing rules, status-inquiry logs, handoff evidence, SLA data | Future routing/status model to design |
| Human-in-the-loop AI | Where judgment, review, override, approval happen | Decision criteria, historical cases, exception history, approval records | Human review checkpoints for design |
| Controls / governance | Privilege, privacy, legal approval, audit, exception handling | Policy rules, approval thresholds, privacy/legal constraints | Control boundaries + approval matrix |
| Value tracking | Baselines and measurable outcomes | Cycle time, aged queue, rework, obligation gaps, status inquiries | Tower metric candidates + baseline needs |

**P2 outputs:** current-state workflow · pain-point map · root-cause candidates · evidence confidence · confirmed current-state truth · **P3 Design Inputs Pack**.
**Client-friendly P2 question:** *Do we agree on what is happening today and what is broken?*

---

## P3 — Choose the Approach / Design the Solution

**Purpose:** choose the practical solution approach before architecture, then design the target way of working.
**Input from P2:** P3 starts **pre-populated** with the P2 Design Inputs Pack. The client does not begin with a blank solution-design page.

| Building block | What P3 designs | Example (Legal Contract Intake) |
|---|---|---|
| Process redesign | Future workflow, roles, handoffs, exception paths | Standard intake → triage → route → review → approval → obligation capture |
| Data readiness | Required data, source of truth, remediation path | Required-field contract, CLM metadata, obligation-owner fields |
| Workflow automation | Routing, SLA/status, notifications, queue movement | CLM routing rules, status updates, aged-queue alerts |
| Human-in-the-loop AI | What AI recommends and where humans approve | AI suggests risk tier & missing info; attorney approves non-standard terms |
| Controls / governance | Approval boundaries, audit trail, privacy/legal constraints | Privilege fence, approval matrix, non-standard-clause escalation |
| Value tracking | What the design must measure | Cycle time, intake completeness, obligation capture, status-inquiry reduction |

**P3 solution options (compare before architecture):**
1. Process-first intake cleanup · 2. CLM-embedded assisted triage & obligation extraction · 3. New cross-system legal workflow/orchestration layer.
**Recommended phase-one:** CLM-embedded assisted triage & obligation extraction.
**Not recommended yet:** fully autonomous contract review or a standalone orchestration layer — unless readiness improves.

**P3 outputs:** Solution Approach Canvas · Target Operating Model · Human + AI Work Split · Control Model · architecture aligned to the selected approach · **P4 Workstream Inputs Pack**.
**Client-friendly P3 question:** *Which solution approach should we use?*

---

## P4 — Build the Plan

**Purpose:** convert the selected approach into a fundable roadmap, value case, risks, and Tower metric plan.
**Input from P3:** the approved P3 solution approach and design.

| Building block | P4 workstream | Example output |
|---|---|---|
| Process redesign | Intake process redesign | Standardize request types, required fields, exception paths |
| Data readiness | Metadata & obligation-data remediation | Clean missing fields, define obligation owner, fix source-of-truth gaps |
| Workflow automation | CLM routing/status configuration | Configure routing rules, SLA states, notifications |
| Human-in-the-loop AI | AI-assisted triage implementation | Build recommendation prompts/models, review queue, override tracking |
| Controls / governance | Approval & audit controls | Legal approval matrix, privacy review, audit-log requirements |
| Value tracking | Tower measurement setup | Baselines, targets, metric owners, review cadence |

**P4 outputs:** roadmap · workstreams · dependencies · cost & effort · value case · risk/readiness review · Tower metric plan · **P5 Mobilization Inputs Pack**.
**Client-friendly P4 question:** *What will we fund, when, and how will value be measured?*

---

## P5 — Prepare to Execute

**Purpose:** turn the approved plan into execution ownership, approvals, launch readiness, and handoff.

| Building block | What P5 confirms |
|---|---|
| Process redesign | Process owner, change lead, training plan |
| Data readiness | Data owner, remediation owner, data-quality acceptance |
| Workflow automation | Platform owner, delivery owner, test plan |
| Human-in-the-loop AI | Human-reviewer role, exception owner, override process |
| Controls / governance | Approver, policy owner, audit owner |
| Value tracking | Tower owner, metric owner, review cadence |

**P5 outputs:** RACI · launch-readiness checklist · approval path · training/change plan · handoff package · Tower acceptance checklist.
**Client-friendly P5 question:** *Who owns what, what approvals are needed, and are we ready to start?*

---

## Tower — Track Outcomes

**Purpose:** track whether the Move produced measurable outcomes after launch.

| Building block | Tower metric group |
|---|---|
| Process redesign | Cycle time, queue age, handoff count |
| Data readiness | Intake completeness, metadata quality, obligation-owner coverage |
| Workflow automation | SLA compliance, routing accuracy, status-inquiry reduction |
| Human-in-the-loop AI | Recommendation acceptance, override rate, review cycle time |
| Controls / governance | Approval compliance, policy exceptions, audit issues |
| Value tracking | Realized savings, productivity, risk reduction, adoption |

**Tower outputs:** measurement contract · outcome ledger · realized-value tracking · adoption tracking · escalation cadence · lessons learned for future Moves.
**Client-friendly Tower question:** *How will we know this worked?*

---

## Required product features (the build)

1. **P2 Evidence Contract** — per Move, AbarVa generates a phase-specific upload guide from function + selected blocks. *(Legal Contract Intake → upload: contract request log, work-queue extract, cycle-time baseline, missing-field analysis, obligation register, systems/data-source list, policy/control rules, current-state review notes.)*
2. **P3 Building-Blocks Canvas** — shows each selected block as a design lane: what P2 found · what must be designed · what options exist · what is phase one · what is later · what is not recommended yet.
3. **P4 Block-to-Workstream Builder** — turns each block into: workstream · owner · dependency · cost/effort · risk · metric.
4. **P5 Owner / RACI Builder** — maps each block to: business owner · IT owner · reviewer · approver · operator · measurement owner.
5. **Tower Metric Contract** — maps each block to: baseline · target · formula · data owner · review cadence · escalation rule.

**Priority for the demo: features 1–3.**

## Core rule

**A phase should never start blank.** Each phase inherits the prior phase's approved findings and carries the building-block lanes forward. Every phase-boundary produces an **Inputs Pack** for the next phase (P2→P3 Design Inputs, P3→P4 Workstream Inputs, P4→P5 Mobilization Inputs). This is the "next-phase readiness pack" made specific — the lanes are what pre-populate it.

## Client-friendly summary

AbarVa looks at the current-state evidence and identifies what kinds of changes are needed — process, data, workflow, AI assistance, controls, platform work, and measurement. It uses those lanes to help the team diagnose the current state, choose a practical solution, build the plan, assign owners, and track outcomes.

## What this means for engineering (build priorities)

From the pressure test, in order: **1) P2 Evidence Contract · 2) P3 Building-Blocks Canvas · 3) P4 Block-to-Workstream Builder · 4) P5 Owner/RACI Builder · 5) Tower Metric Contract.** The first three matter most for the demo. These are produced by the `src/lib/programs/analytics/` layer (`MOVES_ANALYTICS_LAYER_SPEC.md`): each phase extractor emits the current-phase findings **and** the next-phase Inputs Pack, keyed by block.

## What this means for the Lakeshore demo (narration)

> *AbarVa does not start every phase from scratch. It carries forward the solution lanes. In P2, those lanes tell us what evidence to collect. In P3, they tell us what to design. In P4, they become workstreams and value metrics. In P5, they become owners. In Tower, they become the measurement contract.*
