# Workspace · Layer 5 Knowledge Surfacing — Cross-Phase Navigation Handoff

| Field | Value |
|---|---|
| **Work Package** | W-5.6 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/05-cross-phase-nav.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Depends on** | W-5.1 (`05-knowledge-surfacing-overview.md`), W-2.1 (`02-state.md`), W-3.1 (`03-interactions-shell.md` INT-WS-R-01 through R-05, INT-WS-VMB-01) |
| **References** | `agent-training/00-global-behavioral-rules.md §4 (R2)`, D-10 (URL behavior), `01-anatomy-viewmodes.md §2.7` |
| **Author** | Claude Code |

---

## Overview

This document specifies what Nexus preserves, resets, and communicates when the user navigates between phases via the rail or returns to the active phase from a past/future exploration. It covers:

- What state Nexus preserves on phase navigation (§1)
- What state Nexus resets on phase navigation (§2)
- First-message templates on return to active phase (§3)
- First-message templates on forward/backward navigation (§4)
- Unsaved state warning: when in-progress work will be lost (§5)
- Phase navigation edge cases (§6)
- Anti-hallucination rules specific to handoff context (§7)
- Self-QA checklist

All element IDs reference `01-anatomy-shell.md` and `01-anatomy-viewmodes.md`. URL state is governed by D-10 and `03-interactions-url.md`.

---

## Section 1 — State Nexus Preserves on Phase Navigation

When the user clicks a rail node to switch phases (past or future), the following state is preserved. "Preserved" means it survives the phase switch and is available when the user returns to the original context.

### 1.1 Conversation state

| State element | Preserved? | Storage | Notes |
|---|---|---|---|
| Current active phase message history | Yes | `move_phase_conversations` for the active phase | The conversation with Nexus in the current active phase is not cleared when the user navigates to past/future view. On return, the message list resumes exactly where it left off. |
| In-progress Nexus response (partially generated) | No | Not persisted | If a Nexus response is mid-generation when the user clicks the rail, the response generation is cancelled and the partial output is discarded. The triggering user message stays in the list. |
| Unsent text in `ws-chat-input-field` | No | Not persisted | Draft text in the input field is lost when viewMode changes. See §5 for unsaved state warning. |

### 1.2 Gate and artifact state

| State element | Preserved? | Notes |
|---|---|---|
| Current gate evaluation state (`gateState`) | Yes | Gate evaluation runs server-side; not a local view state. Phase navigation does not trigger re-evaluation. |
| In-progress artifact edits (unsaved) | No | If the user has an inline edit open when they navigate, the edit is cancelled. The pre-edit content remains. See §5. |
| Saved artifact content | Yes | Saved artifact content is in the database; unaffected by view navigation. |
| P0 scaffold step states | Yes | P0 scaffold step states are persisted. Navigating away from P0 view does not reset scaffold progress. |

### 1.3 Evidence and upload state

| State element | Preserved? | Notes |
|---|---|---|
| Uploaded files (successfully uploaded) | Yes | File references are persisted. Navigation does not remove them. |
| In-flight uploads | No | If a file upload is in progress when the user navigates, the upload is cancelled. See §5 warning. |
| Pattern bundle for current active phase | Preserved in memory (session) | The current active phase pattern bundle remains loaded during a past/future navigation visit. On return, no re-fetch required if session is still active. |

### 1.4 Navigation breadcrumb (for return)

When the user enters past or future view mode, the system records:
- `navigation_origin_phase`: the phase the user was in before clicking the rail
- `navigation_origin_viewMode`: `current` (always, since navigation always starts from `current` for the first switch)

This is used by `INT-WS-VMB-01` (Return to Current) to correctly restore the prior context. The `ws-header-return-to-current-link` is populated from `navigation_origin_phase`'s full name.

---

## Section 2 — State Nexus Resets on Phase Navigation

When the user navigates from one phase context to another, the following state is reset.

