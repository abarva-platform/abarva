# Workspace Canvas Read Bindings — P3 Design Future State phase — W-4.2 (P3)

| | |
|---|---|
| **Work Package** | W-4.2 (P3) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-canvas-p3.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-canvas-p3.md` (frozen) · `02-state.md` (frozen) · `03-interactions-canvas-p3.md` (frozen) |
| **Author** | Claude Code |

---

## Overview

P3 Design Future State produces 3 deliverables: Target State Design, Operating Model Shift, and Risks & Tradeoffs. A hard doctrine requirement: every design element must trace to a P2 root cause — the `requirements_design_outcome_trace` gate criterion enforces this via the traceability artifact in `deliverables_v2`.

**Gate structure (from `governance.ts` P3→P4 rule):** 4 checks — `design_approved` (hard), `requirements_design_outcome_trace` (hard), `phase_3_findings_written` (soft), `cxo_interview_complete` (soft).

---

## §1 · Column Definitions

Same as `04-data-shell.md §1`.

---

## §2 · Design Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p3-design-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('design_spec', 'design', 'design_brief', 'solution_design', 'operating_model_design')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest) | Server: `deliverables_v2` + `deliverable_versions` | Stored | After design content update; page load | Empty placeholder: `"Target state design documentation will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p3-design-panel-status` | Computed: `signed-off` when design deliverable `status = 'signed_off'`; `in-progress` when deliverable exists but not signed; `not-started` when no deliverable | Server: derived | Computed | After deliverable status change | `'not-started'` | Not editable |
| `ws-canvas-p3-design-panel-signoff-btn` (visibility) | Computed: visible when `viewMode = current` AND design deliverable exists AND `status != 'signed_off'` | N/A | Computed | View mode change; after deliverable update | Hidden | Sponsor role required for signoff |

---

## §3 · Operating Model Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p3-operatingmodel-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('operating_model_design', 'operating_model_shift', 'target_operating_model')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest) | Server: `deliverables_v2` + `deliverable_versions` | Stored | After operating model update; page load | Empty placeholder: `"Operating model shift (Today → Tomorrow) will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p3-operatingmodel-role-{n}` | Individual role change records from `program_modules` WHERE `module_key = 'operating_model_roles'` → `module_data->'roles'` JSONB array | Server: `program_modules` | Stored in JSONB | After role add/edit | Empty list | Admin, lead, governance |
| `ws-canvas-p3-operatingmodel-panel-status` | Computed from deliverable presence and content | Server: derived | Computed | After update | `'not-started'` | Not editable |

---

## §4 · Root Cause Trace Panel

The trace panel is the enforcement mechanism for the P3 doctrine requirement: every design element must map to a P2 root cause.

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p3-rootcause-trace-item-{n}` | `deliverables_v2` WHERE `deliverable_type_key IN ('requirements_traceability', 'requirements_design_outcome_trace', 'traceability_matrix')` AND `engagement_id = moveId` → `deliverable_versions.structured_data->'traces'` JSONB array | Server: `deliverables_v2` + `deliverable_versions` | Stored in structured_data JSONB | After trace entry add/edit; page load | Empty list | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p3-rootcause-trace-item-{n}-cause` | P2 root cause text pulled from P2 canvas data: `program_modules WHERE module_key = 'root_cause'` module_data OR prior delivery | Server: same + P2 module query | Stored | After P2 root cause add | Empty | Not editable — sourced from P2 |
| `ws-canvas-p3-rootcause-trace-item-{n}-design` | Design element text from traceability deliverable structured_data | Server: same | Stored in JSONB | After trace entry edit | Empty | Admin, lead, governance |
| `ws-canvas-p3-rootcause-trace-item-{n}-status` | Computed: `traced` when both cause and design are non-empty; `untraced` when design is empty; `approved` when parent deliverable `status = 'signed_off'` | Server: derived | Computed | After trace edit; after deliverable signoff | `'untraced'` | Not editable |
| `ws-canvas-p3-rootcause-trace-summary` | Computed: count of `traced` items / total items from traceability deliverable | Server: derived | Computed | After trace edit | `"0 of 0 root causes traced"` | Not editable |
| `ws-canvas-p3-rootcause-untrace-warning` (visibility) | Computed: visible when any trace item has `status = 'untraced'` AND `viewMode = current` | Server: derived from trace data | Computed | After trace edit | Hidden | Not editable |

---

