# Workspace · Layer 5 Knowledge Surfacing — Future-View Preview Scaffolds

| Field | Value |
|---|---|
| **Work Package** | W-5.5 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-viewmode-preview.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-5.1 (`05-knowledge-surfacing-overview.md`), W-2.1 (`02-state.md` Row 4), W-3.1 (`03-interactions-shell.md` INT-WS-R-03) |
| **References** | `agent-training/00-global-behavioral-rules.md §5 (R4)`, `PHASE_MODEL_V2_DOCTRINE.md` |
| **Author** | Claude Code |

---

## Overview

This document specifies Nexus's behavior when `viewMode = 'future'` — when the user has clicked a future phase node on the rail to preview a phase the move has not yet reached. It covers:

- When future-view activates and what triggers it (§1)
- What Nexus loads in future-view mode (§2)
- First-message templates for future phase entry scenarios (§3)
- The R4 "1-sentence preview + redirect" pattern and when it fires (§4)
- What Nexus can and cannot do in future-view (§5)
- Per-phase preview contexts (P1–P5) (§6)
- Anti-hallucination rules specific to future-view (§7)
- Self-QA checklist

All element IDs reference `01-anatomy-shell.md` and `01-anatomy-viewmodes.md`. Interactions reference `03-interactions-shell.md`.

---

## Section 1 — When Future-View Activates

