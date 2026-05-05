# Workspace Canvas Anatomy — P3 Design Future State context

| | |
|---|---|
| **Work Package** | W-1.2 (P3) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/01-anatomy-canvas-p3.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-1.5 sign-off |
| **Reference** | `docs/design/strategic-moves/15-workspace-v0.2.html` · `PHASE_MODEL_V2_DOCTRINE.md` §P3 |
| **Companion** | `01-anatomy-canvas-p2.md` (P2 root cause IDs referenced by trace panel) |
| **Author** | Claude Code |

---

## Overview

This document inventories the canvas elements visible when the Workspace is in **P3 Design Future State context**.

P3 produces 3 deliverables (per doctrine): Target State Design, Operating Model Shift, Risks & Tradeoffs. A hard requirement from doctrine: **every design element must trace back to a P2 root cause**. The `ws-canvas-p3-rootcause-trace-panel` enforces this.

**Gate structure (from `governance.ts` P3→P4 rule):** 2 hard checks (`design_approved`, `requirements_design_outcome_trace`) + 2 soft checks (`phase_3_findings_written`, `cxo_interview_complete`). Total: 4 checks.

Shell elements are documented in `01-anatomy-shell.md`.

---

## P3.1 Canvas container

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p3` |
| **Element type** | Zone |
| **Parent** | `ws-grid` |
| **Visibility** | When viewing P3 context (current or past view mode) |

---

## P3.2 Design panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p3-design-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p3` |
| **Visibility** | Always when `ws-canvas-p3` is active |

**Description:** The future-state design documentation. P3 is simplified to 3 deliverables per doctrine. This panel captures Target State Design: the future workflow, where AI/agents sit, what humans own, the capability being built.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p3-design-panel-header` | Label | "Target State Design" |
| `ws-canvas-p3-design-panel-content` | Field (editable) | Design narrative (not just diagrams) |
| `ws-canvas-p3-design-panel-status` | Badge | Status: `not-started` / `in-progress` / `signed-off` |
| `ws-canvas-p3-design-panel-signoff-btn` | Button | Sign off design (sponsor action; current view mode only) |

---

## P3.3 Operating model panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p3-operatingmodel-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p3` |
| **Visibility** | Always when `ws-canvas-p3` is active |

**Description:** Operating Model Shift panel. Documents who works differently: roles, handoffs, approval chains that change. "Today → Tomorrow" for each affected role. This is the second of P3's 3 deliverables.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p3-operatingmodel-panel-header` | Label | "Operating Model Shift" |
| `ws-canvas-p3-operatingmodel-panel-content` | Field (editable) | Today→Tomorrow documentation |
| `ws-canvas-p3-operatingmodel-panel-status` | Badge | Status |
| `ws-canvas-p3-operatingmodel-role-{n}` | List item | Individual role change entry (n = 1..N) |
| `ws-canvas-p3-operatingmodel-add-role-btn` | Button | Add a role change entry |

---

## P3.4 Root cause trace panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p3-rootcause-trace-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p3` |
| **Visibility** | Always when `ws-canvas-p3` is active |

**Description:** **Hard requirement from doctrine (D-3):** Every P3 design element must trace to a P2 root cause. This panel provides the mechanism — it shows the P2 root causes (pulled from `ws-canvas-p2-rootcause-item-{n}` via the P2 canvas data) and the design decisions that address each one.

