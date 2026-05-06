# Workspace Write Bindings — Artifact shelf interactions — W-4.5

| | |
|---|---|
| **Work Package** | W-4.5 |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-writes-artifacts.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-*.md` (frozen) · `02-state.md` (frozen) · `03-interactions-*.md` (frozen) |
| **Companion** | `04-data-writes-promote.md` (W-4.3) · `04-data-writes-gate.md` (W-4.4) · `04-data-audit-log.md` (W-4.7) · `04-data-gaps.md` (W-4.6) |
| **Author** | Claude Code |

---

## Overview

This document specifies the write bindings for artifact shelf interactions on each phase canvas. The `move_artifact_index` view is the read source; the underlying tables (`deliverables_v2`, `program_attachments`, `program_evidence_items`) are the write targets.

**Three interaction classes:**
1. **Open artifact** — read-only fetch, no write
2. **Upload artifact** — `POST` to create a new deliverable/attachment row
3. **Signoff artifact** — `PATCH` to update `deliverables_v2.status = 'signed_off'`

**Substrate note:** No dedicated artifact edit API route exists for editing deliverable content from the Workspace canvas. See gap-ws-4-001 (B-117).

---

## §1 · Column Definitions

Same as `04-data-writes-promote.md §1`.

---

## §2 · Open Artifact (Read-Only)

| Field | Value |
|---|---|
| **interaction-id** | `ws-canvas-{phase}-artifact-{n}` (click to open) |
| **mutation-api-route** | No mutation — read-only fetch |
| **request-body** | N/A |
| **optimistic-update** | Artifact detail panel/drawer opens; content loads from `move_artifact_index` + `deliverable_versions.content` (latest version) |
| **rollback-strategy** | N/A (read-only) |
| **audit-log-action** | `move_artifact_opened` — see `04-data-audit-log.md §2.4` |
| **side-effects** | Audit log entry written on open (lightweight read-access tracking for pilot compliance). No data mutation. |
| **permissions** | Any authenticated user with tenant access to this move |

**Data source on open:**
- `move_artifact_index` (via `artifact_id`) → determines `artifact_type` (deliverable / legacy_deliverable / evidence / attachment)
- For `artifact_type = 'deliverable'`: fetch `deliverable_versions` WHERE `deliverable_id = artifact_id` ORDER BY `generated_at DESC` LIMIT 1 → `content`, `structured_data`
- For `artifact_type = 'evidence'`: fetch `program_evidence_items` WHERE `id = artifact_id` → `title`, `summary`, `evidence_type`
- For `artifact_type = 'attachment'`: fetch `program_attachments` WHERE `id = artifact_id` → `original_name`, `mime_type`, `scan_status`, storage URL

---

## §3 · Upload Artifact

| Field | Value |
|---|---|
| **interaction-id** | `ws-canvas-{phase}-artifact-upload-btn` (click → file picker → file selected → upload) |
| **mutation-api-route** | **gap-ws-4-002** (B-118) — no dedicated artifact upload API route exists for the Workspace canvas. The existing `program_attachments` upload pathway exists but no Workspace-surface-specific upload endpoint is wired. Until B-118 is resolved, uploading via the Nexus attach button (`ws-chat-attach-button`) is the available path. |
| **request-body** | (Proposed) `multipart/form-data`: `{ file: File, engagement_id: UUID, phase: number, artifact_type_key: string }` |
| **optimistic-update** | New artifact item appears in shelf immediately with `status = 'uploading'` spinner |
| **rollback-strategy** | On error: remove optimistic item; toast: `"Upload failed — [error]. Accepted: PDF, DOCX, XLSX, PNG."` |
| **audit-log-action** | `move_artifact_uploaded` — see `04-data-audit-log.md §2.5` |
| **side-effects** | On success: `program_attachments` INSERT (or `deliverables_v2` INSERT for typed deliverables); `move_artifact_index` view auto-reflects new row; gate criterion re-evaluation triggered for any criteria that depend on artifact presence |
| **permissions** | `userRole IN ['admin', 'lead', 'governance']` AND `viewMode = 'current'` |

---

## §4 · Signoff Artifact

Signing off a deliverable artifact is the primary mechanism for passing hard gate criteria (e.g., `charter_signed_off`, `design_approved`, `discovery_report_signed_off`).

| Field | Value |
|---|---|
| **interaction-id** | Signoff action within artifact detail panel (button: "Sign Off" or "Mark as Signed") |
| **mutation-api-route** | **gap-ws-4-001** (B-117) — no dedicated `PATCH /api/programs/deliverable/{id}/status` route exists. The `deliverables_v2.status` column can be updated via Supabase direct client or via a future route. |
| **request-body** | (Proposed) `PATCH /api/programs/deliverable/{artifactId}/signoff`: `{ engagement_id: UUID, signed_by_user_id: UUID, signoff_timestamp: ISO8601, rationale?: string }` |
| **optimistic-update** | Artifact status badge updates immediately to `'signed'`; associated gate criterion status updates to `passing` in the gate panel |
| **rollback-strategy** | Artifact status badge reverts to prior state; gate criterion reverts; toast: `"Could not record signoff — please try again."` |
| **audit-log-action** | `move_artifact_signed_off` — see `04-data-audit-log.md §2.6` |
| **side-effects** | 1. `deliverables_v2.status = 'signed_off'` UPDATE. 2. Gate criterion re-evaluation via `evaluateGate` for the current phase — any criteria that depend on this deliverable type being signed off will now pass. 3. If all hard gate criteria now pass: `gateState` transitions from `failing` to `ready`; `ws-canvas-{phase}-gate-promote-btn` becomes enabled. 4. Audit log entry `move_artifact_signed_off`. |
| **permissions** | `userRole IN ['admin', 'lead', 'governance', 'sponsor']` (sponsor specifically required for charter signoff per gate doctrine) AND `viewMode = 'current'` |

### §4.1 Sponsor signoff specific case

The charter signoff (`charter_signed_off` gate criterion for P1→P2) has additional UI in `ws-canvas-p1-sponsor-signoff-action-btn`. This maps to:

| Field | Value |
|---|---|
| **interaction-id** | `ws-canvas-p1-sponsor-signoff-action-btn` (when label = "Request Signoff" or "Record Signoff") |
| **mutation-api-route** | **gap-ws-4-002** (B-118) — no sponsor signoff API route exists. Proposed: `POST /api/programs/signoff-request` |
| **request-body** | `{ engagement_id: UUID, phase: 1, request_type: 'phase_signoff', sponsor_person_id: UUID, message?: string }` |
| **optimistic-update** | `ws-canvas-p1-sponsor-signoff-status` updates to `'requested'`; button label changes to `"Requested (pending)"` |
| **rollback-strategy** | Status reverts; toast: `"Could not send signoff request."` |
| **audit-log-action** | `sponsor_review_requested` — see `04-data-audit-log.md §2.7` |
| **side-effects** | `founder_approval_requests` INSERT with `request_type = 'phase_signoff'`, `status = 'pending'`; notification to sponsor |

---

## §5 · Baseline Attestation (P2-specific)

The P2 baseline attest button (`ws-canvas-p2-baseline-panel-attest-btn`) drives the `discovery_baseline_attested` gate criterion.

| Field | Value |
|---|---|
| **interaction-id** | `ws-canvas-p2-baseline-panel-attest-btn` |
| **mutation-api-route** | **gap-ws-4-001** (B-117) — same deliverable signoff pathway |
| **request-body** | (Proposed) Same as §4 signoff: updates baseline deliverable `status = 'signed_off'` |
| **optimistic-update** | Baseline panel status badge updates to `'attested'`; `ws-canvas-p2-gate-item-3` (discovery_baseline_attested) updates to `passing` |
| **rollback-strategy** | Status reverts; toast error |
| **audit-log-action** | `move_artifact_signed_off` with `rationale = 'Baseline attested by owner'` |
| **side-effects** | Same as §4 side effects; gate re-evaluation for P2 gate |
| **permissions** | `userRole IN ['admin', 'lead', 'governance']` AND `viewMode = 'current'` |

---

## §6 · Design Signoff (P3-specific)

The P3 design signoff button (`ws-canvas-p3-design-panel-signoff-btn`) drives the `design_approved` gate criterion.

| Field | Value |
|---|---|
| **interaction-id** | `ws-canvas-p3-design-panel-signoff-btn` |
| **mutation-api-route** | **gap-ws-4-001** (B-117) |
| **request-body** | Same deliverable signoff shape — updates design deliverable `status = 'signed_off'` |
| **optimistic-update** | Design panel status badge updates to `'signed-off'`; `ws-canvas-p3-gate-item-1` updates to `passing` |
| **rollback-strategy** | Status reverts; toast error |
| **audit-log-action** | `move_artifact_signed_off` with context `{ criterion: 'design_approved', phase: 3 }` |
| **side-effects** | Same as §4; gate re-evaluation for P3; if both hard checks now pass, promote button enables |
| **permissions** | `userRole IN ['sponsor', 'governance']` required for design signoff (sponsor-grade authority) AND `viewMode = 'current'` |

---

## §7 · Self-QA

| Check | Status |
|---|---|
| Open artifact (read-only) interaction documented | PASS |
| Upload artifact interaction documented with gap reference | PASS |
| Signoff artifact (deliverable status update) documented | PASS |
| Sponsor signoff P1 specific case documented | PASS |
| P2 baseline attestation documented | PASS |
| P3 design signoff documented | PASS |
| Gate criterion re-evaluation side effect documented for all signoff mutations | PASS |
| All missing API routes documented as gaps with B-xxx references | PASS |
| Permissions aligned with Layer 2 state matrix | PASS |
| No "TBD" values | PASS |
