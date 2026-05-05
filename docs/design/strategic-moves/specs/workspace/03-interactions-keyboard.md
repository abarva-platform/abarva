# Workspace Keyboard Navigation — tab order, focus management, shortcuts

| | |
|---|---|
| **Work Package** | W-3.5 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-keyboard.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `01-anatomy-shell.md` · `01-anatomy-viewmodes.md` · Per-phase interaction files (keyboard fields) |
| **Author** | Claude Code |

---

## Overview

This document consolidates keyboard navigation rules for the Workspace page. It covers:

1. Page-level tab order
2. Rail keyboard navigation
3. Chat lane keyboard behavior
4. Canvas keyboard behavior
5. Focus management on state transitions
6. Global shortcuts

All individual interaction keyboard bindings are specified in the per-element interaction docs. This document provides the structural view.

---

## 1 · Page-level tab order

The Workspace page tab order follows the visual layout: top-to-bottom, left-to-right within each zone. The broad tab stop regions are:

1. `ws-nav` (global navigation links)
2. `ws-breadcrumb-portfolio-link`
3. `ws-identity` region (read-only; `tabindex="-1"` unless status pill is interactive)
4. `ws-rail` region (phase nodes, each a tab stop)
5. `ws-header-view-mode-banner` → `ws-header-return-to-current-link` (visible only in non-current modes)
6. `ws-chat` region: `ws-chat-input-field`, chip buttons, attach button, send button
7. `ws-canvas-p{N}` region: panels in visual order, with section edit buttons, gate items, and action buttons

**Skip links:** A "Skip to canvas" link should be included as the first focusable element (visually hidden until focused) to allow keyboard users to bypass the nav and rail. Element ID: `ws-skip-to-canvas-link`.

---

## 2 · Rail keyboard navigation

The rail (`ws-rail`) uses a roving tabindex pattern:

- Tab moves focus into the rail (lands on the currently active node or the first node).
- Arrow Left / Arrow Right move focus between phase nodes within the rail.
- Arrow Left / Arrow Right do NOT wrap (reaching P0 on the left or P5/Tower on the right is a stop).
- `Enter` or `Space` activates the focused node (same as click).
- Tab moves focus out of the rail to the next tab stop in page order.

Only ONE rail node is in the tab sequence at a time (roving tabindex). The tab-reachable node is the currently active phase node by default; when the user arrow-navigates within the rail, the focused node becomes tab-reachable.

**Tower indicator (`ws-rail-tower-indicator`):** `aria-hidden="true"` or `role="presentation"`. Not focusable. Not a tab stop.

---

## 3 · Chat lane keyboard behavior

| Shortcut | Element | Behavior |
|---|---|---|
| `Enter` | `ws-chat-input-field` | Send message (if field has content; does NOT send if `Shift` is held) |
| `Shift+Enter` | `ws-chat-input-field` | Insert newline (grows input area) |
| `Enter` or `Space` | `ws-chat-chip-{N}` | Activate chip (fill input or send) |
| `Enter` or `Space` | `ws-chat-attach-button` | Open file picker |
| `Enter` | `ws-chat-send-button` | Send message |

In `past` and `handed-off` modes, `ws-chat-input-field` is disabled (`tabindex="-1"`; cannot receive focus). Focus skips directly from the last interactive element before the chat lane to the canvas.

In `future` mode, chat input is enabled and receives focus normally.

---

## 4 · Canvas keyboard behavior

### 4.1 Section / panel edit buttons

- Tab to `ws-canvas-p{N}-{section}-edit-btn`.
- `Enter` activates inline edit mode.
- Inside edit mode: Tab navigates between fields; `Cmd+Enter` / `Ctrl+Enter` saves; `Escape` cancels.
- On save or cancel: focus returns to the edit button (`ws-canvas-p{N}-{section}-edit-btn`).

### 4.2 Gate items

- Tab to gate item (`ws-canvas-p{N}-gate-item-{M}`).
- `Space` or `Enter` toggles checked state.
- Tab continues to next gate item.

### 4.3 Promote / advance / handoff buttons

