# Workspace Canvas Anatomy — P2 Discover & Diagnose context

| | |
|---|---|
| **Work Package** | W-1.2 (P2) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/01-anatomy-canvas-p2.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft — pending W-1.5 sign-off |
| **Reference** | `docs/design/strategic-moves/15-workspace-v0.2.html` · `16-flow-cascade.html` Flow 1 |
| **Companion** | `01-anatomy-shell.md` (shell IDs), `PHASE_MODEL_V2_DOCTRINE.md` |
| **Author** | Claude Code |

---

## Overview

This document inventories the canvas elements visible when the Workspace is in **P2 Discover & Diagnose context**.

P2 answers: "What is the current state, what are the root causes, what is the data readiness?" It is the only phase that can produce a **discontinue** recommendation — the gate can kill the move. The canvas must surface this clearly.

**Gate structure (from `governance.ts` P2→P3 rule):** 5 hard checks (`discovery_report_signed_off`, `discovery_notes_ingested`, `discovery_baseline_attested`, `discovery_stakeholders_named`, `p2_readiness_cleared`), 0 soft checks. Total: 5 hard checks.

Shell elements are documented in `01-anatomy-shell.md`.

---

## P2.1 Canvas container

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p2` |
| **Element type** | Zone |
| **Parent** | `ws-grid` |
| **Visibility** | When viewing P2 context (current or past view mode) |

---

## P2.2 Baseline panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p2-baseline-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p2` |
| **Visibility** | Always when `ws-canvas-p2` is active |

**Description:** Documents the current-state baseline: metrics, process state, pain points. The baseline must be attested by a named owner — not just planned. Corresponds to the `discovery_baseline_attested` gate criterion.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p2-baseline-panel-header` | Label | Section title: "Current State Baseline" |
| `ws-canvas-p2-baseline-panel-content` | Field (editable) | Baseline documentation content |
| `ws-canvas-p2-baseline-panel-attest-btn` | Button | Attest baseline (records owner attestation; current view mode only) |
| `ws-canvas-p2-baseline-panel-status` | Badge | Baseline status: `not-started` / `in-progress` / `attested` |

---

## P2.3 Root cause panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p2-rootcause-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p2` |
| **Visibility** | Always when `ws-canvas-p2` is active |

**Description:** Root cause analysis panel. Documents identified root causes underpinning the problem this move addresses. Root causes documented here become the required trace anchors in P3 (every P3 design element must trace back to a P2 root cause).

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p2-rootcause-panel-header` | Label | Section title: "Root Cause Analysis" |
| `ws-canvas-p2-rootcause-panel-content` | Field (editable) | Root cause documentation |
| `ws-canvas-p2-rootcause-item-{n}` | List item | Individual root cause entry (n = 1..N) |
| `ws-canvas-p2-rootcause-add-btn` | Button | Add a root cause entry |
| `ws-canvas-p2-rootcause-panel-status` | Badge | Status: `not-started` / `in-progress` / `complete` |

---

## P2.4 Data readiness panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p2-datareadiness-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p2` |
| **Visibility** | Always when `ws-canvas-p2` is active |

**Description:** Assessment of data foundation readiness — whether the data, systems, access, governance, and quality are sufficient for this move's AI/automation scope. This directly addresses the "Weak data foundation" AI program failure mode from the doctrine.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p2-datareadiness-panel-header` | Label | Section title: "Data & Readiness Assessment" |
| `ws-canvas-p2-datareadiness-panel-content` | Field (editable) | Readiness assessment content |
| `ws-canvas-p2-datareadiness-panel-status` | Badge | Assessment status |
| `ws-canvas-p2-datareadiness-gap-list` | List | List of identified data/readiness gaps |
| `ws-canvas-p2-datareadiness-gap-{n}` | List item | Individual data gap entry (n = 1..N) |

---

