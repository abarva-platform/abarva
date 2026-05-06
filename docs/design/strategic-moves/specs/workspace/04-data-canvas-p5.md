# Workspace Canvas Read Bindings — P5 Mobilize & Handoff phase — W-4.2 (P5)

| | |
|---|---|
| **Work Package** | W-4.2 (P5) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-canvas-p5.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-canvas-p5.md` (frozen) · `02-state.md` (frozen) · `03-interactions-canvas-p5.md` (frozen) |
| **Author** | Claude Code |

---

## Overview

P5 Mobilize & Handoff is the final Strategic Moves phase. Its primary output is the Tower handoff package — accepted by the execution team (not merely acknowledged). After P5 completes, `engagements.status = 'handed_off'` and Tower owns execution tracking.

**P5→Tower gate status:** The `governance.ts` file defines **no P5→Tower gate rule** (last defined gate is P4→P5). Five provisional criteria are documented in Layer 1 (`01-anatomy-canvas-p5.md §P5.5`) and Layer 2 (`02-state.md §3`). This is **gap-ws-p5-001 / B-120** — the P5→Tower gate must be defined in `governance.ts` before implementation. All P5 gate bindings are provisional pending B-120 resolution.

**Critical distinction:** `ws-canvas-p5-tower-acceptance-status = 'acknowledged'` does NOT enable handoff. Only `'accepted'` enables the `ws-canvas-p5-gate-handoff-btn`.

---

## §1 · Column Definitions

Same as `04-data-shell.md §1`.

---

## §2 · RACI Panel

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p5-raci-panel-content` | `deliverables_v2` WHERE `deliverable_type_key IN ('delivery_raci', 'raci', 'operating_model')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest) | Server: `deliverables_v2` + `deliverable_versions` | Stored | After RACI update; page load | Empty placeholder: `"Delivery RACI with named owners will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p5-raci-role-{n}` | Same deliverable `structured_data->'raci_roles'` JSONB array | Server: same | Stored in JSONB | After role add/edit | Empty list | Admin, lead, governance |
| `ws-canvas-p5-raci-role-{n}-name` | `structured_data->'raci_roles'[n]->>'category'` (e.g., "Business Owner") | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p5-raci-role-{n}-person` | `structured_data->'raci_roles'[n]->>'person'` (named individual, not just a role title) | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p5-raci-role-{n}-responsibility` | `structured_data->'raci_roles'[n]->>'responsibility'` | Same | Stored | After edit | Empty | Same |
| `ws-canvas-p5-raci-panel-status` | Computed: `complete` when RACI deliverable exists with >0 named roles; `in-progress` when deliverable exists; `not-started` when no deliverable | Server: derived | Computed | After deliverable update | `'not-started'` | Not editable |

---

## §3 · Handoff Package Panel

