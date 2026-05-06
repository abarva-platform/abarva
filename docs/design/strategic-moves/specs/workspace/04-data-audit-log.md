# Workspace Audit Log Spec — W-4.7

| | |
|---|---|
| **Work Package** | W-4.7 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-audit-log.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-*.md` (frozen) · `02-state.md` (frozen) · `03-interactions-*.md` (frozen) |
| **Companion** | `04-data-writes-promote.md` (W-4.3) · `04-data-writes-gate.md` (W-4.4) · `04-data-writes-artifacts.md` (W-4.5) · `04-data-gaps.md` (W-4.6) |
| **Author** | Claude Code |

---

## Overview

This document specifies the `program_audit_log` entry shapes for all Workspace mutations. The audit log is the compliance and traceability spine for the Strategic Moves lifecycle.

**Substrate:** `src/lib/programs/audit-log.ts` — `writeProgramAuditLog(ctx, input: ProgramAuditLogInput)`.

**DB insert columns:**
```
tenant_key        TEXT
program_id        UUID
engagement_id     UUID
actor_id          UUID        -- from Clerk auth, resolved to persons.id
actor_role        TEXT        -- caller's role at time of action
action            TEXT        -- stable action key (see §2)
from_state        JSONB       -- snapshot of relevant state before mutation
to_state          JSONB       -- snapshot of relevant state after mutation
rationale         TEXT        -- optional; always populated for waivers and overrides
evidence_refs     TEXT[]      -- optional; artifact IDs or criterion IDs referenced
```

**Action key naming convention:** `{entity}_{verb}_{qualifier}` — all lowercase snake_case. Phase-parametric actions use `{n}` as a placeholder for the phase number.

---

## §1 · Action Key Registry

All `program_audit_log.action` values written by Workspace mutations:

| action | trigger | section |
|---|---|---|
| `move_promoted_{n}_to_{m}` | Phase promotion P0→P1 through P4→P5 | §2.1 |
| `move_handed_off_to_tower` | P5→Tower handoff | §2.2 |
| `move_gate_criterion_updated` | Gate criterion toggled (met / not-met) | §2.3 (via W-4.4) |
| `move_gate_criterion_waived` | Gate criterion waived | §2.4 (via W-4.4) |
| `move_gate_criterion_comment_updated` | Comment added/edited on criterion | §2.5 (via W-4.4) |
| `move_gate_criteria_reset` | All criteria for phase reset to not-met | §2.6 (via W-4.4) |
| `move_artifact_opened` | Artifact detail panel opened (read tracking) | §2.7 |
| `move_artifact_uploaded` | New artifact uploaded to phase shelf | §2.8 |
| `move_artifact_signed_off` | Artifact / deliverable signed off | §2.9 |
| `sponsor_review_requested` | Sponsor signoff request submitted | §2.10 |
| `move_view_mode_changed` | View mode switched (current / historical) | §2.11 |
| `move_phase_gate_overridden` | Promote executed with soft failures present | §2.12 |

---

## §2 · Entry Shapes

### §2.1 `move_promoted_{n}_to_{m}`

Written when a phase promotion mutation completes successfully (e.g., P1→P2 = `move_promoted_1_to_2`).

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | lead | governance",
  "action": "move_promoted_1_to_2",   // parametric: n=fromPhase, m=toPhase
  "from_state": {
    "phase": 1,
    "gateState": "ready | partial",   // state immediately before promote
    "hardCriteriaMet": 2,
    "hardCriteriaTotal": 2,
    "softCriteriaMet": 0,
    "softCriteriaTotal": 1
  },
  "to_state": {
    "phase": 2,
    "promotedAt": "<ISO8601>"
  },
  "rationale": null,                  // populated only when override (see §2.12)
  "evidence_refs": []                 // populated when promote references specific artifact IDs
}
```

**Notes:**
- `action` must be computed as `` `move_promoted_${fromPhase}_to_${toPhase}` `` — e.g., `move_promoted_0_to_1`, `move_promoted_4_to_5`.
- `from_state.gateState` captures whether the user promoted with all soft checks passing (`ready`) or with soft gaps (`partial`). A `partial` promote must also write a `move_phase_gate_overridden` entry (§2.12).
- Written by: `POST /api/programs/phase-gate` handler (currently gap-ws-4-015 / B-130 — route does not yet write to audit log).