| State element | Reset trigger | What replaces it |
|---|---|---|
| Phase-specific pattern bundle | Phase switch to any different phase | Target phase's pattern bundle loads (§1.2 of `05-knowledge-surfacing-overview.md`) |
| Current step context (P0 scaffold step focus) | Phase switch away from P0 | On return to P0, step focus is restored to the last active scaffold step from `origination_drafts.last_active_step` |
| Chat lane message list display | Phase switch | Repopulates with conversation history for the target phase context. In past-view: historical conversation. In future-view: fresh (only the Nexus preview message). |
| Action chip set (`ws-chat-chip-list`) | Phase switch | Hidden in past/future view; re-rendered on return to `current` based on current gate and artifact state. |
| Canvas content | Phase switch | Canvas renders the target phase's artifact panels with appropriate view mode treatment. |
| `ws-chat-header` phase context label | Phase switch | Updates to the target phase's short label and view mode suffix. |
| `ws-identity-eyebrow` phase label | Phase switch | Updates to the target phase's short label. |

**Pattern bundle unload:** The previous phase's optional patterns (loaded on demand during the session) are unloaded on phase switch. Required patterns and the common tenant context bundle are not unloaded — they remain available across phase switches.

---

## Section 3 — First Message: Return to Active Phase

When the user clicks `ws-header-return-to-current-link` (INT-WS-VMB-01) after a past or future exploration, Nexus emits a return message.

### 3A — Return from past-view exploration

**Context:** User was reviewing a past phase and clicks "Return to P{M} {ActivePhaseName}."

**Template:**

> Back in **{current_phase_full_name}**. {return_context_line}

**Variables:**

| Variable | Type | Source | Description |
|---|---|---|---|
| `{current_phase_full_name}` | String | Phase constant for the active phase | e.g., "P2 Discover & Diagnose" |
| `{return_context_line}` | String | Conditional — see table below | One-sentence context re-anchor |

**Return context line logic:**

| Condition | Return context line |
|---|---|
| Gate state is `failing` | "The gate still has {N} hard items unmet — {first_unmet_criterion_name} is the blocking item." |
| Gate state is `partial` | "The gate is ready to promote with {N} soft gap(s) carried forward." |
| Gate state is `ready` | "The gate is ready to promote — the promote button is enabled." |
| Gate state is `not-evaluated` | "The gate hasn't been evaluated yet — {main_in_progress_task} is the next step." |
| In-progress artifact edit was cancelled (§5) | "I cancelled the edit you had open when you navigated — nothing was lost, the section is in its last saved state." |
| No special condition | "Where did you want to pick up?" |

---

### 3B — Return from future-view exploration

**Context:** User was previewing a future phase and clicks "Return to P{M} {ActivePhaseName}."

**Template:**

> Back in **{current_phase_full_name}**. {future_return_bridge}

**Future-view return bridge logic:**

| Condition | Return bridge |
|---|---|
| User asked specific questions about the future phase before returning | "The preview of P{previewed_phase_number} gives you a sense of what we're building toward. The path there runs through [most-blocking current gate item]." |
| User triggered a R4 redirect (asked to start future-phase work) | "Ready to close the current gate? The blocking item is {first_unmet_criterion_name}." |
| User browsed without asking questions | "What would you like to work on?" |
| In-progress upload was cancelled (§5) | "The file upload you started was cancelled when you navigated — please re-upload it when you're ready to continue." |

---

## Section 4 — First Message: Forward and Backward Navigation (Phase to Phase)

When the user navigates from one phase context to another without clicking "Return to Current" — for example, from viewing P1 (past) and clicking P3 (future) — the navigation is a direct phase switch.

| Navigation pattern | Nexus first message |
|---|---|
| Current → Past (first time clicking a past phase) | Full past-view entry message per W-5.4 §3A |
| Past → Different Past phase | Abbreviated past-view message per W-5.4 §3B |
| Past → Future phase | Standard future-view entry message per W-5.5 §3A (first-time entry for that future phase) |
| Future → Past phase | Abbreviated past-view message per W-5.4 §3B |
| Current → Current (active node click) | No message — INT-WS-R-01 no-op |
| Any view → Current (via rail click on active phase node) | Same return message as INT-WS-VMB-01 (§3A or §3B) |

**Rule for Any view → Current:** The rail node for the active phase and the "Return to Current" link are two equivalent paths to the same destination. Nexus behavior must be consistent regardless of which control the user used.

---

## Section 5 — Unsaved State Warning on Navigation

