# Workspace Shell Read Bindings — W-4.1

| | |
|---|---|
| **Work Package** | W-4.1 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-shell.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-shell.md` (frozen) · `02-state.md` (frozen) · `03-interactions-shell.md` (frozen) |
| **Companion** | `04-data-gaps.md` (gap log) · `04-data-audit-log.md` (audit shapes) |
| **Author** | Claude Code |

---

## Overview

This document specifies the data read bindings for every shell element that persists across all phase contexts of the Workspace page (`/strategic-moves/[moveId]`). Shell elements are defined in `01-anatomy-shell.md`.

**Substrate context:**
- Primary source table: `engagements` (one row per move)
- Participant/sponsor: `engagement_participants` (role, approval_authority)
- Phase labels: `PHASE_LABELS` constant in `src/lib/programs/types.db.ts` (full names); `PHASE_SHORT_NAMES` constant — **gap-ws-001, B-101**
- Query surface: No dedicated Workspace GET API exists yet — context loaded via `getStrategicMovesTenancy()` in `src/lib/programs/strategic-moves-context.ts`; engagement row fetched by `getProgramById()` in `src/lib/programs/queries.ts`
- Audit log: `program_audit_log` (write-only; shape from `src/lib/programs/audit-log.ts`)

---

## §1 · Column Definitions

| Column | Content |
|---|---|
| `element-id` | Stable ID from `01-anatomy-shell.md` |
| `db-table-or-view` | Source table, view, or computed field |
| `query-api-route` | API route that provides this data (or internal server function) |
| `computed-or-stored` | Whether value is computed at query time or stored |
| `refetch-trigger` | What event causes a refetch |
| `fallback` | What renders when null or fetch fails |
| `update-permissions` | Which roles/conditions can update this field |

---

## §2 · Identity Card

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-identity-eyebrow` | `engagements.name` (program code portion) + `engagements.current_phase` → `PHASE_SHORT_NAMES[current_phase]` | Server: `getProgramById(ctx, moveId)` | Computed at render: `{engagement.name} · {PHASE_SHORT_NAMES[current_phase]}` | After phase promotion (URL param `?phase=N` change) | `"MOVE · Originate"` (static fallback) | Not user-editable on Workspace — read-only |
| `ws-identity-title` | `engagements.name` | Server: `getProgramById(ctx, moveId)` | Stored | On engagement update; page load | `"Untitled Move"` | Admin and lead via separate edit flow; not inline on Workspace |
| `ws-identity-status-pill` | Derived from `engagements.status` + `engagements.current_phase` | Server: `getProgramById(ctx, moveId)` | Computed: `status IN ('active', 'paused', 'handed_off', 'archived')` | After any mutation that changes `engagements.status` or `current_phase`; optimistic on promote | `"Active"` (green) as default when status is null | Only updated as side effect of promote/pause/resume mutations |
| `ws-identity-phase-label` | `engagements.current_phase` → `PHASE_LABELS[current_phase]` | Server: `getProgramById(ctx, moveId)` | Computed: full phase name from `PHASE_LABELS` constant | After phase promotion | `"P0 Originate"` | Read-only; changes only on promotion |

### §2.1 Status pill derivation

The `ws-identity-status-pill` visible value is computed as follows:

| `engagements.status` value | Pill label | Color token |
|---|---|---|
| `'active'` or null (current_phase 0–4) | "Active" | green |
| `'paused'` | "Paused" | amber |
| `'handed_off'` | "Handed Off" | blue/neutral |
| `'archived'` | "Archived" | muted gray |
| `'complete'` (legacy, remapped to P5) | "Active" | green |

---