## §5 · Risks & Tradeoffs Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p3-risks-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('phase_3_findings', 'design_findings', 'risks_tradeoffs')` AND `engagement_id = moveId` → `deliverable_versions.content` | Server: `deliverables_v2` + `deliverable_versions` | Stored | After risks update; page load | Empty placeholder: `"Risks and tradeoffs documentation (5–7 named risks) will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p3-risks-item-{n}` | Individual risk entries from same deliverable `structured_data->'risks'` JSONB array | Server: same | Stored in JSONB | After risk add/edit | Empty list | Admin, lead, governance |
| `ws-canvas-p3-risks-item-{n}-name` | `structured_data->'risks'[n]->>'name'` | Same | Stored | After edit | Empty | Admin, lead, governance |
| `ws-canvas-p3-risks-item-{n}-likelihood` | `structured_data->'risks'[n]->>'likelihood'` | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p3-risks-item-{n}-impact` | `structured_data->'risks'[n]->>'impact'` | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p3-risks-item-{n}-mitigation` | `structured_data->'risks'[n]->>'mitigation'` | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p3-risks-panel-status` | Computed from `phase_3_findings_written` gate check result | Server: derived | Computed | After risks update | `'not-started'` | Not editable |

---

## §6 · Gate Panel (P3→P4)

### §6.1 Gate criterion data sources

| element-id | gate criterion key | db-table-or-view | computed-or-stored | fallback |
|---|---|---|---|---|
| `ws-canvas-p3-gate-item-1` (Design + operating model signed off — hard) | `design_approved` | `deliverables_v2` WHERE `deliverable_type_key IN ('design_spec', 'design', 'design_brief', 'solution_design', 'operating_model_design')` AND `status = 'signed_off'` | Computed from `evaluateGate(ctx, moveId, 3, 4)` | `not-evaluated` |
| `ws-canvas-p3-gate-item-2` (Requirements-to-design traceability — hard) | `requirements_design_outcome_trace` | `deliverables_v2` WHERE `deliverable_type_key IN ('requirements_traceability', 'requirements_design_outcome_trace', 'traceability_matrix')` EXISTS | Computed from `evaluateGate` | `not-evaluated` |
| `ws-canvas-p3-gate-item-3` (Risks + tradeoffs named — soft) | `phase_3_findings_written` | `program_modules` WHERE `module_key IN ('phase_3_findings', 'findings')` AND `status = 'completed'`; OR `deliverables_v2` WHERE `deliverable_type_key IN ('phase_3_findings', 'design_findings')` EXISTS | Computed from `evaluateGate` | `not-evaluated` |
| `ws-canvas-p3-gate-item-4` (Operating model owners interviewed — soft) | `cxo_interview_complete` | `program_modules` WHERE `module_key = 'cxo_interview'` AND `status = 'completed'` | Computed from `evaluateGate` | `not-evaluated` |

### §6.2 Gate summary and promote button

| element-id | db-table-or-view | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|
| `ws-canvas-p3-gate-summary` | Computed from `evaluateGate(ctx, moveId, 3, 4)` result | Computed | After any P3 deliverable or module change | `"0 of 4 met"` | Not editable |
| `ws-canvas-p3-gate-promote-btn` (enabled) | Computed: no hard fails AND `userRole` authorized AND `viewMode = 'current'` | Computed | After gate evaluation | Disabled | Not editable |

---

## §7 · Artifact Shelf

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p3-artifact-{n}` | `move_artifact_index` VIEW: `SELECT * FROM move_artifact_index WHERE engagement_id = $moveId AND (phase_number = 3 OR artifact_kind IN ('design_spec', 'design', 'operating_model_design', 'requirements_traceability', 'phase_3_findings'))` | Server: Supabase query on `move_artifact_index` | Stored | After artifact upload; after status change; page load | Empty state | Admin, lead, governance |
| `ws-canvas-p3-artifact-{n}-status` | `move_artifact_index.status` | Same | Stored | After status update | `'draft'` | Admin, lead |

---

## §8 · Write Bindings (P3 mutations)

| interaction-id | what gets written | target | API route |
|---|---|---|---|
| Design panel save | Design deliverable content | `deliverables_v2` / `deliverable_versions` | **gap-ws-4-001** (B-117) |
| Design signoff | `deliverables_v2.status = 'signed_off'` for design deliverable | `deliverables_v2` | **gap-ws-4-001** (B-117) |
| Trace entry add/edit | Traceability deliverable `structured_data` | `deliverable_versions` | **gap-ws-4-001** (B-117) |
| Risks panel save | Risks deliverable content | `deliverables_v2` / `deliverable_versions` | **gap-ws-4-001** (B-117) |
| Promote P3→P4 | `engagements.current_phase = 4` + audit log | `engagements` + `program_audit_log` | `POST /api/programs/phase-gate` — see `04-data-writes-promote.md` |

---

## §9 · Self-QA

| Check | Status |
|---|---|
| All P3 panels mapped to DB sources | PASS |
| P3→P4 gate criteria (4 checks) mapped to governance.ts keys | PASS |
| Root cause trace panel linked to P2 root cause source | PASS |
| Traceability deliverable as enforcement mechanism for `requirements_design_outcome_trace` documented | PASS |
| No "TBD" values | PASS |