## P2.5 Decision panel (continue / discontinue)

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p2-decision-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p2` |
| **Visibility** | Conditional — appears when `gateState` has been evaluated for P2→P3 gate |

**Description:** The P2 decision panel captures whether the diagnosis supports **continue** or **discontinue**. Discontinue is a valid and important outcome at P2 — the doctrine explicitly states P2 can kill a move (D-4 decision). This panel must not be hidden or de-emphasized: it is the mechanism for the honest gate.

**Critical note:** This panel is hidden until a gate evaluation has been run (`gateState ≠ not-evaluated`). Once evaluated, it displays whether the move should proceed to P3 or be discontinued.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p2-decision-panel-header` | Label | Section title: "P2 Decision" |
| `ws-canvas-p2-decision-continue-option` | Radio/option | "Continue to P3 Design" option |
| `ws-canvas-p2-decision-discontinue-option` | Radio/option | "Discontinue Move" option |
| `ws-canvas-p2-decision-rationale` | Field | Decision rationale (required when discontinuing) |
| `ws-canvas-p2-decision-confirm-btn` | Button | Confirm decision and lock it |

**Visibility rule for options:** Both options are always visible once the panel appears. The continue option is pre-selected if no hard gaps are present; the discontinue option is pre-selected if Nexus recommends discontinuation.

---

## P2.6 Gate panel

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p2-gate-panel` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p2` |
| **Visibility** | Always when `ws-canvas-p2` is active |

**Description:** P2→P3 gate criteria panel. 5 hard checks, 0 soft checks (from `governance.ts`).

**Gate items:**
- `ws-canvas-p2-gate-item-1`: Discovery synthesis report signed off (hard)
- `ws-canvas-p2-gate-item-2`: Discovery notes or workshop logs ingested (hard)
- `ws-canvas-p2-gate-item-3`: Baseline metrics captured and attested (hard)
- `ws-canvas-p2-gate-item-4`: Stakeholder map names required human owners with no hard-owner gaps (hard)
- `ws-canvas-p2-gate-item-5`: Diagnosis clears P2 without unresolved hard gaps or kill recommendation (hard)

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p2-gate-item-{1..5}` | List item | Gate criterion item (see pattern below) |
| `ws-canvas-p2-gate-item-{N}-status` | Icon | Item status: `not-evaluated` / `failing` / `passing` |
| `ws-canvas-p2-gate-item-{N}-severity` | Badge | All "Hard" for P2 |
| `ws-canvas-p2-gate-item-{N}-description` | Label | Criterion description |
| `ws-canvas-p2-gate-summary` | Label | "X of 5 met" summary |
| `ws-canvas-p2-gate-promote-btn` | Button | Promote to P3 (current view mode, gateState=ready) |

---

## P2.7 Artifact shelf

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p2-artifact-shelf` |
| **Element type** | Panel |
| **Parent** | `ws-canvas-p2` |
| **Visibility** | Always when `ws-canvas-p2` is active |

