# Workspace Canvas Read Bindings — P1 Charter phase — W-4.2 (P1)

| | |
|---|---|
| **Work Package** | W-4.2 (P1) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-canvas-p1.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-canvas-p1.md` (frozen) · `02-state.md` (frozen) · `03-interactions-canvas-p1.md` (frozen) |
| **Author** | Claude Code |

---

## Overview

P1 Charter is the chartering phase. Canvas content is stored across `engagements` columns, `engagement_participants`, and `deliverables_v2`. The primary gate advance check is `charter_signed_off` — the charter deliverable must reach `status = 'signed_off'`.

**Gate structure (from `governance.ts` P1→P2 rule):** 3 checks — `charter_signed_off` (hard), `sponsor_assigned` (hard), `baseline_captured` (soft).

---

## §1 · Column Definitions

Same as `04-data-shell.md §1`.

---

## §2 · Charter Sections (×5)

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p1-charter-section-1-content` (Sponsor — identity, commitment, decision rights) | `engagement_participants` WHERE `approval_authority = 'sponsor'` → `user_name` + commitment data from `founder_approval_requests.context_jsonb` | Server: `getProgramById` + `engagement_participants` query | Stored | After sponsor assignment; after sponsor commitment recorded; page load | Empty placeholder: `"Sponsor identity and decision rights will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p1-charter-section-1-status` | Computed: `complete` when sponsor row exists AND commitment record exists; `in-progress` when sponsor exists but no commitment; `empty` when no sponsor | Server: derived from participant + approval query | Computed | After sponsor assignment/commitment mutation | `'empty'` | Not editable |
| `ws-canvas-p1-charter-section-2-content` (Stakeholders — stakeholder map, owners) | `deliverables_v2` WHERE `deliverable_type_key IN ('stakeholder_map', 'stakeholder_alignment')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest) | Server: `deliverables_v2` + `deliverable_versions` | Stored | After stakeholder map update; page load | Empty placeholder: `"Stakeholder map and required human owners will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p1-charter-section-2-status` | Computed from deliverable presence | Server: derived | Computed | After update | `'empty'` | Not editable |
| `ws-canvas-p1-charter-section-3-content` (Success metrics — ratified metrics, measurement cadence) | `deliverables_v2` WHERE `deliverable_type_key IN ('baseline', 'baseline_metrics', 'value_baseline', 'success_criteria')` AND `engagement_id = moveId` → `deliverable_versions.content` (latest) | Server: `deliverables_v2` + `deliverable_versions` query | Stored | After metrics update; page load | Empty placeholder: `"Success metrics and measurement cadence will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p1-charter-section-3-status` | Computed from `baseline_captured` gate check logic | Server: derived | Computed | After metrics update | `'empty'` | Not editable |
| `ws-canvas-p1-charter-section-4-content` (Value range — low/mid/high locked at charter sign-off) | `engagements.value_projected_low_usd` + `engagements.value_projected_high_usd` + `engagements.value_currency` | Server: `getProgramById` | Stored (columns in migration `20260503113000`) | After P1 value range lock; page load | Empty placeholder: `"Value range will be set during charter..."` | Admin, lead, sponsor (to lock); `viewMode = current` |
| `ws-canvas-p1-charter-section-4-status` | Computed: `complete` when both low and high are non-null; `empty` when null | Server: derived | Computed | After value range update | `'empty'` | Not editable |
| `ws-canvas-p1-charter-section-5-content` (Scope — charter scope, more precise than P0 boundary) | `engagements.value_assumptions_jsonb->>'charter_scope'` (interim — gap-ws-4-009, B-124) OR `deliverables_v2` WHERE `deliverable_type_key = 'scope_definition'` → `deliverable_versions.content` | Server: `getProgramById` | Stored (JSONB interim or deliverable) | After scope edit; page load | Empty placeholder: `"Charter scope will appear here..."` | Admin, lead, governance; `viewMode = current` |
| `ws-canvas-p1-charter-section-5-status` | Computed from scope field presence | Server: derived | Computed | After scope update | `'empty'` | Not editable |

---

## §3 · Gate Panel (P1→P2)

### §3.1 Gate criterion data sources

| element-id | gate criterion key | db-table-or-view | computed-or-stored | refetch-trigger | fallback |
|---|---|---|---|---|---|
| `ws-canvas-p1-gate-item-1` (Charter signed off — hard) | `charter_signed_off` | `deliverables_v2` WHERE `deliverable_type_key = 'charter'` AND `status = 'signed_off'` | Computed from `evaluateGate(ctx, moveId, 1, 2)` | After deliverable status change; after gate re-evaluation | `not-evaluated` |
| `ws-canvas-p1-gate-item-2` (Sponsor committed — hard) | `sponsor_assigned` | `engagement_participants` WHERE `approval_authority = 'sponsor'` EXISTS | Computed from `evaluateGate` | After participant assignment | `not-evaluated` |
| `ws-canvas-p1-gate-item-3` (Value range + metrics ratified — soft) | `baseline_captured` | `program_modules` WHERE `module_key IN ('baseline_capture', 'baseline')` AND `status = 'completed'`; OR `deliverables_v2` WHERE `deliverable_type_key IN ('baseline', 'baseline_metrics', 'value_baseline')` EXISTS | Computed from `evaluateGate` | After baseline module completion; after baseline deliverable added | `not-evaluated` |

