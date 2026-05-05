# Workspace Canvas Anatomy — P0 Originate context

| | |
|---|---|
| **Work Package** | W-1.2 (P0) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/01-anatomy-canvas-p0.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-1.5 sign-off |
| **Reference** | `docs/design/strategic-moves/16-flow-cascade.html` Flow 1 (Workspace) |
| **Companion** | `01-anatomy-shell.md` (shell IDs), `SPEC_METHODOLOGY.md` §2.1 |
| **Author** | Claude Code |

---

## Overview

This document inventories the canvas elements visible when the Workspace page is in **P0 Originate context** — either because the move's current phase is P0, or because the user clicked the P0 rail node to review it in `past` view mode.

The P0 canvas shows the origination brief: the same 7 sections authored on the Originate page (`/strategic-moves/new`), now surfaced as a read-with-edit canvas in the Workspace. The user may amend the brief after P0 even if the move has been promoted to P1+.

Shell elements (nav, rail, chat lane, sponsor strip, identity) are documented in `01-anatomy-shell.md`.

---

## P0.1 Canvas container

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p0` |
| **Element type** | Zone |
| **Parent** | `ws-grid` |
| **Visibility** | When `viewMode = current` and `phase = P0`, or when user navigates to P0 via rail in `past` view mode |

**Description:** Root container for P0 canvas content within the workspace right column.

---

## P0.2 Brief sections (×7)

The P0 canvas surfaces the same 7 brief sections as the Originate page. Users can view and edit the origination brief content here.

### P0.2.1 Brief section — generic pattern

**Pattern applies to:** `ws-canvas-p0-brief-section-1` through `ws-canvas-p0-brief-section-7`

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p0-brief-section-{1..7}` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p0` |
| **Visibility** | Always when `ws-canvas-p0` is active |

**Description:** The 7 brief section panels correspond to the P0 scaffold steps:

| Instance | Topic |
|---|---|
| `ws-canvas-p0-brief-section-1` | What's the bet / hypothesis |
| `ws-canvas-p0-brief-section-2` | Archetype classification |
| `ws-canvas-p0-brief-section-3` | Sponsor candidate |
| `ws-canvas-p0-brief-section-4` | Scope / boundary |
| `ws-canvas-p0-brief-section-5` | Evidence family selection |
| `ws-canvas-p0-brief-section-6` | Value hypothesis seed |
| `ws-canvas-p0-brief-section-7` | Foundation readiness (F1–F4 checks) |

**Sub-elements per section (cross-cutting pattern):**

| Sub-element ID | Type | Description |
|---|---|---|
| `ws-canvas-p0-brief-section-{N}-label` | Label | Section title heading |
| `ws-canvas-p0-brief-section-{N}-content` | Field (editable) | Captured/extracted content; editable when `viewMode = current` |
| `ws-canvas-p0-brief-section-{N}-status` | Icon | Completion status: `empty` / `in-progress` / `complete` |
| `ws-canvas-p0-brief-section-{N}-edit-btn` | Button | Inline edit trigger; visible when `viewMode = current` and section not `empty` |

**Brief section 7 additional sub-elements (F1–F4):**

| Sub-element ID | Type | Description |
|---|---|---|
| `ws-canvas-p0-brief-section-7-f1` | Field | F1 foundation readiness check result |
| `ws-canvas-p0-brief-section-7-f2` | Field | F2 foundation readiness check result |
| `ws-canvas-p0-brief-section-7-f3` | Field | F3 foundation readiness check result |
| `ws-canvas-p0-brief-section-7-f4` | Field | F4 foundation readiness check result |

---

## P0.3 Promote bar

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p0-promote-bar` |
| **Element type** | Zone (bar) |
| **Parent** | `ws-canvas-p0` |
| **Visibility** | When `ws-canvas-p0` is active AND `viewMode = current` AND `moveLifecycle` is `drafting` or `active` at P0 |

