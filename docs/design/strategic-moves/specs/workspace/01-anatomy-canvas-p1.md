# Workspace Canvas Anatomy — P1 Charter context

| | |
|---|---|
| **Work Package** | W-1.2 (P1) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/01-anatomy-canvas-p1.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-1.5 sign-off |
| **Reference** | `docs/design/strategic-moves/15-workspace-v0.2.html` · `16-flow-cascade.html` Flow 1 |
| **Companion** | `01-anatomy-shell.md` (shell IDs), `SPEC_METHODOLOGY.md` §2.1 |
| **Author** | Claude Code |

---

## Overview

This document inventories the canvas elements visible when the Workspace page is in **P1 Charter context** — either because the move's current phase is P1 Charter, or because the user navigated to P1 in `past` view mode.

P1 is the chartering phase. The canvas shows charter sections (sponsor commitment, stakeholders, success metrics, value range, scope), a gate panel with the P1→P2 gate criteria, an artifact shelf, and a sponsor signoff widget.

Gate structure (from `governance.ts`): P1→P2 gate has **3 checks** — 2 hard (`charter_signed_off`, `sponsor_assigned`) + 1 soft (`baseline_captured`).

Shell elements are documented in `01-anatomy-shell.md`.

---

## P1.1 Canvas container

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1` |
| **Element type** | Zone |
| **Parent** | `ws-grid` |
| **Visibility** | When `viewMode = current` and `phase = P1`, or when user navigates to P1 via rail |

**Description:** Root container for P1 Charter canvas content within the workspace right column.

---

## P1.2 Charter sections (×5)

### P1.2.1 Charter section container pattern

**Applies to:** `ws-canvas-p1-charter-section-1` through `ws-canvas-p1-charter-section-5`

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-charter-section-{1..5}` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p1` |
| **Visibility** | Always when `ws-canvas-p1` is active |

**Description:** The 5 charter sections:

| Instance | Topic |
|---|---|
| `ws-canvas-p1-charter-section-1` | Sponsor (identity, commitment level, decision rights) |
| `ws-canvas-p1-charter-section-2` | Stakeholders (stakeholder map, required human owners) |
| `ws-canvas-p1-charter-section-3` | Success metrics (ratified metrics, measurement cadence) |
| `ws-canvas-p1-charter-section-4` | Value range (low/mid/high value range; locked at charter sign-off) |
| `ws-canvas-p1-charter-section-5` | Scope (charter scope — more precise than the P0 scope boundary) |

**Sub-elements per section:**

| Sub-element ID | Type | Description |
|---|---|---|
| `ws-canvas-p1-charter-section-{N}-label` | Label | Section title |
| `ws-canvas-p1-charter-section-{N}-content` | Field (editable) | Charter section content |
| `ws-canvas-p1-charter-section-{N}-status` | Icon | Completion status |
| `ws-canvas-p1-charter-section-{N}-edit-btn` | Button | Edit trigger (current view mode only) |

---

## P1.3 Gate panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-gate-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p1` |
| **Visibility** | Always when `ws-canvas-p1` is active |

**Description:** The P1→P2 gate criteria panel. Shows all gate items (hard + soft), their evaluation status, an overall gate summary, and the promote button. Gate items are interactive in `current` view mode (user can click to mark progress or review criteria); read-only in `past` and `future` view modes.

**Gate structure (from `governance.ts` P1→P2 rule):**
- Hard check 1: `charter_signed_off` — "Charter signed off by sponsor"
- Hard check 2: `sponsor_assigned` — "Sponsor committed and decision rights named"
- Soft check 1: `baseline_captured` — "Initial value range and success metrics ratified"
- Total: 3 checks (2 hard + 1 soft)

**Children:**
- `ws-canvas-p1-gate-item-{1..3}` (3 items: 2 hard, 1 soft)
- `ws-canvas-p1-gate-summary`
- `ws-canvas-p1-gate-promote-btn`

### P1.3.1 Gate item (×3)

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-gate-item-{1..3}` |
| **Element type** | List item |
| **Parent** | `ws-canvas-p1-gate-panel` |
| **Visibility** | Always when gate panel is visible |

**Description:** Individual gate criterion item. Each item shows criterion description, severity (hard/soft badge), and current evaluation status.

**Instances:**
- `ws-canvas-p1-gate-item-1`: Charter signed off by sponsor (hard)
- `ws-canvas-p1-gate-item-2`: Sponsor committed and decision rights named (hard)
- `ws-canvas-p1-gate-item-3`: Initial value range and success metrics ratified (soft)

**Sub-elements per gate item:**

| Sub-element ID | Type | Description |
|---|---|---|
| `ws-canvas-p1-gate-item-{N}-status` | Icon | Per-item status: `not-evaluated` / `failing` / `passing` |
| `ws-canvas-p1-gate-item-{N}-severity` | Badge | "Hard" / "Soft" severity badge |
| `ws-canvas-p1-gate-item-{N}-description` | Label | Criterion description text |

### P1.3.2 Gate summary

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-gate-summary` |
| **Element type** | Label |
| **Parent** | `ws-canvas-p1-gate-panel` |

**Description:** Overall gate evaluation summary. Format: "X of 3 met" with visual indicator for hard vs soft gate status.

**Fields:**
- `met_count`: Integer 0–3
- `total_count`: 3
- `hard_passing`: Boolean
- `display_text`: "X of 3 met"