### §3.2 Gate summary and promote button

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p1-gate-summary` | Computed from `evaluateGate(ctx, moveId, 1, 2)` result | Server: `evaluateGate` in `governance.ts` | Computed | After any gate-relevant deliverable or participant change | `"0 of 3 met"` | Not editable |
| `ws-canvas-p1-gate-promote-btn` (enabled state) | Computed: no hard fails AND `userRole` in `['admin', 'lead', 'governance', 'sponsor']` AND `viewMode = 'current'` | Server: `evaluateGate` + `hasAuthority` | Computed | After gate evaluation | Disabled | Not editable |

---

## §4 · Artifact Shelf

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p1-artifact-{n}` | `move_artifact_index` VIEW: `SELECT * FROM move_artifact_index WHERE engagement_id = $moveId AND (phase_number = 1 OR artifact_kind IN ('charter', 'stakeholder_map', 'baseline_metrics', 'value_baseline'))` | Server: direct Supabase query against `move_artifact_index` view | Stored (view over `deliverables_v2`, `engagement_deliverables`, `program_evidence_items`, `program_attachments`) | After artifact upload; after artifact status change; page load | `ws-canvas-p1-artifact-empty-state` shown | Admin, lead, governance via upload |
| `ws-canvas-p1-artifact-{n}-status` (badge) | `move_artifact_index.status` | Same | Stored | After status update | `'draft'` | Admin, lead via signoff action |
| `ws-canvas-p1-artifact-upload-btn` (visibility) | Computed: visible when `viewMode = current` | N/A | Computed | View mode change | Visible in current mode | N/A |
| `ws-canvas-p1-artifact-empty-state` (visibility) | Computed: visible when 0 rows returned from artifact query | Server: derived | Computed | After artifact upload | Visible (empty state default) | N/A |

---

## §5 · Sponsor Signoff Widget

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p1-sponsor-signoff` (visibility) | Presence of `engagement_participants` row WHERE `approval_authority = 'sponsor'` | Server: `engagement_participants` query | Computed | After sponsor assignment | Hidden | Not editable |
| `ws-canvas-p1-sponsor-signoff-name` | `engagement_participants.user_name` OR `persons.name` WHERE `approval_authority = 'sponsor'` | Server: join `engagement_participants → persons` | Stored | After sponsor assignment | `"Sponsor not assigned"` | Admin/governance only |
| `ws-canvas-p1-sponsor-signoff-status` | `founder_approval_requests.status` for latest request WHERE `request_type = 'phase_signoff'` AND `engagement_id = moveId` | Server: `founder_approval_requests` query | Computed: `not_requested` / `requested` / `signed` | After signoff request or approval | `not_requested` | Not editable — derived |
| `ws-canvas-p1-sponsor-signoff-action-btn` | Same derivation as status | Server: same | Computed label | Same | `"Request Signoff"` | Visible in `current` view mode only |
| `ws-canvas-p1-sponsor-signoff-timestamp` | `founder_approval_requests.decided_at` WHERE `status = 'approved'` | Server: `founder_approval_requests` | Stored | After signoff approval | Hidden (shown only when `signed`) | Not editable |

---

## §6 · Write Bindings (P1 mutations)

| interaction-id (Layer 3) | what gets written | target table/column | API route |
|---|---|---|---|
| Charter section edit save | Charter section content | Various `engagements` columns or `deliverables_v2.content` | **gap-ws-4-001** (B-117) — no workspace content-update API |
| Sponsor signoff request | `founder_approval_requests` INSERT | `founder_approval_requests` | **gap-ws-4-002** (B-118) — no sponsor signoff API route |
| Promote P1→P2 | `engagements.current_phase = 2` + audit log | `engagements` + `program_audit_log` | `POST /api/programs/phase-gate` — see `04-data-writes-promote.md` |

---

## §7 · Self-QA

| Check | Status |
|---|---|
| All 5 charter sections mapped to DB sources | PASS |
| P1→P2 gate criteria (3 checks) mapped to governance.ts keys and DB sources | PASS |
| Artifact shelf mapped to `move_artifact_index` view | PASS |
| Sponsor signoff widget mapped to `founder_approval_requests` | PASS |
| Gaps referenced to gap log | PASS |
| No "TBD" values | PASS |