- Tab to promote/advance/handoff button.
- `Enter` activates.
- During async loading: button is disabled (removed from tab order temporarily).
- On completion: focus moves to first focusable element in the new phase canvas.

### 4.4 Modal / panel (file picker, artifact preview, signoff panel)

When a modal or panel opens:
- Focus moves to the first focusable element inside the modal/panel.
- Focus is **trapped** within the modal/panel (Tab cycles within it; Shift+Tab cycles backwards).
- `Escape` closes the modal/panel.
- On close: focus returns to the trigger element that opened it.

### 4.5 Inline forms (add root cause, add risk, add milestone, add KPI)

- Tab to the inline form's first field on open.
- Tab navigates between form fields.
- `Cmd+Enter` / `Ctrl+Enter` saves.
- `Escape` cancels and collapses the form.
- On save: focus returns to the "Add" button.
- On cancel: focus returns to the "Add" button.

---

## 5 · Focus management on state transitions

### 5.1 Rail click → view mode change

On clicking a past/future rail node, focus moves to `ws-canvas-p{N}` first focusable element in the newly loaded phase canvas.

### 5.2 Return to current (banner link)

On clicking `ws-header-return-to-current-link`, focus moves to `ws-canvas-p{activePhase}` first focusable element.

### 5.3 Promote / phase advance

On successful promote, focus moves to `ws-canvas-p{N+1}` first focusable element.

### 5.4 Error toast

Error toasts (`role="alert"`, `aria-live="assertive"`) are announced by screen readers immediately. They do not receive keyboard focus; the user's focus remains on the triggering element.

### 5.5 Inline save/cancel

On save: focus returns to the section's edit button.
On cancel: focus returns to the section's edit button.

### 5.6 Page load with `?phase=N`

On page load, focus lands on `document.body` or the first focusable element in `ws-nav` (default browser behavior). A skip link allows immediate jump to the canvas.

---

## 6 · Global keyboard shortcuts

| Shortcut | Action | Scope |
|---|---|---|
| `?` | Open keyboard shortcut help overlay | Global (page) |
| `Cmd+K` / `Ctrl+K` | Focus `ws-chat-input-field` (Nexus chat quick-focus) | Global (page) |
| `Escape` | Close open modal / collapse open inline form / cancel edit mode | Active modal / panel / form |

**Note on `Cmd+K`:** This shortcut is the "talk to Nexus" quick-access shortcut. If the chat lane input is already focused, `Cmd+K` is a no-op. In `past` and `handed-off` modes where chat is disabled, `Cmd+K` is a no-op.

---

## 7 · ARIA roles and labelling

| Element | ARIA role | Label |
|---|---|---|
| `ws-rail` | `tablist` or `navigation` with `aria-label="Phase navigation"` | "Phase navigation" |
| `ws-rail-phase-node-p{N}` | `tab` or `button` | "P{N} {phase-name}" + state (e.g., "active", "completed", "future") |
| `ws-canvas-p{N}` | `region` | `aria-label="P{N} {phase-name} canvas"` |
| `ws-chat` | `region` | `aria-label="Nexus conversation"` |
| `ws-header-view-mode-banner` | `status` or `banner` | Announced via `aria-live="polite"` on mode change |
| `ws-canvas-p{N}-gate-item-{M}` | `checkbox` | Gate item label text |
| Error toasts | `alert` | `aria-live="assertive"` |
| Skip link | `link` | "Skip to main content" |

---

## Self-QA

| Check | Status |
|---|---|
| Page-level tab order documented | PASS |
| Rail roving tabindex pattern specified | PASS |
| Chat lane keyboard behavior (Enter to send, Shift+Enter for newline) documented | PASS |
| Canvas edit mode keyboard (Cmd+Enter save, Escape cancel, focus return) documented | PASS |
| Modal focus trap and Escape behavior documented | PASS |
| Inline form keyboard (Cmd+Enter, Escape, focus return) documented | PASS |
| Focus management on all state transitions documented | PASS |
| Global shortcuts (Cmd+K, ?) documented | PASS |
| ARIA roles and labels specified | PASS |
| Skip link specified | PASS |