### P1.3.3 Promote button (gate panel)

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-gate-promote-btn` |
| **Element type** | Button |
| **Parent** | `ws-canvas-p1-gate-panel` |
| **Visibility** | When `viewMode = current` |

**Description:** Triggers promotion from P1 to P2. Enabled when `gateState = ready` (all hard checks passing) and `userRole` has promote authority. Disabled but visible when `gateState = partial` (some soft checks failing but hard checks pass — allowed to promote with soft gaps). Hidden in `past`, `future`, `handed-off` view modes.

---

## P1.4 Artifact shelf

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-artifact-shelf` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p1` |
| **Visibility** | Always when `ws-canvas-p1` is active |

**Description:** Panel displaying P1-phase documents and artifacts. Key artifacts for P1: charter document, stakeholder map, value baseline. Each artifact shows its current status (draft / reviewed / signed).

**Children:**
- `ws-canvas-p1-artifact-{n}` (n = 1..N, variable count depending on artifacts in DB)
- `ws-canvas-p1-artifact-upload-btn`
- `ws-canvas-p1-artifact-empty-state`

### P1.4.1 Artifact item (template)

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-artifact-{n}` |
| **Element type** | List item |
| **Parent** | `ws-canvas-p1-artifact-shelf` |
| **Visibility** | When artifacts exist for this phase |

**Fields:**
- `artifact_name`: String
- `artifact_type`: Deliverable type key (e.g., `charter`, `stakeholder_map`)
- `status`: One of: `draft` | `reviewed` | `signed`

### P1.4.2 Artifact status badge

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-artifact-status` |
| **Element type** | Badge (per artifact item) |
| **Parent** | Each `ws-canvas-p1-artifact-{n}` |

**Fields:**
- `status_value`: `draft` | `reviewed` | `signed`
- `status_label`: "Draft" / "Reviewed" / "Signed"

### P1.4.3 Artifact upload button

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-artifact-upload-btn` |
| **Element type** | Button |
| **Parent** | `ws-canvas-p1-artifact-shelf` |
| **Visibility** | When `viewMode = current` |

**Description:** Upload a new artifact to this phase's shelf.

### P1.4.4 Artifact empty state

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-artifact-empty-state` |
| **Element type** | Empty state panel |
| **Parent** | `ws-canvas-p1-artifact-shelf` |
| **Visibility** | When no artifacts exist for P1 |

---

## P1.5 Sponsor signoff widget

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p1-sponsor-signoff` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p1` |
| **Visibility** | When `ws-canvas-p1` is active and a sponsor is assigned |

**Description:** Widget for capturing sponsor signoff on the P1 charter. Shows sponsor identity, current signoff status, and action to request or record signoff. This is the mechanism for driving the `charter_signed_off` gate criterion.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p1-sponsor-signoff-name` | Label | Sponsor name |
| `ws-canvas-p1-sponsor-signoff-status` | Badge | Signoff status: `not_requested` / `requested` / `signed` |
| `ws-canvas-p1-sponsor-signoff-action-btn` | Button | "Request Signoff" / "Record Signoff" / "View Signoff" |
| `ws-canvas-p1-sponsor-signoff-timestamp` | Label | Date/time of signoff (visible when `signed`) |

---

## P1.6 Element ID quick-reference

| Stable ID | Type | Description |
|---|---|---|
| `ws-canvas-p1` | Zone | P1 canvas container |
| `ws-canvas-p1-charter-section-1` | Panel | Sponsor section |
| `ws-canvas-p1-charter-section-2` | Panel | Stakeholders section |
| `ws-canvas-p1-charter-section-3` | Panel | Success metrics section |
| `ws-canvas-p1-charter-section-4` | Panel | Value range section |
| `ws-canvas-p1-charter-section-5` | Panel | Scope section |
| `ws-canvas-p1-charter-section-{N}-label` | Label | Charter section N title |
| `ws-canvas-p1-charter-section-{N}-content` | Field | Charter section N content |
| `ws-canvas-p1-charter-section-{N}-status` | Icon | Charter section N status |
| `ws-canvas-p1-charter-section-{N}-edit-btn` | Button | Charter section N edit trigger |
| `ws-canvas-p1-gate-panel` | Panel | P1→P2 gate criteria panel |
| `ws-canvas-p1-gate-item-1` | List item | Gate: charter signed off (hard) |
| `ws-canvas-p1-gate-item-2` | List item | Gate: sponsor assigned (hard) |
| `ws-canvas-p1-gate-item-3` | List item | Gate: baseline captured (soft) |
| `ws-canvas-p1-gate-item-{N}-status` | Icon | Gate item N evaluation status |
| `ws-canvas-p1-gate-item-{N}-severity` | Badge | Gate item N severity (hard/soft) |
| `ws-canvas-p1-gate-item-{N}-description` | Label | Gate item N criterion text |
| `ws-canvas-p1-gate-summary` | Label | "X of 3 met" summary |
| `ws-canvas-p1-gate-promote-btn` | Button | Promote to P2 (current view mode only) |
| `ws-canvas-p1-artifact-shelf` | Panel | P1 artifact shelf |
| `ws-canvas-p1-artifact-{n}` | List item | Individual P1 artifact |
| `ws-canvas-p1-artifact-status` | Badge | Artifact status (draft/reviewed/signed) |
| `ws-canvas-p1-artifact-upload-btn` | Button | Upload artifact |
| `ws-canvas-p1-artifact-empty-state` | Panel | Empty state when no artifacts |
| `ws-canvas-p1-sponsor-signoff` | Panel | Sponsor signoff widget |
| `ws-canvas-p1-sponsor-signoff-name` | Label | Sponsor name |
| `ws-canvas-p1-sponsor-signoff-status` | Badge | Signoff status |
| `ws-canvas-p1-sponsor-signoff-action-btn` | Button | Request / Record / View signoff |
| `ws-canvas-p1-sponsor-signoff-timestamp` | Label | Signoff timestamp (when signed) |