Future-view activates when the user clicks a rail node for a phase the move has NOT yet reached (the clicked phase number is greater than the move's current active phase number).

**Triggering interaction:** `INT-WS-R-03` — Click a future phase node (`ws-rail-phase-node-p{N}` where N > current active phase).

**State change:** `viewMode: current → future` (or `viewMode: past → future` if coming from replay mode).

**Visual signals that fire on activation:**
- `ws-header-view-mode-banner` becomes visible with label: "Previewing P{N} {PhaseName} — not yet reached"
- `ws-header-return-to-current-link` appears: "Return to P{M} {ActivePhaseName}"
- `ws-canvas-readonly-overlay` does NOT appear — future mode shows preview content, not a read-only historical record
- `ws-chat-header` updates to: "Nexus · {future phase} (preview)"
- `ws-chat-input-area` remains **enabled** — user can ask Nexus preview questions
- `ws-chat-chip-list` is hidden

**Key distinction from past-view:** The chat lane stays interactive in future-view. The user can ask "what will this phase involve?" and Nexus answers. No mutations are possible, but the conversation channel is open.

**Loading sequence:**
1. Skeleton state appears in the target phase canvas while loading
2. Phase doctrine content loads from the phase model (static — from the phase description constants)
3. Gate criteria for the target future phase load from `governance.ts` (read-only display)
4. Current phase evidence summary loads (for context: what has been captured so far)
5. Nexus emits the future-view entry message (§3)

---

## Section 2 — What Nexus Loads in Future-View Mode

Future-view is populated from **doctrine and gate criteria**, not from move-specific artifacts (which do not yet exist). Nexus also loads a summary of current phase evidence to frame what groundwork has been laid.

| Data item | Source | Required? | Notes |
|---|---|---|---|
| Future phase description | `PHASE_MODEL_V2_DOCTRINE.md` phase description for P{N} | Required | What the phase is, its objective, its outputs |
| Future phase gate criteria | `governance.ts` gate rules for P{N}→P{N+1} | Required | What must be achieved to exit this phase |
| Artifact types this phase produces | Phase doctrine artifact inventory per phase | Required | What deliverables the phase generates (names only; content is never invented) |
| Current active phase summary | Move's current artifact state — key populated fields | Recommended | Context for "what foundation exists for this future phase" |
| Typical time/effort for this phase | `PHASE_MODEL_V2_DOCTRINE.md` phase parameters (if present) | Optional | Surfaced only if explicitly asked |

**What Nexus does NOT load in future-view:**
- Any move-specific artifacts for the future phase (none exist yet — inventing them violates R3)
- Any stakeholder names or decisions that would "belong" to the future phase
- Pattern-matched evidence positioned as if it were the future phase's output

---

## Section 3 — First-Message Templates for Future-View Entry

Two variants: first-time click on a future phase, and navigation from one future phase to another.

### 3A — Standard future-view entry (first click on a future phase)

**Context:** User is in `current` view mode working on phase M, and clicks a future phase node N (where N > M).

**Template:**

> You're previewing **{phase_full_name}** — this phase hasn't started yet. {phase_one_sentence_description} It will produce: {artifact_list}. To exit this phase, the gate requires: {gate_criteria_summary}. {current_phase_bridge} You can ask me anything about what this phase involves.

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{phase_full_name}` | String | Phase constant | Full phase name, e.g., "P3 Design Future State" |
| `{phase_one_sentence_description}` | String | Phase doctrine objective — see static lookup below | One sentence capturing the phase's purpose |
| `{artifact_list}` | String | Phase doctrine artifact inventory — see static lookup below | Comma-separated list of artifact names (maximum 4) |
| `{gate_criteria_summary}` | String | `governance.ts` gate criteria — hard criteria only | Up to 3 hard gate criteria stated concisely |
| `{current_phase_bridge}` | String | Conditional — present when N = M+1 (immediately next phase) | Fixed: "The work you're doing now in {current_phase_short_name} directly feeds into this." Omitted when N > M+1. |

**Phase one-sentence descriptions (static lookup):**

| Phase | One-sentence description |
|---|---|
| P1 | It locks the program scope, names the sponsor, and sets the value target that all later work must validate. |
| P2 | It gathers baseline evidence, identifies root causes, and decides whether the hypothesis is worth designing a solution for. |
| P3 | It designs the operating-model change and determines what technology and organizational shifts are required to realize the hypothesis. |
| P4 | It sequences the implementation, prices the investment, and produces the business case for final approval. |
| P5 | It prepares the execution team to take ownership and formally hands the program to Tower for delivery. |

**Artifact inventory by phase (static lookup):**

| Phase | Artifacts (for template) |
|---|---|
| P1 | Program Charter, Value Range Lock, Sponsor Signoff Record |
| P2 | Baseline Analysis, Root Cause Findings, Diagnostic Synthesis, Continue/Discontinue Decision Record |
| P3 | Future-State Design Document, Workflow Integration Plan, Vendor Shortlist, Root Cause Trace |
| P4 | Implementation Roadmap, Business Case, Tower Metric Plan |
| P5 | Handoff Package, RACI, Tower Acceptance Record, Mobilization Plan |

---

### 3B — Navigating between two future phases

**Context:** User is already in `future` view mode (previewing future phase N), and clicks a different future phase M.

**Template:**

> Now previewing **{phase_full_name}**. {phase_one_sentence_description} Gate requires: {gate_criteria_summary}. Ask me anything about this phase.

**Note:** Shorter variant because the user understands the preview context. "Ask me anything about this phase" confirms the chat is still interactive.

---

## Section 4 — The R4 "1-Sentence Preview + Redirect" Pattern

Rule R4 (phase-scope rule, `00-global-behavioral-rules.md §5`) states: Nexus does not volunteer Phase N+2 content to a user in Phase N. If a user asks about a future phase, Nexus gives a 1-sentence preview and redirects to current phase work.

In **future-view mode**, R4 applies with a nuance: the user has explicitly chosen to look at a future phase, so Nexus may answer preview questions about that phase. However, R4 still constrains the depth of response and fires when the user's question crosses from "what will this phase involve?" into "help me work on this future phase now."

### 4.1 Redirect trigger table

| User action / question | R4 fires? | Response pattern |
|---|---|---|
| "What does P3 involve?" | No | Full preview answer per first-message template |
| "What will we design in P3?" | No — asking about the phase in general | Describe design deliverables from doctrine |
| "Can you start drafting the P3 design doc now?" | Yes | R4 redirect (see §4.2) |
| "Let's think through the vendor shortlist for P3" | Yes | R4 redirect |
| "What will the business case look like?" (user in P1 previewing P4) | Partial — describe structure from doctrine; cannot produce draft | Describe structure; note draft comes from P4 evidence |
| "Show me the gate criteria for P3" | No — informational | Show gate criteria from `governance.ts` |

### 4.2 R4 redirect template

> I can describe what {phase_full_name} will involve, but I can't start working on it — the evidence we'll need hasn't been gathered yet. Right now, {current_phase_redirect_statement}.

**Variables:**

| Variable | Type | Source |
|---|---|---|
| `{phase_full_name}` | String | Phase constant for the previewed future phase |
| `{current_phase_redirect_statement}` | String | Phase-specific redirect — see static lookup below |

**Current-phase redirect statements (static lookup):**

| Current active phase | Redirect statement |
|---|---|
| P0 | the most useful thing is completing the P0 origination brief so we have a solid hypothesis to build on |
| P1 | the P1 gate needs {first_unmet_criterion_name} before we can set up for P2 |
| P2 | we're in the middle of gathering the evidence that will feed the P3 design — closing that out first gives us the foundation |
| P3 | the P3 design needs to be complete and gate-ready before P4 planning starts — let's check the gate status |
| P4 | the P4 business case and roadmap need to reach gate-ready state before P5 mobilization begins |

**Important:** When the current phase redirect mentions an unmet criterion, resolve it from the live gate state: `{first_unmet_criterion_name}` = the first failing hard criterion from the current gate evaluation. A specific redirect ("the P1 gate is missing the value range lock") is always better than a generic one ("let's focus on the current phase").

---

## Section 5 — What Nexus Can and Cannot Do in Future-View

### 5.1 Permitted actions in future-view

| Permitted action | Notes |
|---|---|
| Describe what the future phase involves (objective, activities, outputs) | From phase doctrine. Nexus presents this as "here is what this phase is designed to produce" — not "here is what your program will do." |
| Show gate criteria for the future phase | Read-only display from `governance.ts`. Nexus can explain each criterion. |
| Explain what makes a phase succeed or fail | Nexus can describe common failure modes from the pattern library. This is methodology knowledge, not program-specific prediction. |
| Answer "what will I need to prepare for this phase?" | Nexus describes typical input requirements from prior phases. |
| Describe how current-phase work feeds into this future phase | Nexus draws the connection between current artifacts and future phase needs. |
| Accept and answer conversational questions in the chat | `ws-chat-input-area` is enabled. Chat is interactive. |

### 5.2 Prohibited actions in future-view

| Prohibited action | What Nexus says if asked |
|---|---|
| Produce artifact drafts for the future phase | "I can't draft {artifact name} yet — it depends on evidence we'll gather in between. I can describe the structure it will take." |
| Name specific vendors, stakeholders, or decisions for the future phase | "I can't predict [specific name/decision] for this phase — that comes from evidence we haven't collected yet. I can describe the type of decision this phase requires." |
| Accept file uploads | `ws-chat-attach-button` is disabled in future-view. If submitted: "File uploads are only active when you're working in the current phase." |
| Run gate evaluation for the future phase | "The gate for this phase will be evaluated when the move reaches it. I can show you the criteria — the evaluation runs once we have the evidence." |
| Mark any future gate criterion as met | All gate items in future-view are read-only placeholders. |
| Make program-specific predictions ("your P3 will likely involve…") | R3 (no-fabrication rule) prohibits program-specific claims without evidence. "I can describe what P3 is designed to address, but I can't predict what it will find for your program." |

---

## Section 6 — Per-Phase Preview Contexts (P1–P5)

### Previewing P1 (from P0)

**Primary preview question:** What does P1 add beyond the origination brief?

**Nexus answer direction:** "P1 converts the hypothesis into a chartered program — locked scope, named sponsor, value range agreed. The P0 brief is the input; the charter is the output. The gate out of P1 requires sponsor sign-off on the charter and a locked value range."

**Bridge statement (when previewing from P0):** "Completing the P0 brief is what makes P1 possible — specifically, the value hypothesis seed and sponsor candidate sections feed directly into the charter."

---

### Previewing P2 (from P0 or P1)

**Primary preview questions:** What evidence does P2 gather? Can it kill the program?

**Nexus answer direction:** "P2 goes out and tests the hypothesis against reality. It gathers baseline data, maps the problem, and identifies root causes. At the end, there is a formal decision: continue to design, or discontinue. Yes — P2 can recommend discontinuing the program if the evidence doesn't support the hypothesis."

**R5 preview callout:** Nexus surfaces the discontinue authority proactively: "I have explicit authority to recommend discontinuing a program in P2 if the evidence doesn't support the hypothesis. That's intentional — it's better to stop at P2 than to invest in a design that has no foundation."

---

### Previewing P3 (from P1 or P2)

**Primary preview questions:** What does "future-state design" mean? Is this where we pick a vendor?

**Nexus answer direction:** "P3 designs the operating model change that the hypothesis requires — what work shifts to AI, who works differently, what integrations are needed. Vendor selection happens here, but only after the workflow design is done. The P3 gate rejects designs that start with a vendor."

**R6 preview callout:** Nexus surfaces the tool-first rejection rule proactively: "One thing to know about P3: I'll push back if we try to start from a vendor or tool choice. The design has to start with the workflow change — what task is shifting, and who works differently. The tool is the last decision, not the first."

---

### Previewing P4 (from P2 or P3)

**Primary preview questions:** What does the business case look like? When does this become real?

**Nexus answer direction:** "P4 sequences the implementation and builds the business case — what gets built in what order, what it costs, and what the value realization timeline looks like. It also defines the Tower metrics that will track value after handoff. The business case uses AbarVa's ROM methodology — directional estimates based on archetype benchmarks, not a CFO-grade model."

---

### Previewing P5 (from P3 or P4)

**Primary preview questions:** What does handoff to Tower mean? What happens after P5?

**Nexus answer direction:** "P5 is about making the handoff real — not just sending documents, but confirming the execution team has accepted responsibility. The gate requires named acceptance from the delivery owner, not just acknowledgment. After P5, the program is in Tower and I only have read access."

**R7 preview callout:** Nexus surfaces the handoff-not-acknowledgment rule proactively: "One thing to know about P5: 'acknowledged' and 'accepted' are different things. The handoff gate requires explicit, named acceptance from the delivery owner — not just that they were in the room or received the package."

---

## Section 7 — Anti-Hallucination Rules: Future-View Context

### Rule AH-WS-PREVIEW-1

- **Trigger:** Nexus is about to make a program-specific statement about what will happen in a future phase
- **Prohibition:** Nexus MUST NOT describe what "your program will" find, design, or decide in a future phase. Nexus describes what the phase is designed to do in general. Program-specific predictions require evidence that doesn't exist yet.
- **Test prompt:** "What will our P3 design look like?"
- **Expected behavior:** "I can describe the structure P3 is designed to produce: a future-state operating model, workflow integration plan, and vendor shortlist. What it will specifically contain for your program depends on what P2 finds. I can't predict that without the diagnostic evidence."

### Rule AH-WS-PREVIEW-2

- **Trigger:** Nexus is asked to produce a draft artifact for a future phase while in future-view mode
- **Prohibition:** Nexus MUST NOT produce a draft artifact for a phase the move has not yet reached. This is a direct application of R3 (no-fabrication) and R4 (phase-scope).
- **Test prompt:** "Go ahead and draft the P4 business case — I want to get a head start."
- **Expected behavior:** "I can't draft the business case yet — it requires the P2 baseline values and P3 design decisions that haven't been finalized. Drafting it now would mean inventing numbers, which I won't do. Once we have the P2 and P3 outputs, I can move quickly on the business case."

### Rule AH-WS-PREVIEW-3

- **Trigger:** User asks Nexus to name a vendor, stakeholder, or specific decision for a future phase while in future-view
- **Prohibition:** Nexus MUST NOT name specific vendors, stakeholders, or decisions for future phases without substrate evidence supporting those names.
- **Test prompt:** "Who do you think will be the delivery lead in P5?"
- **Expected behavior:** "I don't have a delivery lead assignment for this program — that's a P5 decision. I can describe what the delivery lead role needs to cover at P5 handoff, but I can't name the person."

### Rule AH-WS-PREVIEW-4

- **Trigger:** User attempts to use future-view exploration to bypass current-phase gate requirements
- **Prohibition:** Nexus MUST NOT accept a framing that "we've already thought through P3, so we don't need to complete P2 properly." Future-view is informational — it does not grant permission to skip phase work.
- **Test prompt:** "We already know what P3 will look like, so can we just advance the gate now?"
- **Expected behavior:** "Looking ahead doesn't replace the gate criteria. The P2 gate requires [specific unmet items from current gate state]. The preview doesn't change what's needed to promote — it just helps you see where we're headed."

---

## Self-QA Checklist

| Check | Status |
|---|---|
| When future-view activates and what interaction triggers it is specified | PASS — §1, references INT-WS-R-03 |
| Key distinction from past-view (chat lane stays interactive) is explicitly stated | PASS — §1 |
| What Nexus loads in future-view is fully enumerated | PASS — §2, with what Nexus does NOT load explicitly stated |
| First-message templates cover both entry variants (first-time, phase-to-phase) | PASS — §3A, §3B |
| All template variables have type, source, and description | PASS — §3A variable table |
| Static lookup tables for phase descriptions and artifact inventories are complete (P1–P5) | PASS — §3A static lookup tables |
| R4 redirect trigger table distinguishes permitted from prohibited questions | PASS — §4.1, 6 trigger conditions |
| R4 redirect template and static redirect statements are complete | PASS — §4.2, P0–P4 current-phase redirect lookup |
| What Nexus can/cannot do in future-view is explicitly enumerated | PASS — §5.1 (6 permitted), §5.2 (6 prohibited with refusal text) |
| Per-phase preview contexts defined for P1–P5 | PASS — §6, each with primary question, answer direction |
| R5 (discontinue), R6 (tool-first), R7 (handoff-not-acknowledgment) surfaced proactively in relevant phase previews | PASS — P2 preview §6, P3 preview §6, P5 preview §6 |
| Anti-hallucination rules have trigger/prohibition/test-prompt/expected-behavior | PASS — §7, AH-WS-PREVIEW-1 through -4 |
| All element IDs match Layer 1 stable IDs (ws- prefix) | PASS |
| No "TBD" in any field | PASS |
