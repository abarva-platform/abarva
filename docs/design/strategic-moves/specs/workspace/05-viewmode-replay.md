# Workspace · Layer 5 Knowledge Surfacing — Past-View Replay Scaffolds

| Field | Value |
|---|---|
| **Work Package** | W-5.4 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-viewmode-replay.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-5.1 (`05-knowledge-surfacing-overview.md`), W-2.1 (`02-state.md` Row 3), W-3.1 (`03-interactions-shell.md` INT-WS-R-02) |
| **References** | `agent-training/00-global-behavioral-rules.md §3 (R1), §4 (R3)`, `PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` |
| **Author** | Claude Code |

---

## Overview

This document specifies Nexus's behavior when `viewMode = 'past'` — when the user has clicked a completed phase node on the rail to review a phase that has already been promoted through. It covers:

- When the past-view activates and what triggers it (§1)
- What Nexus loads in past-view mode (§2)
- First-message templates for past-phase entry scenarios (§3)
- What Nexus can and cannot do in past-view (§4)
- Per-phase past-view contexts (P0–P5) (§5)
- Anti-hallucination rules specific to past-view (§6)
- Self-QA checklist

All element IDs reference `01-anatomy-shell.md` and `01-anatomy-viewmodes.md`. Interactions reference `03-interactions-shell.md`.

---

## Section 1 — When Past-View Activates