A design decision that cannot be traced to a P2 root cause cannot be approved in P3. This is a blocking constraint enforced at the gate level — the `requirements_design_outcome_trace` hard gate criterion checks for this traceability artifact.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p3-rootcause-trace-panel-header` | Label | "Root Cause → Design Trace" |
| `ws-canvas-p3-rootcause-trace-item-{n}` | List item | One trace record: P2 root cause → P3 design element (n = 1..N) |
| `ws-canvas-p3-rootcause-trace-item-{n}-cause` | Label | Source P2 root cause text |
| `ws-canvas-p3-rootcause-trace-item-{n}-design` | Field | Design element that addresses this root cause |
| `ws-canvas-p3-rootcause-trace-item-{n}-status` | Badge | Trace status: `untraced` / `traced` / `approved` |
| `ws-canvas-p3-rootcause-trace-add-btn` | Button | Add trace entry |
| `ws-canvas-p3-rootcause-trace-summary` | Label | "X of Y root causes traced" |
| `ws-canvas-p3-rootcause-untrace-warning` | Banner | Warning when design elements have no trace (blocks gate) |

---

## P3.5 Risks & tradeoffs panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p3-risks-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p3` |
| **Visibility** | Always when `ws-canvas-p3` is active |

**Description:** Risks & Tradeoffs — the third of P3's 3 deliverables. Per doctrine: 5–7 named risks with likelihood, impact, mitigation. Plus tradeoffs the sponsor must explicitly accept.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p3-risks-panel-header` | Label | "Risks & Tradeoffs" |
| `ws-canvas-p3-risks-panel-content` | Field (editable) | Risks documentation |
| `ws-canvas-p3-risks-item-{n}` | List item | Individual risk entry (n = 1..N, target 5–7) |
| `ws-canvas-p3-risks-item-{n}-name` | Label | Risk name |
| `ws-canvas-p3-risks-item-{n}-likelihood` | Field | Likelihood assessment |
| `ws-canvas-p3-risks-item-{n}-impact` | Field | Impact assessment |
| `ws-canvas-p3-risks-item-{n}-mitigation` | Field | Mitigation strategy |
| `ws-canvas-p3-risks-add-btn` | Button | Add a risk entry |
| `ws-canvas-p3-risks-panel-status` | Badge | Status: `not-started` / `in-progress` / `complete` |

---

## P3.6 Gate panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p3-gate-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p3` |
| **Visibility** | Always when `ws-canvas-p3` is active |

**Description:** P3→P4 gate criteria panel. 2 hard + 2 soft checks (from `governance.ts`).

**Gate items:**
- `ws-canvas-p3-gate-item-1`: Future-state design and operating-model shift signed off (hard)
- `ws-canvas-p3-gate-item-2`: Requirements-to-design-to-outcomes traceability captured (hard)
- `ws-canvas-p3-gate-item-3`: Risks and tradeoffs named with mitigations (soft)
- `ws-canvas-p3-gate-item-4`: Operating-model owners interviewed (soft)

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p3-gate-item-{1..4}` | List item | Gate criterion |
| `ws-canvas-p3-gate-item-{N}-status` | Icon | Status: `not-evaluated` / `failing` / `passing` |
| `ws-canvas-p3-gate-item-{N}-severity` | Badge | Hard / Soft |
| `ws-canvas-p3-gate-item-{N}-description` | Label | Criterion description |
| `ws-canvas-p3-gate-summary` | Label | "X of 4 met" |
| `ws-canvas-p3-gate-promote-btn` | Button | Promote to P4 |

---

## P3.7 Artifact shelf

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p3-artifact-shelf` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p3` |
| **Visibility** | Always when `ws-canvas-p3` is active |

**Description:** P3 design artifacts: design spec, operating model design, risks document, requirements traceability matrix.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p3-artifact-{n}` | List item | P3 artifact |
| `ws-canvas-p3-artifact-{n}-status` | Badge | Draft / reviewed / signed |
| `ws-canvas-p3-artifact-upload-btn` | Button | Upload artifact |
| `ws-canvas-p3-artifact-empty-state` | Panel | Empty state |

---

## P3.8 Element ID quick-reference

