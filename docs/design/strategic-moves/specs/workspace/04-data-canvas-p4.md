# Workspace Canvas Read Bindings — P4 Roadmap & Business Case phase — W-4.2 (P4)

| | |
|---|---|
| **Work Package** | W-4.2 (P4) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-canvas-p4.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-canvas-p4.md` (frozen) · `02-state.md` (frozen) · `03-interactions-canvas-p4.md` (frozen) |
| **Author** | Claude Code |

---

## Overview

P4 Roadmap & Business Case is the funding/mobilization gate. Key doctrine rule: the Tower metric plan must be **proactively surfaced at mid-P4** (when roadmap and business case panels both have content). The `program_milestones` table (seeded in migration `20260504220000`) is the substrate for milestone tracking.

**Gate structure (from `governance.ts` P4→P5 rule):** 11 checks — 5 hard: `execution_roadmap_drafted`, `business_case_approved`, `execution_milestones_defined`, `execution_success_criteria_defined`, `readiness_and_change_plan_signed_off`; 6 soft: `funding_approval_recorded`, `sponsor_alignment_confirmed`, `delivery_raci_named`, `vendor_selection_approved`, `tower_metric_plan_drafted`, `tower_handoff_plan_accepted`.

---

## §1 · Column Definitions

Same as `04-data-shell.md §1`.

---

## §2 · Roadmap Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p4-roadmap-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('execution_roadmap', 'execution_plan', 'roadmap', 'mobilization_roadmap')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest) | Server: `deliverables_v2` + `deliverable_versions` | Stored | After roadmap update; page load | Empty placeholder: `"Execution roadmap documentation will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p4-roadmap-panel-status` | Computed: `complete` when roadmap deliverable exists and is non-null; `in-progress` when content exists but deliverable not signed; `not-started` when no deliverable | Server: derived | Computed | After deliverable add/update | `'not-started'` | Not editable |
| `ws-canvas-p4-roadmap-milestone-{n}` | `program_milestones` WHERE `engagement_id = moveId` ORDER BY `phase_number ASC, sequence ASC` | Server: `SELECT * FROM program_milestones WHERE engagement_id = $moveId ORDER BY phase_number, target_date` | Stored (milestone rows; demo data seeded in migration `20260504220000`) | After milestone add/update/delete; page load | Empty list | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p4-roadmap-milestone-{n}-name` | `program_milestones.name` | Same | Stored | After milestone edit | Empty | Same |
| `ws-canvas-p4-roadmap-milestone-{n}-date` | `program_milestones.target_date` | Same | Stored | After milestone edit | Null (not set) | Same |
| `ws-canvas-p4-roadmap-milestone-{n}-status` | `program_milestones.status` — values: `'upcoming'` / `'hit'` / `'at_risk'` / `'missed'` | Same | Stored | After milestone status update | `'upcoming'` | Admin, lead; `viewMode = current` |

---

## §3 · Business Case Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p4-businesscase-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('business_case', 'funding_business_case', 'approval_business_case')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest) | Server: `deliverables_v2` + `deliverable_versions` | Stored | After business case update; page load | Empty placeholder: `"Business case documentation will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p4-businesscase-panel-status` | Computed: `approved` when `status = 'signed_off'`; `in-progress` when content exists; `not-started` when no deliverable | Server: derived | Computed | After deliverable status change | `'not-started'` | Not editable |
| `ws-canvas-p4-businesscase-rom-low` | `engagements.value_projected_low_usd` | Server: `getProgramById` | Stored | After ROM update | Null (Nexus ROM estimate) | Admin, lead (to update with org-specific figures) |
| `ws-canvas-p4-businesscase-rom-mid` | Computed: `(value_projected_low_usd + value_projected_high_usd) / 2` | Server: derived | Computed | After ROM update | Null | Not editable — computed |
| `ws-canvas-p4-businesscase-rom-high` | `engagements.value_projected_high_usd` | Server: `getProgramById` | Stored | After ROM update | Null | Admin, lead |
| `ws-canvas-p4-businesscase-roi-display` | Computed: `(value_projected_high_usd - cost_estimate) / cost_estimate * 100`% — cost_estimate from business case deliverable `structured_data.cost_estimate` (gap-ws-4-011, B-126) | Server: derived | Computed | After ROM or cost update | `"ROI calculation pending"` | Not editable — computed |
| `ws-canvas-p4-businesscase-approve-btn` (visibility) | Computed: visible when `viewMode = current` AND sponsor role | N/A | Computed | View mode change | Hidden | Sponsor role required |

---