## §3 · Value At Stake

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-identity-value-at-stake` | `engagements.value_projected_low_usd` + `engagements.value_projected_high_usd` + `engagements.value_currency` | Server: `getProgramById(ctx, moveId)` | Stored; display format computed: `"$X–$Y"` using `value_currency` | After P1 charter value range lock mutation; after any update to value columns | Element hidden (not rendered) when both `value_projected_low_usd` and `value_projected_high_usd` are null | Admin, lead (sponsor) via P1 charter section edit; not directly editable on identity card |

**Display logic:**
- If both `value_projected_low_usd` and `value_projected_high_usd` are set: display `"$LOW–$HIGH"` (formatted with commas, no decimal)
- If only `value_projected_high_usd` is set: display `"Up to $HIGH"`
- If both null: element hidden (Layer 2 Row 29)

---

## §4 · Phase Rail

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-rail-phase-node-p0` (visual state) | `engagements.current_phase` | Server: `getProgramById(ctx, moveId)` | Computed: phase 0 visual_state = `'completed'` when `current_phase > 0`; `'active'` when `current_phase = 0`; never `'future'` | After phase promotion | `'future'` (static) | Not editable — derived from phase |
| `ws-rail-phase-node-p0-label` | `PHASE_SHORT_NAMES[0]` = `"Originate"` | N/A — constant | Computed (constant) | Never | `"Originate"` | Not editable — constant (gap-ws-001) |
| `ws-rail-phase-node-p1` (visual state) | `engagements.current_phase` | Server: `getProgramById(ctx, moveId)` | Computed: `'completed'` when `current_phase > 1`; `'active'` when `current_phase = 1`; `'future'` when `current_phase < 1` | After phase promotion | `'future'` | Not editable |
| `ws-rail-phase-node-p1-label` | `PHASE_SHORT_NAMES[1]` = `"Charter"` | N/A — constant | Computed (constant) | Never | `"Charter"` | Not editable (gap-ws-001) |
| `ws-rail-phase-node-p2` (visual state) | `engagements.current_phase` | Server: `getProgramById(ctx, moveId)` | Computed: `'completed'` / `'active'` / `'future'` by same rule | After phase promotion | `'future'` | Not editable |
| `ws-rail-phase-node-p2-label` | `PHASE_SHORT_NAMES[2]` = `"Diagnose"` | N/A — constant | Computed (constant) | Never | `"Diagnose"` | Not editable (gap-ws-001) |
| `ws-rail-phase-node-p3` (visual state) | `engagements.current_phase` | Server: `getProgramById(ctx, moveId)` | Computed | After phase promotion | `'future'` | Not editable |
| `ws-rail-phase-node-p3-label` | `PHASE_SHORT_NAMES[3]` = `"Design"` | N/A — constant | Computed (constant) | Never | `"Design"` | Not editable (gap-ws-001) |
| `ws-rail-phase-node-p4` (visual state) | `engagements.current_phase` | Server: `getProgramById(ctx, moveId)` | Computed | After phase promotion | `'future'` | Not editable |
| `ws-rail-phase-node-p4-label` | `PHASE_SHORT_NAMES[4]` = `"Roadmap"` | N/A — constant | Computed (constant) | Never | `"Roadmap"` | Not editable (gap-ws-001) |
| `ws-rail-phase-node-p5` (visual state) | `engagements.current_phase` | Server: `getProgramById(ctx, moveId)` | Computed | After phase promotion | `'future'` | Not editable |
| `ws-rail-phase-node-p5-label` | `PHASE_SHORT_NAMES[5]` = `"Mobilize"` | N/A — constant | Computed (constant) | Never | `"Mobilize"` | Not editable (gap-ws-001) |
| `ws-rail-tower-indicator` | Hardcoded label `"→ Tower"` | N/A — constant | Computed (constant) | Never | `"→ Tower"` | Not editable — non-interactive |
| `ws-rail-connector-{0..5}` | `engagements.current_phase` | Server: `getProgramById(ctx, moveId)` | Computed: connector-N is `filled` when `current_phase > N`; `partial` when `current_phase = N`; `empty` when `current_phase < N` | After phase promotion | `empty` | Not editable — visual only |

### §4.1 Phase node visual state rule

```
visual_state(nodePhase, currentPhase):
  if nodePhase < currentPhase → 'completed' (filled dot, green/checkmark)
  if nodePhase = currentPhase → 'active' (filled dot, current color, pulsing or bold)
  if nodePhase > currentPhase → 'future' (empty dot, muted)
```

---

