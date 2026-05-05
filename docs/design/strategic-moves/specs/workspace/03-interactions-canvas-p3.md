# Workspace Canvas Interactions — P3 Design phase

| | |
|---|---|
| **Work Package** | W-3.2 (P3) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-canvas-p3.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `01-anatomy-canvas-p3.md` · `02-state.md` (state names) · `PHASE_MODEL_V2_DOCTRINE.md` (root-cause trace doctrine) |
| **Author** | Claude Code |

---

## P3 Canvas Interactions

### INT-WS-P3-01: Click design panel edit button

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p3-design-panel-edit-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (enables editing of the design content) |
| **state-change** | Design content area becomes editable; edit button swaps to "Save" / "Cancel" |
| **side-effects** | Nexus may surface relevant root causes from P2 as editing context |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p3-design-panel-content` |
| **loading-treatment** | none (immediate) |
| **error-treatment** | none (edit is client-side until saved) |

---

### INT-WS-P3-02: Save design panel content

| Field | Value |
|---|---|
| **element-id** | Inline save button within design panel edit mode |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (saves design panel content) |
| **state-change** | Design content updated; edit mode closes |
| **side-effects** | Audit log: `{action: 'design_content_updated', by: userId, at: timestamp, prev: ..., next: ...}`; Nexus context updated |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p3-design-panel-edit-btn` |
| **loading-treatment** | Brief saving indicator |
| **error-treatment** | "Could not save design content. Try again." inline error; content preserved |

---

### INT-WS-P3-03: Click design signoff button (request design sign-off)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p3-design-panel-signoff-btn` |
| **trigger** | `click` |
| **action** | `mutation` (requests design sign-off from sponsor) |
| **state-change** | Signoff button state: `available → requested`; button label changes to "Requested"; design panel shows "Awaiting sign-off" status |
| **side-effects** | Notification dispatched to sponsor; audit log: `{action: 'design_signoff_requested', by: userId, at: timestamp}`; gate item `design_signed_off` moves to `pending` |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p3-design-panel` header |
| **loading-treatment** | Button shows spinner |
| **error-treatment** | "Could not send sign-off request. Try again." error toast |

---

### INT-WS-P3-04: Add root-cause trace link to a design element

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p3-root-cause-trace-item-{N}-trace-btn` (or inline "Link to root cause" control within a design element) |
| **trigger** | `click` |
| **action** | `modal-open` (opens root cause picker for the selected design element) |
| **state-change** | Root cause picker opens; shows all P2 root causes; user selects one or more to link |
| **side-effects** | none until confirmed |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | Root cause picker first item |
| **loading-treatment** | Picker opens; root cause list loads from P2 data |
| **error-treatment** | If P2 root cause data fails to load: "Could not load root causes from Diagnose phase. Try again." |

**Doctrine note (PHASE_MODEL_V2_DOCTRINE.md):** Every P3 design element MUST trace to at least one P2 root cause. Design elements without a trace are flagged with the `ws-canvas-p3-root-cause-trace-untraced-warning-banner`. Gate item `root_causes_traced` remains unchecked until all design elements have at least one trace link.

---

### INT-WS-P3-05: Confirm root-cause trace link

| Field | Value |
|---|---|
| **element-id** | Confirm button within root cause picker |
| **trigger** | `click` |
| **action** | `mutation` (saves trace link between design element and P2 root cause) |
| **state-change** | Trace link saved; `ws-canvas-p3-root-cause-trace-item-{N}` updates to show the linked root cause; if this was the last untraced item: `ws-canvas-p3-root-cause-trace-untraced-warning-banner` hides; gate item `root_causes_traced` toggles to checked |
| **side-effects** | Audit log: `{action: 'trace_link_added', designElement: ..., rootCause: ..., by: userId, at: timestamp}`; gate re-evaluates |
| **url-impact** | `none` |
| **keyboard** | `Enter` when button is focused |
| **focus-target** | `ws-canvas-p3-root-cause-trace-item-{N}` |
| **loading-treatment** | Brief saving indicator |
| **error-treatment** | "Could not save trace link. Try again." inline error |

---

### INT-WS-P3-06: Remove root-cause trace link