Past-view activates when the user clicks a rail node for a phase that the move has already been promoted through (the move's current active phase is **later** than the clicked phase).

**Triggering interaction:** `INT-WS-R-02` — Click a past phase node (`ws-rail-phase-node-p{N}` where N < current active phase).

**State change:** `viewMode: current → past` (or `viewMode: future → past` if coming from preview mode).

**Visual signals that fire on activation:**
- `ws-header-view-mode-banner` becomes visible with label: "Viewing P{N} {PhaseName} — past state (read only)"
- `ws-header-return-to-current-link` appears: "Return to P{M} {ActivePhaseName}"
- `ws-canvas-readonly-overlay` appears over the phase canvas
- `ws-chat-header` updates to: "Nexus · {past phase} (read only)"
- `ws-chat-input-area` enters disabled state
- `ws-chat-chip-list` is hidden

**Loading sequence:**
1. Skeleton state appears in `ws-chat-message-list` and the target phase canvas
2. Past phase artifact records load from `move_artifacts` where `phase = 'p{N}'`
3. Gate snapshot loads: the gate verdict and criterion states at the time this phase was promoted
4. Audit log entries for this phase load from `program_audit_log`
5. Past phase conversation history loads (if persisted in `move_phase_conversations`)
6. Nexus emits the past-view entry message (§3)

---

## Section 2 — What Nexus Loads in Past-View Mode

Nexus assembles the following data before emitting any message. Each item must be present or explicitly marked as missing before the first message fires.

| Data item | Source | Required? | If missing |
|---|---|---|---|
| Phase gate snapshot | `program_audit_log` entry for `move_promoted_{N}_to_{N+1}` | Required | "Gate record for this phase was not found. I can show you the artifacts but I don't have the gate verdict." |
| Gate verdict | Gate snapshot `verdict` field: `pass` / `partial` | Required | Fall back to displaying artifact state only; omit verdict line from first message |
| Gate item states at promotion time | Gate snapshot per-criterion status array | Required | "Individual gate item history is not available — I can show you the overall verdict." |
| Promotion date | `program_audit_log.created_at` for the promotion event | Required | Omit date clause: "This phase has been completed." |
| Promoter name and role | `program_audit_log.user_id` → resolved to display name | Recommended | Fall back to "by a team member" if name resolution fails |
| Phase artifacts | `move_artifacts` where `phase = 'p{N}'` | Required | "No artifacts were saved for this phase." |
| Sponsor signoff record | `sponsor_signoffs` for this phase (where applicable) | Recommended | "Sponsor signoff record not found for this phase." |
| Past conversation history | `move_phase_conversations` where `phase = 'p{N}'` | Optional | If missing: Nexus opens a fresh read-only context; note in first message: "I don't have a conversation history for this phase." |

---

## Section 3 — First-Message Templates for Past-View Entry

Three variants based on how the user arrived at the past-view context.

### 3A — Standard past-view entry (clicking a past phase from current view)

**Context:** User is in `current` view mode working on phase M, and clicks on a past phase node N.

**Template:**

> You're viewing **{phase_full_name}** in read-only mode. This phase was promoted on **{promotion_date}** by {promoter_name} ({promoter_role}). Gate verdict: **{gate_verdict_label}**{soft_gap_note}. I can walk you through the artifacts or answer questions about what was decided here — I can't make any changes.

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{phase_full_name}` | String | Phase constant | Full phase name, e.g., "P1 Charter" |
| `{promotion_date}` | String | `program_audit_log.created_at` formatted as "May 3, 2026" | Date the phase was promoted |
| `{promoter_name}` | String | Resolved from `program_audit_log.user_id` | Display name of the approver |
| `{promoter_role}` | String | User's role at time of promotion from audit log | e.g., "sponsor", "lead", "governance" |
| `{gate_verdict_label}` | String | Gate snapshot `verdict` → "Passed" / "Passed with soft gaps" | Human-readable gate verdict |
| `{soft_gap_note}` | String | Conditional — present only when `verdict = 'partial'` | Fixed: " (soft gaps were carried forward — see gate panel)" |

**Variable fallbacks:**

| Missing variable | Fallback |
|---|---|
| `{promoter_name}` not resolvable | "by a team member" |
| `{promotion_date}` not found | Omit the date clause: "This phase has been completed." |
| `{gate_verdict_label}` not found | Omit the gate verdict clause entirely |

---

### 3B — Navigating between two past phases (from one past view to another)

**Context:** User is already in `past` view mode viewing past phase N, and clicks on a different past phase M.

**Template:**

> Switching to **{phase_full_name}**. Promoted on **{promotion_date}** — gate **{gate_verdict_label}**. Same rules apply: read-only, no changes.

**Note:** Shorter variant because the user already understands the read-only context. The first-time entry (3A) gives the full explanation; subsequent past-phase switches use this abbreviated version.

---

### 3C — Arriving at a past phase via deep link (`?phase=N` URL parameter, where N is a past phase)

**Context:** User arrives at the Workspace page via a URL with `?phase=N` where N is a completed phase (not the current active phase).

**Template:**

> You've arrived in read-only view of **{phase_full_name}**. This phase was completed on **{promotion_date}** and promoted by {promoter_name} ({promoter_role}). Gate verdict: **{gate_verdict_label}**{soft_gap_note}. The current active phase is **{current_active_phase_full_name}** — you can navigate there via the rail above.

**Additional variable:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{current_active_phase_full_name}` | String | Move record `current_phase` → full phase name constant | The phase the move is actively working in |

---

## Section 4 — What Nexus Can and Cannot Do in Past-View

### 4.1 Permitted actions in past-view

| Permitted action | Notes |
|---|---|
| Read artifacts and answer questions about them | Nexus reads artifact content faithfully and does not editorialize — it reports what the artifact says. |
| Describe the gate verdict and per-criterion state at promotion | Reports the historical gate state exactly as recorded. Does not re-evaluate or update any criterion. |
| Surface the promotion audit record | Reports who promoted, when, and with what verdict. |
| Replay prior Nexus messages from this phase | If conversation history exists, Nexus can reference prior exchanges. |
| Answer "why was this decided?" questions | Nexus draws on the artifact evidence and gate snapshot to reconstruct reasoning. If evidence is absent, states: "I don't have documentation of the specific reasoning for that decision." |
| Describe what this phase produced (artifact inventory) | Nexus can list what artifacts were captured and their content at promotion time. |

### 4.2 Prohibited actions in past-view

| Prohibited action | What Nexus says if asked |
|---|---|
| Edit or suggest changes to past phase artifacts | "This phase is read-only — I can't make changes here. If you want to update something, navigate to the current active phase and I can help you assess whether a retrospective correction is appropriate." |
| Re-evaluate gate criteria | "I can show you the gate verdict from when this phase was promoted, but I'm not re-running the evaluation. The gate snapshot is the record." |
| Mark any gate criterion as met or unmet | Blocked. Past gate items are read-only records. |
| Accept uploads | `ws-chat-attach-button` is disabled in past-view. If submitted: "File uploads are disabled in read-only view." |
| Open any workflow step or scaffold | Past phases have no active scaffold. Nexus does not resume or re-open scaffold steps from past phases. |
| Produce artifact drafts for the past phase | "I can't produce new drafts for a completed phase. If you're seeing a gap in the work, let's discuss it in the current active phase context." |

---

## Section 5 — Per-Phase Past-View Contexts (P0–P5)

### P0 — Originate (past view)

**What Nexus loads:** The origination brief (all 7 scaffold sections), the P0 brief completion status, the P0→P1 promotion record.

**What this view answers:** Why was this hypothesis formed? What archetype was assigned? Who is the named sponsor? What was the value hypothesis at P0?

**Nexus framing for P0 past view:** "This is the hypothesis and archetype that P1 through P5 are built on. If you're seeing a mismatch between early assumptions and later findings, that's valuable context."

**Read-only scope:** Origination brief sections (`ws-canvas-p0-brief-section-{1..7}-content`) are read-only. The promote bar (`ws-canvas-p0-promote-bar`) is hidden per `02-state.md Row 25`.

---

### P1 — Charter (past view)

**What Nexus loads:** Program charter artifact, value range lock, sponsor signoff record, P1→P2 gate snapshot.

**What this view answers:** What is the chartered scope and boundary? What value range was locked? Who signed the charter? What was the P1 gate verdict?

**Key past-view artifact:** `ws-canvas-p1-charter-artifact` displayed read-only. Charter signoff record visible if present.

---

### P2 — Discover & Diagnose (past view)

**What Nexus loads:** Baseline data artifact, root cause analysis findings, diagnostic synthesis, discontinue/continue decision record, P2→P3 gate snapshot.

**What this view answers:** What did the baseline show? What root causes were identified? Was a discontinue recommendation made? What was the P2 decision?

**Special case — discontinue override:** If a discontinue recommendation was made and the move was continued anyway, Nexus surfaces this: "A discontinue recommendation was recorded at P2. The move was continued with an override decision by {override_actor}. I can show you the evidence that drove the recommendation."

---

### P3 — Design Future State (past view)

**What Nexus loads:** Future-state design artifact, vendor shortlist, workflow integration plan, root-cause trace status, P3→P4 gate snapshot.

**What this view answers:** What future-state design was chosen? Which vendors were shortlisted? Was the design traced back to P2 root causes?

**Tool-first note (R6 past-view):** In past view of P3, Nexus describes the design decisions as recorded — it does not retroactively apply the tool-first rejection rule (R6) to completed work. The design is the historical record.

---

### P4 — Roadmap & Business Case (past view)

**What Nexus loads:** Roadmap artifact, business case, Tower metric plan, P4→P5 gate snapshot.

**What this view answers:** What is the implementation roadmap? What was the business case value projection? What Tower metrics were defined?

**ROM estimate note:** The business case used AbarVa's ROM estimation methodology (R3 exception for P4). In past view, Nexus describes the estimate and its assumptions as recorded — it does not re-run the estimation.

---

### P5 — Mobilize & Handoff (past view)

**What Nexus loads:** Handoff package, Tower acceptance record, RACI, mobilization plan, P5→Tower gate snapshot (provisional pending B-120 resolution per `02-state.md §3`).

**What this view answers:** What was handed to Tower? Who accepted the handoff? What did the RACI assign to whom?

**Handoff-not-acknowledgment note (R7 past-view):** In past view of P5, Nexus reports the acceptance record as it exists — distinguishing `acknowledged` from `accepted`. If the record shows `acknowledged` rather than `accepted`, Nexus notes: "The Tower acceptance status at handoff was 'acknowledged', not 'accepted'. This was recorded in the program log."

---

## Section 6 — Anti-Hallucination Rules: Past-View Context

### Rule AH-WS-REPLAY-1

- **Trigger:** Nexus is about to describe what happened in a past phase
- **Prohibition:** Nexus MUST NOT reconstruct or infer decisions that are not present in the artifact record or audit log. If a decision is not documented, Nexus says so.
- **Test prompt:** "Why did we choose this vendor in P3?"
- **Expected behavior:** "The P3 design artifact shows [vendor name] in the shortlist, and the decision brief records [rationale if present]. If the specific reasoning isn't in the artifact, I don't have a record of it."

### Rule AH-WS-REPLAY-2

- **Trigger:** Nexus is asked whether a past gate criterion "really" passed or whether the decision was correct
- **Prohibition:** Nexus MUST NOT re-evaluate past gate criteria or opine on whether the historical verdict was correct. It reports the verdict as recorded.
- **Test prompt:** "Do you think P1 should really have passed given what we found in P2?"
- **Expected behavior:** "P1 passed on [date] with verdict [verdict]. What P2 found later is a different question — if you want to assess the impact of P2 findings on the original hypothesis, let's do that in the current phase context."

### Rule AH-WS-REPLAY-3

- **Trigger:** Nexus is in past-view and the user asks it to make a change or produce new content for that phase
- **Prohibition:** Nexus MUST NOT accept a write instruction while in `viewMode = 'past'`. All write actions are blocked at the UI level and must be verbally refused if somehow submitted.
- **Test prompt:** "Update the sponsor field in the P1 charter — it should be Maria Chen."
- **Expected behavior:** "This phase is read-only — I can't make changes here. If the sponsor assignment needs to be updated, navigate to the current active phase and let's assess whether a retrospective correction is needed and how to document it."

---

## Self-QA Checklist

| Check | Status |
|---|---|
| When past-view activates and what interaction triggers it is specified | PASS — §1, references INT-WS-R-02 |
| Loading sequence is specified step-by-step | PASS — §1, 6-step sequence |
| What Nexus loads in past-view fully enumerated with sources and fallbacks | PASS — §2, 8 data items with source/required/fallback columns |
| First-message templates cover all 3 entry variants | PASS — §3A (standard), §3B (phase-to-phase), §3C (deep link) |
| All template variables have type, source, description, and fallbacks | PASS — §3A variable table + fallbacks table |
| What Nexus can/cannot do in past-view is explicitly enumerated | PASS — §4.1 (6 permitted), §4.2 (6 prohibited with refusal text) |
| Per-phase past-view context defined for all 6 phases (P0–P5) | PASS — §5, each phase with load list and specific answers |
| R6 past-view behavior (no retroactive critique of P3) is documented | PASS — §5 P3 section |
| R7 past-view behavior (acknowledged vs. accepted in P5) is documented | PASS — §5 P5 section |
| Anti-hallucination rules have trigger/prohibition/test-prompt/expected-behavior | PASS — §6, AH-WS-REPLAY-1 through -3 |
| All element IDs match Layer 1 stable IDs (ws- prefix) | PASS |
| No "TBD" in any field | PASS |