**Description:** P2 discovery artifacts: discovery report, discovery notes, workshop logs, baseline document.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p2-artifact-{n}` | List item | Individual P2 artifact |
| `ws-canvas-p2-artifact-{n}-status` | Badge | Draft / reviewed / signed |
| `ws-canvas-p2-artifact-upload-btn` | Button | Upload artifact (current view mode only) |
| `ws-canvas-p2-artifact-empty-state` | Panel | Empty state when no P2 artifacts |

---

## P2.8 Discontinue banner

| Field | Value |
|---|---|
| **ID** | `ws-canvas-p2-discontinue-banner` |
| **Element type** | Banner |
| **Parent** | `ws-canvas-p2` |
| **Visibility** | Conditional — visible when Nexus analysis recommends discontinuation OR when `ws-canvas-p2-decision-discontinue-option` is selected |

**Description:** An amber or red banner surfaced prominently when the P2 diagnosis warrants discontinuation. Clearly communicates "Nexus recommends discontinuing this move" with the evidence basis. This is a first-class UI element, not a footnote. Must appear above the gate panel in visual stacking order.

**Children:**

| Child ID | Type | Description |
|---|---|---|
| `ws-canvas-p2-discontinue-banner-header` | Label | "Discontinue Recommended" heading |
| `ws-canvas-p2-discontinue-banner-reason` | Label | Summary of why discontinuation is recommended |
| `ws-canvas-p2-discontinue-banner-evidence` | List | Evidence items supporting recommendation |
| `ws-canvas-p2-discontinue-banner-override-link` | Link | "Override and continue anyway" (requires rationale) |

---

## P2.9 Element ID quick-reference

| Stable ID | Type | Description |
|---|---|---|
| `ws-canvas-p2` | Zone | P2 canvas container |
| `ws-canvas-p2-baseline-panel` | Panel | Current-state baseline documentation |
| `ws-canvas-p2-baseline-panel-header` | Label | Baseline panel title |
| `ws-canvas-p2-baseline-panel-content` | Field | Baseline content |
| `ws-canvas-p2-baseline-panel-attest-btn` | Button | Attest baseline |
| `ws-canvas-p2-baseline-panel-status` | Badge | Baseline status |
| `ws-canvas-p2-rootcause-panel` | Panel | Root cause analysis |
| `ws-canvas-p2-rootcause-panel-header` | Label | Root cause panel title |
| `ws-canvas-p2-rootcause-panel-content` | Field | Root cause content |
| `ws-canvas-p2-rootcause-item-{n}` | List item | Individual root cause |
| `ws-canvas-p2-rootcause-add-btn` | Button | Add root cause |
| `ws-canvas-p2-rootcause-panel-status` | Badge | Root cause panel status |
| `ws-canvas-p2-datareadiness-panel` | Panel | Data / readiness assessment |
| `ws-canvas-p2-datareadiness-panel-header` | Label | Data readiness title |
| `ws-canvas-p2-datareadiness-panel-content` | Field | Data readiness content |
| `ws-canvas-p2-datareadiness-panel-status` | Badge | Assessment status |
| `ws-canvas-p2-datareadiness-gap-list` | List | Data gap list |
| `ws-canvas-p2-datareadiness-gap-{n}` | List item | Individual data gap |
| `ws-canvas-p2-decision-panel` | Panel | Continue/discontinue decision (conditional) |
| `ws-canvas-p2-decision-panel-header` | Label | Decision panel title |
| `ws-canvas-p2-decision-continue-option` | Option | Continue to P3 option |
| `ws-canvas-p2-decision-discontinue-option` | Option | Discontinue move option |
| `ws-canvas-p2-decision-rationale` | Field | Decision rationale |
| `ws-canvas-p2-decision-confirm-btn` | Button | Confirm decision |
| `ws-canvas-p2-gate-panel` | Panel | P2→P3 gate panel |
| `ws-canvas-p2-gate-item-1` | List item | Gate: discovery report signed off (hard) |
| `ws-canvas-p2-gate-item-2` | List item | Gate: discovery notes ingested (hard) |
| `ws-canvas-p2-gate-item-3` | List item | Gate: baseline attested (hard) |
| `ws-canvas-p2-gate-item-4` | List item | Gate: stakeholders named (hard) |
| `ws-canvas-p2-gate-item-5` | List item | Gate: P2 readiness cleared (hard) |
| `ws-canvas-p2-gate-item-{N}-status` | Icon | Gate item N evaluation status |
| `ws-canvas-p2-gate-item-{N}-severity` | Badge | Gate item N severity badge |
| `ws-canvas-p2-gate-item-{N}-description` | Label | Gate item N text |
| `ws-canvas-p2-gate-summary` | Label | "X of 5 met" |
| `ws-canvas-p2-gate-promote-btn` | Button | Promote to P3 |
| `ws-canvas-p2-artifact-shelf` | Panel | P2 artifact shelf |
| `ws-canvas-p2-artifact-{n}` | List item | P2 artifact item |
| `ws-canvas-p2-artifact-{n}-status` | Badge | Artifact status |
| `ws-canvas-p2-artifact-upload-btn` | Button | Upload artifact |
| `ws-canvas-p2-artifact-empty-state` | Panel | Empty state |
| `ws-canvas-p2-discontinue-banner` | Banner | Discontinue recommendation banner (conditional) |
| `ws-canvas-p2-discontinue-banner-header` | Label | Banner heading |
| `ws-canvas-p2-discontinue-banner-reason` | Label | Discontinuation reason |
| `ws-canvas-p2-discontinue-banner-evidence` | List | Supporting evidence |
| `ws-canvas-p2-discontinue-banner-override-link` | Link | Override and continue |