| Field | Value |
|---|---|
| **element-id** | Remove/unlink control within `ws-canvas-p3-root-cause-trace-item-{N}` |
| **trigger** | `click` |
| **action** | `mutation` (removes trace link) |
| **state-change** | Trace link removed; design element status reverts to `untraced`; `ws-canvas-p3-root-cause-trace-untraced-warning-banner` re-appears if any design element is now untraced; gate item `root_causes_traced` may toggle back to unchecked |
| **side-effects** | Audit log: `{action: 'trace_link_removed', designElement: ..., rootCause: ..., by: userId, at: timestamp}`; gate re-evaluates |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | `ws-canvas-p3-root-cause-trace-item-{N}` |
| **loading-treatment** | Brief state update |
| **error-treatment** | "Could not remove trace link. Try again." |

---

### INT-WS-P3-07: Click gate item toggle (P3 gate)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p3-gate-item-{N}` |
| **trigger** | `click` |
| **action** | `mutation` (toggles gate item completion state) |
| **state-change** | Gate item `checked` state toggles; P3 gate has 2 hard + 2 soft items; `gateState` re-evaluates: `ready` when both hard items checked; `partial` when hard items checked but soft items unchecked; `failing` when any hard item unchecked |
| **side-effects** | Gate summary badge updates; promote button enabled/disabled; audit log: `{action: 'gate_item_toggled', phase: 3, item: N, checked: bool, by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Space` or `Enter` when item is focused |
| **focus-target** | `ws-canvas-p3-gate-item-{N}` (retains focus) |
| **loading-treatment** | Brief state update; gate summary re-renders |
| **error-treatment** | "Could not update gate item. Try again." inline message |

---

### INT-WS-P3-08: Add risk item

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p3-risks-add-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (expands inline form to add a new risk entry) |
| **state-change** | Inline add-risk form appears; fields: description, likelihood, impact, mitigation |
| **side-effects** | none until saved |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | First field in add-risk form |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-P3-09: Save risk item

| Field | Value |
|---|---|
| **element-id** | Inline save button within add-risk form |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (creates risk entry) |
| **state-change** | New risk item appears in risks panel |
| **side-effects** | Audit log: `{action: 'risk_added', id: ..., by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p3-risks-add-btn` |
| **loading-treatment** | Brief saving indicator |
| **error-treatment** | "Could not save risk. Try again." inline error; form content preserved |

---

### INT-WS-P3-10: Upload artifact to shelf

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p3-artifact-shelf-upload-btn` |
| **trigger** | `click` |
| **action** | `modal-open` (opens file picker) |
| **state-change** | File picker; on complete, artifact tile appears |
| **side-effects** | Audit log: `{action: 'artifact_uploaded', phase: 3, filename: ..., by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | File picker (OS dialog); on close, returns to upload button |
| **loading-treatment** | Upload progress indicator |
| **error-treatment** | "Upload failed. Accepted formats: PDF, DOCX, XLSX, PPTX. Max size: Xmb." |

---

### INT-WS-P3-11: Click promote button (P3→P4)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p3-gate-promote-btn` |
| **trigger** | `click` |
| **action** | `mutation` (promotes move from P3 to P4) |
| **state-change** | `gateState: ready → promoted`; `phase: P3 → P4`; URL updates to `?phase=4` |
| **side-effects** | Gate evaluation runs (`evaluateGate(3, 4)`); if approved: phase changes, canvas switches to P4, rail node P4 becomes active, Nexus rescopes; audit log: `{action: 'phase_promoted', fromPhase: 3, toPhase: 4, by: userId, at: timestamp}` |
| **url-impact** | `query-param` — URL updates to `?phase=4` |
| **keyboard** | `Enter` when button is focused |
| **focus-target** | `ws-canvas-p4` first focusable element |
| **loading-treatment** | "Advancing to P4 Roadmap & Business Case..." |
| **error-treatment** | "Gate requirements not met. Review criteria." with gate panel in view |

---

## Self-QA

| Check | Status |
|---|---|
| All P3 canvas elements have interaction specs | PASS |
| Root-cause trace add documented (INT-WS-P3-04 / -05) | PASS |
| Root-cause trace remove (unlink) documented | PASS |
| Untraced warning banner behavior on add/remove documented | PASS |
| Doctrine note on root-cause trace requirement included | PASS |
| Design signoff request documented | PASS |
| Risk add/save documented | PASS |
| Gate toggle (2 hard + 2 soft, partial possible) documented | PASS |
| Artifact upload documented | PASS |
| Promote P3→P4 documented | PASS |
