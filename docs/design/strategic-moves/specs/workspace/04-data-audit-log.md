# Workspace Audit Log Spec — audit_log entry shapes for all mutations

| | |
|---|---|
| **Work Package** | W-4.7 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-audit-log.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-*.md` (frozen), `02-state.md` (frozen), `03-interactions-*.md` (frozen) |
| **Companion** | `04-data-writes-promote.md` (W-4.3), `04-data-writes-gate.md` (W-4.4), `04-data-gaps.md` (W-4.6) |
| **Author** | Claude Code |

---

## Overview

This document specifies the full `program_audit_log` entry shape for every Workspace mutation. Audit entries are write-only (no UPDATE/DELETE, enforced by RLS + DB trigger). All entries follow the shared schema established in Originate Layer 4 §4.

**Gate approval model note:** The `actor_role` field on promote entries is specifically designed to support the pilot vs. production approval distinction. In pilot, `actor_role` will be the user's tenant membership role (e.g. `'viewer'`, `'contributor'`) even for self-approved promotions. In production (when `GATE_APPROVAL_STRICT_MODE` is enabled), only `'admin'` and `'maestro'` role entries will appear — providing a clear audit trail differentiating self-approved pilot promotions from admin-gated production approvals.

---

## §1 · Shared audit log schema (reference)

From Originate Layer 4 §4 — reproduced here for self-contained reference:

```
program_audit_log:
  id             UUID (PK, auto-generated)
  tenant_key     TEXT (from active client)
  program_id     TEXT (display ID e.g. APX-CDP-2026 — or engagement UUID as text before display ID assigned)
  engagement_id  UUID (FK to engagements, nullable)
  actor_id       UUID (FK to persons, nullable — the user performing the action)
  actor_role     TEXT (role of the actor at time of action — resolved from tenant membership; see gap-ws-4-005 / B-121)
  action         TEXT (discriminator — see §2 entries below)
  from_state     TEXT (previous state descriptor)
  to_state       TEXT (new state descriptor)
  rationale      TEXT (optional human-readable context)
  evidence_refs  TEXT[] (array of evidence IDs, approval request IDs, or snapshot IDs)
  created_at     TIMESTAMPTZ (auto-set to now())
```

---

## §2 · Audit entries produced by Workspace mutations

### 2.1 `move_promoted_{fromPhase}_to_{toPhase}` — phase gate promotion

Fired when `POST /api/programs/phase-gate` succeeds and `engagements.current_phase` is updated.

> **Actor role on this entry is critical for the pilot vs. production audit trail.** The `actor_role` field shows whether approval was self-approved (any role in pilot) or admin-gated (admin/maestro only in production). This field MUST be resolved and written — see `gap-ws-4-005` (B-121).

```json
{
  "action": "move_promoted_p1_to_p2",
  "tenant_key": "<activeClient.key>",
  "program_id": "<engagements.display_id OR engagements.id cast to TEXT>",
  "engagement_id": "<engagements.id>",
  "actor_id": "<resolvedPersonId from Clerk userId>",
  "actor_role": "<tenant membership role at time of action — e.g. 'viewer', 'contributor', 'maestro', 'admin'>",
  "from_state": "P1 Charter — active",
  "to_state": "P2 Discover & Diagnose — active",
  "rationale": "<optional: user-supplied rationale from confirmation dialog, or null>",
  "evidence_refs": ["<phase_gate_snapshots.id of the promotion snapshot>"]
}
```

**Parametric pattern:** The action discriminator follows `move_promoted_{fromPhase}_to_{toPhase}` where `fromPhase` and `toPhase` use the short phase key:

| `fromPhase` key | `toPhase` key |
|---|---|
| `p0` | `p1` |
| `p1` | `p2` |
| `p2` | `p3` |
| `p3` | `p4` |
| `p4` | `p5` |

Example entries: `move_promoted_p1_to_p2`, `move_promoted_p2_to_p3`, `move_promoted_p3_to_p4`, `move_promoted_p4_to_p5`.

**Self-approval vs. admin-approval audit trail:**

To query pilot self-approvals vs. production admin approvals in the audit log:

```sql
-- All pilot self-approvals (non-admin/maestro approvers)
SELECT * FROM program_audit_log
WHERE action LIKE 'move_promoted_%'
  AND actor_role NOT IN ('admin', 'maestro');

-- All production-gated approvals
SELECT * FROM program_audit_log
WHERE action LIKE 'move_promoted_%'
  AND actor_role IN ('admin', 'maestro');