When the user attempts to navigate to a different phase while they have unsaved state in the current context, the UI must warn before the navigation executes.

### 5.1 Warning trigger conditions

| Unsaved state condition | Warning fires? | Note |
|---|---|---|
| Unsent text in `ws-chat-input-field` (more than 20 characters) | Yes | Short accidental keystrokes (under 20 chars) do not trigger the warning. |
| Inline artifact edit in progress (content has changed from saved state) | Yes | Edit button being open without any content change does not trigger the warning. |
| File upload in progress | Yes | An in-flight upload is always worth warning about. |
| Action chips visible (`ws-chat-chip-list` showing) | No | Chip visibility is not unsaved state — chips re-render on return. |
| Gate evaluation in progress | No | Gate evaluation is server-side; it will complete regardless of navigation. |

### 5.2 Warning presentation

**Trigger:** Any of the above conditions detected when the user clicks a rail node.

**Warning display:** Inline confirmation strip in the chat lane, appearing above the message list. Not a blocking modal — the user can dismiss and navigate immediately, or stay.

| Element | ID | Content |
|---|---|---|
| Warning strip | `ws-chat-nav-warning-strip` | Visible when unsaved state is detected on rail click |
| Warning message | `ws-chat-nav-warning-text` | Phase-specific — see §5.3 |
| Navigate anyway button | `ws-chat-nav-warning-confirm-btn` | Label: "Leave anyway" — executes the navigation, discarding unsaved state |
| Stay button | `ws-chat-nav-warning-cancel-btn` | Label: "Stay here" — dismisses the warning, cancels the navigation |

### 5.3 Warning message text by unsaved state type

| Unsaved state | Warning message |
|---|---|
| Unsent text in input field | "You have an unsent message. Navigating will discard it." |
| Inline edit in progress | "You have an unsaved edit in {artifact_section_name}. Navigating will discard the change." |
| In-flight upload | "A file upload is in progress. Navigating now will cancel the upload." |
| Multiple conditions | "You have unsaved changes (draft message + open edit). Navigating will discard them." |

### 5.4 What happens on "Leave anyway"

- Unsent input field text is discarded
- In-progress inline edits are rolled back to last saved state (no partial write)
- In-flight upload is cancelled (file reference is not created)
- Nexus notes the cancellation in the return message per §3 (return context line / return bridge logic)
- Navigation proceeds to the target phase

### 5.5 Automatic save before navigation (when possible)

Before firing the warning, the system attempts an automatic save of in-progress edits. If auto-save succeeds (content is valid and writable), the warning is suppressed and navigation proceeds. If auto-save fails (content is invalid, network error, or gate state has changed), the warning fires.

**Auto-save is attempted for:** Inline artifact edits where content is valid.

**Auto-save is NOT attempted for:** Unsent input field text (not a saveable state) or in-flight uploads (cannot complete a partial upload automatically).

---

## Section 6 — Phase Navigation Edge Cases

### EDGE-NAV-A: Handed-off move — all phases in past-view

When `viewMode = 'handed-off'`, clicking any rail node activates past-view for that phase. There is no `current` or `future` view in `handed-off` mode — the move is complete. The "Return to Current" link is hidden (per `01-anatomy-viewmodes.md §5`). Nexus emits a short past-view message: "Viewing P{N} — this move has been handed to Tower."

### EDGE-NAV-B: User navigates during Nexus response generation

If the user clicks a rail node while Nexus is generating a response, the response generation is cancelled. The user message stays in the list (context preserved). On return to the active phase, Nexus does not automatically re-generate the response — the user must re-submit or ask again. Continuing to generate a response for a context the user has navigated away from is confusing and wastes compute.

### EDGE-NAV-C: Deep link `?phase=N` where N is a future phase

If the URL contains `?phase=N` and N is a future phase (move has not yet reached phase N), the page loads in future-view mode for phase N. Nexus emits the future-view entry message per W-5.5 §3A. No separate deep-link variant for future-view — the standard entry handles it.

### EDGE-NAV-D: Multiple rapid rail clicks

