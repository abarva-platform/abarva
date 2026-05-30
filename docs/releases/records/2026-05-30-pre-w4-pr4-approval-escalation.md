# 2026-05-30 PRE-W4-PR-4 · Approval escalation + notify-sponsor

## Release ID

`2026-05-30-pre-w4-pr4-approval-escalation`

## Status

`released`

## Plain-English Summary

The `/admin/programs/approvals` queue and detail surfaces gain two
in-surface remediation actions for stuck approvals. A tenant admin
reviewing a 48-hour-old request can now:

1. **Notify sponsor** — log a reminder, increment the notify counter,
   bump escalation level 0 → 1. The button turns amber after the first
   reminder so admins can see "I've already nudged."
2. **Escalate to platform admin** — flip the escalation level to 2,
   stamp the platform-admin recipient, and route the request out of
   the tenant-admin queue. The button is disabled once already
   escalated.

The detail-page panel also surfaces a **Pending {N}h** SLA badge
(gray < 24h, amber 24–48h, red ≥ 48h) so the elapsed time is visible
before the decision. The queue list shows the same badge per row and
now sorts longest-pending first so SLA breaches bubble to the top.

Both actions write append-only rows to `admin_audit_log` with
`category='approval'`. These two audit actions
(`approval_sponsor_notified`, `approval_escalated`) are the source of
the `approval.escalated` notification event that lands in Trust Plane
Wave 4 at severity = critical.

Auto-escalation (cron-driven SLA expiry) is intentionally NOT in
scope; that arrives in Wave 7. PR-4 ships the admin-initiated paths
only.

## Layer Impact

- **Runtime application lane**: New server actions under
  `src/app/(maestro)/admin/programs/approvals/_actions/`; panel and
  queue-table updates in `src/components/admin/programs/`.
- **Data plane**: One migration
  (`supabase/migrations/20260530210000_approval_escalation.sql`) adds
  four columns + a CHECK + an SLA-sort index to
  `program_approval_requests`. RLS posture preserved (no policies
  touched).
- **Broker boundary**: Server actions live under `_actions/` and call
  `markSponsorNotified` / `escalateToPlatformAdmin` in
  `src/lib/programs/approval.ts`. The broker-boundary lint excludes
  `_actions/` paths; no banned imports were introduced.

## Client Applicability

- All clients: Yes — the actions render for every tenant on the
  approval detail page; the SLA badges render on every queue page.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260530210000_approval_escalation.sql` — new
  migration; adds `escalation_level`, `last_notified_at`,
  `notify_count`, `escalated_to_user_id`, the CHECK on level ∈ {0,1,2},
  and a partial pending-sort index. No RLS policy changes.
- `src/lib/programs/approval.ts` — typed escalation fields onto
  `ApprovalRequest`; new helpers `markSponsorNotified` and
  `escalateToPlatformAdmin`; queue sort flipped to ascending
  (longest-pending first).
- `src/app/(maestro)/admin/programs/approvals/_actions/notify-sponsor.ts`
  — new server action; the Tier-1 event source.
- `src/app/(maestro)/admin/programs/approvals/_actions/escalate-approval.ts`
  — new server action; the Tier-2 event source.
- `src/app/(maestro)/admin/programs/approvals/_actions/_audit-writer.ts`
  — centralised `admin_audit_log` writer for both actions.
- `src/app/(maestro)/admin/programs/approvals/[requestId]/page.tsx` —
  threads the new props + server actions into the panel.
- `src/components/admin/programs/ApprovalDecisionPanel.tsx` — adds
  the two buttons, the SLA badge, the notify banner, and the escalate
  confirmation dialog.
- `src/components/admin/programs/ApprovalQueueTable.tsx` — adds the
  per-row pending badge + the defensive ascending sort.
- Tests (new):
  `src/app/(maestro)/admin/programs/approvals/_actions/__tests__/notify-sponsor.test.ts`,
  `…/__tests__/escalate-approval.test.ts`,
  `src/__tests__/integration/admin/data/approval-escalation-migration.test.ts`.
- Tests (updated): `src/components/admin/__tests__/ApprovalDecisionPanel.test.tsx`,
  `src/components/admin/__tests__/ApprovalQueueTable.test.tsx`,
  `src/lib/programs/__tests__/approval.test.ts` (queue ordering flipped).

## Wave 4 wiring

The two new audit actions feed the `approval.escalated` notification
event introduced in Trust Plane Wave 4. Wave 4 reads
`admin_audit_log` rows where `category='approval'` AND `action IN
('approval_sponsor_notified', 'approval_escalated')`. Severity:
**critical**. See PERSONA_C_INCIDENT_2026-05-30 §5 + §10 #6.

## QA / Validation

- `npx eslint 'src/app/(maestro)/admin/programs' 'src/components/setup' 'src/components/admin/programs'` — clean.
- `npx tsc --noEmit` — clean.
- `npx jest 'src/components/admin/__tests__/ApprovalDecisionPanel.test.tsx' 'src/components/admin/__tests__/ApprovalQueueTable.test.tsx' 'src/app/(maestro)/admin/programs/approvals/_actions/__tests__' 'src/lib/programs/__tests__/approval.test.ts' 'src/__tests__/integration/admin/data/approval-escalation-migration.test.ts'` — pass.
- Migration RLS preservation verified statically by
  `approval-escalation-migration.test.ts`: the new migration does NOT
  touch any of the parent migration's five policies.

## Rollout Plan

1. Merge to `main`. Vercel preview + production redeploy automatically.
2. Run the new migration via `npm run db:migrate` against the staging
   Supabase, then production. The migration is additive (columns +
   index); existing rows default to `escalation_level=0`,
   `notify_count=0`, and `NULL` timestamps.
3. No env vars, no feature flags, no seed changes.

## Rollback Plan

Revert the PR. The migration is additive and idempotent — the columns
remain on existing rows but are unused by the reverted app code; no
data is lost. If a hard rollback of the schema is required, drop the
four columns and the SLA-sort index manually.

## Audit Evidence

- North-star spec: `docs/build/PERSONA_C_INCIDENT_2026-05-30.md`
  §5 (state of the queue) and §10 fix #6 (in-surface remediation).
- Wave 4 event source: `admin_audit_log` rows written by the two
  server actions in this PR.
- Broker-boundary hygiene: `src/lib/admin/__tests__/broker-boundary.test.ts`
  unaffected — no banned-pattern imports introduced.

## Known Gaps

- The Tier-2 recipient resolver is a placeholder: in PR-4 we route to
  the acting admin's own `userId` when no explicit override is passed.
  Wave 4 will ship a real platform-admin resolver (likely keyed off
  Clerk `publicMetadata.role === 'admin'`).
- No email-out yet on notify-sponsor — that arrives in Wave 4 when the
  notification channel is wired up.
- Auto-escalation cron deferred to Wave 7 per the incident note.
