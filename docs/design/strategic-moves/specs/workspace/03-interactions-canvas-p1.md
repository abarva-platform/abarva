# Workspace Canvas Interactions — P1 Charter phase

| | |
|---|---|
| **Work Package** | W-3.2 (P1) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-canvas-p1.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `01-anatomy-canvas-p1.md` · `02-state.md` (state names) |
| **Author** | Claude Code |

---

## P1 Canvas Interactions

### INT-WS-P1-01: Click charter section edit button

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p1-charter-section-{N}-edit-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (enters inline edit mode for that section) |
| **state-change** | Charter section content becomes editable; edit button swaps to "Save" / "Cancel" |
| **side-effects** | Nexus may provide charter-context coaching if content changes significantly |
| **url-impact** | `none` |
| **keyboard** | `Enter` when button is focused |
| **focus-target** | `ws-canvas-p1-charter-section-{N}-content` |
| **loading-treatment** | none (immediate) |
| **error-treatment** | none (edit is client-side until saved) |

---

### INT-WS-P1-02: Save charter section edit

| Field | Value |
|---|---|
| **element-id** | Save action within charter section edit mode (inline button) |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (saves charter section content) |
| **state-change** | Charter section updated; edit mode closes; section status may update |
| **side-effects** | Auto-save to database; audit log: `{action: 'charter_section_updated', section: N, by: userId, at: timestamp, prev: ..., next: ...}`; Nexus context updated |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p1-charter-section-{N}-edit-btn` (returns focus to edit button) |
| **loading-treatment** | Brief saving indicator on the section |
| **error-treatment** | "Could not save changes. Try again." inline error; content preserved in field |

---

### INT-WS-P1-03: Click gate item toggle (mark complete / incomplete)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p1-gate-item-{N}` |
| **trigger** | `click` |
| **action** | `mutation` (toggles gate item completion state) |
| **state-change** | Gate item `checked` state toggles; `gateState` re-evaluates: if all hard items checked → `gateState: failing → ready`; if any hard item unchecked → `gateState: ready → failing` |
| **side-effects** | Gate summary badge updates; promote button enabled/disabled accordingly; audit log: `{action: 'gate_item_toggled', phase: 1, item: N, checked: bool, by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Space` or `Enter` when item is focused |
| **focus-target** | `ws-canvas-p1-gate-item-{N}` (retains focus) |
| **loading-treatment** | Brief state update indicator; gate summary re-renders |
| **error-treatment** | "Could not update gate item. Try again." inline message; item state reverts |

**Note:** P1 gate has 2 hard items (`charter_signed_off`, `sponsor_assigned`) and 1 soft item (`baseline_captured`). `partial` gateState is possible if soft item is unchecked while both hard items are checked — but promote button is still enabled in `partial` state per Layer 2 spec. Clicking a soft item does not block promotion.

---

### INT-WS-P1-04: Upload artifact to shelf

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p1-artifact-shelf-upload-btn` |
| **trigger** | `click` |
| **action** | `modal-open` (opens file picker) |
| **state-change** | File picker opens; on selection, file queued for upload; on upload complete, new artifact tile appears in shelf |
| **side-effects** | File stored; audit log: `{action: 'artifact_uploaded', phase: 1, filename: ..., by: userId, at: timestamp}`; artifact becomes referenceable by Nexus |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | File picker (OS dialog); on close, focus returns to `ws-canvas-p1-artifact-shelf-upload-btn` |
| **loading-treatment** | Upload progress indicator in shelf area |
| **error-treatment** | "Upload failed. Accepted formats: PDF, DOCX, XLSX, PPTX. Max size: Xmb." error message inline |

---

### INT-WS-P1-05: Click artifact tile (open artifact)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p1-artifact-shelf-item-{N}` |
| **trigger** | `click` |
| **action** | `panel-toggle` (opens artifact preview) |
| **state-change** | Artifact preview panel opens (drawer or modal); shows file name, upload date, uploader, preview or download link |
| **side-effects** | none |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | First focusable element in artifact preview panel |
| **loading-treatment** | Panel opens; artifact loads within panel |
| **error-treatment** | "Could not load artifact." message within panel |

---

### INT-WS-P1-06: Click sponsor signoff widget (request signoff)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p1-sponsor-signoff-request-btn` |
| **trigger** | `click` |
| **action** | `mutation` (sends signoff request to sponsor) |
| **state-change** | Signoff widget status changes: `not_requested → requested`; button label changes to "Requested" / "Pending"; widget shows "Awaiting sponsor sign-off" |
| **side-effects** | Notification dispatched to sponsor; audit log: `{action: 'charter_signoff_requested', by: userId, at: timestamp}`; gate item `charter_signed_off` status set to `pending` |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p1-sponsor-signoff-status` |
| **loading-treatment** | Button shows spinner; "Sending request..." text |
| **error-treatment** | "Could not send signoff request. Check sponsor is in the system." error toast; button state reverts |

---

### INT-WS-P1-07: Sponsor completes signoff (system-initiated state change)

| Field | Value |
|---|---|
| **element-id** | N/A — state change originates from sponsor action, not user click |
| **trigger** | `system` (sponsor signs off via their notification or link) |
| **action** | `mutation` (records signoff) |
| **state-change** | Signoff widget status: `requested → signed_off`; gate item `charter_signed_off` toggles to checked; `gateState` re-evaluates |
| **side-effects** | Real-time update pushed to open Workspace sessions; audit log: `{action: 'charter_signed_off', by: sponsorId, at: timestamp}`; Nexus notified |
| **url-impact** | `none` |
| **keyboard** | n/a |
| **focus-target** | n/a |
| **loading-treatment** | n/a |
| **error-treatment** | If real-time push fails: user sees stale state until page refresh; "Refresh to see latest signoff status" banner |

---

### INT-WS-P1-08: Click advance button (P1→P2)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p1-gate-promote-btn` |
| **trigger** | `click` |
| **action** | `mutation` (promotes move from P1 to P2) |
| **state-change** | `gateState: ready → promoted`; `phase: P1 → P2`; `moveLifecycle: active`; URL updates to `?phase=2` |
| **side-effects** | Gate evaluation runs (`evaluateGate(1, 2)`); if approved: phase changes, canvas switches to P2, rail node P2 becomes active, Nexus rescopes to P2 context; audit log: `{action: 'phase_promoted', fromPhase: 1, toPhase: 2, by: userId, at: timestamp}`; notification to sponsor |
| **url-impact** | `query-param` — URL updates to `?phase=2` |
| **keyboard** | `Enter` when button is focused |
| **focus-target** | `ws-canvas-p2` first focusable element |
| **loading-treatment** | Canvas-level loading state: "Advancing to P2 Diagnose..." |
| **error-treatment** | If gate evaluation fails: "Gate requirements not met. Review criteria." with gate panel scrolled into view |

---

## Self-QA

| Check | Status |
|---|---|
| All P1 canvas elements have interaction specs | PASS |
| Gate item toggle behavior (hard vs soft) documented | PASS |
| Sponsor signoff two-step (request → signed_off) documented | PASS |
| System-initiated state change (sponsor signs off) documented | PASS |
| Artifact shelf upload and tile open documented | PASS |
| Keyboard equivalents specified | PASS |
| Loading and error treatment for all async interactions | PASS |
| Promote button gating on gateState documented | PASS |
