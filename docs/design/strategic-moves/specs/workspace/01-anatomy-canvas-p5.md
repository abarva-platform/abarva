# Workspace Canvas Anatomy — P5 Mobilize & Handoff context

| | |
|---|---|
| **Work Package** | W-1.2 (P5) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/01-anatomy-canvas-p5.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-1.5 sign-off |
| **Reference** | `docs/design/strategic-moves/15-workspace-v0.2.html` · `PHASE_MODEL_V2_DOCTRINE.md` §P5 |
| **Author** | Claude Code |

---

## Overview

This document inventories the canvas elements for **P5 Mobilize & Handoff**.

P5 prepares and executes the handoff to Tower. The primary output is a Tower handoff package accepted by the execution team. P5 is the final Strategic Moves phase — after P5, Control Tower owns execution.

**Gate count reconciliation (W-2.3 requirement):**

The cascade shows 5 criteria for P5→Tower. Governance.ts does NOT have a P5→Tower gate rule. The last defined gate is P4→P5. This is a discrepancy that must be flagged.

**Finding:** `governance.ts` defines 5 gate transitions: P0→P1, P1→P2, P2→P3, P3→P4, P4→P5. There is **no P5→Tower gate** in `governance.ts`. The P4→P5 gate has 11 checks (5 hard + 6 soft). The cascade references a P5→Tower criteria count, but this gate is not yet defined in the substrate.

**Flag:** `gap-ws-p5-001` — P5→Tower gate criteria not defined in `governance.ts`. The cascade suggests 5 criteria but the substrate has no rule for this transition. This must be reconciled in Layer 2 (W-2.3) before implementation. Assigned backlog item **B-120**.

Shell elements are documented in `01-anatomy-shell.md`.

---

## P5.1 Canvas container

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p5` |
| **Element type** | Zone |
| **Parent** | `ws-grid` |
| **Visibility** | When viewing P5 context (current or past view mode) |

---

## P5.2 RACI panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p5-raci-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p5` |
| **Visibility** | Always when `ws-canvas-p5` is active |

**Description:** Delivery RACI panel. Per doctrine, the RACI names business, technology, vendor, finance, change, and Tower owners — named people, not roles. This is required for the Tower handoff package.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p5-raci-panel-header` | Label | "Delivery RACI" |
| `ws-canvas-p5-raci-panel-content` | Field (editable) | RACI documentation |
| `ws-canvas-p5-raci-panel-status` | Badge | `not-started` / `in-progress` / `complete` |
| `ws-canvas-p5-raci-role-{n}` | List item | Individual RACI role entry (n = 1..N) |
| `ws-canvas-p5-raci-role-{n}-name` | Label | Role category (e.g., "Business Owner") |
| `ws-canvas-p5-raci-role-{n}-person` | Field | Named person (not just role title) |
| `ws-canvas-p5-raci-role-{n}-responsibility` | Field | Responsibility description |
| `ws-canvas-p5-raci-add-role-btn` | Button | Add RACI entry |

---

## P5.3 Handoff pack panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p5-handoffpack-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p5` |
| **Visibility** | Always when `ws-canvas-p5` is active |

**Description:** The Tower handoff package panel. Aggregates all required handoff content: execution roadmap, monitoring plan, value realization framework, risk register, RACI, change plan status, dependency map. Tower will receive this package at P5 completion.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p5-handoffpack-panel-header` | Label | "Tower Handoff Package" |
| `ws-canvas-p5-handoffpack-panel-status` | Badge | `incomplete` / `ready` / `accepted` |
| `ws-canvas-p5-handoffpack-checklist` | List | Checklist of handoff package components |
| `ws-canvas-p5-handoffpack-item-{n}` | List item | Individual handoff component (n = 1..N) |
| `ws-canvas-p5-handoffpack-item-{n}-name` | Label | Component name (e.g., "Execution Roadmap") |
| `ws-canvas-p5-handoffpack-item-{n}-status` | Badge | Present / Missing / Signed |
| `ws-canvas-p5-handoffpack-item-{n}-link` | Link | Link to the underlying artifact |

---

## P5.4 Tower acceptance panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p5-tower-acceptance-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p5` |
| **Visibility** | Always when `ws-canvas-p5` is active |

**Description:** Panel for recording Tower's acceptance of the handoff package. Per doctrine, P5 gate-out requires execution team acceptance, not just Strategic Moves signoff. This panel captures two distinct states that must NOT be conflated:

- **Acknowledged**: Tower has seen the handoff package (weaker signal)
- **Accepted**: Tower has confirmed readiness and accepted ownership (required for gate-out)

This distinction is mandatory. The promote action (Tower handoff) is only enabled when status is `accepted`, not merely `acknowledged`.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p5-tower-acceptance-header` | Label | "Tower Acceptance" |
| `ws-canvas-p5-tower-acceptance-status` | Badge | `not-submitted` / `submitted` / `acknowledged` / `accepted` / `declined` |
| `ws-canvas-p5-tower-acceptance-submit-btn` | Button | Submit handoff package to Tower |
| `ws-canvas-p5-tower-acceptance-accept-btn` | Button | Record Tower acceptance (gates to "accepted") |
| `ws-canvas-p5-tower-acceptance-decline-note` | Field | Decline note (visible when Tower declines — triggers loop back to P4/P3) |
| `ws-canvas-p5-tower-acceptance-timestamp` | Label | Acceptance timestamp (when accepted) |
| `ws-canvas-p5-tower-acceptance-acceptor` | Label | Name of Tower representative who accepted |

**Critical behavioral note:** The Tower handoff action (final gate-out from Strategic Moves) is enabled ONLY when `ws-canvas-p5-tower-acceptance-status = accepted`. When status is `acknowledged`, the handoff action remains disabled. This must be enforced at Layer 3 (interactions) and Layer 2 (state matrix).

---

## P5.5 Gate panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p5-gate-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p5` |
| **Visibility** | Always when `ws-canvas-p5` is active |

**Description:** P5→Tower gate criteria panel.

**Gate count reconciliation note (W-2.3):** The cascade shows 5 criteria for P5→Tower. The `governance.ts` file does NOT define a P5→Tower gate rule — the last gate defined is P4→P5. This is a substrate gap (gap-ws-p5-001 / B-120). The anatomy documents 5 gate item placeholders consistent with the cascade's indication, but the actual criteria must be defined in a future `governance.ts` amendment before implementation.

**Provisional gate items (from doctrine P5 description + cascade pattern):**
- `ws-canvas-p5-gate-item-1`: Tower handoff package complete and accepted (provisional)
- `ws-canvas-p5-gate-item-2`: Execution team confirmed readiness (provisional)
- `ws-canvas-p5-gate-item-3`: Monitoring plan active (provisional)
- `ws-canvas-p5-gate-item-4`: RACI signed off with named owners (provisional)
- `ws-canvas-p5-gate-item-5`: Value realization framework handed to Tower (provisional)

**All 5 items marked as provisional.** Layer 2 (W-2.3) must reconcile with Anand before these are locked.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p5-gate-item-{1..5}` | List item | Gate criterion (provisional — see reconciliation note) |
| `ws-canvas-p5-gate-item-{N}-status` | Icon | Status |
| `ws-canvas-p5-gate-item-{N}-severity` | Badge | Hard / Soft (TBD pending reconciliation) |
| `ws-canvas-p5-gate-item-{N}-description` | Label | Criterion description |
| `ws-canvas-p5-gate-summary` | Label | "X of 5 met" |
| `ws-canvas-p5-gate-handoff-btn` | Button | Hand off to Tower (replaces "promote" at P5) |

**Note on `ws-canvas-p5-gate-handoff-btn`:** This button is semantically different from the promote button on earlier phases. It initiates the Tower handoff action, not a phase promotion within Strategic Moves. The button is enabled only when `gateState = ready` AND `ws-canvas-p5-tower-acceptance-status = accepted`.

---

## P5.6 Artifact shelf

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p5-artifact-shelf` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p5` |
| **Visibility** | Always when `ws-canvas-p5` is active |

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p5-artifact-{n}` | List item | P5 artifact |
| `ws-canvas-p5-artifact-{n}-status` | Badge | Draft / reviewed / signed |
| `ws-canvas-p5-artifact-upload-btn` | Button | Upload |
| `ws-canvas-p5-artifact-empty-state` | Panel | Empty state |

---

## P5.7 Substrate gap log (P5-specific)