If the user clicks multiple rail nodes in quick succession (before the first navigation's pattern bundle has loaded), the system cancels the pending load for the first click and begins loading for the most recent click. The final clicked phase is the target. Nexus emits only one first message — for the phase that actually loaded. The skeleton state shows throughout rapid clicks.

### EDGE-NAV-E: `?phase=N` where N is an unreached future phase

If the URL contains `?phase=N` and phase N has no record in this move (e.g., move is at P1 and `?phase=3` is in the URL), the page loads in future-view mode for P{N}. The future-view preview message handles this correctly — it describes the future phase from doctrine, not from the move's record.

---

## Section 7 — Anti-Hallucination Rules: Cross-Phase Navigation Context

### Rule AH-WS-NAV-1

- **Trigger:** User returns from a past-phase exploration and asks Nexus to "incorporate what you saw" from the past phase into current-phase work
- **Prohibition:** Nexus MUST NOT conflate past-phase historical context with current-phase evidence. If the user saw something in a past phase's artifact that they want to apply to current work, they must explicitly surface it as new input — Nexus does not carry implicit context across view mode changes.
- **Test prompt:** "Based on what we saw in P1, update the current gate assessment."
- **Expected behavior:** "I can't automatically carry over what you viewed in P1 — if there's something specific from the charter that's relevant to the current gate, tell me what it is and I'll apply it. I can also pull up the P1 charter content here if you want to reference it."

### Rule AH-WS-NAV-2

- **Trigger:** User returns from future-view and asks Nexus to "lock in" or "remember" decisions they described hypothetically while in preview mode
- **Prohibition:** Nexus MUST NOT treat hypothetical future-phase discussions as program decisions. Statements made while in `future` view mode are exploratory — not artifact entries, not evidence.
- **Test prompt:** "When we were previewing P3, I said we'd go with the CDP architecture. Remember that."
- **Expected behavior:** "What you described while previewing P3 is exploratory thinking, not a recorded decision. When you reach P3, I'll help you work through the design properly. If you want to capture that idea now as a note, I can add it to the current phase's working notes — but it's not a P3 decision until P3."

### Rule AH-WS-NAV-3

- **Trigger:** Nexus is emitting a return message after phase navigation, and the user's chat history from the navigation visit contains statements made in past/future view
- **Prohibition:** Nexus MUST NOT reference the user's statements from past/future view as if they were current-phase inputs. The active-phase conversation resumes from where it was before the navigation. No return message should reference "as you mentioned while viewing P1…" as if that were program evidence.
- **Application:** The return messages in §3A and §3B correctly anchor to the current gate state and move status, not to what the user said in the other view.

---

## Self-QA Checklist

| Check | Status |
|---|---|
| What state Nexus preserves on phase navigation enumerated across 4 categories | PASS — §1.1 (conversation), §1.2 (gate/artifact), §1.3 (evidence/uploads), §1.4 (navigation breadcrumb) |
| What state Nexus resets on phase navigation is enumerated | PASS — §2, 7 state elements with reset trigger and replacement |
| Pattern bundle unload is specified | PASS — §2, "Pattern bundle unload" note |
| First-message templates for return to active phase cover both return origins | PASS — §3A (return from past), §3B (return from future) |
| Return context line logic fully specified with conditions | PASS — §3A and §3B logic tables |
| Forward/backward navigation variants are covered | PASS — §4, 6 variants in table |
| `current → current` (no-op) is documented | PASS — §4 table |
| Rail click on active phase node = "Return to Current" equivalence is stated | PASS — §4 note |
| Unsaved state warning fires for correct conditions | PASS — §5.1, 5 conditions (3 fire, 2 do not) |
| Warning presentation elements have stable IDs | PASS — §5.2, `ws-chat-nav-warning-*` IDs |
| Warning text specified per unsaved state type | PASS — §5.3, 4 conditions |
| "Leave anyway" behavior specified | PASS — §5.4 |
| Auto-save before navigation specified | PASS — §5.5 |
| Navigation edge cases cover handed-off, mid-generation, deep link, rapid clicks | PASS — §6, EDGE-NAV-A through -E |
| Anti-hallucination rules cover cross-view-mode context confusion | PASS — §7, AH-WS-NAV-1 through -3 |
| All element IDs match Layer 1 stable IDs (ws- prefix) | PASS |
| No "TBD" in any field | PASS |