## §4 · Value Plan Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p4-valueplan-panel-content` | `program_modules` WHERE `module_key IN ('value_plan', 'value_plan_kpis')` AND `engagement_id = moveId` → `module_data` | Server: `program_modules` | Stored | After value plan update; page load | Empty placeholder: `"Value plan (measurement contract) will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p4-valueplan-kpi-{n}` | `program_modules.module_data->'kpis'` JSONB array entries | Server: same | Stored in JSONB | After KPI add/edit | Empty list | Admin, lead, governance |
| `ws-canvas-p4-valueplan-kpi-{n}-metric` | `module_data->'kpis'[n]->>'metric'` | Same | Stored | After KPI edit | Empty | Same |
| `ws-canvas-p4-valueplan-kpi-{n}-baseline` | `module_data->'kpis'[n]->>'baseline'` | Same | Stored | After KPI edit | Empty | Same |
| `ws-canvas-p4-valueplan-kpi-{n}-target` | `module_data->'kpis'[n]->>'target'` | Same | Stored | After KPI edit | Empty | Same |
| `ws-canvas-p4-valueplan-kpi-{n}-timeframe` | `module_data->'kpis'[n]->>'timeframe'` | Same | Stored | After KPI edit | Empty | Same |
| `ws-canvas-p4-valueplan-panel-status` | Computed from module completion | Server: derived | Computed | After module update | `'not-started'` | Not editable |

---

## §5 · Tower Metric Plan Panel

