# Codex Handoff — Source Decision Engine · Slice C

**Approval routing foundation (migration-free C1 — pre-flighted)**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first. **Depends on Slice A** (live — the Stage Decision
> Status panel is where unresolved/pending approvals surface). Unknowns resolved in §0.5; scope is
> migration-free (reuse `source_event_approvals` + the dormant `waiver_approval_id` FK).

---

## 0 · Why this slice

Gate approvals today are **strings**, not governance. `REQUIRED_APPROVALS_BY_TRANSITION` in
`src/lib/source/source-stage-gates.ts` lists labels like `'Business sponsor approval'`,
`'Executive review'`, `'Steering alignment'`. No person is resolved, no record persisted, no
status tracked. For pilot rigor an approval must be: a named requirement → a resolved approver →
a persisted record with status + actor + timestamp.

This slice builds the **foundation** — resolution + records + clear "unresolved" surfacing. It
does **not** build Slack/email delivery (reuse the existing best-effort emitter; no real delivery).

---

## 0.5 · VERIFIED pre-flight — the unknowns are resolved (scope = migration-free C1)

A read-only pre-flight pinned the persistence, resolution, and surface paths. **Verify by grep —
the line numbers are orientation only.** Three findings shape this slice:

1. **Persistence table EXISTS — reuse `source_event_approvals`, NO migration.**
   `supabase/migrations/20260430151000_source_event_approvals.sql` defines it: `id, event_id,
   action ('stage_advance'|'lifecycle_change'|'admin_review'|'rejected'), approved_by_user_id,
   from_state, to_state, notes, approved_at`. It's already written by the approve route via
   `selectSourceWriteAdapter(...).applyApproval`. **And the gate criterion row already has a
   dormant FK** `source_event_gate_criterion_states.waiver_approval_id →
   source_event_approvals(id)` (defined in `...source_canvas_per_event_substrate.sql`, read by the
   mapper but **never written**). That FK is the seam this slice fills. The richer per-requirement
   columns (`requirement_id`, `owner_role`, `resolved_person_id`, `status` enum) are a **named
   additive follow-on, Slice C2** — do NOT add them here. C1 is migration-free.

2. **Resolution is THIN — `unresolved` must be first-class.** The `source_events` row carries only
   `decision_owner` (free-text NAME, not an id) and `created_by_user_id` (Clerk userId). There is
   **no sponsor/finance/legal/ea-council field.** Resolve the actor via `getCurrentUser()` /
   `getCurrentPerson()` (`src/lib/auth/current-user.ts`, `src/lib/auth/maestro.ts`). Mapping reality:

   | label (`REQUIRED_APPROVALS_BY_TRANSITION`) | ownerRole | resolves from | result |
   |---|---|---|---|
   | Sourcing lead review, Procurement release approval | sourcing-lead | `created_by_user_id` | **resolved** |
   | Business sponsor approval, Steering alignment, Executive review | sponsor / ea-council | `decision_owner` | resolved (**name only**) |
   | Finance and commercial lead review | finance | — | **unresolved** |
   | Contract and mobilization sign-off | legal | — | **unresolved** |
   | Operations/Value office review | steward | — | admin (`canApproveSourceStages`) |
   | (auto-met criteria) | atlas / sentinel | — | machine, no human |

   So only `sourcing-lead` resolves cleanly and `sponsor` resolves name-only — everything else is
   `unresolved` **by design**. Never fabricate an approver; surface `unresolved` clearly.

3. **Concrete unblock target — the `waived` state is currently REJECTED.** The PATCH route
   `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts` rejects `waived`
   with `error: 'waiver_required'` ("Waiver state requires an approval record"). This slice unblocks
   exactly that: create a `source_event_approvals` row + set `waiver_approval_id`, then allow the
   state — gated by the existing `loadUserSourceAccessPolicy(...).canApproveSourceStages` +
   `GATE_APPROVAL_STRICT_MODE`. A Programs-side stack (`program_approval_requests`, escalation cols)
   is a **shape reference only** — it's program-scoped, do not reuse its table.

---

## 1 · Build tasks

### 1.1 — Approval requirement model + resolver
New `src/lib/source/approval-routing.ts`:
- Map each gate transition's label strings (`REQUIRED_APPROVALS_BY_TRANSITION`,
  `src/lib/source/source-stage-gates.ts`) → `{ requirementId, fromStage, toStage, label,
  ownerRole }` using the canonical `ownerRole` enum in `canonical-specs/gate-criteria.ts`. Do not
  invent roles (see the §0.5 mapping table).
