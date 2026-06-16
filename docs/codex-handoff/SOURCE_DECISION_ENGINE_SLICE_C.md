# Codex Handoff — Source Decision Engine · Slice C

**Approval routing foundation**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first. **Depends on Slice A** (the Stage Decision
> Status panel is where unresolved/pending approvals surface).

---

## 0 · Why this slice

Gate approvals today are **strings**, not governance. `REQUIRED_APPROVALS_BY_TRANSITION` in
`src/lib/source/source-stage-gates.ts` lists labels like `'Business sponsor approval'`,
`'Executive review'`, `'Steering alignment'`. No person is resolved, no record persisted, no
status tracked. For pilot rigor an approval must be: a named requirement → a resolved approver →
a persisted record with status + actor + timestamp.

This slice builds the **foundation** — resolution + records + clear "unresolved" surfacing. It
does **not** build Slack/email delivery (stub the notification hook cleanly).

---

## 1 · Build tasks

### 1.1 — Approval requirement model
New `src/lib/source/approval-routing.ts`:
- Define `SourceApprovalRequirement` for each gate transition: `{ requirementId, fromStage,
  toStage, label, approverRole }` derived from the existing
  `REQUIRED_APPROVALS_BY_TRANSITION` + the gate criteria `ownerRole` already in
  `canonical-specs/gate-criteria.ts` (sponsor / ea-council / finance / legal / sourcing-lead /
  steward). Map each label → a role; do not invent new roles.
- `resolveApprover(event, approverRole)`: resolve to an actual identity from the event's
  owner/sponsor fields + the tenant membership the event already carries. Return
  `{ status: 'resolved', personId, name } | { status: 'unresolved', reason }`. Never fabricate
  an approver — unresolved is a valid, surfaced outcome.

### 1.2 — Approval records (persistence)
Persist an approval record per requirement. **Check first** whether a suitable table exists
(`source_event_approvals` / an approvals column / the activity-log). Prefer reusing an existing
table; if none fits, the **minimum** is to record the resolution + status on the existing
audit/activity log (`activity-log.ts`) — do NOT add a new table without confirming none exists
and noting it as a migration follow-on. Each record carries: `requirementId`, `approverRole`,
resolved `personId` (or null), `status` (`pending | approved | rejected | skipped | unresolved`),
`timestamp`, `actorId`, `comment/reason`.

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

### 1.4 — Notification hook (stub, clean)
Define a `notifyApprover(requirement, approver)` seam that currently no-ops/logs. Do NOT wire
Slack/email in this slice. Design the seam so a later slice can implement delivery without
refactoring callers.

---

## 2 · Tests
`src/lib/source/__tests__/approval-routing.test.ts`:
1. Each gate transition's label maps to a known role (no unmapped labels).
2. `resolveApprover` with a populated sponsor field → `resolved` with the right identity.
3. `resolveApprover` with no matching field → `unresolved` with a reason (never fabricated).
4. Approval record persists with all required fields + correct status.
5. Notification stub is called but performs no external I/O.

Plus standing validation (OVERVIEW).

---

## 3 · Browser verification (the hard gate)
SkyHarbor Air event:
1. Open a gate with a sponsor-type approval → confirm the panel shows the **resolved approver**
   (a real name), not the raw label string. Screenshot.
2. Find/force a gate whose approver can't be resolved → confirm **`Approval unresolved`** renders
   clearly. Screenshot.
3. Confirm an approval action (if exposed) writes a record visible in the Log/audit tab with
   actor + timestamp.

Label `click-verified` or `code-complete` honestly.

---

## 4 · Out of scope / boundaries
- No Slack/email delivery (stub only). No new standing notification rules/config.
- No new table without confirming none exists; prefer reuse, note any migration as a follow-on.
- Do NOT change who is *allowed* to promote a stage (RBAC stays as-is); this slice makes the
  approval posture **visible and recorded**, it does not re-gate promotion.
- Branch: `codex/source-decision-engine-slice-c` ·
  PR title: `Source Decision Engine · Slice C: approval routing foundation (resolve + record + surface)`
