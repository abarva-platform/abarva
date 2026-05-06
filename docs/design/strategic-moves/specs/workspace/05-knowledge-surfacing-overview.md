# Workspace · Layer 5 Knowledge Surfacing Overview

| Field | Value |
|---|---|
| **Work Package** | W-5.1 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-knowledge-surfacing-overview.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-1.1 (`01-anatomy-shell.md`), W-1.3 (`01-anatomy-viewmodes.md`), W-2.1 (`02-state.md`), W-3.1 (`03-interactions-shell.md`) |
| **References** | `agent-training/00-global-behavioral-rules.md`, `agent-training/00-cross-phase-capabilities.md`, `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Author** | Claude Code |

---

## Overview

This document specifies the overall knowledge surfacing contract for Nexus on the Workspace page (`/strategic-moves/[moveId]`). It covers the principles and patterns that apply across ALL phases and ALL view modes, and serves as the index for the full W-5 file suite.

### How Workspace Layer 5 differs from Originate Layer 5

The Originate page (`/strategic-moves/new`) hosts a single phase context: P0. Nexus operates in exactly one mode — forward-working origination — with a fixed 7-step scaffold and a clear start/end. The Originate Layer 5 spec (`../originate/05-knowledge-surfacing.md`) covers one entry variant per entry condition, one chip ladder per scaffold state.

The Workspace page hosts **six phase contexts** (P0 through P5) and **four view modes** (`current` / `past` / `future` / `handed-off`). Nexus's context, capabilities, and first-message scaffolds shift depending on:

1. **Which phase** the user is viewing (P0 through P5, each with distinct artifacts, gate criteria, and coaching objectives)
2. **Which view mode** is active (`current` = full coaching; `past` = read-only replay; `future` = preview-only; `handed-off` = archive view)
3. **Whether the user just navigated** (from a different phase, returning from past/future exploration, or first page load)

This means Workspace Layer 5 is not a single behavioral spec — it is a matrix. The files in W-5 each govern one slice of that matrix.

---

## Section 1 — Common Pattern Loading Principles

### 1.1 Required patterns (load on page open, all phases)

The following patterns load on every Workspace page open, regardless of which phase is active. They establish Nexus's context for the move and are required before any phase-specific guidance is rendered.

| Pattern category | Source | What it establishes |
|---|---|---|
| Move identity context | `strategic_moves` row + `origination_drafts.brief_section_content` | Move title, hypothesis, archetype, sponsor, value hypothesis — the P0 brief that every phase builds on |
| Phase audit trail | `program_audit_log` (all entries for this move) | Complete promotion history, gate verdicts, who approved what, when each phase transitioned |
| Current gate state | `governance.ts` gate criteria evaluation for the active phase | What criteria are met, what is failing, what the gate verdict is |
| Tenant context bundle | AgentContextBroker bundle (tenant key `{tenant_key}`) | Industry patterns, benchmark data, engagement history for this tenant |

**Load sequence:** Move identity and phase audit trail load first (needed to generate the first message). Gate state and tenant context bundle load second (needed for coaching and evidence queries). Nexus does not emit a first message until all four categories have loaded or have returned a definitive error.

**Pattern load failure behavior:** If the move identity fails to load, surface: "Unable to load this Strategic Move. If this persists, contact your administrator." Do not render any phase content. If gate state fails to load, Nexus may still render the canvas and message list but must note: "I couldn't load the gate evaluation for this phase — the gate panel may not reflect current status." Log the failure; do not block the user's read access.

### 1.2 Phase-specific patterns (loaded on phase context activation)

When the user's view context sets to a specific phase (either on page load or via rail navigation), the following phase-specific loading fires.

| Phase | Phase-specific patterns | Source |
|---|---|---|
| P0 | Full origination brief sections (all 7) | `origination_drafts.brief_section_content` |
| P1 | Charter artifact content, sponsor signoff record | `move_artifacts` where `phase = 'p1'` |
| P2 | Baseline data uploads, root cause findings, discontinue recommendation if present | `move_artifacts` where `phase = 'p2'` |
| P3 | Future-state design artifact, vendor shortlist, workflow integration plan | `move_artifacts` where `phase = 'p3'` |
| P4 | Roadmap, business case, Tower metric plan | `move_artifacts` where `phase = 'p4'` |
| P5 | Handoff package, Tower acceptance record, RACI | `move_artifacts` where `phase = 'p5'` |

**On phase switch:** When the user navigates to a different phase via the rail (INT-WS-R-02, INT-WS-R-03), unload the previous phase's pattern bundle and load the target phase's bundle before emitting the first message for that context. See W-5.6 (`05-cross-phase-nav.md`) for the full handoff protocol.

---

## Section 2 — How viewMode Affects Nexus Context

The `viewMode` dimension (from `02-state.md §1`) is the primary modifier of Nexus's behavioral envelope. The four modes produce four distinct operating postures.

### 2.1 `current` — Full coaching mode

**When active:** User is working on the move's active phase. This is the default mode on page load.

**Nexus posture:** Full coaching and artifact generation authority. Nexus can:
- Emit phase-appropriate first messages (W-5.2 per phase)
- Propose artifact drafts and updates
- Evaluate gate criteria and surface gaps
- Run cross-phase capability chains (`ingest` → `synthesize` → `generate_artifacts`)
- Accept file uploads and extract evidence from them
- Surface action chips (W-5.3)

**Chat lane state:** `ws-chat-input-area` enabled. `ws-chat-chip-list` visible with phase-specific chips.

**Identity card:** Shows current active phase short label in `ws-identity-eyebrow`.

### 2.2 `past` — Read-only replay mode

**When active:** User has clicked a completed phase node on the rail (`ws-rail-phase-node-p{N}` where N < current active phase). Governed by INT-WS-R-02.

**Nexus posture:** Read-only replay. Nexus loads the conversation history and artifact state from when that phase was active. It explains what happened, answers historical questions, and surfaces the gate verdict and promotion record. See W-5.4 (`05-viewmode-replay.md`) for the full replay scaffold.

**Nexus CANNOT do in past mode:**
- Suggest changes to past phase artifacts
- Open or continue any scaffold step from that phase
- Surface edit-enabling chips or accept uploads
- Take any mutation action

**Chat lane state:** `ws-chat-input-area` disabled per `02-state.md Row 3`. `ws-chat-chip-list` hidden. Message list shows historical conversation, with a banner indicating read-only status.

**Identity card:** `ws-identity-eyebrow` updates to show the viewed past phase short label. `ws-identity-status-pill` shows "Reviewing Past" supplementary indicator.

### 2.3 `future` — Preview-only mode

**When active:** User has clicked a future phase node on the rail (`ws-rail-phase-node-p{N}` where N > current active phase). Governed by INT-WS-R-03.

**Nexus posture:** Preview and explanation. Nexus explains what the phase involves, what artifacts it will produce, and what gate criteria must be met. See W-5.5 (`05-viewmode-preview.md`) for the full preview scaffold.

**Nexus CANNOT do in future mode:**
- Begin producing artifacts for the future phase (Rule R4 — phase-scope rule)
- Claim any decisions or content from the future phase are determined
- Accept uploads for processing as future-phase evidence
- Mark any future gate criterion as met

**Chat lane state:** `ws-chat-input-area` enabled (user can ask preview questions). `ws-chat-chip-list` hidden.

**Identity card:** `ws-identity-eyebrow` updates to show the previewed future phase short label. `ws-identity-status-pill` shows "Previewing Future" supplementary indicator.

### 2.4 `handed-off` — Archive view mode

**When active:** `moveLifecycle = handed_off` — the move has been completed and handed to Tower.

**Nexus posture:** Archive narration. Nexus can describe what was accomplished across all phases, surface any artifact for review, and answer questions about the program history. All phases are read-only.

**Nexus CANNOT do in handed-off mode:**
- Accept any new inputs as program evidence
- Suggest artifact changes or gate actions
- Enable any write path

**Chat lane state:** `ws-chat-input-area` disabled per `02-state.md Row 5`. Banner (`ws-header-view-mode-banner`) reads: "This move has been handed to Tower."

---

## Section 3 — How Nexus Relates to Rail Clicks (INT-WS-RAIL-*)

Rail interactions are defined in `03-interactions-shell.md`. Layer 5 specifies what Nexus does in response to each rail event.

| Rail interaction | Nexus response | Covered in |
|---|---|---|
| `INT-WS-R-01` — click active phase node (no-op) | No Nexus message. Nexus does not comment on no-op interactions. | n/a |
| `INT-WS-R-02` — click past phase node | Nexus emits the past-view entry message for the clicked phase. Chat lane loads read-only replay. | W-5.4 |
| `INT-WS-R-03` — click future phase node | Nexus emits the future-view preview message for the clicked phase. | W-5.5 |
| `INT-WS-VMB-01` — click "Return to Current" link | Nexus emits the return-to-current message for the active phase (abbreviated return variant). | W-5.6 |
| Rail keyboard navigation (`INT-WS-R-05`) | Same Nexus behavior as the corresponding click interaction. | W-5.4 / W-5.5 |

**Timing rule:** Nexus must not emit its first message for a new phase context until the phase-specific pattern bundle has loaded. A skeleton state is shown in the chat lane during pattern loading. The loading treatment is defined in `03-interactions-loading.md`.

---

## Section 4 — Inherited Global Behavioral Rules

The following rules from `agent-training/00-global-behavioral-rules.md` apply across ALL phases and ALL view modes on the Workspace page. They are not restated per-phase — this is the single point of record for their Workspace application.

| Rule | ID | Workspace application |
|---|---|---|
| Evidence-first rule | R1 | Every factual claim Nexus makes about the move must cite a source: an artifact field, an upload reference, a session capture, or a user-confirmed input. Methodology claims do not need citation. |
| Stay-simple rule | R2 | Default response length is 1–3 sentences. Phase-view first messages may be slightly longer (up to ~5 sentences) given their context-reset purpose. Artifact drafts and gate summaries may be structured lists. No preamble, no closing summaries. |
| No-fabrication rule | R3 | Nexus never invents program-specific data in any phase or view mode. In past-view, Nexus reports only what the artifacts and audit log contain. In future-view, Nexus describes what a phase is designed to produce, not what this specific move will produce. |
| Phase-scope rule | R4 | In `current` view mode, Nexus stays on the active phase. In `future` view mode, Nexus provides a 1-sentence preview of each future phase and redirects to current-phase work when the user asks for substantive help. |
| Discontinue authority rule | R5 | Applies only in P2 `current` view mode. In `past` view of P2, Nexus reports the historical discontinue recommendation if one was made — it does not re-evaluate or re-recommend. |
| Tool-first rejection rule | R6 | Applies only in P3 `current` view mode. In `past` view of P3, Nexus describes the design decisions made — it does not retroactively critique them. |
| Handoff-not-acknowledgment rule | R7 | Applies only in P5 `current` view mode. In `past` view of P5, Nexus reports the acceptance record as recorded — it distinguishes `acknowledged` from `accepted` in historical reporting. |
| No-self-approve-gate rule | R8 | Applies in `current` view mode when gate evaluation runs. In `past` view, gate items are read-only historical records — no new approval logic runs. |

---

## Section 5 — W-5 File Index

| File | Work Package | Covers |
|---|---|---|
| `05-knowledge-surfacing-overview.md` | W-5.1 | This file. Common patterns, viewMode behavior, global rules, file index. |
| `05-first-messages-p0.md` | W-5.2 | First-message scaffold for P0 Originate (current view mode). |
| `05-first-messages-p1.md` | W-5.2 | First-message scaffold for P1 Charter. |
| `05-first-messages-p2.md` | W-5.2 | First-message scaffold for P2 Discover & Diagnose. |
| `05-first-messages-p3.md` | W-5.2 | First-message scaffold for P3 Design Future State. |
| `05-first-messages-p4.md` | W-5.2 | First-message scaffold for P4 Roadmap & Business Case. |
| `05-first-messages-p5.md` | W-5.2 | First-message scaffold for P5 Mobilize & Handoff. |
| `05-chips-all-phases.md` | W-5.3 | Action chip ladders for all phases and state combinations. |
| `05-evidence-rules.md` | W-5.3 | Evidence rules governing what claims Nexus may make per phase. |
| `05-viewmode-replay.md` | W-5.4 | Past-view replay scaffolds — what Nexus loads and says when user navigates to a completed phase. |
| `05-viewmode-preview.md` | W-5.5 | Future-view preview scaffolds — what Nexus shows when user clicks a not-yet-reached phase. |
| `05-cross-phase-nav.md` | W-5.6 | Cross-phase navigation handoff — state preservation and reset on rail navigation. |
| `05-fixtures.md` | W-5.7 | Fixture test scenarios validating correct Nexus behavior across all phases and view modes. |

---

## Self-QA Checklist

| Check | Status |
|---|---|
| Header table complete with all required fields | PASS |
| How Workspace Layer 5 differs from Originate Layer 5 is stated | PASS — Overview explains 1-phase vs. 6-phase + 4-view-mode matrix |
| Common pattern loading principles specify what loads for ALL phases | PASS — §1.1 required patterns, §1.2 phase-specific patterns |
| How each viewMode affects Nexus context is fully specified | PASS — §2.1 through §2.4, each with posture, can/cannot, chat state, identity card |
| How Nexus relates to each rail interaction is specified | PASS — §3, table keyed to INT-WS-R-* IDs |
| Inherited global behavioral rules listed with Workspace-specific application notes | PASS — §4, all 8 rules listed |
| File index covers all W-5.x files | PASS — §5, 13 files listed |
| No element IDs invented — all reference Layer 1 stable IDs | PASS |
| No "TBD" in any field | PASS |
