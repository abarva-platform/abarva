# Workspace Canvas Interactions — P2 Diagnose phase

| | |
|---|---|
| **Work Package** | W-3.2 (P2) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-canvas-p2.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `01-anatomy-canvas-p2.md` · `02-state.md` (state names) · `PHASE_MODEL_V2_DOCTRINE.md` (P2 discontinue doctrine) |
| **Author** | Claude Code |

---

## P2 Canvas Interactions

### INT-WS-P2-01: Click baseline panel attest button

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-baseline-attest-btn` |
| **trigger** | `click` |
| **action** | `mutation` (attests baseline content as reviewed and accepted) |
| **state-change** | Baseline panel status badge changes: `draft → attested`; gate item `baseline_attested` toggles to checked |
| **side-effects** | Audit log: `{action: 'baseline_attested', by: userId, at: timestamp}`; Nexus notified that baseline is locked; gate re-evaluates |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p2-baseline-panel` header |
| **loading-treatment** | Button shows spinner while mutation completes |
| **error-treatment** | "Could not record attestation. Try again." inline error |

---

### INT-WS-P2-02: Add root cause (open add-root-cause form)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-root-cause-add-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (expands inline form to add a new root cause entry) |
| **state-change** | Inline add-root-cause form appears below existing root cause items |
| **side-effects** | none until saved |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | First field in the add-root-cause form |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-P2-03: Save new root cause