## §5 · Breadcrumb

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-breadcrumb-portfolio-link` | Hardcoded: `label = "Strategic Moves"`, `href = "/strategic-moves"` | N/A — constant | Computed (constant) | Never | `"Strategic Moves"` (static) | Not editable |
| `ws-breadcrumb-move-name` | `engagements.name` | Server: `getProgramById(ctx, moveId)` | Stored | After engagement name update; page load | `"Untitled Move"` | Read-only — reflects engagement name |

---

## §6 · Chat Lane Shell

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-chat-header` | `agent_label = "Nexus"` (constant) + `phase_context_label = PHASE_SHORT_NAMES[viewedPhase]` | N/A — constant + derived | Computed | When viewed phase changes (rail click); when view mode changes | `"Nexus"` / `"P0"` | Not editable |
| `ws-chat-message-list` | Agent conversation turns stored in `engagements.id`-scoped agent context; retrieved via the agent context broker | Agent SSE stream endpoint (no dedicated REST GET; messages arrive via streaming in current view mode); read from broker bundle on load | Stored in agent context (not in `engagements` table directly) | On new Nexus message; page load (retrieves last N turns from broker) | Empty list — blank chat state; Phase first-message from Layer 5 | Not directly editable by user |
| `ws-chat-nexus-message` | Agent turn with `role = 'assistant'`; `content`, `timestamp`, optional `evidence_citations` | Agent context broker (engagement-scoped) | Stored in agent context | Real-time SSE | None — empty list state | Append-only by Nexus |
| `ws-chat-user-message` | Agent turn with `role = 'user'`; `content`, `timestamp` | Agent context broker (engagement-scoped) | Stored in agent context | After user sends message | None — empty list state | Append-only by user send |
| `ws-chat-chip-list` | Chip set from Layer 5 spec (`05-chips-all-phases.md`) — phase-specific, context-dependent | Computed from current phase + gate state at render time | Computed at render | After phase change; after gate state changes; after first Nexus message appears | Hidden (condition: `ws-chat-chip-list` hidden until first Nexus message) | Not editable — derived from Layer 5 |
| `ws-chat-chip-{n}` | `chip_label` and `chip_action` from Layer 5 chip set | Computed from phase context | Computed (constant per phase context) | When phase or gate state changes | Hidden with parent | Not editable |
| `ws-chat-input-field` | Local client state only (draft text) | N/A — local state | N/A | N/A | Placeholder: `"Message Nexus..."` | Enabled in `current` and `future` view modes; disabled in `past` and `handed-off` |

---

## §7 · Sponsor Strip

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-sponsor-strip` (visibility) | Presence of any `engagement_participants` row with `approval_authority = 'sponsor'` for this `engagement_id` | Server: `engagement_participants` query via `getProgramById` state aggregation | Computed: strip visible iff sponsor participant exists | After sponsor assigned/removed mutation | Element hidden | Not directly editable — show/hide is derived |
| `ws-sponsor-strip-name` | `engagement_participants.user_name` (or `persons.name` via `engagement_participants.person_id`) where `approval_authority = 'sponsor'` | Server: join `engagement_participants → persons` via `person_id` | Stored | After sponsor assignment mutation; page load | `"Sponsor not named"` (fallback when `user_name` and `persons.name` both null) | Admin/governance only via participant management |
| `ws-sponsor-strip-role` | `engagement_participants.role` where `approval_authority = 'sponsor'`; supplemented by `persons.title` if available | Server: `engagement_participants` join | Stored | Page load; after sponsor update | Empty string (not shown if null) | Admin/governance only |
| `ws-sponsor-strip-status` | Derived from `founder_approval_requests` — latest request for this `engagement_id` with `request_type = 'phase_signoff'`: `status IN ('pending', 'approved')` | Server: `founder_approval_requests` query filtered by `engagement_id` + `request_type` | Computed: `not_requested` when no request exists; `requested` when `status = 'pending'`; `signed_off` when `status = 'approved'` | After `ws-sponsor-strip-action-btn` mutation (INT-WS-SS-01); after approval decision | `not_requested` | Not directly editable — derived from approval records |
| `ws-sponsor-strip-action-btn` (label) | Same as `ws-sponsor-strip-status` derivation | Server: same | Computed | Same as status | `"Request Review"` (default when not requested) | Visible only in `current` view mode; hidden in `past`, `future`, `handed-off` |

---

## §8 · Data Load Context

The Workspace page does not have a dedicated `GET /api/programs/workspace/[moveId]` endpoint at the time of this spec. Data is loaded server-side via:

1. `getStrategicMovesTenancy()` in `src/lib/programs/strategic-moves-context.ts` — resolves `TenancyCtx` from active client + current user
2. `getProgramById(ctx, moveId)` in `src/lib/programs/queries.ts` — fetches the `engagements` row
3. Participant query: `engagement_participants WHERE engagement_id = moveId` — for sponsor strip and role-based gate access
4. Gate evaluation: `evaluateGate(ctx, moveId, fromPhase, toPhase)` in `src/lib/programs/governance.ts` — called per phase canvas render

**Gap:** No single `GET /api/programs/workspace/[moveId]` route exists that returns all shell data in one response. Shell data is assembled from multiple queries. See `gap-ws-4-007` in `04-data-gaps.md`.

---

## §9 · Self-QA

| Check | Status |
|---|---|
| Every shell element from `01-anatomy-shell.md` has a read binding row | PASS |
| All element IDs match Layer 1 exactly | PASS |
| No "TBD" values in any binding row | PASS |
| Fallback values specified for every field | PASS |
| Refetch triggers specified | PASS |
| Gaps referenced to `04-data-gaps.md` and B-xxx items | PASS |
| Status pill derivation table present | PASS |
| Phase node visual state rule documented | PASS |
| Sponsor strip derivation from `founder_approval_requests` documented | PASS |
