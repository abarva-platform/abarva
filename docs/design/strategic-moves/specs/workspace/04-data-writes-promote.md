# Workspace Write Bindings — Phase promotion mutation — W-4.3

| | |
|---|---|
| **Work Package** | W-4.3 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-writes-promote.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-*.md` (frozen) · `02-state.md` (frozen) · `03-interactions-*.md` (frozen) |
| **Companion** | `04-data-audit-log.md` (W-4.7) · `04-data-gaps.md` (W-4.6) |
| **Author** | Claude Code |

---

## Overview

This document specifies the write binding for phase promotions on the Workspace — the most consequential mutations: advancing a Move from phase N to phase N+1 (e.g., P1 Charter → P2 Discover & Diagnose), and the special case of the P5→Tower handoff.

**UI trigger:** Each phase gate panel has a promote button:
- `ws-canvas-p0-promote-bar-promote-btn` — P0→P1 (INT-WS-P0-03)
- `ws-canvas-p1-gate-promote-btn` — P1→P2
- `ws-canvas-p2-gate-promote-btn` — P2→P3
- `ws-canvas-p3-gate-promote-btn` — P3→P4
- `ws-canvas-p4-gate-promote-btn` — P4→P5
- `ws-canvas-p5-gate-handoff-btn` — P5→Tower (special case, see §3)

**Current API route:** `POST /api/programs/phase-gate` in `src/app/api/programs/phase-gate/route.ts`.

**Substrate note on current route implementation:** The existing `POST /api/programs/phase-gate` route writes to a flat JSON file (`.approvals/phase-gates.json`) using a file-system ledger pattern. It does NOT write to `engagements.current_phase` in Supabase, nor does it write to `program_audit_log`. This is a **substrate gap** — the route is a placeholder that needs to be extended to perform the actual database writes. See gap-ws-4-015 (B-130) in `04-data-gaps.md`.

---

## §1 · Column Definitions

| Column | Content |
|---|---|
| `interaction-id` | Stable ID from Layer 3 |
| `mutation-api-route` | API route that accepts the write |
| `request-body` | Fields sent in the POST body |
| `optimistic-update` | What UI changes before server response |
| `rollback-strategy` | How UI reverts on server error |
| `audit-log-action` | String key written to `program_audit_log.action` |
| `side-effects` | Other tables touched, notifications, cache invalidation |
| `permissions` | Who can trigger this mutation |

---

## §2 · Phase Promotion Write Bindings (W-4.3)

### §2.1 Phase promote — all phases P0→P1 through P4→P5

| Field | Value |
|---|---|
| **interaction-id** | `ws-canvas-{phase}-gate-promote-btn` (click → confirmation dialog → confirm); for P0 specifically: `ws-canvas-p0-promote-bar-promote-btn` |
| **mutation-api-route** | `POST /api/programs/phase-gate` |
| **request-body** | `{ programCode: string, fromPhase: number, toPhase: number, gateCriterion?: string }` — `programCode` is the engagement's display code; `fromPhase` is current active phase; `toPhase = fromPhase + 1`; `gateCriterion` is optional summary string |
| **optimistic-update** | `ws-identity-status-pill` label changes to `"Promoting..."` (amber loading state); promote button disabled; spinner shown inside button; phase rail node for `toPhase` shows pending state |
| **rollback-strategy** | On error: revert status pill to prior value; re-enable promote button; show error toast: `"Promotion failed — [error.message]. Review gate criteria and try again."` |
| **audit-log-action** | `move_promoted_{fromPhase}_to_{toPhase}` — e.g., `move_promoted_1_to_2` for P1→P2 — see `04-data-audit-log.md §2.1` |
| **side-effects (on success):** | 1. `engagements.current_phase` UPDATE to `toPhase` (gap-ws-4-015 — current route does NOT do this; B-130). 2. `program_audit_log` INSERT `move_promoted_{fromPhase}_to_{toPhase}` entry. 3. `phase_gate_snapshots` INSERT capturing full gate state at promotion moment (gap-ws-4-015 — table may not exist; B-130). 4. Phase rail re-renders: `ws-rail-phase-node-p{fromPhase}` becomes `completed`; `ws-rail-phase-node-p{toPhase}` becomes `active`. 5. Canvas switches to `toPhase` canvas context. 6. URL updates to `?phase={toPhase}`. 7. Nexus rescopes to `toPhase` context (first message from Layer 5). 8. Cache invalidation: `revalidatePath('/strategic-moves')` to update portfolio phase badge. 9. Notification to sponsor (gap-ws-4-016, B-131 — no notification service wired). |
| **permissions** | **Pilot:** Any authenticated user with view access (`viewMode = 'current'` AND move `lifecycle NOT IN ['handed_off', 'archived', 'paused']`). Self-approval is explicitly permitted. **Production:** `userRole IN ['admin', 'maestro']` only — enforced by `GATE_APPROVAL_STRICT_MODE` flag (gap-ws-4-003 / B-119). Soft-gate failures (partial gateState) show warning modal — user confirms override. Hard-gate failures block promotion (button disabled) regardless of tier. |

### §2.2 Soft gate failure warning modal (partial gateState promotion)

When `gateState = 'partial'` (hard checks pass, soft checks failing) and user clicks the promote button:
- A warning modal appears listing the failing soft criteria
- Modal label: "Promote with soft gaps?"
- User must explicitly confirm by clicking "Promote anyway"
- On confirm: proceed with promote mutation above
- On cancel: dismiss modal, maintain current gate state

This behavior applies to: P0→P1 (discovery_funding_envelope, initial_scope_boundary, evidence_family_selected are soft), P1→P2 (baseline_captured is soft), P3→P4 (phase_3_findings_written, cxo_interview_complete are soft), P4→P5 (all 6 soft checks).

P2→P3 has no soft checks — `partial` gateState is not possible for that gate.

### §2.3 Gate re-evaluation after promote

After a successful promote mutation, the client should:
1. Refetch the engagement row from Supabase to get the updated `current_phase`
2. Run `evaluateGate(ctx, moveId, toPhase, toPhase + 1)` for the new active phase's gate (eagerly, so the new canvas loads with gate evaluation results)
3. Update the local `gateState` dimension in Layer 2 state with the fresh result

---

## §3 · P5→Tower Handoff (Special Case)

The P5→Tower transition is semantically different from phase-to-phase promotions. It sets `engagements.status = 'handed_off'` rather than advancing `current_phase` (which stays at 5).

| Field | Value |
|---|---|
| **interaction-id** | `ws-canvas-p5-gate-handoff-btn` |
| **mutation-api-route** | `POST /api/programs/phase-gate` — same route, with sentinel `toPhase: 6` (or a `handoff: true` flag — gap-ws-p5-001 / B-120) |
| **request-body** | `{ programCode: string, fromPhase: 5, toPhase: 6, gateCriterion: 'tower_handoff_accepted' }` — note: `toPhase = 6` acts as a sentinel for Tower handoff; actual `current_phase` stays at 5 |
| **optimistic-update** | `ws-identity-status-pill` transitions to "Handing Off..." (loading); handoff button disabled; spinner |
| **rollback-strategy** | On error: revert pill; re-enable button; toast: `"Tower handoff failed — [error]. Confirm Tower acceptance and retry."` |
| **audit-log-action** | `move_handed_off_to_tower` — see `04-data-audit-log.md §2.6` |
| **side-effects (on success):** | 1. `engagements.status = 'handed_off'` UPDATE. 2. `engagements.current_phase` remains 5. 3. `program_audit_log` INSERT `move_handed_off_to_tower`. 4. Workspace enters `handed-off` view mode globally. 5. `ws-identity-status-pill` updates to "Handed Off" (blue/neutral). 6. `ws-rail-tower-indicator` activates. 7. All chat inputs, edit buttons disabled. 8. Cache invalidation: portfolio + workspace routes. |
| **permissions** | `userRole IN ['admin', 'lead', 'governance']` AND `ws-canvas-p5-tower-acceptance-status = 'accepted'` (not merely `acknowledged`) AND `viewMode = 'current'` — see Layer 2 Row 10 |

**Critical gate:** This button is hard-blocked when `ws-canvas-p5-tower-acceptance-status = 'acknowledged'`. The `acknowledged` → `accepted` distinction is a first-class enforcement requirement per doctrine. See Layer 2 Row 11.

---

## §4 · Route Substrate Gap Detail

The current `POST /api/programs/phase-gate` implementation (`src/app/api/programs/phase-gate/route.ts`) uses a **file-system JSON ledger** (`.approvals/phase-gates.json`) and does NOT:
- Write to `engagements.current_phase` in Supabase
- Write to `program_audit_log`
- Enforce role-based permissions beyond Clerk authentication
- Use the `evaluateGate` function from `governance.ts`

The route DOES:
- Authenticate via Clerk
- Validate `programCode`, `fromPhase`, `toPhase`
- Enforce `toPhase = fromPhase + 1`
- Check tenant access via `checkTenantAccessByKey`
- Apply P1→P2 specific preconditions (sponsor commitment, stakeholder success, tensions, data readiness)

**Gap reference:** gap-ws-4-015 (B-130) — extend `POST /api/programs/phase-gate` to write to Supabase `engagements` and `program_audit_log` in addition to (or replacing) the file ledger.

---

## §5 · Self-QA

| Check | Status |
|---|---|
| All 6 promote interactions (P0→P1 through P5→Tower) have binding rows | PASS |
| Request body shape from actual route documented | PASS |
| Optimistic update and rollback specified | PASS |
| Partial gate warning modal documented | PASS |
| Side effects enumerated including audit log, cache, URL, agent rescope | PASS |
| Permission rules aligned with Layer 2 state matrix rows 1–4, 6–7, 10–11 | PASS |
| File-system ledger gap documented with B-130 reference | PASS |
| P5→Tower semantic difference from promote documented | PASS |
| No "TBD" values | PASS |
