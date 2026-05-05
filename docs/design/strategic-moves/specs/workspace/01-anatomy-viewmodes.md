# Workspace Anatomy — View Mode Variants

| | |
|---|---|
| **Work Package** | W-1.3, W-1.4, W-1.5 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/01-anatomy-viewmodes.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-1.5 sign-off |
| **Reference** | `docs/design/strategic-moves/15-workspace-v0.2.html` (4 view modes) |
| **Companion** | `01-anatomy-shell.md` + `01-anatomy-canvas-p{N}.md` (base element IDs) |
| **Author** | Claude Code |

---

## Overview

The Workspace page operates in four view modes. The view mode changes which elements are visible, enabled, disabled, or hidden — but it does NOT change element IDs. The same stable ID is used regardless of view mode (per `STABLE_ID_CONVENTION.md §4.3`).

This document specifies per-mode behavior for every shell and canvas element that behaves differently across modes.

---

## 1 · View Mode Definitions

| Mode | Description | URL behavior |
|---|---|---|
| `current` | User is working the move's current active phase. All interactive elements enabled per gate state and user role. | Base URL `/strategic-moves/[moveId]` with optional `?phase=N` if arrived via deep link. |
| `past` | User has clicked a previously completed phase node on the rail to review it. No mutations allowed. | No URL change from rail click (D-10). `?phase=N` present only if arrived via deep link. |
| `future` | User has clicked a future (not yet reached) phase node on the rail to preview. No mutations allowed. Nexus shows a preview. | No URL change from rail click (D-10). |
| `handed-off` | The move has been handed to Tower (P5→Tower complete). All content read-only. Tower badge visible. | Base URL. `moveLifecycle = handed_off`. |

---

## 2 · Shell Elements — View Mode Behavior

### 2.1 App navigation (`ws-nav`)

| Mode | Behavior |
|---|---|
| `current` | Visible, fully interactive |
| `past` | Visible, fully interactive |
| `future` | Visible, fully interactive |
| `handed-off` | Visible, fully interactive |

Navigation bar is unaffected by view mode.

---

### 2.2 Breadcrumb (`ws-breadcrumb`, `ws-breadcrumb-portfolio-link`, `ws-breadcrumb-move-name`)

| Mode | Behavior |
|---|---|
| `current` | Visible. Portfolio link clickable. Move name = current move. |
| `past` | Visible. Same as current. |
| `future` | Visible. Same as current. |
| `handed-off` | Visible. Move name may show " (Handed Off)" suffix. |

---

### 2.3 Identity card (`ws-identity` and children)

| Element | `current` | `past` | `future` | `handed-off` |
|---|---|---|---|---|
| `ws-identity` | Visible | Visible | Visible | Visible |
| `ws-identity-eyebrow` | Shows current active phase short label | Shows name of **viewed** phase (past phase being reviewed) | Shows name of **viewed** phase (future phase being previewed) | Shows "P5 Mobilize" (or last phase) |
| `ws-identity-title` | Current move title | Current move title | Current move title | Current move title |
| `ws-identity-status-pill` | Active / Paused | Shows "Reviewing Past" supplementary indicator | Shows "Previewing Future" supplementary indicator | "Handed Off" status |
| `ws-identity-phase-label` | Full name of current active phase | Full name of viewed past phase | Full name of viewed future phase | Full name of last phase (P5) |
| `ws-identity-value-at-stake` | Visible if set | Visible if set | Visible if set | Visible if set |

---

### 2.4 Phase rail (`ws-rail` and nodes)

| Element | `current` | `past` | `future` | `handed-off` |
|---|---|---|---|---|
| `ws-rail` | Visible | Visible | Visible | Visible |
| Completed phase nodes (before active) | Visible; clickable (switches to `past` mode) | Visible; clickable (switches to another past phase) | Visible; clickable | Visible; clickable (read-only replay) |
| Active phase node (current phase) | Highlighted/glowing; click = no-op | Not active — another node is highlighted | Not active | Completed state (move is handed off) |
| Future phase nodes (beyond active) | Visible; clickable (switches to `future` mode) | Visible; clickable (switches to `future`) | Visible; another future node may be highlighted | All nodes show completed or handed-off state |
| `ws-rail-tower-indicator` | Visible; non-interactive | Visible; non-interactive | Visible; non-interactive | Visible; Tower badge active (move is in Tower) |
| Rail connectors | Segment between completed phases is filled/solid; segments to future phases are muted | Same as current | Same as current | All segments filled (all phases done) |