- `resolveApprover(event, ownerRole)` → `{ status: 'resolved', personId|userId, name } |
  { status: 'unresolved', reason }`, pulling from `decision_owner` / `created_by_user_id` per the
  table. **`unresolved` is first-class — never fabricate.** Only sourcing-lead + sponsor (name-only)
  resolve today.

### 1.2 — Approval records (persistence, migration-free)
Write the resolved approval into the **existing** `source_event_approvals` table via
`selectSourceWriteAdapter(...).applyApproval` (the seam the approve route already uses): `action`,
`approved_by_user_id` = resolved actor, `notes` = `ownerRole + requirementId + human reason`,
`approved_at`. Then **set the criterion's `waiver_approval_id`** to the new approval row id (this is
the dormant FK from §0.5). Per-requirement `status` that the existing columns can't hold
(pending/unresolved) is **derived at read** from `resolveApprover` + the criterion state — not a new
column. (First-class status/role/requirement columns = Slice C2, additive, deferred.)

### 1.3 — Surface in the decision panel (compact — obey OVERVIEW §UX density contract)
In the Stage Decision Status panel (Slice A) + `GateTab.tsx`: **one row per approval requirement**,
matching the gate-panel row shape from Slice A §UX. Layout:

```
● Business sponsor approval     Maya Rodriguez · pending        [Request]
● Executive review              unresolved — no approver on event
```

- A single status marker per row: resolved approver name + `pending` / `approved` / `rejected`, or
  **`Approval unresolved`** when no identity resolves (clear, never silently treated as satisfied).
- One action per row (`Request` / view record), revealed inline. Do not stack badge + sentence +
  label. The criterion/requirement ID and full record (timestamps, actor, comment) live on
  expand/hover, not in the row.
- The promote path may proceed per existing rules, but the panel must make the approval posture
  visible at a glance — one row, one status, no second list.

### 1.4 — Notification (reuse the existing best-effort emitter — do NOT invent a stub)
A notification spine already exists. On an approval request/decision, call the proven fire-and-forget
pattern `emitNotificationBestEffort` (`src/lib/programs/approval.ts`) → `emitNotification`
(`src/lib/admin/broker/notification-broker`). It `void`s the promise + swallows errors so it never
blocks the HTTP response. **Emit the event only — no real delivery wired in this slice** (the
out-of-scope dispatch worker handles delivery). Do not build a new `notifyApprover` stub.

---

## 2 · Tests
`src/lib/source/__tests__/approval-routing.test.ts` + extend the gate-criteria-route test:
1. Every transition label maps to a known `ownerRole` (no unmapped labels).
2. `resolveApprover` → `resolved` for sourcing-lead (`created_by_user_id`) and sponsor
   (`decision_owner`, name-only); `unresolved` with a reason for finance/legal/ea-council (never
   fabricated).
3. Approving/waiving a criterion writes a `source_event_approvals` row (actor + notes) **and** sets
   `waiver_approval_id`.
4. The `waived` state is now **accepted** with an approval record and still **rejected** without one.
5. `emitNotificationBestEffort` is called but performs no external I/O.

Plus standing validation (OVERVIEW).

---

## 3 · Browser verification (the hard gate)
Create a disposable SkyHarbor Air event (approve via P0 as Slice B/A-UX did):
1. Screenshot: a gate with a **sponsor or sourcing-lead** approval shows the **resolved approver
   name**, not the raw label string.
2. Screenshot: a **finance/legal/ea-council** approval shows **`Approval unresolved`** clearly.
3. Approve/waive a criterion → it advances + a record appears in the Log/audit with actor +
   timestamp; **reload** → the record persists (proves `waiver_approval_id` wired, not derived).
4. Archive the disposable event after proof. Label `click-verified` or `code-complete` honestly.

---

## 4 · Out of scope / boundaries
- **Migration-free (C1).** Reuse `source_event_approvals` + the existing `waiver_approval_id` FK.
  Do NOT add columns/tables. The additive routing columns (`requirement_id`, `owner_role`,
  `resolved_person_id`, `status` enum) are the **named Slice C2 follow-on** — not this slice.
- Reuse `emitNotificationBestEffort`; **no real Slack/email delivery**, no new standing notification
  rules/config.
- Do NOT change who is *allowed* to approve/promote (RBAC stays: `canApproveSourceStages` +
  `GATE_APPROVAL_STRICT_MODE`). This slice makes the approval posture **visible and recorded** and
  unblocks the `waived` state; it does not re-gate promotion.
- `unresolved` is correct for finance/legal/ea-council today (no event field) — surface it, don't
  fabricate.
- Branch: `codex/source-decision-engine-slice-c` ·
  PR title: `Source Decision Engine · Slice C: approval routing foundation (resolve + record + unblock waived; migration-free)`