The handoff package is an aggregate — its checklist items link to artifacts from prior phases.

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p5-handoffpack-panel-status` | Computed: `accepted` when `ws-canvas-p5-tower-acceptance-status = 'accepted'`; `ready` when all checklist items are present; `incomplete` when any required item is missing | Server: derived from handoff deliverable + Tower acceptance | Computed | After any handoff component added or accepted | `'incomplete'` | Not editable |
| `ws-canvas-p5-handoffpack-item-{n}` (checklist items) | Computed checklist from `move_artifact_index` queried for specific required artifact types: execution_roadmap, tower_metric_plan, tower_handoff_plan, delivery_raci, change_management_plan, business_case, execution_success_criteria | Server: Supabase query on `move_artifact_index` | Computed from artifact presence | After artifact add; page load | All items show `'Missing'` status | Admin, lead (to add missing components) |
| `ws-canvas-p5-handoffpack-item-{n}-name` | Hardcoded component names (e.g., "Execution Roadmap", "Tower Monitoring Plan", "RACI") | N/A — constant | Computed (constant) | Never | Hardcoded label | Not editable |
| `ws-canvas-p5-handoffpack-item-{n}-status` | Computed: `'Signed'` when corresponding artifact `status = 'signed_off'`; `'Present'` when exists but not signed; `'Missing'` when no artifact of that type exists | Server: derived from `move_artifact_index` | Computed | After artifact add/status change | `'Missing'` | Not editable — derived |
| `ws-canvas-p5-handoffpack-item-{n}-link` | `move_artifact_index.artifact_id` — URL constructed as `/strategic-moves/{moveId}/artifacts/{artifact_id}` | Server: same | Stored (artifact_id) | After artifact add | Link hidden when `status = 'Missing'` | Not editable |

---

## §4 · Tower Acceptance Panel

The Tower acceptance widget manages the `acknowledged` vs `accepted` distinction that gates the handoff button.

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p5-tower-acceptance-status` | `founder_approval_requests` WHERE `engagement_id = moveId` AND `request_type = 'tower_handoff_acceptance'` → latest `status` mapped to: `'not-submitted'` / `'submitted'` / `'acknowledged'` / `'accepted'` / `'declined'` | Server: `founder_approval_requests` query | Computed from approval request status | After Tower acceptance action; after submit; page load | `'not-submitted'` | Not directly editable — derived from approval flow |
| `ws-canvas-p5-tower-acceptance-submit-btn` (enabled) | Computed: enabled when `status = 'not-submitted'` AND `ws-canvas-p5-handoffpack-panel-status = 'ready'` AND `viewMode = 'current'` | N/A | Computed | After handoff package becomes ready | Disabled until package ready | Admin, lead, governance |
| `ws-canvas-p5-tower-acceptance-accept-btn` (enabled) | Computed: enabled when `status IN ('submitted', 'acknowledged')` AND `viewMode = 'current'` | N/A | Computed | After submit | Hidden until submitted | Admin, governance (Tower representative records acceptance) |
| `ws-canvas-p5-tower-acceptance-decline-note` | `founder_approval_requests.decision_notes` WHERE `status = 'declined'` | Server: `founder_approval_requests` | Stored | After decline decision | Hidden (shown only when `declined`) | Not editable — written by Tower representative at decline time |
| `ws-canvas-p5-tower-acceptance-timestamp` | `founder_approval_requests.decided_at` WHERE `status = 'approved'` (mapped to `'accepted'`) | Server: same | Stored | After acceptance | Hidden | Not editable |
| `ws-canvas-p5-tower-acceptance-acceptor` | `founder_approval_requests.approver_user_id` → `persons.name` WHERE acceptance decision recorded | Server: join `founder_approval_requests → persons` | Stored | After acceptance | Hidden | Not editable |

**Note on `founder_approval_requests` status mapping for Tower acceptance:**

| `founder_approval_requests.status` | `tower-acceptance-status` display |
|---|---|
| No request exists | `not-submitted` |
| `'pending'` (submitted, awaiting decision) | `submitted` |
| `'acknowledged'` (Tower has seen it — **does NOT enable handoff**) | `acknowledged` |
| `'approved'` | `accepted` (enables `ws-canvas-p5-gate-handoff-btn`) |
| `'denied'` | `declined` |

**Substrate gap:** `founder_approval_requests.status` has enum values `pending`, `approved`, `denied` in the current schema. The `acknowledged` state is not a native status value. This requires either an additional status value or a separate tracking mechanism. See gap-ws-4-012 (B-127) in `04-data-gaps.md`.

---

## §5 · P5 Gate Panel (P5→Tower — Provisional)

**All items in this section are provisional pending B-120 resolution** — the P5→Tower gate rule does not exist in `governance.ts`. The bindings below are derived from the 5 provisional criteria documented in Layer 1 and Layer 2.

