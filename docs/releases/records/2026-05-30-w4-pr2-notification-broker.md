# 2026-05-30 Enterprise Comms Spine · Notification broker + Resend client + REGISTRY (W4-PR-2)

## Release ID

`2026-05-30-w4-pr2-notification-broker`

## Status

`candidate`

## Plain-English Summary

The engine layer of the Enterprise Comms Spine. W4-PR-1 shipped the
four tables; this PR builds the broker that turns any module event
into queued delivery rows.

Concretely:

- A REGISTRY of all 42 notification event types from Spine §2,
  each declaring its source module, severity, category, default
  channels, retention, and PII class.
- `emitNotification(input)` — the single entry point any module
  calls. Validates against the REGISTRY, resolves tenant + subscribers,
  applies throttle / dedup / quiet hours / daily caps, and enqueues
  one delivery row per (user, channel) combination.
- A Resend SDK wrapper with typed error mapping (rate_limit /
  invalid_recipient / provider_error / timeout / provider_not_configured),
  a 5-second timeout, and a Phase 1 shared sender.
- A CAN-SPAM headers builder — `From`, `List-Unsubscribe` (RFC 2369),
  `List-Unsubscribe-Post` (RFC 8058 one-click), `X-Entity-Ref-ID`,
  plus a physical-address footer per US 15 U.S.C. § 7704.
- A persona-default resolver encoding the Spine §3 matrix —
  given (tenant, user, role, event_type), does this user get this
  event by default? 8 personas × every registered event.
- Idempotent seed helpers — `seedDefaultPreferencesForAdmin()` and
  `seedMandatorySecuritySubscriptionsForAdmin()` — that the
  preferences page and tenant-provisioning flow will call to put
  newly-onboarded admins into a known-good notification state.

No app-tier callers are wired in this PR. Module emitters
(`emitNotification('approval.requested', ...)`) come in W4-PR-3+,
the preferences page in W4-PR-4, the delivery worker that flushes
`notification_deliveries.status='queued'` to Resend in a later wave.

## Layer Impact

- **Runtime / app-lane:** New broker `emitNotification()` in
  `src/lib/admin/broker/notification-broker.ts`. The function is the
  only sanctioned way to fan out a notification — module emitters
  will call it directly.
- **Data-plane lane:** No schema changes. The broker writes to the
  four W4-PR-1 tables (`notification_events`,
  `notification_preferences`, `notification_deliveries`,
  `notification_subscriptions`).
- **QA-validation lane:** 89 new tests (10 suites) covering registry
  hygiene, broker pipeline gates, Resend mapping, persona matrix,
  CAN-SPAM headers, and seed-default idempotency.
- **Broker boundary:** All Supabase writes live under
  `src/lib/admin/broker/**`. The pure helpers (registry, persona
  resolver, CAN-SPAM headers, Resend wrapper) live under
  `src/lib/notifications/**` where the boundary scan does not
  reach (the broker is the only file in that tree that touches the DB).

## Client Applicability

- All clients: Yes — the broker is tenant-scoped and routes via the
  existing `resolveClientId()` helper. No tenant-specific seed data.
- Specific clients: None.
- Internal only: No — this lands code; module emitters in W4-PR-3+
  will start producing real notifications.
- Public/demo only: No.
- Feature flag: None at the broker level. The Resend wrapper
  short-circuits to `provider_not_configured` when `RESEND_API_KEY`
  is unset, so dev / preview environments without the key remain
  honest (no fake-sent records).

## Changes Included

- `src/lib/notifications/registry.ts` — REGISTRY of 42 events with
  full type-safe contract.
- `src/lib/notifications/persona-defaults.ts` — Spine §3 persona
  matrix; 8 personas × every registered event.
- `src/lib/notifications/can-spam-headers.ts` — header builder +
  HTML / text footer helpers; reads `ABARVA_PHYSICAL_ADDRESS` env
  with placeholder fallback.
- `src/lib/notifications/channels/email-resend.ts` — Resend SDK
  wrapper with typed errors and a 5s timeout.