**Description:** Bottom bar of the P0 canvas showing gate progress and the promote-to-P1 action. Hidden in `past` view mode (move has already been promoted). Also hidden if `moveLifecycle = handed-off` or `archived`.

**Children:**

### P0.3.1 Gate summary

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p0-promote-bar-gate-summary` |
| **Element type** | Label |
| **Parent** | `ws-canvas-p0-promote-bar` |

**Fields:**
- `complete_count`: Integer 0–7
- `display_text`: "{N} of 7 sections complete"

### P0.3.2 Promote button

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p0-promote-bar-promote-btn` |
| **Element type** | Button (primary action) |
| **Parent** | `ws-canvas-p0-promote-bar` |

**Description:** Promotes the move from P0 to P1 Charter. Enabled only when all 7 brief sections are `complete` and sponsor is `signed`. Triggers `evaluateGate(0, 1)` against `governance.ts` gate rule.

**Fields:**
- `button_label`: "Promote to P1 Charter"
- `is_enabled`: `true` when `gateState = ready`, `userRole` has promote authority, `viewMode = current`

### P0.3.3 Status text

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p0-promote-bar-status-text` |
| **Element type** | Label |
| **Parent** | `ws-canvas-p0-promote-bar` |

**Fields:**
- `status_message`: Context-dependent. Examples: "Complete all 7 sections to promote" / "Sponsor signature required" / "Ready to promote to P1 Charter"

---

## P0.4 Post-P0 edit button

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p0-edit-btn` |
| **Element type** | Button |
| **Parent** | `ws-canvas-p0` |
| **Visibility** | When `ws-canvas-p0` is active, `viewMode = current`, and `phase > P0` (move has been promoted past P0) |

**Description:** Allows amending the origination brief even after the move has been promoted from P0. Clicking enables edit mode on all brief section panels. **Not visible when viewing P0 as current active phase** (promote bar handles that state). **Not visible in `past` or `handed-off` view modes.**

---

## P0.5 Element ID quick-reference

| Stable ID | Type | Description |
|---|---|---|
| `ws-canvas-p0` | Zone | P0 canvas container |
| `ws-canvas-p0-brief-section-1` | Panel | Hypothesis brief section |
| `ws-canvas-p0-brief-section-2` | Panel | Archetype brief section |
| `ws-canvas-p0-brief-section-3` | Panel | Sponsor brief section |
| `ws-canvas-p0-brief-section-4` | Panel | Scope brief section |
| `ws-canvas-p0-brief-section-5` | Panel | Evidence family brief section |
| `ws-canvas-p0-brief-section-6` | Panel | Value hypothesis brief section |
| `ws-canvas-p0-brief-section-7` | Panel | Foundation readiness brief section |
| `ws-canvas-p0-brief-section-{N}-label` | Label | Section N title (N=1–7) |
| `ws-canvas-p0-brief-section-{N}-content` | Field | Section N content (editable) |
| `ws-canvas-p0-brief-section-{N}-status` | Icon | Section N status |
| `ws-canvas-p0-brief-section-{N}-edit-btn` | Button | Section N edit trigger |
| `ws-canvas-p0-brief-section-7-f1` | Field | F1 foundation check |
| `ws-canvas-p0-brief-section-7-f2` | Field | F2 foundation check |
| `ws-canvas-p0-brief-section-7-f3` | Field | F3 foundation check |
| `ws-canvas-p0-brief-section-7-f4` | Field | F4 foundation check |
| `ws-canvas-p0-promote-bar` | Zone | P0 promote bar |
| `ws-canvas-p0-promote-bar-gate-summary` | Label | Gate progress count |
| `ws-canvas-p0-promote-bar-promote-btn` | Button | Promote to P1 Charter |
| `ws-canvas-p0-promote-bar-status-text` | Label | Gate status message |
| `ws-canvas-p0-edit-btn` | Button | Post-P0 brief amendment toggle |