| element-id | provisional gate criterion | proposed db-table-or-view | fallback |
|---|---|---|---|
| `ws-canvas-p5-gate-item-1` (Tower handoff package complete and accepted — provisional hard) | No governance.ts key yet — B-120 | `ws-canvas-p5-handoffpack-panel-status = 'accepted'` (derived from Tower acceptance status) | `not-evaluated` |
| `ws-canvas-p5-gate-item-2` (Execution team confirmed readiness — provisional hard) | No governance.ts key yet — B-120 | `founder_approval_requests` WHERE `request_type = 'execution_team_readiness'` AND `status = 'approved'` — **gap-ws-4-013** (B-128) | `not-evaluated` |
| `ws-canvas-p5-gate-item-3` (Monitoring plan active — provisional hard) | No governance.ts key yet — B-120 | `deliverables_v2` WHERE `deliverable_type_key IN ('tower_metric_plan', 'execution_monitoring_plan')` EXISTS | `not-evaluated` |
| `ws-canvas-p5-gate-item-4` (RACI signed off with named owners — provisional soft) | No governance.ts key yet — B-120 | `deliverables_v2` WHERE `deliverable_type_key IN ('delivery_raci', 'raci')` AND `status = 'signed_off'` | `not-evaluated` |
| `ws-canvas-p5-gate-item-5` (Value realization framework handed to Tower — provisional soft) | No governance.ts key yet — B-120 | `program_modules` WHERE `module_key = 'value_realization_framework'` AND `status = 'completed'` — **gap-ws-4-014** (B-129) | `not-evaluated` |
| `ws-canvas-p5-gate-summary` | Provisional: "X of 5 met" (pending B-120) | Provisional computed from above | `"0 of 5 met"` |
| `ws-canvas-p5-gate-handoff-btn` (enabled) | Computed: all provisional hard checks passing AND `ws-canvas-p5-tower-acceptance-status = 'accepted'` AND `userRole` authorized AND `viewMode = 'current'` | All above | Disabled |

---

## §6 · Artifact Shelf

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p5-artifact-{n}` | `move_artifact_index` WHERE `engagement_id = $moveId AND (phase_number = 5 OR artifact_kind IN ('delivery_raci', 'tower_handoff_plan', 'tower_metric_plan', 'change_management_plan'))` | Server: Supabase query on `move_artifact_index` | Stored | After artifact upload; after status change; page load | Empty state | Admin, lead, governance |
| `ws-canvas-p5-artifact-{n}-status` | `move_artifact_index.status` | Same | Stored | After status update | `'draft'` | Admin, lead |

---

## §7 · P5 Completion — Status Update

When `ws-canvas-p5-gate-handoff-btn` is successfully triggered:
- `engagements.status` is set to `'handed_off'`
- `engagements.current_phase` remains at `5`
- `ws-identity-status-pill` updates to "Handed Off" (blue/neutral)
- `ws-rail-tower-indicator` activates (Layer 2 Row 5)
- The workspace enters `handed-off` view mode globally

This is the **terminal state** of the Strategic Moves lifecycle. No further promotions are possible.

---

## §8 · Write Bindings (P5 mutations)

| interaction-id | what gets written | target | API route |
|---|---|---|---|
| RACI panel save | RACI deliverable content | `deliverables_v2` / `deliverable_versions` | **gap-ws-4-001** (B-117) |
| Tower acceptance submit | `founder_approval_requests` INSERT with `request_type = 'tower_handoff_acceptance'` | `founder_approval_requests` | **gap-ws-4-002** (B-118) |
| Tower acceptance record (accept/decline) | `founder_approval_requests.status` UPDATE | `founder_approval_requests` | **gap-ws-4-002** (B-118) |
| Hand off to Tower | `engagements.status = 'handed_off'` + audit log entry `move_handed_off_to_tower` | `engagements` + `program_audit_log` | `POST /api/programs/phase-gate` (with P5→Tower sentinel) — **gap-ws-p5-001** (B-120) |

---

## §9 · Self-QA

| Check | Status |
|---|---|
| All P5 panels mapped to DB sources | PASS |
| P5 gate items marked as provisional with B-120 reference | PASS |
| `acknowledged` vs `accepted` distinction documented for Tower acceptance panel | PASS |
| `founder_approval_requests` status mapping table included | PASS |
| Handoff terminal state update documented | PASS |
| Substrate gap for `acknowledged` status value documented | PASS |
| No "TBD" values (provisional items marked as provisional with gap references) | PASS |
