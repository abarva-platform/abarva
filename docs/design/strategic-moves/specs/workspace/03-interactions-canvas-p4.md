# Workspace Canvas Interactions — P4 Roadmap phase

| | |
|---|---|
| **Work Package** | W-3.2 (P4) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-canvas-p4.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `01-anatomy-canvas-p4.md` · `02-state.md` (state names) · `PHASE_MODEL_V2_DOCTRINE.md` (Tower metric plan proactive surfacing) |
| **Author** | Claude Code |

---

## P4 Canvas Interactions

### INT-WS-P4-01: Add roadmap milestone

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-roadmap-add-milestone-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (expands inline form to add a milestone) |
| **state-change** | Add-milestone form appears; fields: title, due date, owner, dependencies |
| **side-effects** | none until saved |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | First field in add-milestone form |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-P4-02: Save roadmap milestone

| Field | Value |
|---|---|
| **element-id** | Inline save button within add-milestone form |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (creates milestone entry) |
| **state-change** | New milestone item appears in roadmap panel |
| **side-effects** | Audit log: `{action: 'milestone_added', id: ..., by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p4-roadmap-add-milestone-btn` |
| **loading-treatment** | Brief saving indicator |
| **error-treatment** | "Could not save milestone. Try again." inline error; form content preserved |

---

### INT-WS-P4-03: Click milestone item (view / edit)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-roadmap-milestone-{N}` |
| **trigger** | `click` |
| **action** | `panel-toggle` (expands inline edit form for that milestone) |
| **state-change** | Milestone item expands; fields become editable |
| **side-effects** | none until saved |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | First editable field in expanded milestone |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-P4-04: Approve ROM estimate (business case panel)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-business-case-approve-btn` |
| **trigger** | `click` |
| **action** | `mutation` (records sponsor approval of the ROM estimate) |
| **state-change** | Business case approval status changes: `pending → approved`; approve button swaps to "Approved" confirmation; gate item `business_case_approved` toggles to checked |
| **side-effects** | Audit log: `{action: 'business_case_approved', by: userId, at: timestamp}`; Nexus notified; gate re-evaluates |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p4-business-case-panel` header |
| **loading-treatment** | Button shows spinner while mutation completes |
| **error-treatment** | "Could not record approval. Try again." inline error |

**Note:** Only users with appropriate role (sponsor or above) can approve the business case. Role enforcement at the API layer; the button is hidden/disabled for users without approval authority.

---

### INT-WS-P4-05: Add value plan KPI entry

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-value-plan-add-kpi-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (expands inline form to add a KPI entry) |
| **state-change** | Add-KPI form appears; fields: metric name, baseline value, target value, measurement frequency, owner |
| **side-effects** | none until saved |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | First field in add-KPI form |
| **loading-treatment** | none |
| **error-treatment** | none |

---

### INT-WS-P4-06: Save value plan KPI entry

| Field | Value |
|---|---|
| **element-id** | Inline save button within add-KPI form (value plan) |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (creates KPI entry in value plan) |
| **state-change** | New KPI item appears in value plan panel |
| **side-effects** | Audit log: `{action: 'value_plan_kpi_added', id: ..., by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p4-value-plan-add-kpi-btn` |
| **loading-treatment** | Brief saving indicator |
| **error-treatment** | "Could not save KPI. Try again." inline error; form content preserved |

---

### INT-WS-P4-07: Add Tower metric plan KPI entry

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-tower-metric-plan-add-kpi-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (expands inline form to add a Tower-facing KPI entry) |
| **state-change** | Add-Tower-KPI form appears; fields: metric name, baseline, target, measurement cadence, Tower reporting owner |
| **side-effects** | none until saved |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | First field in add-Tower-KPI form |
| **loading-treatment** | none |
| **error-treatment** | none |

**Doctrine note (PHASE_MODEL_V2_DOCTRINE.md):** The Tower metric plan MUST be proactively surfaced to the user at mid-P4. The `ws-canvas-p4-tower-metric-plan-proactive-prompt-banner` is shown when the move reaches mid-P4 and the Tower metric plan has no entries. This interaction documents the CTA that dismisses that banner and opens this form.

---