| Stable ID | Type | Description |
|---|---|---|
| `ws-canvas-p3` | Zone | P3 canvas container |
| `ws-canvas-p3-design-panel` | Panel | Target State Design panel |
| `ws-canvas-p3-design-panel-header` | Label | Design panel title |
| `ws-canvas-p3-design-panel-content` | Field | Design narrative |
| `ws-canvas-p3-design-panel-status` | Badge | Design status |
| `ws-canvas-p3-design-panel-signoff-btn` | Button | Design signoff |
| `ws-canvas-p3-operatingmodel-panel` | Panel | Operating Model Shift panel |
| `ws-canvas-p3-operatingmodel-panel-header` | Label | Operating model title |
| `ws-canvas-p3-operatingmodel-panel-content` | Field | Today→Tomorrow content |
| `ws-canvas-p3-operatingmodel-panel-status` | Badge | Panel status |
| `ws-canvas-p3-operatingmodel-role-{n}` | List item | Role change entry n |
| `ws-canvas-p3-operatingmodel-add-role-btn` | Button | Add role change |
| `ws-canvas-p3-rootcause-trace-panel` | Panel | Root cause→design trace (hard doctrine requirement) |
| `ws-canvas-p3-rootcause-trace-panel-header` | Label | Trace panel title |
| `ws-canvas-p3-rootcause-trace-item-{n}` | List item | Trace record n |
| `ws-canvas-p3-rootcause-trace-item-{n}-cause` | Label | P2 root cause |
| `ws-canvas-p3-rootcause-trace-item-{n}-design` | Field | Addressing design element |
| `ws-canvas-p3-rootcause-trace-item-{n}-status` | Badge | Trace status |
| `ws-canvas-p3-rootcause-trace-add-btn` | Button | Add trace |
| `ws-canvas-p3-rootcause-trace-summary` | Label | "X of Y root causes traced" |
| `ws-canvas-p3-rootcause-untrace-warning` | Banner | Untrace warning banner |
| `ws-canvas-p3-risks-panel` | Panel | Risks & Tradeoffs panel |
| `ws-canvas-p3-risks-panel-header` | Label | Risks title |
| `ws-canvas-p3-risks-panel-content` | Field | Risks narrative |
| `ws-canvas-p3-risks-item-{n}` | List item | Risk entry n |
| `ws-canvas-p3-risks-item-{n}-name` | Label | Risk name |
| `ws-canvas-p3-risks-item-{n}-likelihood` | Field | Likelihood |
| `ws-canvas-p3-risks-item-{n}-impact` | Field | Impact |
| `ws-canvas-p3-risks-item-{n}-mitigation` | Field | Mitigation |
| `ws-canvas-p3-risks-add-btn` | Button | Add risk |
| `ws-canvas-p3-risks-panel-status` | Badge | Panel status |
| `ws-canvas-p3-gate-panel` | Panel | P3→P4 gate panel |
| `ws-canvas-p3-gate-item-1` | List item | Gate: design + operating model signed off (hard) |
| `ws-canvas-p3-gate-item-2` | List item | Gate: requirements-to-design traceability (hard) |
| `ws-canvas-p3-gate-item-3` | List item | Gate: risks + tradeoffs named (soft) |
| `ws-canvas-p3-gate-item-4` | List item | Gate: operating model owners interviewed (soft) |
| `ws-canvas-p3-gate-item-{N}-status` | Icon | Gate item N status |
| `ws-canvas-p3-gate-item-{N}-severity` | Badge | Hard / Soft |
| `ws-canvas-p3-gate-item-{N}-description` | Label | Criterion text |
| `ws-canvas-p3-gate-summary` | Label | "X of 4 met" |
| `ws-canvas-p3-gate-promote-btn` | Button | Promote to P4 |
| `ws-canvas-p3-artifact-shelf` | Panel | P3 artifact shelf |
| `ws-canvas-p3-artifact-{n}` | List item | P3 artifact item |
| `ws-canvas-p3-artifact-{n}-status` | Badge | Artifact status |
| `ws-canvas-p3-artifact-upload-btn` | Button | Upload artifact |
| `ws-canvas-p3-artifact-empty-state` | Panel | Empty state |