---

### 2.5 View mode banner (conditional element)

| Field | Value |
|---|---|
| **ID** | `ws-header-view-mode-banner` |
| **Element type** | Banner |
| **Parent** | `ws-page` (appears between rail and grid) |
| **Visibility** | Visible ONLY in `past`, `future`, and `handed-off` modes. Hidden in `current` mode. |

**Description:** A banner communicating to the user that they are not in the current working phase. Prevents confusion about why the canvas is read-only.

**Sub-elements:**

| Sub-element ID | Type | Description |
|---|---|---|
| `ws-header-view-mode-label` | Label | Context message. Examples: "Viewing P1 Charter — past state (read only)" / "Previewing P3 Design — not yet reached" / "This move has been handed to Tower" |
| `ws-header-return-to-current-link` | Link | "Return to P{N} [Phase Name]" — navigates back to current active phase. Hidden in `handed-off` mode (move is complete, no "current" to return to). |

---

### 2.6 Workspace grid (`ws-grid`)

| Mode | Behavior |
|---|---|
| `current` | Two columns: chat lane + phase canvas. Both fully interactive per gateState and userRole. |
| `past` | Two columns. Canvas is read-only (overlay prevents editing). Chat lane loads read-only replay of conversation context for that past phase. |
| `future` | Two columns. Canvas shows preview content (what this phase will look like). Chat lane shows Nexus preview message. |
| `handed-off` | Two columns. Both fully read-only. Tower badge visible on canvas. |

---

### 2.7 Chat lane (`ws-chat` and children)

| Element | `current` | `past` | `future` | `handed-off` |
|---|---|---|---|---|
| `ws-chat` | Visible; interactive | Visible; read-only replay mode | Visible; preview mode | Visible; read-only |
| `ws-chat-header` | Shows "Nexus · {current phase}" | Shows "Nexus · {past phase} (read only)" | Shows "Nexus · {future phase} (preview)" | Shows "Nexus · {last phase} (handed off)" |
| `ws-chat-message-list` | Current conversation | Past phase conversation replay (read-only) | Nexus preview message | Final conversation state (read-only) |
| `ws-chat-chip-list` | Visible; chips interactive | Hidden — no actionable chips in past view | Hidden — no actionable chips | Hidden |
| `ws-chat-input-area` | Visible; interactive | Visible but DISABLED — input grayed, non-interactive | Visible; **enabled** (user can ask Nexus questions in preview mode) | Visible but DISABLED |
| `ws-chat-input-field` | Enabled | Disabled | Enabled | Disabled |
| `ws-chat-attach-button` | Enabled | Disabled | Disabled | Disabled |
| `ws-chat-send-button` | Enabled when field has content | Disabled | Enabled when field has content | Disabled |

**Note on `future` mode chat:** The chat lane remains interactive in `future` view mode — the user can ask Nexus "what will this phase involve?" and Nexus responds with a preview. This is the design intent of `future` mode: not fully locked, but no mutations.

---

### 2.8 Sponsor strip (`ws-sponsor-strip` and children)

| Element | `current` | `past` | `future` | `handed-off` |
|---|---|---|---|---|
| `ws-sponsor-strip` | Visible if sponsor assigned | Visible if sponsor was assigned at that past phase | Visible if sponsor assigned | Visible; read-only |
| `ws-sponsor-strip-name` | Visible | Visible | Visible | Visible |
| `ws-sponsor-strip-role` | Visible | Visible | Visible | Visible |
| `ws-sponsor-strip-status` | Visible | Visible | Visible | Visible |
| `ws-sponsor-strip-action-btn` | Visible; interactive | **Hidden** — no signoff actions in past view | **Hidden** — no signoff actions in future view | **Hidden** — move is complete |

---

## 3 · Canvas Elements — View Mode Behavior

