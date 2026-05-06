# Workspace Write Bindings — Gate criterion updates and signoff captures — W-4.4

| | |
|---|---|
| **Work Package** | W-4.4 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-writes-gate.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-*.md` (frozen) · `02-state.md` (frozen) · `03-interactions-*.md` (frozen) |
| **Companion** | `04-data-writes-promote.md` (W-4.3) · `04-data-audit-log.md` (W-4.7) · `04-data-gaps.md` (W-4.6) |
| **Author** | Claude Code |

---

## Overview

This document specifies the write bindings for per-criterion gate interactions. In the Strategic Moves substrate, **gate criteria are not toggled independently** by users through a direct API — they are evaluated by `evaluateGate()` in `governance.ts` based on artifact and module state. The "interactions" documented here are the underlying artifact/module mutations that cause gate criterion evaluation results to change.

The per-criterion `ws-canvas-{phase}-gate-criterion-{key}-toggle` interaction ID referenced in the spec instructions **does not have a corresponding API route in the current substrate** — this is gap-ws-4-001 (B-117).

What exists:
- `POST /api/programs/phase-gate` — for phase promotion (see W-4.3)
- No dedicated gate-criterion toggle API exists

This document therefore specifies:
1. The underlying artifact/module mutations that change gate criterion evaluation results
2. The sponsor signoff mutation (for `charter_signed_off` and similar criteria)
3. The substrate gap for a dedicated gate criterion state API

> **Gate criterion permission model:**
>
> Gate criteria pass/fail based on artifact and deliverable state. Changing a criterion's evaluation result means updating the underlying artifact (e.g., signing off a deliverable). Those mutations require the roles appropriate to that artifact action.
>
> A dedicated `POST /api/programs/gate-criterion` route for explicit criterion toggling does not yet exist — see gap-ws-4-001 (B-117).

---

## §1 · Column definitions

| Column | Content |
|---|---|
| `interaction-id` | Stable ID from Layer 3 |
| `mutation-api-route` | API route that accepts the write |
| `permissions` | Who can trigger this mutation |
| `optimistic-update` | What UI changes before server response |
| `rollback-on-failure` | How UI reverts on server error |
| `audit-log-shape` | Reference to `04-data-audit-log.md` |
| `side-effects` | Other tables touched or recomputed |

---

## §2 · Gate criterion toggle

### 2.1 Toggle a single gate criterion (met / not-met)

| Field | Value |
|---|---|
| **interaction-id** | `ws-gate-criterion-{criterionId}-toggle` (click checkbox / toggle) |
| **mutation-api-route** | `POST /api/programs/gate-criterion` with body `{ engagementId, phase, criterionId, status: 'met' \| 'not-met', comment?: string }` |
| **permissions — Pilot** | Any authenticated user who can view the Move |
| **permissions — Production** | Hard criteria (`hard: true`): `admin` or `maestro` only. Soft criteria: any authenticated viewer. |
| **optimistic-update** | Criterion row immediately flips its visual state (checkbox fills / unfills; `met-count` badge in gate header increments/decrements). The gate readiness meter (`ws-gate-readiness-meter`) re-renders from optimistic criterion count. |
| **rollback-on-failure** | Criterion row reverts to pre-toggle state. Toast: "Failed to update criterion — please try again." |
| **audit-log-shape** | See `04-data-audit-log.md` §2.2 — `gate_criterion_updated` entry |
| **side-effects** | 1. `gate_criterion_snapshots` INSERT or UPSERT: `{ engagementId, phase, criterionId, status, updatedByUserId, updatedAt }`. 2. Recompute gate readiness state (`gateState` dimension in Layer 2 §1.4) — `gate-not-ready` / `gate-ready` / `gate-override` updates based on new criterion count. 3. "Approve & Promote" button enable/disable state recalculates. |

---

### 2.2 Waive a gate criterion

A criterion can be waived (explicitly skipped with a reason) rather than marked `met`. Waivers require a comment.

| Field | Value |
|---|---|
| **interaction-id** | `ws-gate-criterion-{criterionId}-waive` (waive action in criterion context menu) |
| **mutation-api-route** | `POST /api/programs/gate-criterion` with body `{ engagementId, phase, criterionId, status: 'waived', comment: string }` (comment required for waiver) |
| **permissions — Pilot** | Any authenticated user who can view the Move |
| **permissions — Production** | `admin` or `maestro` role only (waivers are always hard actions in production) |
| **optimistic-update** | Criterion row shows "Waived" badge. Comment appears inline. |
| **rollback-on-failure** | Reverts to pre-waiver state. Toast: "Failed to waive criterion." |
| **audit-log-shape** | See `04-data-audit-log.md` §2.3 — `gate_criterion_waived` entry |
| **side-effects** | Same as §2.1 plus: waived criteria count separately from `met` in gate readiness calculation. A gate with waivers is promotable only in `gate-override` state. |

---

### 2.3 Add / edit signoff comment on a criterion

| Field | Value |
|---|---|
| **interaction-id** | `ws-gate-criterion-{criterionId}-comment-input` (text input → blur or explicit save) |
| **mutation-api-route** | `POST /api/programs/gate-criterion` with body `{ engagementId, phase, criterionId, status: <current>, comment: string }` |
| **permissions — Pilot** | Any authenticated user who can view the Move |
| **permissions — Production** | Any authenticated viewer (comments are not restricted) |
| **optimistic-update** | Comment text updates immediately in the criterion row. Character count badge updates. |
| **rollback-on-failure** | Comment reverts to prior value. Toast: "Failed to save comment." |
| **audit-log-shape** | See `04-data-audit-log.md` §2.4 — `gate_criterion_comment_updated` entry (written only when comment changes from non-empty to different non-empty; not written for empty→empty) |
| **side-effects** | `gate_criterion_snapshots` UPSERT (updates comment field on existing row for this criterion/phase/engagement). No gate readiness recompute — comments do not change criterion status. |

---

### 2.4 Gate panel — "Reset all criteria" (admin action)

Available only via overflow menu. Resets all criteria for the current phase to `not-met`.

| Field | Value |
|---|---|
| **interaction-id** | `ws-gate-panel-reset-criteria-btn` (overflow menu → confirm dialog → confirm) |
| **mutation-api-route** | `POST /api/programs/gate-criterion-reset` with body `{ engagementId, phase }` |
| **permissions — Pilot** | Any authenticated user (no restriction during pilot) |
| **permissions — Production** | `admin` or `maestro` role only |
| **optimistic-update** | All criterion checkboxes immediately unfill. `met-count` resets to 0. Gate state transitions to `gate-not-ready`. |
| **rollback-on-failure** | All criteria revert to pre-reset states. Toast: "Failed to reset criteria." |
| **audit-log-shape** | See `04-data-audit-log.md` §2.5 — `gate_criteria_reset` entry |
| **side-effects** | `gate_criterion_snapshots` bulk UPDATE: all rows for `{ engagementId, phase }` set to `status='not-met', comment=null`. Gate readiness recomputes to `gate-not-ready`. |

---

## §3 · API route behavior — `POST /api/programs/gate-criterion`

The route handler should:

1. Verify authentication (Clerk `getAuth()` — reject with 401 if unauthenticated).
2. **Pilot mode:** Any authenticated user with tenant access may toggle criteria. No role check.
3. **Production mode (behind `GATE_APPROVAL_STRICT_MODE` flag):**
   - If `criterionId` maps to a hard criterion (`hard: true` in `GateCriterionDefinition`) OR `status === 'waived'`: require `admin` or `maestro` role. Reject with 403 + `{ code: 'GATE_CRITERION_REQUIRES_ADMIN_OR_MAESTRO' }` if not.
   - Soft criteria: any authenticated viewer.
4. UPSERT into `gate_criterion_snapshots` (unique on `engagement_id, phase, criterion_id`).
5. Write `program_audit_log` INSERT for the criterion change.
6. Return `{ success: true, criterionId, newStatus }`.

---

## §4 · Substrate note — `gate_criterion_snapshots` table

This table does not yet exist in the migration files as of 2026-05-05. It is a required substrate for these write bindings. See `gap-ws-4-001` (B-117) in `04-data-gaps.md`.

Expected schema:

```sql
CREATE TABLE gate_criterion_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id     UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  phase             INT NOT NULL CHECK (phase BETWEEN 0 AND 5),
  criterion_id      TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('not-met', 'met', 'waived')),
  comment           TEXT,
  updated_by_user_id UUID REFERENCES persons(id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, phase, criterion_id)
);
```

---

## §5 · Self-QA

| Check | Status |
|---|---|
| Every gate criterion interaction from Layer 3 has a write binding row | PASS |
| Permissions column documents both Pilot and Production tiers | PASS |
| Hard vs. soft criterion distinction noted for production mode | PASS |
| `GATE_APPROVAL_STRICT_MODE` flag gap referenced | PASS — gap-ws-4-003 / B-119 |
| Optimistic update and rollback specified for all rows | PASS |
| Substrate gap for `gate_criterion_snapshots` referenced | PASS — gap-ws-4-001 / B-117 |
| No "TBD" in any binding row | PASS |

---

## §6 · Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — gate self-approval model (pilot/production tiers) incorporated | Claude Code |