```

---

### 2.2 `gate_criterion_updated` — single criterion toggled met/not-met

Fired when `POST /api/programs/gate-criterion` succeeds with `status: 'met'` or `status: 'not-met'`.

```json
{
  "action": "gate_criterion_updated",
  "tenant_key": "<activeClient.key>",
  "program_id": "<engagements.display_id OR id as TEXT>",
  "engagement_id": "<engagements.id>",
  "actor_id": "<resolvedPersonId>",
  "actor_role": "<tenant membership role>",
  "from_state": "criterion:<criterionId>:not-met",
  "to_state": "criterion:<criterionId>:met",
  "rationale": "<comment if provided, else null>",
  "evidence_refs": ["<gate_criterion_snapshots.id of the updated row>"]
}
```

The `from_state` and `to_state` encode: `criterion:{criterionId}:{previousStatus}` → `criterion:{criterionId}:{newStatus}`.

> **Note:** In pilot, `actor_role` may be `'viewer'` or `'contributor'` for self-approved criterion toggles. In production (strict mode), hard criteria will only show `'admin'` or `'maestro'` as the actor role — providing clear audit evidence that the production gate enforcement is operating.

---

### 2.3 `gate_criterion_waived` — criterion explicitly waived

Fired when `POST /api/programs/gate-criterion` succeeds with `status: 'waived'`.

```json
{
  "action": "gate_criterion_waived",
  "tenant_key": "<activeClient.key>",
  "program_id": "<engagements.display_id OR id as TEXT>",
  "engagement_id": "<engagements.id>",
  "actor_id": "<resolvedPersonId>",
  "actor_role": "<tenant membership role>",
  "from_state": "criterion:<criterionId>:not-met",
  "to_state": "criterion:<criterionId>:waived",
  "rationale": "<waiver reason — required for waiver actions>",
  "evidence_refs": ["<gate_criterion_snapshots.id>"]
}
```

Waivers without a `rationale` should be rejected at the API layer (validation error). The audit entry for a waiver must always have a non-empty `rationale`.

---

### 2.4 `gate_criterion_comment_updated` — comment added or edited on a criterion

Fired when `POST /api/programs/gate-criterion` is called with a changed comment (and `status` unchanged). Only written when comment transitions from one non-empty value to a different non-empty value, OR from `null`/empty to non-empty.

```json
{
  "action": "gate_criterion_comment_updated",
  "tenant_key": "<activeClient.key>",
  "program_id": "<engagements.display_id OR id as TEXT>",
  "engagement_id": "<engagements.id>",
  "actor_id": "<resolvedPersonId>",
  "actor_role": "<tenant membership role>",
  "from_state": "criterion:<criterionId>:comment:<previousCommentPreview or null>",
  "to_state": "criterion:<criterionId>:comment:<newCommentPreview>",
  "rationale": null,
  "evidence_refs": []
}
```

`<commentPreview>` = first 80 characters of the comment followed by `...` if truncated. The full comment is stored in `gate_criterion_snapshots.comment`, not in the audit log.

---

### 2.5 `gate_criteria_reset` — all criteria reset to not-met

Fired when `POST /api/programs/gate-criterion-reset` succeeds.

```json
{
  "action": "gate_criteria_reset",
  "tenant_key": "<activeClient.key>",
  "program_id": "<engagements.display_id OR id as TEXT>",
  "engagement_id": "<engagements.id>",
  "actor_id": "<resolvedPersonId>",
  "actor_role": "<tenant membership role>",
  "from_state": "phase:<phaseKey>:gate-snapshot-before-reset",
  "to_state": "phase:<phaseKey>:all-criteria-not-met",
  "rationale": "<optional reason from confirmation dialog>",
  "evidence_refs": []
}
```

> In production strict mode, a `gate_criteria_reset` with `actor_role` of `'viewer'` or `'contributor'` should not be possible (blocked by API). If such an entry appears in the audit log while strict mode is enabled, it indicates a permission enforcement bug.

---

## §3 · Audit entries NOT produced by Workspace (for clarity)

- Canvas content auto-saves: NOT audited in `program_audit_log`. Canvas auto-saves write to `engagement_canvas_state` table (or equivalent) with `updated_at` auto-touch.
- View mode switches (Compact / Canvas / Preview / Replay): NOT audited. These are ephemeral UI state changes stored in URL params / session.
- Chat messages in the workspace agent panel: NOT audited in `program_audit_log`. Agent conversation turns are stored in the agent session table.
- Gate criterion snapshot reads: NOT audited.
- Phase rail hover / navigation events: NOT audited.

---

## §4 · Actor role resolution — implementation note

The `actor_role` field in every audit entry requires resolving the Clerk `userId` to a tenant membership role at request time. This resolution does not happen automatically — the API handler must:

1. Call `getAuth()` from Clerk to get `userId`.
2. Look up the tenant membership record for `{ tenantKey, userId }` to get `role`.
3. Pass `role` as `actor_role` to the audit log INSERT.

This is gap `gap-ws-4-005` (B-121). Until B-121 is resolved, audit entries will have `actor_role = null`.

---

## §5 · Self-QA

| Check | Status |
|---|---|
| Every write mutation from W-4.3 and W-4.4 has an audit entry shape | PASS |
| `actor_role` field documented on all entries with pilot/production distinction | PASS |
| Promote entry has `actor_role` note explaining self-approved vs. admin-approved audit trail | PASS |
| SQL query examples provided for distinguishing pilot vs. production approvals | PASS |
| `evidence_refs` populated with snapshot IDs where applicable | PASS |
| Entries NOT produced by workspace listed for clarity | PASS |
| Actor role resolution implementation note cross-references B-121 | PASS |
| No "TBD" | PASS |

---

## §6 · Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — gate self-approval model incorporated; actor_role on promote entries designed to distinguish pilot vs. production approvals | Claude Code |