The canvas switches content based on viewed phase. The visibility/enabled behavior of canvas elements follows a uniform pattern across all phase canvases (P0–P5).

### 3.1 Uniform canvas behavior rules

| Element category | `current` | `past` | `future` | `handed-off` |
|---|---|---|---|---|
| Content panels (baseline, charter sections, design panels, etc.) | Visible; editable | Visible; **read-only** | Visible; **read-only** (preview/skeleton content) | Visible; **read-only** |
| Section edit buttons (`-edit-btn`) | Visible; interactive | **Hidden** | **Hidden** | **Hidden** |
| Sign-off / attest buttons | Visible; interactive (per role) | **Hidden** | **Hidden** | **Hidden** |
| Gate panel (`-gate-panel`) | Visible; gate items interactive | Visible; **read-only** (shows historical gate state at time of promotion) | Visible; **read-only** (shows criteria the phase will require) | Visible; **read-only** |
| Gate promote button (`-gate-promote-btn`) | Visible; enabled when `gateState = ready` | **Hidden** | **Hidden** | **Hidden** |
| P5 handoff button (`-gate-handoff-btn`) | Visible; enabled when Tower accepted | **Hidden** | **Hidden** | **Hidden** |
| Artifact shelf | Visible; upload button present | Visible; upload button **hidden** | Visible; upload button **hidden** | Visible; upload button **hidden** |
| Decision panel (P2 only) | Visible; interactive | Visible; read-only (shows historical decision) | Visible; shows decision preview placeholder | Visible; read-only |
| Discontinue banner (P2 only) | Visible when recommended | Visible if it was present | **Hidden** | Visible if it was present |

### 3.2 Canvas read-only overlay

| Field | Value |
|---|---|
| **ID** | `ws-canvas-readonly-overlay` |
| **Element type** | Overlay (visual indicator) |
| **Parent** | The active phase canvas container (e.g., `ws-canvas-p2`) |
| **Visibility** | Visible in `past` and `handed-off` view modes. Hidden in `current` and `future`. |

**Description:** A subtle visual treatment applied to the canvas content in `past` and `handed-off` modes that communicates read-only state. Not a blocking modal — the content remains readable. Could be implemented as a slightly reduced opacity, a border treatment, or a top-of-canvas badge ("Viewing past state"). Does NOT appear in `future` mode — future mode shows preview content without a read-only overlay since it hasn't existed yet.

---

## 4 · Phase P0 special case

Phase P0 has **no `past` view**. The user cannot navigate to "before P0" — P0 is the starting point of the move. When viewing the Workspace from P1 or later, clicking the P0 rail node switches to P0 canvas in `past` mode (user is reviewing the origination brief). This is not an exception to the rule — it is the normal `past` view behavior applied to P0. The exception is that there is no phase before P0 to navigate to.

Behavioral rule: `ws-rail-phase-node-p0` in the Workspace is clickable from any phase context (to review the origination brief in `past` mode). It is never disabled, except in `handed-off` mode when all nodes become read-only replay.

---

## 5 · Handed-off mode — Tower badge

When `viewMode = handed-off`:
- `ws-rail-tower-indicator` changes from a non-interactive label to a **visual badge** indicating the move is actively in Tower.
- `ws-identity-status-pill` shows "Handed Off" (blue/neutral).
- All canvas content is read-only.
- The chat lane shows the final P5 conversation state (read-only).
- No promote or gate actions are available anywhere.
- A top-of-page banner (`ws-header-view-mode-banner` with label "This move has been handed to Tower") replaces the normal view-mode banner.

---

## 6 · Self-QA

| Check | Status |
|---|---|
| All 4 view modes defined | PASS |
| Per-mode behavior specified for all shell elements | PASS |
| Per-mode behavior specified for all canvas element categories | PASS |
| Chat lane behavior in future mode (interactive) explicitly stated | PASS |
| Phase P0 special case documented | PASS |
| Handed-off mode Tower badge documented | PASS |
| Read-only overlay element ID defined (`ws-canvas-readonly-overlay`) | PASS |
| View-mode banner elements defined (`ws-header-view-mode-banner`, children) | PASS |
| No state encoding in IDs | PASS |