| Field | Value |
|---|---|
| **element-id** | Inline save button within add-root-cause form |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (creates root cause entry) |
| **state-change** | New root cause item appears in root cause panel; item count increments |
| **side-effects** | Root cause persisted; audit log: `{action: 'root_cause_added', id: ..., by: userId, at: timestamp}`; Nexus context updated (root causes are inputs to P3 design tracing) |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p2-root-cause-add-btn` |
| **loading-treatment** | Brief inline saving indicator |
| **error-treatment** | "Could not save root cause. Try again." inline error; form content preserved |

---

### INT-WS-P2-04: Click root cause item (view / edit)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-root-cause-item-{N}` |
| **trigger** | `click` |
| **action** | `panel-toggle` (expands inline edit form for that root cause entry) |
| **state-change** | Root cause item expands inline; fields become editable |
| **side-effects** | none until saved |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | First editable field in the expanded item |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-P2-05: Click gate item toggle (mark complete / incomplete)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-gate-item-{N}` |
| **trigger** | `click` |
| **action** | `mutation` (toggles gate item completion state) |
| **state-change** | Gate item `checked` state toggles; `gateState` re-evaluates: P2 gate has 5 hard items and 0 soft items, so `gateState` is `ready` only when ALL 5 are checked; otherwise `failing`. `partial` state is **not possible** for P2. |
| **side-effects** | Gate summary badge updates; promote button enabled/disabled; audit log: `{action: 'gate_item_toggled', phase: 2, item: N, checked: bool, by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Space` or `Enter` when item is focused |
| **focus-target** | `ws-canvas-p2-gate-item-{N}` (retains focus) |
| **loading-treatment** | Brief state update; gate summary re-renders |
| **error-treatment** | "Could not update gate item. Try again." inline message; item state reverts |

**Note:** P2 gate has 5 hard items and 0 soft items. The `partial` gateState is not possible for P2 — the gate is either `failing` (any hard item unchecked) or `ready` (all 5 checked). This is per the Layer 2 state matrix per-phase nuances.

---

### INT-WS-P2-06: Upload evidence to artifact shelf

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-artifact-shelf-upload-btn` |
| **trigger** | `click` |
| **action** | `modal-open` (opens file picker for evidence upload) |
| **state-change** | File picker opens; on selection, file queued for upload; on complete, artifact tile appears in shelf |
| **side-effects** | Evidence file stored; audit log: `{action: 'artifact_uploaded', phase: 2, filename: ..., by: userId, at: timestamp}`; artifact becomes available as supporting evidence for root causes and gate items; Nexus may reference it |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | File picker (OS dialog); on close, returns to `ws-canvas-p2-artifact-shelf-upload-btn` |
| **loading-treatment** | Upload progress indicator in shelf area |
| **error-treatment** | "Upload failed. Accepted formats: PDF, DOCX, XLSX, PPTX. Max size: Xmb." error message |

---

### INT-WS-P2-07: Click artifact tile (open evidence artifact)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-artifact-shelf-item-{N}` |
| **trigger** | `click` |
| **action** | `panel-toggle` (opens artifact preview) |
| **state-change** | Artifact preview panel opens; shows filename, upload date, uploader |
| **side-effects** | none |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | First focusable element in artifact preview panel |
| **loading-treatment** | Panel opens; artifact loads |
| **error-treatment** | "Could not load artifact." message within panel |

---

### INT-WS-P2-08: Click discontinue recommendation (discontinue banner CTA)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-discontinue-banner-action-btn` |
| **trigger** | `click` |
| **action** | `view-change` (scrolls decision panel into view and highlights the discontinue option) |
| **state-change** | Page scrolls to `ws-canvas-p2-decision-panel`; `ws-canvas-p2-decision-discontinue-option` is highlighted/selected as the recommended path |
| **side-effects** | Nexus may surface the evidence and rationale that triggered the recommendation |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p2-decision-discontinue-option` |
| **loading-treatment** | Smooth scroll to decision panel |
| **error-treatment** | none |

---

### INT-WS-P2-09: Click "override" link in discontinue banner

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-discontinue-banner-override-link` |
| **trigger** | `click` |
| **action** | `view-change` (scrolls to decision panel and highlights the continue option instead) |
| **state-change** | Page scrolls to decision panel; `ws-canvas-p2-decision-continue-option` is highlighted/selected |
| **side-effects** | Nexus may show "You're overriding a discontinue recommendation — document your rationale" coaching prompt |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p2-decision-continue-option` |
| **loading-treatment** | Smooth scroll |
| **error-treatment** | none |

---

### INT-WS-P2-10: Select decision outcome (continue or discontinue)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-decision-continue-option` or `ws-canvas-p2-decision-discontinue-option` |
| **trigger** | `click` |
| **action** | `panel-toggle` (selects the decision outcome; reveals rationale field) |
| **state-change** | Selected option becomes active/checked; `ws-canvas-p2-decision-rationale-field` becomes visible and focused |
| **side-effects** | Nexus may surface supporting data for the selected path |
| **url-impact** | `none` |
| **keyboard** | `Space` or `Enter` when option is focused |
| **focus-target** | `ws-canvas-p2-decision-rationale-field` |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-P2-11: Submit decision (confirm continue or discontinue)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-decision-confirm-btn` |
| **trigger** | `click` |
| **action** | `mutation` (records the P2 decision outcome) |
| **state-change** | If `continue`: `moveLifecycle` remains `active`; gate item `decision_recorded` toggles to checked; decision panel locks into read-only with selected outcome displayed. If `discontinue`: `moveLifecycle: active → discontinued`; canvas switches to discontinued state; promote button hidden; rail nodes beyond P2 grayed out. |
| **side-effects** | Audit log: `{action: 'p2_decision_submitted', outcome: 'continue' | 'discontinue', rationale: ..., by: userId, at: timestamp}`; notification to sponsor; Nexus context updated; if discontinue: move is archived |
| **url-impact** | `none` (discontinue does not change URL; the move record state changes) |
| **keyboard** | `Enter` when focused |
| **focus-target** | If continue: `ws-canvas-p2-gate-item-1` (gate panel); if discontinue: `ws-header-view-mode-banner` (discontinued state banner) |
| **loading-treatment** | Button shows spinner; "Recording decision..." text |
| **error-treatment** | "Could not record decision. Try again." error toast; decision state reverts; rationale preserved in field |

**Doctrine note (PHASE_MODEL_V2_DOCTRINE.md):** P2 discontinue is a first-class outcome, not an error state. When discontinued, the move enters a terminal state. The canvas should clearly communicate this (e.g., banner: "This move was discontinued at P2 Diagnose"). No further mutations are possible. The decision rationale is permanently recorded.

---

### INT-WS-P2-12: Click promote button (P2→P3)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p2-gate-promote-btn` |
| **trigger** | `click` |
| **action** | `mutation` (promotes move from P2 to P3) |
| **state-change** | `gateState: ready → promoted`; `phase: P2 → P3`; URL updates to `?phase=3` |
| **side-effects** | Gate evaluation runs (`evaluateGate(2, 3)`); if approved: phase changes, canvas switches to P3, rail node P3 becomes active, Nexus rescopes to P3 context; audit log: `{action: 'phase_promoted', fromPhase: 2, toPhase: 3, by: userId, at: timestamp}`; notification to sponsor |
| **url-impact** | `query-param` — URL updates to `?phase=3` |
| **keyboard** | `Enter` when button is focused |
| **focus-target** | `ws-canvas-p3` first focusable element |
| **loading-treatment** | Canvas-level loading state: "Advancing to P3 Design Future State..." |
| **error-treatment** | If gate evaluation fails: "Gate requirements not met. Review criteria." with gate panel scrolled into view |

**Note:** Promote button is only visible and enabled if `decision_recorded = continue`. If the recorded decision is `discontinue`, the promote button is permanently hidden.

---

## Self-QA

| Check | Status |
|---|---|
| All P2 canvas elements have interaction specs | PASS |
| Discontinue recommendation click documented (INT-WS-P2-08) | PASS |
| Override link in discontinue banner documented (INT-WS-P2-09) | PASS |
| Decision submission (continue / discontinue) fully documented | PASS |
| Discontinue terminal state documented per doctrine | PASS |
| Evidence upload (artifact shelf) documented | PASS |
| Root cause add and edit documented | PASS |
| Baseline attest interaction documented | PASS |
| P2 gate: no-partial rule stated explicitly | PASS |
| Keyboard equivalents specified | PASS |
| Loading and error treatment for all async interactions | PASS |