---

### §2.2 `move_handed_off_to_tower`

Written when the P5→Tower handoff mutation completes (sets `engagements.status = 'handed_off'`).

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | lead | governance",
  "action": "move_handed_off_to_tower",
  "from_state": {
    "phase": 5,
    "status": "active",
    "towerAcceptanceStatus": "accepted"
  },
  "to_state": {
    "phase": 5,
    "status": "handed_off",
    "handoffAt": "<ISO8601>"
  },
  "rationale": null,
  "evidence_refs": []
}
```

**Notes:**
- `engagements.current_phase` stays at `5`; only `status` changes.
- Written by: `POST /api/programs/phase-gate` (sentinel `toPhase=6`) handler — gap-ws-p5-001 / B-120 (route sentinel not yet implemented).

---

### §2.3 `move_gate_criterion_updated`

Written when a gate criterion is toggled met ↔ not-met via `POST /api/programs/gate-criterion`.

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | lead | governance | sponsor",
  "action": "move_gate_criterion_updated",
  "from_state": {
    "criterionId": "charter_signed_off",
    "phase": 1,
    "previousStatus": "not-met"
  },
  "to_state": {
    "criterionId": "charter_signed_off",
    "phase": 1,
    "newStatus": "met",
    "updatedAt": "<ISO8601>"
  },
  "rationale": null,
  "evidence_refs": ["<artifact_id>"]   // artifact that caused the criterion to pass, if known
}
```

**Notes:**
- Written only when `status` actually changes (not on no-op toggles).
- See W-4.4 §2.1 for the full gate criterion toggle binding.

---

### §2.4 `move_gate_criterion_waived`

Written when a gate criterion is waived via `POST /api/programs/gate-criterion` with `status: 'waived'`.

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | maestro",    // waiver requires elevated role in production
  "action": "move_gate_criterion_waived",
  "from_state": {
    "criterionId": "discovery_funding_envelope",
    "phase": 0,
    "previousStatus": "not-met"
  },
  "to_state": {
    "criterionId": "discovery_funding_envelope",
    "phase": 0,
    "newStatus": "waived",
    "waivedAt": "<ISO8601>"
  },
  "rationale": "<required — waiver reason text>",
  "evidence_refs": []
}
```

**Notes:**
- `rationale` is **always non-null** for waived entries. The route must reject `status: 'waived'` without a comment.
- See W-4.4 §2.2.

---

### §2.5 `move_gate_criterion_comment_updated`

Written when the comment on a gate criterion changes from one non-empty value to a different non-empty value.

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "any",
  "action": "move_gate_criterion_comment_updated",
  "from_state": {
    "criterionId": "baseline_captured",
    "phase": 1,
    "previousComment": "<prior text | null>"
  },
  "to_state": {
    "criterionId": "baseline_captured",
    "phase": 1,
    "newComment": "<new text>",
    "updatedAt": "<ISO8601>"
  },
  "rationale": null,
  "evidence_refs": []
}
```

**Notes:**
- NOT written when comment transitions empty→empty.
- See W-4.4 §2.3.

---

### §2.6 `move_gate_criteria_reset`

Written when all criteria for a phase are reset via `POST /api/programs/gate-criterion-reset`.

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | maestro",
  "action": "move_gate_criteria_reset",
  "from_state": {
    "phase": 2,
    "criteriaMetCount": 4,
    "criteriaTotalCount": 5
  },
  "to_state": {
    "phase": 2,
    "criteriaMetCount": 0,
    "resetAt": "<ISO8601>"
  },
  "rationale": null,
  "evidence_refs": []
}
```

**Notes:**
- See W-4.4 §2.4.

---

### §2.7 `move_artifact_opened`

Written on artifact detail panel open. This is a **read-access tracking** entry — no data is mutated.

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "any",
  "action": "move_artifact_opened",
  "from_state": null,
  "to_state": {
    "artifactId": "<artifact_id>",
    "artifactType": "deliverable | legacy_deliverable | evidence | attachment",
    "phase": 2,
    "openedAt": "<ISO8601>"
  },
  "rationale": null,
  "evidence_refs": ["<artifact_id>"]
}
```

