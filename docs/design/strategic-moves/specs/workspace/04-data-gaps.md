# Workspace Substrate Gap Log — bindings without current substrate support

| | |
|---|---|
| **Work Package** | W-4.6 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-gaps.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-*.md` (frozen), `02-state.md` (frozen), `03-interactions-*.md` (frozen) |
| **Companion** | `04-data-writes-promote.md` (W-4.3), `04-data-writes-gate.md` (W-4.4), `04-data-audit-log.md` (W-4.7) |
| **Author** | Claude Code |

---

## Overview

This document enumerates all Workspace Layer 4 bindings that reference missing or incomplete substrate — tables, columns, API routes, feature flags, or constants that do not yet exist as of 2026-05-05. Each gap is assigned a stable gap ID and a backlog item number.

**Numbering:** Originate Layer 4 gaps ran through B-116. Workspace Layer 4 gaps start at B-117.

---

## §1 · Gap table

| Gap ID | Spec file | Element(s) affected | Missing substrate | Impact | Backlog item |
|---|---|---|---|---|---|
| `gap-ws-4-001` | `04-data-writes-gate.md` §2.1–2.4 | All gate criterion toggle/waive/comment/reset mutations | `gate_criterion_snapshots` table does not exist. Schema specified in `04-data-writes-gate.md` §4. No migration file exists for this table as of 2026-05-05. | **High** — gate criterion state cannot be persisted; gate panel is purely ephemeral UI without this table. | B-117: Create migration `YYYYMMDDHHMMSS_add_gate_criterion_snapshots.sql` with schema from `04-data-writes-gate.md` §4. Enable RLS; add INSERT/UPDATE policy for authenticated tenant members in pilot; restrict hard-criteria UPDATE to admin/maestro in production mode. |
| `gap-ws-4-002` | `04-data-writes-promote.md` §2.1 | Phase promotion side-effect #3 (`phase_gate_snapshots` INSERT) | `phase_gate_snapshots` table does not exist. This table should capture the full gate criterion state at the moment of phase promotion (immutable historical record distinct from the live `gate_criterion_snapshots` UPSERT table). | **High** — without a promotion snapshot, there is no audit-quality record of what gate state was when the phase was approved. | B-118: Create migration for `phase_gate_snapshots` table: `{ id, engagement_id, from_phase, to_phase, promoted_at, promoted_by_user_id, promoted_by_role, criteria_snapshot JSONB, rationale TEXT }`. This table is append-only (no UPDATE/DELETE — same pattern as `program_audit_log`). |
| `gap-ws-4-003` | `04-data-writes-promote.md` §2.3, `04-data-writes-gate.md` §3 | `POST /api/programs/phase-gate`, `POST /api/programs/gate-criterion` | `GATE_APPROVAL_STRICT_MODE` feature flag — the `POST /api/programs/phase-gate` route currently has no role-level gate approval enforcement. Pilot behavior is permissive (any authenticated user). Production requires `admin`/`maestro`-only approval and `admin`/`maestro`-only hard-criterion waiver. The strict-mode enforcement path does not exist. | **Medium** — pilot works without this flag. Risk is that permissive pilot behavior ships to production without a clear cutover mechanism. | B-119: Add `GATE_APPROVAL_STRICT_MODE` environment variable (boolean, default `false`). In `POST /api/programs/phase-gate` and `POST /api/programs/gate-criterion`: when flag is `true`, enforce role check (`admin` or `maestro`) before allow. Return 403 with `{ code: 'GATE_APPROVAL_REQUIRES_ADMIN_OR_MAESTRO' }` when rejected. Document flag in `.env.example` and deployment runbook. |
| `gap-ws-4-004` | `04-data-writes-promote.md` §2.2 | Pre-condition check: `GATE_OVERRIDE_THRESHOLD` | The constant `GATE_OVERRIDE_THRESHOLD` (max unmet criteria allowed for override promotion) is not defined anywhere in the codebase. The gate-override state (Layer 2 §1.4) requires this threshold to determine when override is permissible vs. blocked. | **Medium** — without this constant, gate-override UI cannot correctly block or allow the Approve & Promote button. | B-120: Define `GATE_OVERRIDE_THRESHOLD` as a typed constant in `src/lib/programs/types.db.ts` (or a dedicated `gate-constants.ts`). Initial pilot value: 2 (at most 2 unmet criteria permitted for override). |
| `gap-ws-4-005` | `04-data-audit-log.md` §2.1 | `move_promoted_{fromPhase}_to_{toPhase}` audit entry | The `program_audit_log` schema (as of Originate Layer 4 §4.3) has `actor_role TEXT` but the promote mutation at `POST /api/programs/phase-gate` does not yet resolve the actor's role at the time of writing the audit entry. The role must be looked up from the Clerk session / tenant membership table at request time. | **Medium** — audit entries for promotions will have `actor_role = null` until this gap is closed, making production audit trails unable to distinguish self-approved vs. admin-approved promotions. | B-121: In the `POST /api/programs/phase-gate` handler, after `getAuth()`, resolve `actor_role` from the tenant membership record (or Clerk JWT custom claims if role is embedded there). Pass `actor_role` to the `program_audit_log` INSERT. |
| `gap-ws-4-006` | `04-data-writes-promote.md` §2.1 side-effect #1 | `engagements.current_phase` UPDATE | The `POST /api/programs/phase-gate` API route does not yet exist. The Originate promote goes through `POST /api/programs/origination-submit`. Mid-stream phase transitions (P1→P2, P2→P3, etc.) require a separate route that handles the gate approval flow distinct from origination. | **High** — the entire phase promote write binding has no API route. | B-122: Create `POST /api/programs/phase-gate` route in `src/app/api/programs/phase-gate/route.ts`. Handler spec: authenticate → permission check (pilot/production) → concurrency check → transactional write (snapshots + phase update + audit log) → return. |
| `gap-ws-4-007` | `04-data-writes-gate.md` §3 | `POST /api/programs/gate-criterion` | The `POST /api/programs/gate-criterion` API route does not yet exist. | **High** — gate criterion toggling has no backend. | B-123: Create `POST /api/programs/gate-criterion` route in `src/app/api/programs/gate-criterion/route.ts`. Also create `POST /api/programs/gate-criterion-reset` for the bulk-reset action. |
| `gap-ws-4-008` | `04-data-writes-gate.md` §2.3 | `GateCriterionDefinition.hard` flag | The `GateCriterionDefinition` type (if it exists) does not have a `hard: boolean` field distinguishing hard criteria (require admin/maestro to waive in production) from soft criteria (any viewer). | **Low (pilot)** / **Medium (production)** | B-124: Add `hard: boolean` field to `GateCriterionDefinition` type in `src/lib/programs/types.db.ts`. Define which criteria for each phase gate are hard vs. soft in the phase gate configuration constants. |

---

## §2 · Previously identified adjacent gaps (for cross-reference)

These gaps were identified in Originate Layer 4 (`docs/design/strategic-moves/specs/originate/04-data-bindings.md`) but have direct relevance to Workspace Layer 4:

| Gap ID (Originate) | Backlog item | Relevance to Workspace |
|---|---|---|
| `gap-orig-013` | B-113 | Portfolio cache invalidation after promote — same mechanism needed after every phase promote from Workspace gate, not just from Originate. |
| `gap-orig-014` | B-114 | Display ID assignment (`APX-CDP-2026` format) — Workspace audit log uses `program_id TEXT` as temporary UUID until display ID is assigned. |

---

## §3 · Self-QA

| Check | Status |
|---|---|
| All gaps from W-4.3, W-4.4, W-4.7 referenced | PASS |
| Each gap has a stable gap-ws-4-{N} ID | PASS |
| Each gap has a backlog item number (B-117 through B-124) | PASS |
| `GATE_APPROVAL_STRICT_MODE` gap documented (gap-ws-4-003 / B-119) | PASS |
| Impact column distinguishes pilot vs. production severity | PASS |
| Missing API routes flagged as High-impact gaps | PASS — B-122 (phase-gate route) and B-123 (gate-criterion route) |
| No "TBD" | PASS |

---

## §4 · Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — gate self-approval model and GATE_APPROVAL_STRICT_MODE gap (B-119) incorporated | Claude Code |
