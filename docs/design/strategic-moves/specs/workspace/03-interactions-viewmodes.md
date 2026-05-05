# Workspace Interactions — View Mode Variants (past / future / handed-off)

| | |
|---|---|
| **Work Package** | W-3.3 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/03-interactions-viewmodes.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-3.7 sign-off |
| **References** | `01-anatomy-viewmodes.md` · `02-state.md` (viewMode state) · `03-interactions-shell.md` (INT-WS-R-*, INT-WS-VMB-01) |
| **Author** | Claude Code |

---

## Overview

This document specifies the interaction behavior that is **specific to non-current view modes** — i.e., what changes when the user is in `past`, `future`, or `handed-off` mode as opposed to `current`. Base interactions (canvas edits, gate toggles, promote) are specified in per-phase canvas interaction files. This document focuses on:

1. How to enter each non-current mode
2. What interactions are disabled/enabled in each mode
3. How to exit the mode (return to `current`)
4. Mode-specific edge cases

---

## 1 · Entering `past` mode

**Trigger:** Click on a past phase node on the rail (`ws-rail-phase-node-p{N}` where N < current active phase).

**Interaction spec:** INT-WS-R-02 (in `03-interactions-shell.md`).

**What changes on entering `past` mode:**

| Element | `current` state | `past` mode state |
|---|---|---|
| `ws-header-view-mode-banner` | Hidden | Visible; label: "Viewing P{N} — past state (read only)" |
| `ws-header-return-to-current-link` | Hidden | Visible |
| `ws-identity-eyebrow` | Current active phase | Name of viewed past phase |
| `ws-chat-input-field` | Enabled | Disabled |
| `ws-chat-attach-button` | Enabled | Disabled |
| `ws-chat-send-button` | Enabled | Disabled |
| `ws-chat-chip-list` | Visible; interactive | Hidden |
| `ws-chat-message-list` | Live conversation | Read-only past phase conversation replay |
| All canvas `-edit-btn` elements | Visible; interactive | Hidden |
| All canvas gate promote buttons | Visible (if gateState ready) | Hidden |
| `ws-sponsor-strip-action-btn` | Visible; interactive | Hidden |
| `ws-canvas-readonly-overlay` | Hidden | Visible |

**No URL change** on entering past mode via rail click (D-10 resolution — see `03-interactions-shell.md`).

---

## 2 · Entering `future` mode

**Trigger:** Click on a future phase node on the rail (`ws-rail-phase-node-p{N}` where N > current active phase).

**Interaction spec:** INT-WS-R-03 (in `03-interactions-shell.md`).

**What changes on entering `future` mode:**

| Element | `current` state | `future` mode state |
|---|---|---|
| `ws-header-view-mode-banner` | Hidden | Visible; label: "Previewing P{N} — not yet reached" |
| `ws-header-return-to-current-link` | Hidden | Visible |
| `ws-identity-eyebrow` | Current active phase | Name of viewed future phase |
| `ws-chat-input-field` | Enabled | **Enabled** (user can ask Nexus preview questions) |
| `ws-chat-attach-button` | Enabled | Disabled |
| `ws-chat-send-button` | Enabled when field has content | Enabled when field has content |
| `ws-chat-chip-list` | Visible; interactive | Hidden |
| `ws-chat-message-list` | Live conversation | Nexus future-phase preview message |
| All canvas `-edit-btn` elements | Visible; interactive | Hidden |
| All canvas gate promote buttons | Visible (if ready) | Hidden |
| `ws-sponsor-strip-action-btn` | Visible; interactive | Hidden |
| `ws-canvas-readonly-overlay` | Hidden | **Hidden** (future mode does NOT show read-only overlay — the canvas shows preview/skeleton content, not a past snapshot) |

**Future mode chat is interactive:** The user can ask "what will P3 involve?" and Nexus provides a forward-looking preview. This is the design intent. Mutations (edits to canvas content) are not possible, but the chat lane is live.

**No URL change** on entering future mode via rail click (D-10 resolution).

---

## 3 · Entering `handed-off` mode

**Trigger:** Not a user interaction — entered automatically when `moveLifecycle = handed_off` (i.e., after the handoff button is clicked in P5 and the mutation completes). See INT-WS-P5-11.

**What changes in `handed-off` mode:**

| Element | `active` state | `handed-off` mode state |
|---|---|---|
| `ws-header-view-mode-banner` | Hidden | Visible; label: "This move has been handed to Tower" |
| `ws-header-return-to-current-link` | Hidden | **Hidden** (no current active phase to return to) |
| `ws-rail-tower-indicator` | Non-interactive label | Active Tower badge; no click handler |
| `ws-identity-status-pill` | Active / Paused | "Handed Off" (blue/neutral) |
| `ws-chat-input-field` | Enabled | Disabled |
| `ws-chat-message-list` | Live | Final P5 conversation state (read-only) |
| All canvas `-edit-btn` elements | Interactive | Hidden |
| All canvas gate/handoff buttons | Interactive | Hidden |
| `ws-sponsor-strip-action-btn` | Interactive | Hidden |
| `ws-canvas-readonly-overlay` | Hidden | Visible |

**No URL change** on entering handed-off mode. The route is `?phase=5` (or base URL); the `handed-off` state is inferred from `moveLifecycle`.

---

## 4 · Exiting non-current modes (returning to `current`)

### Via banner link

**Interaction spec:** INT-WS-VMB-01 (in `03-interactions-shell.md`).

- Clicking `ws-header-return-to-current-link` in `past` or `future` mode returns to `current` mode.
- All elements listed above revert to `current` state.
- Chat lane reloads live conversation.
- Canvas reloads active phase.
- No URL change.

### Via rail click on the active phase node

Clicking the currently active phase node when in `past` or `future` mode returns to `current` mode. The click on the active node itself is no-op (INT-WS-R-01), but the rail node switching logic handles this as a `viewMode → current` transition.

### `handed-off` mode cannot be exited

Once `moveLifecycle = handed_off`, the Workspace permanently shows the `handed-off` view. There is no "return to current" because the move has no current active phase. The rail nodes remain clickable for read-only replay of past phases.

---

## 5 · View mode interaction constraints summary

| Interaction type | `current` | `past` | `future` | `handed-off` |
|---|---|---|---|---|
| Canvas content edit | Allowed | Blocked | Blocked | Blocked |
| Gate item toggle | Allowed | Blocked | Blocked | Blocked |
| Promote/advance/handoff | Allowed (if gate ready) | Blocked | Blocked | Blocked |
| Chat message send | Allowed | Blocked | **Allowed** | Blocked |
| Artifact upload | Allowed | Blocked | Blocked | Blocked |
| Artifact view/open | Allowed | Allowed | Allowed | Allowed |
| Sponsor signoff request | Allowed | Blocked | Blocked | Blocked |
| Rail navigation | Allowed (past/future nodes) | Allowed | Allowed | Allowed (read-only replay) |
| Breadcrumb navigation | Allowed | Allowed | Allowed | Allowed |

---

## Self-QA

| Check | Status |
|---|---|
| All 4 view modes documented | PASS |
| Entry triggers for each non-current mode specified | PASS |
| Element-by-element behavior delta from `current` specified | PASS |
| Future mode chat lane interactive behavior explicitly documented | PASS |
| handed-off mode irreversibility noted | PASS |
| Return-to-current paths documented (banner + rail click on active node) | PASS |
| URL behavior for each mode noted (no URL change on rail clicks, D-10) | PASS |
| readonly-overlay absent in future mode (and why) noted | PASS |