**Notes:**
- Lightweight pilot compliance audit trail. Gives evidence of who viewed what deliverable and when.
- See W-4.5 §2.
- Write must not block the UI — fire-and-forget async.

---

### §2.8 `move_artifact_uploaded`

Written when a new artifact is successfully uploaded.

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | lead | governance",
  "action": "move_artifact_uploaded",
  "from_state": null,
  "to_state": {
    "artifactId": "<new artifact_id>",
    "artifactType": "attachment | deliverable",
    "artifactKind": "<mime_type or deliverable_type_key>",
    "phase": 3,
    "uploadedAt": "<ISO8601>"
  },
  "rationale": null,
  "evidence_refs": ["<new artifact_id>"]
}
```

**Notes:**
- Only written on upload success — not on failed/rolled-back uploads.
- See W-4.5 §3.

---

### §2.9 `move_artifact_signed_off`

Written when a deliverable's status is set to `'signed_off'`. Used for charter signoff, design approval, baseline attestation, and general deliverable signoff.

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | lead | governance | sponsor",
  "action": "move_artifact_signed_off",
  "from_state": {
    "artifactId": "<artifact_id>",
    "previousStatus": "draft | in_review"
  },
  "to_state": {
    "artifactId": "<artifact_id>",
    "artifactType": "deliverable",
    "deliverableTypeKey": "charter | design_solution | discovery_report | business_case",
    "newStatus": "signed_off",
    "signedAt": "<ISO8601>",
    "context": {
      "criterion": "charter_signed_off | design_approved | discovery_baseline_attested",
      "phase": 1
    }
  },
  "rationale": "<optional — provided when signoff includes a formal note>",
  "evidence_refs": ["<artifact_id>"]
}
```

**Notes:**
- The `to_state.context.criterion` field links the signoff to the gate criterion it satisfies (where applicable).
- For the P2 baseline attestation: `to_state.context.criterion = 'discovery_baseline_attested'`, `rationale = 'Baseline attested by owner'`.
- For the P3 design signoff: `to_state.context.criterion = 'design_approved'`, `to_state.context.phase = 3`.
- See W-4.5 §4 (general signoff), §5 (P2 baseline), §6 (P3 design).

---

### §2.10 `sponsor_review_requested`

Written when a sponsor signoff request is submitted (`ws-canvas-p1-sponsor-signoff-action-btn`).

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | lead | governance",
  "action": "sponsor_review_requested",
  "from_state": {
    "sponsorSignoffStatus": "not-requested"
  },
  "to_state": {
    "sponsorSignoffStatus": "requested",
    "sponsorPersonId": "<person uuid>",
    "requestType": "phase_signoff",
    "requestedAt": "<ISO8601>"
  },
  "rationale": null,
  "evidence_refs": []
}
```

**Notes:**
- Written when the `founder_approval_requests` INSERT succeeds (gap-ws-4-002 / B-118 — route not yet implemented).
- See W-4.5 §4.1.

---

### §2.11 `move_view_mode_changed`

Written when a user switches between `current` and `historical` view modes on the workspace.

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "any",
  "action": "move_view_mode_changed",
  "from_state": {
    "viewMode": "current",
    "activePhase": 2
  },
  "to_state": {
    "viewMode": "historical",
    "activePhase": 2,
    "changedAt": "<ISO8601>"
  },
  "rationale": null,
  "evidence_refs": []
}
```

**Notes:**
- View mode changes are tracked for pilot compliance (understanding how frequently historical views are accessed).
- Fire-and-forget async — must not block view mode transition.

---

### §2.12 `move_phase_gate_overridden`

Written in addition to `move_promoted_{n}_to_{m}` when a promotion occurs with soft gate failures present (`gateState = 'partial'`).