- `src/lib/admin/broker/notification-broker.ts` — the broker.
- `src/lib/admin/broker/notification-seed-defaults.ts` — idempotent
  preference + subscription seed helpers.
- `src/lib/notifications/__tests__/registry.test.ts` — 15 hygiene tests.
- `src/lib/notifications/__tests__/persona-defaults.test.ts` —
  matrix verification (8 personas × 5 sample events) + role lifts.
- `src/lib/notifications/__tests__/can-spam-headers.test.ts` —
  RFC compliance shape tests.
- `src/lib/notifications/__tests__/email-resend.test.ts` — happy
  path, error mapping, configurability.
- `src/lib/admin/broker/__tests__/notification-broker.test.ts` —
  validation, recipient resolution, dedup, daily cap, quiet hours,
  mandatory override.
- `src/lib/admin/broker/__tests__/notification-seed-defaults.test.ts`
  — seed idempotency and shape.
- `docs/releases/records/2026-05-30-w4-pr2-notification-broker.md` —
  this file.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx eslint src/lib/notifications src/lib/admin/broker/notification-broker.ts src/lib/admin/broker/notification-seed-defaults.ts` — clean.
- `npx jest src/lib/admin/broker/__tests__ src/lib/notifications/__tests__` — 89 tests pass.
- `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` — boundary hygiene preserved.
- `npx jest src/__tests__/integration/admin/data/notifications-migration.test.ts` — types ↔ SQL lock-step preserved.

## Rollout Plan

1. Merge to `main`.
2. Vercel deploy. `RESEND_API_KEY` env var is required for the
   email channel; in its absence the wrapper returns ok:false with
   reason `provider_not_configured` and the broker still writes the
   event row + in_app delivery rows — email simply suppresses.
3. No DB migration (rides on W4-PR-1).
4. No feature-flag flip needed — nobody calls `emitNotification()`
   yet. W4-PR-3+ wires the first real emitter.

## Rollback Plan

- App-tier rollback: revert this PR. The broker + registry + Resend
  wrapper disappear. No emitters exist, so no consumer break.
- No DB rollback needed.

## Audit Evidence

- Source doctrine: Enterprise Comms Spine §2 (event taxonomy),
  §3 (persona-default matrix), §4 (channel architecture),
  §5 (audit / retention / PII), §6 (throttle / dedup / quiet
  hours), §8 (broker contracts), §13 (founder-locked constraints).
- Founder-locked constraints honoured:
  1. Phase 1 sender = `notifications@abarva.com` — enforced by the
     Resend wrapper and `PHASE1_SHARED_SENDER` constant.
  2. Phase 1 channels = `email` + `in_app` only — broker filters
     `defaultChannels` down to these before enqueueing.
  3. Tenant admin auto-subscription seed — `seedDefaultPreferencesForAdmin()`
     covers the 5 urgent events from
     `DEFAULT_ADMIN_MANDATORY_EVENT_TYPES`.
  4. Mandatory subscriptions cannot be toggled off — broker forces
     in_app delivery even when the user pref is `channel='none'`.
  5. PagerDuty deferred to Phase 3 — not in the Phase 1 channel set.

## Known Gaps

- No delivery worker — the `queued` → `sent` → `delivered`
  transition does not run yet. A worker lands in a later wave;
  until then, rows pile up in `notification_deliveries.status='queued'`
  and only the event log + in-app inbox are visible to users.
- Persona resolver is a Phase 1 stub — `defaultPersonaResolver`
  returns inert context (`tenantRole: null, personas: []`). The
  broker still respects explicit preferences and mandatory
  subscriptions; persona-default fan-out only kicks in when a
  future PR wires the resolver to Clerk metadata or a
  `user_personas` table.
- Quiet hours use UTC time-of-day, not per-user timezone. A real
  Intl.DateTimeFormat conversion lands in Phase 2 alongside the
  preferences page.
- Physical address in CAN-SPAM footer is a placeholder. Replace
  via `ABARVA_PHYSICAL_ADDRESS` env var before the first pilot.
- No retention purge job — service-role purges per `retentionDays`
  land in a later wave.
- No Slack / Teams / PagerDuty / webhook adapters yet.