The Tower metric plan is a **soft gate criterion** (`tower_metric_plan_drafted`) proactively surfaced at mid-P4.

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p4-towermetric-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('tower_metric_plan', 'execution_monitoring_plan', 'control_tower_metrics')` AND `engagement_id = moveId` → `deliverable_versions.content` | Server: `deliverables_v2` + `deliverable_versions` | Stored | After Tower metric plan update; page load | Empty placeholder: `"Tower monitoring metric plan will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p4-towermetric-kpi-{n}` | Same deliverable `structured_data->'tower_kpis'` JSONB array | Server: same | Stored in JSONB | After KPI add/edit | Empty list | Admin, lead, governance |
| `ws-canvas-p4-towermetric-kpi-{n}-metric` | `structured_data->'tower_kpis'[n]->>'metric'` | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p4-towermetric-kpi-{n}-threshold` | `structured_data->'tower_kpis'[n]->>'threshold'` | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p4-towermetric-kpi-{n}-cadence` | `structured_data->'tower_kpis'[n]->>'cadence'` | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p4-towermetric-panel-status` | Computed: `complete` when deliverable exists; `not-started` when no deliverable | Server: derived | Computed | After deliverable add | `'not-started'` | Not editable |
| `ws-canvas-p4-towermetric-proactive-prompt` (visibility) | Computed: visible when `ws-canvas-p4-roadmap-panel-status IN ('in-progress', 'complete')` AND `ws-canvas-p4-businesscase-panel-status IN ('in-progress', 'complete')` AND `ws-canvas-p4-towermetric-panel-status = 'not-started'` | Server: derived | Computed | After roadmap/business case status changes | Hidden | Not editable |

**Note on Tower metric plan storage:** No dedicated `engagements` column for Tower metric plan data exists. Storage is in `deliverables_v2` (deliverable type `tower_metric_plan`). See gap-ws-4-003 in `04-data-gaps.md` (B-119) for the missing dedicated column consideration.

---

## §6 · Gate Panel (P4→P5)

### §6.1 Gate criterion data sources (11 checks)

| element-id | gate criterion key | db-table-or-view | computed-or-stored | fallback |
|---|---|---|---|---|
| `ws-canvas-p4-gate-item-1` (Roadmap drafted — hard) | `execution_roadmap_drafted` | `deliverables_v2` WHERE `deliverable_type_key IN ('execution_roadmap', 'execution_plan', 'roadmap', 'mobilization_roadmap')` EXISTS | `evaluateGate(ctx, moveId, 4, 5)` | `not-evaluated` |
| `ws-canvas-p4-gate-item-2` (Business case approved — hard) | `business_case_approved` | `deliverables_v2` WHERE `deliverable_type_key IN ('business_case', 'funding_business_case', 'approval_business_case')` AND `status = 'signed_off'` | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-3` (Execution milestones defined — hard) | `execution_milestones_defined` | `program_milestones` WHERE `engagement_id = moveId` COUNT > 0; OR `brief_snapshot` text contains `milestone` | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-4` (Success criteria defined — hard) | `execution_success_criteria_defined` | `deliverables_v2` WHERE `deliverable_type_key IN ('execution_success_criteria', 'success_criteria')` EXISTS; OR business case content contains `success criteria` | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-5` (Change plan signed off — hard) | `readiness_and_change_plan_signed_off` | `deliverables_v2` WHERE `deliverable_type_key IN ('change_management_plan', 'business_readiness_plan', 'readiness_and_change_plan')` AND `status = 'signed_off'` | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-6` (Funding approval — soft) | `funding_approval_recorded` | `deliverables_v2` WHERE `deliverable_type_key IN ('funding_approval', 'capacity_approval', 'approval_memo')` AND `status = 'signed_off'` | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-7` (Sponsor alignment — soft) | `sponsor_alignment_confirmed` | `deliverables_v2` WHERE `deliverable_type_key IN ('stakeholder_alignment', 'sponsor_alignment')` AND `status = 'signed_off'` | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-8` (Delivery RACI named — soft) | `delivery_raci_named` | `deliverables_v2` WHERE `deliverable_type_key IN ('delivery_raci', 'raci', 'operating_model')` EXISTS; OR brief text contains `raci` | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-9` (Vendor selection approved — soft) | `vendor_selection_approved` | `deliverables_v2` WHERE `deliverable_type_key IN ('vendor_selection', 'source_award_recommendation')` — passes if not present (vendor may not be applicable) | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-10` (Tower metric plan drafted — soft) | `tower_metric_plan_drafted` | `deliverables_v2` WHERE `deliverable_type_key IN ('tower_metric_plan', 'execution_monitoring_plan', 'control_tower_metrics')` EXISTS; OR brief text contains `tower` or `monitoring` | `evaluateGate` | `not-evaluated` |
| `ws-canvas-p4-gate-item-11` (Tower handoff plan drafted — soft) | `tower_handoff_plan_accepted` | `deliverables_v2` WHERE `deliverable_type_key IN ('tower_handoff_plan', 'execution_monitoring_plan', 'control_tower_handoff')` AND `status = 'signed_off'` | `evaluateGate` | `not-evaluated` |

### §6.2 Gate summary and promote button

| element-id | db-table-or-view | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|
| `ws-canvas-p4-gate-summary` | Computed from `evaluateGate(ctx, moveId, 4, 5)` result | Computed | After any P4 deliverable, milestone, or module change | `"0 of 11 met (0 hard, 0 soft)"` | Not editable |
| `ws-canvas-p4-gate-promote-btn` (enabled) | Computed: zero hard fails AND `userRole` authorized AND `viewMode = 'current'` — soft failures allowed with amber warning (Layer 2 Row 28) | Computed | After gate evaluation | Disabled | Not editable |

---

## §7 · Artifact Shelf

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p4-artifact-{n}` | `move_artifact_index` WHERE `engagement_id = $moveId AND (phase_number = 4 OR artifact_kind IN ('execution_roadmap', 'business_case', 'change_management_plan', 'tower_metric_plan', 'delivery_raci', 'funding_approval'))` | Server: Supabase query on `move_artifact_index` | Stored | After artifact upload; after status change; page load | Empty state | Admin, lead, governance |
| `ws-canvas-p4-artifact-{n}-status` | `move_artifact_index.status` | Same | Stored | After status update | `'draft'` | Admin, lead |

---

## §8 · Write Bindings (P4 mutations)

| interaction-id | what gets written | target | API route |
|---|---|---|---|
| Roadmap panel save | Roadmap deliverable content | `deliverables_v2` / `deliverable_versions` | **gap-ws-4-001** (B-117) |
| Milestone add/update | `program_milestones` row INSERT/UPDATE | `program_milestones` | **gap-ws-4-001** (B-117) |
| Business case approve | `deliverables_v2.status = 'signed_off'` for business case deliverable | `deliverables_v2` | **gap-ws-4-001** (B-117) |
| Tower metric plan save | Tower metric plan deliverable | `deliverables_v2` / `deliverable_versions` | **gap-ws-4-001** (B-117) |
| Promote P4→P5 | `engagements.current_phase = 5` + audit log | `engagements` + `program_audit_log` | `POST /api/programs/phase-gate` — see `04-data-writes-promote.md` |

---

## §9 · Self-QA

| Check | Status |
|---|---|
| All P4 panels mapped to DB sources | PASS |
| P4→P5 gate criteria (11 checks) all mapped to governance.ts keys and DB sources | PASS |
| `program_milestones` table referenced for milestone data | PASS |
| Tower metric plan proactive surfacing condition documented | PASS |
| ROM/ROI computation logic documented | PASS |
| Gaps referenced for missing columns | PASS |
| No "TBD" values | PASS |
