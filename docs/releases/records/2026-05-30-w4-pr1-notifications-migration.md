# 2026-05-30 Enterprise Comms Spine · Notifications foundation (W4-PR-1)

## Release ID

`2026-05-30-w4-pr1-notifications-migration`

## Status

`candidate`

## Plain-English Summary

Foundation for Phase 1 of the Enterprise Comms Spine — four tables that
together let any module in AbarVa fire a notification, let a user
configure how / where they receive each event, let the worker keep a
forensic trail of every delivery, and let tenant admins enforce
mandatory subscriptions on the 5 most urgent events.

This PR ships schema only. No rows are seeded. No app-tier callers are
introduced. The broker (W4-PR-2) and the preferences page (W4-PR-4)
unblock once this lands and can run in parallel after merge.

## Layer Impact

- **Data-plane lane:** New tables `notification_events`,
  `notification_preferences`, `notification_deliveries`,
  `notification_subscriptions`. Each tenant-scoped via `clients(id)`
  with CASCADE delete (tenant offboarding doctrine). Append-only
  invariants on events / deliveries enforced by trigger + REVOKE.
- **QA-validation lane:** New static-SQL migration test
  (`notifications-migration.test.ts`) regex-verifies every CHECK,
  policy name, index, and trigger. Cross-checks the TypeScript enum
  unions exported from `notifications-types.ts` so the broker and the
  schema stay in lock-step.
- **Broker boundary:** Untouched. No app-tier code calls these tables
  yet. W4-PR-2 will introduce `NotificationsBroker` as the only
  app-tier entry point.

## Client Applicability

- All clients: Yes — schema lands on every deployed tenant once the
  migration applies. No tenant-specific seed data.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — this is pure schema, no behaviour change until
  W4-PR-2 lights up the broker.

## Changes Included

- `supabase/migrations/20260530220000_notifications.sql` — DDL for the
  four tables, RLS policies (service_role + authenticated SELECT /
  INSERT scoped by `can_read_tenant_by_id` / `can_write_tenant_by_id`),
  append-only triggers on `notification_events`, immutable-field
  trigger on `notification_deliveries`, block-update / block-delete
  policies where appropriate, indexes for tenant scoping + dedup window
  + worker FIFO + per-user unsubscribe lookup.
- `src/lib/admin/broker/notifications-types.ts` — TypeScript shapes:
  enum unions (`NotificationChannel`, `NotificationFrequency`,
  `NotificationSeverity`, `NotificationCategory`, `NotificationAuditClass`,
  `NotificationSourceModule`, `NotificationDeliveryStatus`,
  `NotificationDeliveryChannel`), row interfaces, insert / update
  shapes, and the `DEFAULT_ADMIN_MANDATORY_EVENT_TYPES` constant (5
  urgent event types tenant admins auto-subscribe to at provisioning).
- `src/__tests__/integration/admin/data/notifications-migration.test.ts`
  — 30+ static-SQL assertions covering every column, CHECK, policy,
  trigger, index, and the types-vs-SQL lock-step.
- `docs/releases/records/2026-05-30-w4-pr1-notifications-migration.md`
  — this file.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx eslint src/lib/admin/broker/notifications-types.ts src/__tests__/integration/admin/data/notifications-migration.test.ts` — clean.
- `npx jest src/__tests__/integration/admin/data/notifications-migration.test.ts` — passes.
- Migration syntactically valid: opens `BEGIN`, closes `COMMIT`,
  `NOTIFY pgrst` reload at end, all DDL uses `IF NOT EXISTS` / `IF EXISTS`
  guards so re-runs are idempotent.

## Rollout Plan

1. Merge to `main`.
2. Migration applies via the standard `npm run db:migrate` flow during
   the next deploy.
3. No env changes, no feature flag, no client cutover. The schema
   stays inert until W4-PR-2 introduces the broker.

## Rollback Plan

- App-tier rollback: revert this PR. The types and the migration file
  disappear. No downstream consumers exist yet.
- DB rollback: apply the down-migration block at the bottom of the SQL
  file. It drops the triggers and the four tables in reverse FK order.
  Safe because no broker or app-tier code references the tables.

## Audit Evidence

- Source doctrine: Enterprise Comms Spine §5 (Audit, compliance, retention).
- Founder-locked constraints honoured:
  1. Phase 1 sender shared `notifications@abarva.com` (no per-tenant
     custom domain columns).
  2. Email-first; `slack` / `teams` valued in CHECK for forward-compat
     but no rows ship yet.
  3. Tenant admin auto-subscription: schema supports it via the
     `notification_subscriptions` table + `mandatory` flag on
     `notification_preferences`. Seed-row logic deferred to W4-PR-2.
  4. Mandatory subscriptions: `mandatory BOOLEAN` flag in preferences;
     broker enforces "cannot toggle off" at application layer.
  5. PagerDuty in Phase 3: present in `channel` CHECK enum for
     forward-compat.

## Known Gaps

- No broker yet — W4-PR-2 lands the `NotificationsBroker` that owns
  writes, dedup, mandatory-flag enforcement, and the
  auto-subscribe-at-provisioning seed.
- No preferences page yet — W4-PR-4 lands the user-facing page that
  reads / writes `notification_preferences`.
- No retention job yet — service-role purges per audit_class retention
  policy land in a later wave.
- No Slack / Teams / PagerDuty adapters — channels are in the CHECK
  enum but Phase 1 only wires `email` + `in_app`.
- Per-user RLS hardening (beyond the existing tenant-scoped helpers)
  is not in this PR. Notifications are tenant-scoped reads; a user
  seeing their own tenant's events is acceptable for Phase 1.