### INT-WS-P4-08: Click Tower metric plan proactive prompt banner CTA

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-tower-metric-plan-proactive-prompt-banner` CTA button |
| **trigger** | `click` |
| **action** | `view-change` (scrolls Tower metric plan panel into view; collapses the prompt banner) |
| **state-change** | Page scrolls to `ws-canvas-p4-tower-metric-plan-panel`; `ws-canvas-p4-tower-metric-plan-add-kpi-btn` is highlighted; prompt banner collapses / dismisses |
| **side-effects** | Nexus may surface a message: "Tower will need measurable outcomes to track this move post-handoff. Define at least 3 KPIs here." |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p4-tower-metric-plan-add-kpi-btn` |
| **loading-treatment** | Smooth scroll |
| **error-treatment** | none |

---

### INT-WS-P4-09: Save Tower metric plan KPI entry

| Field | Value |
|---|---|
| **element-id** | Inline save button within add-Tower-KPI form |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (creates Tower-facing KPI entry) |
| **state-change** | New KPI item appears in Tower metric plan panel; if this is the first entry: `ws-canvas-p4-tower-metric-plan-proactive-prompt-banner` permanently hides |
| **side-effects** | Audit log: `{action: 'tower_metric_plan_kpi_added', id: ..., by: userId, at: timestamp}`; Tower notified (non-blocking) |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p4-tower-metric-plan-add-kpi-btn` |
| **loading-treatment** | Brief saving indicator |
| **error-treatment** | "Could not save Tower KPI. Try again." inline error; form content preserved |

---

### INT-WS-P4-10: Click gate item toggle (P4 gate)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-gate-item-{N}` |
| **trigger** | `click` |
| **action** | `mutation` (toggles gate item completion state) |
| **state-change** | Gate item `checked` state toggles; P4 gate has 11 items total (items 1–5 hard, items 6–11 soft per governance.ts); `gateState` re-evaluates: `ready` when all 5 hard checked; `partial` when hard checked but soft unchecked; `failing` when any hard item unchecked |
| **side-effects** | Gate summary badge updates; promote button enabled/disabled; audit log: `{action: 'gate_item_toggled', phase: 4, item: N, checked: bool, by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Space` or `Enter` when item is focused |
| **focus-target** | `ws-canvas-p4-gate-item-{N}` (retains focus) |
| **loading-treatment** | Brief state update; gate summary re-renders |
| **error-treatment** | "Could not update gate item. Try again." inline message |

---

### INT-WS-P4-11: Upload artifact to shelf

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-artifact-shelf-upload-btn` |
| **trigger** | `click` |
| **action** | `modal-open` (opens file picker) |
| **state-change** | File picker; on complete, artifact tile appears |
| **side-effects** | Audit log: `{action: 'artifact_uploaded', phase: 4, filename: ..., by: userId, at: timestamp}` |
| **url-impact** | `none` |
| **keyboard** | `Enter` or `Space` when focused |
| **focus-target** | File picker (OS dialog); on close, returns to upload button |
| **loading-treatment** | Upload progress indicator |
| **error-treatment** | "Upload failed. Accepted formats: PDF, DOCX, XLSX, PPTX. Max size: Xmb." |

---

### INT-WS-P4-12: Click promote button (P4→P5)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p4-gate-promote-btn` |
| **trigger** | `click` |
| **action** | `mutation` (promotes move from P4 to P5) |
| **state-change** | `gateState: ready → promoted`; `phase: P4 → P5`; URL updates to `?phase=5` |
| **side-effects** | Gate evaluation runs (`evaluateGate(4, 5)`); if approved: phase changes, canvas switches to P5, rail node P5 becomes active, Nexus rescopes to P5 context; audit log: `{action: 'phase_promoted', fromPhase: 4, toPhase: 5, by: userId, at: timestamp}` |
| **url-impact** | `query-param` — URL updates to `?phase=5` |
| **keyboard** | `Enter` when button is focused |
| **focus-target** | `ws-canvas-p5` first focusable element |
| **loading-treatment** | "Advancing to P5 Mobilize & Handoff..." |
| **error-treatment** | "Gate requirements not met. Review criteria." with gate panel in view |

---

## Self-QA

| Check | Status |
|---|---|
| All P4 canvas elements have interaction specs | PASS |
| Tower metric plan proactive prompt banner CTA documented | PASS |
| Tower metric plan KPI add and save documented | PASS |
| Doctrine note on Tower metric plan proactive surfacing included | PASS |
| Business case approve interaction documented | PASS |
| Value plan KPI add/save documented | PASS |
| Roadmap milestone add/save/edit documented | PASS |
| P4 gate (11 items: 5 hard / 6 soft, partial possible) documented | PASS |
| Artifact upload documented | PASS |
| Promote P4→P5 documented | PASS |
