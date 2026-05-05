# Workspace Canvas Interactions — P0 Originate context

| | |
|---|---|
| **Work Package** | W-3.2 (P0) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-canvas-p0.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `01-anatomy-canvas-p0.md` · `02-state.md` (state names) |
| **Author** | Claude Code |

---

## P0 Canvas Interactions

### INT-WS-P0-01: Click section edit button

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p0-brief-section-{N}-edit-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (enters inline edit mode) |
| **state-change** | Section content field becomes editable; edit button changes to "Save" / "Cancel" |
| **side-effects** | Nexus may show coaching message if content significantly changes |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p0-brief-section-{N}-content` |
| **loading-treatment** | none (immediate) |
| **error-treatment** | none (edit is client-side until saved) |

---

### INT-WS-P0-02: Save section edit

| Field | Value |
|---|---|
| **element-id** | Save action within edit mode (inline button) |
| **trigger** | `click` or `keyboard` |
| **action** | `mutation` (saves brief section content) |
| **state-change** | Section content updated; edit mode closes; section status may update |
| **side-effects** | Auto-save to database; audit log: `{action: 'brief_section_updated', section: N, by: userId, at: timestamp, prev: ..., next: ...}`; Nexus context updated |
| **url-impact** | `none` |
| **keyboard** | `Cmd+Enter` or `Ctrl+Enter` to save |
| **focus-target** | `ws-canvas-p0-brief-section-{N}-edit-btn` (returns to edit button) |
| **loading-treatment** | Brief saving indicator on the section |
| **error-treatment** | "Could not save changes. Try again." inline error; content preserved in field |

---

### INT-WS-P0-03: Click promote button (P0→P1)

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p0-promote-bar-promote-btn` |
| **trigger** | `click` |
| **action** | `mutation` (promotes move from P0 to P1) |
| **state-change** | `gateState: ready → promoted`; `phase: P0 → P1`; `moveLifecycle: drafting → active`; URL updates to `?phase=1` |
| **side-effects** | Gate evaluation runs (`evaluateGate(0, 1)`); if approved: phase changes, canvas switches to P1, rail node P1 becomes active, Nexus rescopes to P1 context; audit log: `{action: 'phase_promoted', fromPhase: 0, toPhase: 1, by: userId, at: timestamp}`; notification to sponsor |
| **url-impact** | `query-param` — URL updates to `?phase=1` |
| **keyboard** | `Enter` when button is focused |
| **focus-target** | `ws-canvas-p1` first focusable element |
| **loading-treatment** | Full-screen or canvas-level loading state: "Promoting to P1 Charter..." |
| **error-treatment** | If gate evaluation fails: "Gate requirements not met. Review criteria." with gate panel scrolled into view |

---

### INT-WS-P0-04: Toggle post-P0 edit mode

| Field | Value |
|---|---|
| **element-id** | `ws-canvas-p0-edit-btn` |
| **trigger** | `click` |
| **action** | `panel-toggle` (enables editing of all brief sections) |
| **state-change** | All `ws-canvas-p0-brief-section-{N}-edit-btn` elements become visible and active |
| **side-effects** | Nexus may show "You're editing a promoted brief — changes will be reflected in the move record" |
| **url-impact** | `none` |
| **keyboard** | `Enter` when focused |
| **focus-target** | `ws-canvas-p0-brief-section-1-edit-btn` |
| **loading-treatment** | none |
| **error-treatment** | none |