| Gap ID | Element | Missing substrate | Impact | Backlog item |
|---|---|---|---|---|
| `gap-ws-p5-001` | `ws-canvas-p5-gate-panel`, `ws-canvas-p5-gate-item-{1..5}` | `governance.ts` has no P5→Tower gate rule. The cascade references 5 criteria for P5→Tower but the substrate defines no such transition. The last gate defined is P4→P5 (11 checks). | High — without a gate rule, the P5→Tower promotion cannot be evaluated in code. Gate criteria are provisional. | B-120: Define P5→Tower gate rule in `src/lib/programs/governance.ts`. The 5 provisional gate items documented here are candidates; Anand must confirm before the rule is committed. This must be resolved before Layer 2 W-2.3 sign-off. |

---

## P5.8 Element ID quick-reference

| Stable ID | Type | Description |
|---|---|---|
| `ws-canvas-p5` | Zone | P5 canvas container |
| `ws-canvas-p5-raci-panel` | Panel | Delivery RACI panel |
| `ws-canvas-p5-raci-panel-header` | Label | RACI title |
| `ws-canvas-p5-raci-panel-content` | Field | RACI content |
| `ws-canvas-p5-raci-panel-status` | Badge | RACI status |
| `ws-canvas-p5-raci-role-{n}` | List item | RACI role entry n |
| `ws-canvas-p5-raci-role-{n}-name` | Label | Role category |
| `ws-canvas-p5-raci-role-{n}-person` | Field | Named person |
| `ws-canvas-p5-raci-role-{n}-responsibility` | Field | Responsibility |
| `ws-canvas-p5-raci-add-role-btn` | Button | Add RACI role |
| `ws-canvas-p5-handoffpack-panel` | Panel | Tower handoff package |
| `ws-canvas-p5-handoffpack-panel-header` | Label | Handoff pack title |
| `ws-canvas-p5-handoffpack-panel-status` | Badge | Package status |
| `ws-canvas-p5-handoffpack-checklist` | List | Handoff component checklist |
| `ws-canvas-p5-handoffpack-item-{n}` | List item | Handoff component n |
| `ws-canvas-p5-handoffpack-item-{n}-name` | Label | Component name |
| `ws-canvas-p5-handoffpack-item-{n}-status` | Badge | Present / Missing / Signed |
| `ws-canvas-p5-handoffpack-item-{n}-link` | Link | Link to artifact |
| `ws-canvas-p5-tower-acceptance-panel` | Panel | Tower acceptance widget |
| `ws-canvas-p5-tower-acceptance-header` | Label | Acceptance panel title |
| `ws-canvas-p5-tower-acceptance-status` | Badge | not-submitted / submitted / acknowledged / accepted / declined |
| `ws-canvas-p5-tower-acceptance-submit-btn` | Button | Submit to Tower |
| `ws-canvas-p5-tower-acceptance-accept-btn` | Button | Record Tower acceptance |
| `ws-canvas-p5-tower-acceptance-decline-note` | Field | Decline rationale |
| `ws-canvas-p5-tower-acceptance-timestamp` | Label | Acceptance timestamp |
| `ws-canvas-p5-tower-acceptance-acceptor` | Label | Tower representative name |
| `ws-canvas-p5-gate-panel` | Panel | P5→Tower gate panel (5 provisional criteria) |
| `ws-canvas-p5-gate-item-1` | List item | Gate item 1 (provisional) |
| `ws-canvas-p5-gate-item-2` | List item | Gate item 2 (provisional) |
| `ws-canvas-p5-gate-item-3` | List item | Gate item 3 (provisional) |
| `ws-canvas-p5-gate-item-4` | List item | Gate item 4 (provisional) |
| `ws-canvas-p5-gate-item-5` | List item | Gate item 5 (provisional) |
| `ws-canvas-p5-gate-item-{N}-status` | Icon | Status |
| `ws-canvas-p5-gate-item-{N}-severity` | Badge | Hard / Soft |
| `ws-canvas-p5-gate-item-{N}-description` | Label | Criterion text |
| `ws-canvas-p5-gate-summary` | Label | "X of 5 met" |
| `ws-canvas-p5-gate-handoff-btn` | Button | Hand off to Tower (enabled only when accepted) |
| `ws-canvas-p5-artifact-shelf` | Panel | P5 artifact shelf |
| `ws-canvas-p5-artifact-{n}` | List item | P5 artifact |
| `ws-canvas-p5-artifact-{n}-status` | Badge | Artifact status |
| `ws-canvas-p5-artifact-upload-btn` | Button | Upload |
| `ws-canvas-p5-artifact-empty-state` | Panel | Empty state |