```jsonc
{
  "tenant_key": "<tenant>",
  "program_id": "<uuid>",
  "engagement_id": "<uuid>",
  "actor_id": "<user uuid>",
  "actor_role": "admin | lead | governance",
  "action": "move_phase_gate_overridden",
  "from_state": {
    "phase": 3,
    "gateState": "partial",
    "failingSoftCriteria": [
      "phase_3_findings_written",
      "cxo_interview_complete"
    ]
  },
  "to_state": {
    "phase": 4,
    "overrideConfirmedAt": "<ISO8601>"
  },
  "rationale": "<text from 'Promote with soft gaps?' confirmation — if provided>",
  "evidence_refs": []
}
```

**Notes:**
- Always written alongside `move_promoted_{n}_to_{m}` when `gateState = 'partial'`. Two log entries are written for an override promote.
- `rationale` should capture the soft failures as a structured list in the from_state, and any free-text rationale the user provided in the confirmation modal.
- Hard gate failures never reach this code path — the promote button is disabled when hard criteria are failing.

---

## §3 · Audit Log Write Timing

| action | write timing | sync/async |
|---|---|---|
| `move_promoted_{n}_to_{m}` | After Supabase `engagements.current_phase` UPDATE succeeds | Sync — must succeed or rollback |
| `move_handed_off_to_tower` | After `engagements.status = 'handed_off'` UPDATE succeeds | Sync |
| `move_gate_criterion_updated` | After `gate_criterion_snapshots` UPSERT succeeds | Sync |
| `move_gate_criterion_waived` | After `gate_criterion_snapshots` UPSERT succeeds | Sync |
| `move_gate_criterion_comment_updated` | After `gate_criterion_snapshots` UPSERT succeeds | Sync |
| `move_gate_criteria_reset` | After bulk UPDATE succeeds | Sync |
| `move_artifact_opened` | After panel renders — read tracking | Async / fire-and-forget |
| `move_artifact_uploaded` | After `program_attachments` INSERT succeeds | Sync |
| `move_artifact_signed_off` | After `deliverables_v2.status` UPDATE succeeds | Sync |
| `sponsor_review_requested` | After `founder_approval_requests` INSERT succeeds | Sync |
| `move_view_mode_changed` | After view mode state update in client | Async / fire-and-forget |
| `move_phase_gate_overridden` | Written together with `move_promoted_{n}_to_{m}` in same transaction | Sync |

---

## §4 · Audit Log Query Patterns

The `program_audit_log` table supports these common query patterns for the Workspace:

| use case | query shape |
|---|---|
| Phase history timeline | `SELECT * FROM program_audit_log WHERE engagement_id = $id AND action LIKE 'move_promoted_%' ORDER BY created_at ASC` |
| All actions on a move | `SELECT * FROM program_audit_log WHERE engagement_id = $id ORDER BY created_at DESC` |
| All signoffs for pilot compliance | `SELECT * FROM program_audit_log WHERE engagement_id = $id AND action = 'move_artifact_signed_off' ORDER BY created_at DESC` |
| Gate overrides audit | `SELECT * FROM program_audit_log WHERE engagement_id = $id AND action = 'move_phase_gate_overridden'` |
| Actor activity for a user | `SELECT * FROM program_audit_log WHERE actor_id = $userId AND program_id = $programId ORDER BY created_at DESC` |

---

## §5 · Self-QA

| Check | Status |
|---|---|
| All mutation interactions from W-4.3, W-4.4, W-4.5 have a corresponding audit log entry shape | PASS |
| Action key naming convention (snake_case, entity_verb_qualifier) followed consistently | PASS |
| `from_state` and `to_state` shapes documented for all entries | PASS |
| Rationale field noted as required for waiver entries (§2.4) | PASS |
| Read-tracking entries (opened, view mode) marked as async fire-and-forget | PASS |
| Phase-gate override entry documented as written in addition to promote entry | PASS |
| Timing table (§3) covers all 12 action keys | PASS |
| Gap references included for routes not yet implemented | PASS |
| No "TBD" values | PASS |

---

## §6 · Document Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 | 2026-05-05 | Initial draft — 12 action keys covering all Workspace mutations | Claude Code |
