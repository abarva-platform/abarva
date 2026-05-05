# Workspace Canvas Interactions — P5 Mobilize phase

| | |
|---|---|
| **Work Package** | W-3.2 (P5) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-canvas-p5.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `01-anatomy-canvas-p5.md` · `02-state.md` (state names) · gap-ws-p5-001 (B-120, provisional gate criteria) |
| **Author** | Claude Code |

---

## P5 Canvas Interactions

### INT-WS-P5-01: Update RACI role entry

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p5-raci-role-entry-{N}` |
| **trigger** | `click` |
| **action** | `panel-toggle` (expands inline edit form for that RACI entry) |
| **state-change** | RACI entry expands inline; person and responsibility fields become editable |
| **side-effects** | none until saved |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | First editable field in RACI entry |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-P5-02: Save RACI role entry

| Field | Value |
|---|---|
| **element-id** | Inline save button within RACI entry edit mode |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (saves RACI entry update) |
| **state-change** | RACI entry updated; edit mode closes |
| **side-effects** | Audit log: `{action: 'raci_entry_updated', id: ..., by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p5-raci-role-entry-{N}` |
| **loading-treatment** | Brief saving indicator |
| **error-treatment** | "Could not save RACI entry. Try again." inline error |

---

### INT-WS-P5-03: Click handoff pack checklist item

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p5-handoff-pack-checklist-item-{N}` |
| **trigger** | `click` |
| **action** | `mutation` (toggles checklist item completion) |
| **state-change** | Checklist item `checked` state toggles; checklist completion percentage updates |
| **side-effects** | Audit log: `{action: 'handoff_pack_item_toggled', item: N, checked: bool, by: userId, at: timestamp}`; if all items checked: Nexus may prompt user to submit Tower acceptance |
| **url-impact** | `none` |
| **keyboard** | `Space` or `Enter` when item is focused |
| **focus-target** | `ws-canvas-p5-handoff-pack-checklist-item-{N}` (retains focus) |
| **loading-treatment** | Brief state update |
| **error-treatment** | "Could not update checklist item. Try again." |

---

### INT-WS-P5-04: Click handoff pack item link (open artifact)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p5-handoff-pack-item-{N}-link` |
| **trigger** | `click` |
| **action** | `panel-toggle` (opens the linked artifact or document) |
| **state-change** | Artifact preview panel opens |
| **side-effects** | none |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | First focusable element in artifact preview |
| **loading-treatment** | Panel opens; artifact loads |
| **error-treatment** | "Could not load artifact." in panel |

---

### INT-WS-P5-05: Click "Submit to Tower" button (Tower acceptance panel)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p5-tower-acceptance-submit-btn` |
| **trigger** | `click` |
| **action** | `mutation` (submits the move to Tower for acceptance review) |
| **state-change** | Tower acceptance status badge: `not_submitted → submitted`; submit button becomes "Submitted" (non-interactive); `ws-canvas-p5-tower-acceptance-timestamp` shows submission time |
| **side-effects** | Tower notified of submission; audit log: `{action: 'tower_acceptance_submitted', by: userId, at: timestamp}`; Nexus notified; submission is now immutable from the move workspace (Tower must respond) |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p5-tower-acceptance-status-badge` |
| **loading-treatment** | Button shows spinner; "Submitting to Tower..." text |
| **error-treatment** | "Could not submit to Tower. Try again." error toast; button state reverts |

**Note:** The submit button is available only when gate items suggest handoff readiness (handoff pack complete, RACI set). It should not be available if the handoff pack checklist has incomplete required items.

---

### INT-WS-P5-06: Tower acknowledges the move (system-initiated state change)

| Field | Value |
|---|---|
| **element-id** | N/A — state change originates from Tower action |
| **trigger** | `system` (Tower actor marks the submission as acknowledged) |
| **action** | `mutation` (records Tower acknowledgement) |
| **state-change** | Tower acceptance status badge: `submitted → acknowledged`; `ws-canvas-p5-tower-acceptance-timestamp` updates to acknowledgement time; `ws-canvas-p5-tower-acceptance-acceptor` shows Tower actor name |
| **side-effects** | Real-time push to open Workspace sessions; audit log: `{action: 'tower_acknowledged', by: towerId, at: timestamp}`; Nexus notified |
| **url-impact** | `none` |
| **keyboard** | n/a |
| **focus-target** | n/a |
| **loading-treatment** | n/a |
| **error-treatment** | If real-time push fails: "Refresh to see Tower status" banner |

**Critical distinction:** `acknowledged` means Tower has seen the submission. It does NOT authorize handoff. The handoff button (`ws-canvas-p5-gate-handoff-btn`) remains DISABLED at `acknowledged` state. It only becomes enabled at `accepted` state.

---

### INT-WS-P5-07: Tower accepts the move (system-initiated state change)

| Field | Value |
|---|---|
| **element-id** | N/A — state change originates from Tower action |
| **trigger** | `system` (Tower actor formally accepts the move) |
| **action** | `mutation` (records Tower acceptance) |
| **state-change** | Tower acceptance status badge: `acknowledged → accepted`; `ws-canvas-p5-gate-handoff-btn` becomes ENABLED; Nexus may surface "Tower has accepted — you can now complete the handoff" coaching prompt |
| **side-effects** | Real-time push to open Workspace sessions; audit log: `{action: 'tower_accepted', by: towerId, at: timestamp}`; Nexus notified |
| **url-impact** | `none` |
| **keyboard** | n/a |
| **focus-target** | n/a |
| **loading-treatment** | n/a |
| **error-treatment** | If real-time push fails: "Refresh to see Tower status" banner |

---

### INT-WS-P5-08: Tower declines the move (system-initiated state change)

| Field | Value |
|---|---|
| **element-id** | N/A — state change originates from Tower action |
| **trigger** | `system` (Tower actor declines the submission) |
| **action** | `mutation` (records Tower decline) |
| **state-change** | Tower acceptance status badge: `acknowledged → declined`; `ws-canvas-p5-tower-acceptance-decline-note` becomes visible with Tower's rationale; Nexus surfaces the decline rationale and prompts user to address gaps |
| **side-effects** | Real-time push to open sessions; audit log: `{action: 'tower_declined', by: towerId, reason: ..., at: timestamp}`; notification to move owner and sponsor |
| **url-impact** | `none` |
| **keyboard** | n/a |
| **focus-target** | n/a |
| **loading-treatment** | n/a |
| **error-treatment** | If real-time push fails: "Refresh to see Tower status" banner |

**Note:** A declined submission can be re-submitted. The Tower acceptance panel should show a "Revise and Resubmit" CTA when status is `declined`.

---

### INT-WS-P5-09: Click "Revise and Resubmit" (after Tower decline)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p5-tower-acceptance-resubmit-btn` (visible only when status = `declined`) |
| **trigger** | `click` |
| **action** | `mutation` (resets acceptance status and re-submits) |
| **state-change** | Tower acceptance status badge: `declined → submitted`; decline note hides; resubmit button hides |
| **side-effects** | Tower notified of new submission; audit log: `{action: 'tower_acceptance_resubmitted', by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p5-tower-acceptance-status-badge` |
| **loading-treatment** | Button shows spinner; "Resubmitting..." text |
| **error-treatment** | "Could not resubmit. Try again." error toast |

---

### INT-WS-P5-10: Click gate item toggle (P5 gate — provisional)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p5-gate-item-{N}` |
| **trigger** | `click` |
| **action** | `mutation` (toggles gate item completion state) |
| **state-change** | Gate item `checked` state toggles; P5 gate has 5 provisional items (all treated as hard per gap-ws-p5-001 / B-120 pending governance.ts update); `gateState` re-evaluates: `ready` when all 5 checked; `failing` otherwise |
| **side-effects** | Gate summary badge updates; handoff button enabled/disabled; audit log: `{action: 'gate_item_toggled', phase: 5, item: N, checked: bool, by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Space` or `Enter` when item is focused |
| **focus-target** | `ws-canvas-p5-gate-item-{N}` (retains focus) |
| **loading-treatment** | Brief state update; gate summary re-renders |
| **error-treatment** | "Could not update gate item. Try again." inline message |

**Note (B-120):** P5 gate items are provisional — governance.ts has no P5→Tower gate rule. The items are derived from handoff criteria documented in the anatomy. Once governance.ts is updated (B-120 resolved), the hard/soft classification should be reconciled here.

---

### INT-WS-P5-11: Click handoff button (complete Tower handoff)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p5-gate-handoff-btn` |
| **trigger** | `click` |
| **action** | `mutation` (completes the Tower handoff — final state transition) |
| **state-change** | `moveLifecycle: active → handed_off`; `viewMode` switches to `handed-off`; all canvas content becomes read-only; view mode banner shows "This move has been handed to Tower"; `ws-rail-tower-indicator` activates as a badge; handoff button is permanently removed |
| **side-effects** | Audit log: `{action: 'tower_handoff_completed', by: userId, at: timestamp}`; notification to sponsor and Tower; Nexus rescopes to read-only summary mode; analytics event |
| **url-impact** | `none` — the route does not change; the `viewMode` state is inferred from `moveLifecycle = handed_off` |
| **keyboard** | `Enter` when button is focused |
| **focus-target** | `ws-header-view-mode-banner` (now shows handed-off state) |
| **loading-treatment** | Full-canvas loading state: "Completing Tower handoff..." |
| **error-treatment** | "Could not complete handoff. Try again." error toast; state reverts |

**Pre-conditions for this button to be enabled:**
1. `ws-canvas-p5-tower-acceptance-status-badge` = `accepted` (NOT merely `acknowledged`)
2. All 5 P5 gate items checked (`gateState = ready`)

If either condition is unmet, the button is disabled with a tooltip: "Requires Tower acceptance and all gate criteria."

---

### INT-WS-P5-12: Upload artifact to shelf

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p5-artifact-shelf-upload-btn` |
| **trigger** | `click` |
| **action** | `modal-open` (opens file picker) |
| **state-change** | File picker; on complete, artifact tile appears |
| **side-effects** | Audit log: `{action: 'artifact_uploaded', phase: 5, filename: ..., by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | File picker (OS dialog); on close, returns to upload button |
| **loading-treatment** | Upload progress indicator |
| **error-treatment** | "Upload failed. Accepted formats: PDF, DOCX, XLSX, PPTX. Max size: Xmb." |

---

## Self-QA

| Check | Status |
|---|---|
| All P5 canvas elements have interaction specs | PASS |
| Tower acceptance submit documented | PASS |
| Tower acknowledgement (system-initiated) documented | PASS |
| Tower acceptance (system-initiated) documented | PASS |
| Tower decline + resubmit documented | PASS |
| Critical distinction: acknowledged ≠ accepted; handoff btn only on accepted | PASS |
| Handoff button pre-conditions (accepted + gate ready) explicitly stated | PASS |
| Handoff button completion → handed-off terminal state documented | PASS |
| B-120 provisional gate note included | PASS |
| RACI edit/save documented | PASS |
| Handoff pack checklist toggle documented | PASS |
| Artifact upload documented | PASS |
