# 2026-05-30 Enterprise Comms Spine · Resend webhook + bounce/complaint handling (W4-PR-7)

## Release ID

`2026-05-30-w4-pr7-resend-webhook`

## Status

`candidate`

## Plain-English Summary

Resend (our email provider) tells us when a message bounces, is reported
as spam, or actually lands in the recipient's inbox. Before this PR we
had no way to listen — every `notification_deliveries` row stayed at
status `sent` regardless of what actually happened downstream.

This PR adds the receive side:

- `POST /api/webhooks/resend` accepts Standard-Webhooks (svix-style)
  HMAC-signed events from Resend. Without `RESEND_WEBHOOK_SECRET` the
  route returns 503; a bad signature returns 401; everything else
  returns 200 so Resend doesn't retry on our internal hiccups.
- `email.sent` / `email.delivered` advance the delivery row's status.
- `email.bounced` records the Resend bounce class (Permanent /
  Transient / Undetermined) and the bounce message.
- A **Permanent** bounce immediately disables that user's email channel
  for all non-mandatory events. A **3-bounce** total in 7 days does the
  same, even if every individual bounce was Transient. Mandatory
  subscriptions (security / compliance events seeded for tenant admins)
  survive the downgrade per founder doctrine.
- `email.complained` (spam complaint) immediately downgrades all
  non-mandatory email preferences to `channel='none'`. Mandatory
  subscriptions again survive.
- Every disable writes an `admin_audit_log` row (action
  `email_channel_auto_disabled` or `email_complained`, PII redacted in
  the metadata) AND emits a new `system.delivery_failed` notification
  to tenant admins so they know a user's email channel went silent.
- `GET /api/webhooks/resend/health` returns the timestamp of the
  most recent webhook the route accepted plus a `configured` flag, so
  ops can monitor "has Resend stopped delivering to us?".

The webhook is a strict transport — it NEVER touches Supabase
directly. All DB transitions go through a new broker file
`src/lib/admin/broker/resend-webhook-broker.ts`. Idempotency is
re-checked on every event because Resend retries on transient
receiver failure: same event landing twice does not double-disable
a channel or double-count a bounce.

## Layer Impact

- **Runtime / app-lane:**
  - New route `src/app/api/webhooks/resend/route.ts` (POST handler).
  - New route `src/app/api/webhooks/resend/health/route.ts` (GET).
  - New broker `src/lib/admin/broker/resend-webhook-broker.ts` (the
    only Supabase writer for this flow).
  - New signature verifier `src/lib/notifications/resend-webhook-signature.ts`
    (pure crypto helper, no DB).
  - `src/proxy.ts` adds `/api/webhooks/resend(.*)` to the public-route
    pattern list so Clerk middleware does not block the inbound POST.
- **Data-plane lane:**
  - Migration `supabase/migrations/20260530240000_notification_deliveries_bounce_type.sql`
    adds a single nullable column (`bounce_type TEXT CHECK ...`) and
    a supporting partial index on `(tenant_id, user_id, channel,
    created_at) WHERE status='bounced'`.
  - No schema changes to other notification tables.
- **QA-validation lane:** 31 new tests in 3 suites (signature, broker
  pipeline, route handler) — all pass. Existing notification suites
  remain green (broker boundary, registry, persona defaults,
  preferences page, dispatch).
- **Registry:** Adds `system.delivery_failed` to the canonical event
  registry; the registry-hygiene test now expects 43 events (System
  module: 10). The new event is `severity: warn`, `category:
  operational`, `audit_class: security` (7-year retention so the
  forensic trail of every auto-disable is durable),
  `piiClass: 'personal_redacted'` (broker masks user id before
  logging).
- **Broker boundary:** The webhook route lives outside the
  broker-boundary scan path (`src/app/api/webhooks/*`); the broker
  file is the only Supabase writer, in compliance with the doctrine.

## Client Applicability

- All clients: Yes — applies to every tenant the moment the env var
  is set and the webhook is registered with Resend.
- Specific clients: None.
- Internal only: No — this lands code AND requires an env-var +
  Resend-dashboard change to take effect. See Rollout Plan.
- Public/demo only: No.
- Feature flag: None at the code level; the env var
  `RESEND_WEBHOOK_SECRET` is the binary toggle. Without it the route
  returns 503 and bounces / complaints are NOT tracked (the system
  continues to send email but won't auto-disable channels).

## Changes Included

### New files

- `supabase/migrations/20260530240000_notification_deliveries_bounce_type.sql`
- `src/app/api/webhooks/resend/route.ts`
- `src/app/api/webhooks/resend/health/route.ts`
- `src/lib/admin/broker/resend-webhook-broker.ts`
- `src/lib/notifications/resend-webhook-signature.ts`
- `src/lib/notifications/__tests__/resend-webhook-signature.test.ts`
- `src/lib/admin/broker/__tests__/resend-webhook-broker.test.ts`
- `src/app/api/webhooks/resend/__tests__/route.test.ts`
- `docs/releases/records/2026-05-30-w4-pr7-resend-webhook.md` (this file)

### Modified files

- `src/lib/notifications/registry.ts` — adds `system.delivery_failed`
  event definition; updates module counts in the header comment.
- `src/lib/notifications/__tests__/registry.test.ts` — expects 43
  events (was 42); system count 10 (was 9).
- `src/proxy.ts` — adds `/api/webhooks/resend(.*)` to
  `PUBLIC_ROUTE_PATTERNS` with explanatory comment.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx eslint src/app/api/webhooks/resend src/lib/admin/broker/resend-webhook-broker.ts src/lib/notifications/resend-webhook-signature.ts src/lib/notifications/registry.ts src/lib/notifications/__tests__/resend-webhook-signature.test.ts src/lib/admin/broker/__tests__/resend-webhook-broker.test.ts src/app/api/webhooks/resend/__tests__/route.test.ts src/proxy.ts` — clean.
- `npx jest src/lib/notifications/__tests__/resend-webhook-signature.test.ts src/lib/admin/broker/__tests__/resend-webhook-broker.test.ts src/app/api/webhooks/resend/__tests__/route.test.ts` — **31 / 31 pass**.
- `npx jest src/lib/notifications/__tests__/registry.test.ts src/lib/admin/__tests__/broker-boundary.test.ts src/lib/notifications/__tests__/persona-defaults.test.ts src/lib/admin/broker/__tests__/notification-broker.test.ts` — **42 / 42 pass** (no regressions to W4-PR-2 / W4-PR-4 surfaces).
- `npx jest src/__tests__/unit/proxy-public-routes.test.ts` — **10 / 10 pass** (the new public route additive change does not regress the existing pattern hygiene).
- `npx jest src/__tests__/integration/admin/data/notifications-migration.test.ts` — **39 / 39 pass** (W4-PR-1 schema lock-step preserved).

## Rollout Plan

1. Merge to `main`.
2. Vercel preview / production deploy.
3. **Apply the migration** to the target Postgres
   (`supabase db push` or via the `db:migrate` runner). The migration
   is additive (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`) and is safe
   to run against a populated table.
4. **Configure the env var** in Vercel:
   - `RESEND_WEBHOOK_SECRET=whsec_<base64>` — issued from the Resend
     dashboard when a webhook endpoint is created.
   - Both Preview and Production scopes should be set.
5. **Register the webhook URL** in the Resend dashboard
   (Webhooks → Add Endpoint):
   - Endpoint URL: `https://<deploy>/api/webhooks/resend`
   - Events to subscribe: `email.sent`, `email.delivered`,
     `email.bounced`, `email.complained` (at minimum).
   - Resend will issue a `whsec_…` signing secret — paste into the
     Vercel env var above.
6. **Verify the wire** by either:
   - Hitting `GET /api/webhooks/resend/health` and confirming
     `configured: true`.
   - Sending a Resend test event from the dashboard and confirming
     `GET /api/webhooks/resend/health` shows a fresh
     `lastWebhookReceivedAt`.
7. No feature-flag flip required.

## Rollback Plan

- App-tier rollback: revert this PR. The two route files vanish; the
  proxy patterns list returns to its pre-PR state. The broker file is
  unreferenced elsewhere; nothing else breaks.
- Resend-side rollback: delete the webhook endpoint from the Resend
  dashboard so Resend stops POSTing to a non-existent route. Optional;
  Resend gracefully tolerates 404.
- DB rollback (optional, not usually needed): the migration is
  additive — the `bounce_type` column can stay in place without
  breaking anything. To drop:
  ```sql
  DROP INDEX IF EXISTS idx_deliveries_bounce_history;
  ALTER TABLE notification_deliveries DROP COLUMN IF EXISTS bounce_type;
  ```
- Channel state rollback: any preferences that this PR auto-downgraded
  to `channel='none'` are detectable via the `admin_audit_log` rows
  (action IN ('email_channel_auto_disabled', 'email_complained'))
  whose metadata records the exact `affected_event_types`. A future
  PR may add a "restore" admin action; today an admin can re-enable
  via the preferences page directly.

## Audit Evidence

- Source doctrine: `docs/build/ENTERPRISE_COMMS_SPINE_2026-05-30.md`
  - §5 (audit / retention / PII) — `system.delivery_failed` uses
    `audit_class: security`, 7-year retention. Every disable writes
    `admin_audit_log` AND is visible in the immutable
    `notification_events` log.
  - §9 (failure modes) — implements failure-mode C (persistent
    bounce auto-disable) and failure-mode D (complaint
    auto-unsubscribe). Mandatory-survives-complaint constraint from
    founder doctrine is enforced by the broker's
    `disableEmailChannelForUser()`.
  - §11 W4-PR-7 (this PR's spec).
- Founder-locked constraints honoured:
  1. **Mandatory subscriptions survive** — the broker walks all
     `notification_preferences` rows for the user with `channel='email'`
     and skips any where `mandatory = true`. Test
     `'immediately disables channel on Permanent bounce'` proves this
     with mandatory + non-mandatory rows in the same fixture and
     asserts only the non-mandatory row is patched.
  2. **PII redaction** — user ids are masked to first-6-chars in
     every log line, audit row metadata, and the spawned
     `system.delivery_failed` notification payload. No email
     addresses are ever logged; the webhook payload from Resend
     does not include them (we only read `email_id` and `bounce`
     fields).
  3. **Signature verification** — fail-closed: missing secret →
     503, bad signature → 401, broker is NOT called either way.
  4. **Idempotency** — re-fetched delivery row's status is
     checked before any transition; same bounce / complaint event
     replayed by Resend returns `no_op_already_in_final_state` and
     does NOT re-count toward the 7-day threshold or re-emit the
     admin notification.

## Known Gaps

- The webhook does not currently authenticate via Resend's IP
  allow-list (only the HMAC signature). The signature is
  cryptographically sufficient per Standard Webhooks; IP allow-list
  is belt-and-suspenders that we can add at the platform proxy if
  Spine §15 escalates it.
- The "restore my email channel" admin action is not yet built —
  a tenant admin who needs to re-enable an auto-disabled user must
  open the preferences page and flip the channel back. Out of scope
  for this PR.
- Per-user timezone math for bounce-history windows is not yet
  applied — the 7-day window uses UTC. Bounces are timestamped in
  UTC at the DB layer so this is correct globally; the window
  framing is approximate at day boundaries for non-UTC users, which
  for a 3-bounces-in-7-days threshold is operationally fine.
- `email.failed` and `email.suppressed` Resend events are accepted
  but not routed (the broker falls through to `no_op_no_delivery`).
  A future PR can map them onto our `failed` / `suppressed` delivery
  statuses if we adopt Resend's suppression list as a write surface.
- The `lastWebhookReceivedAt` health probe is per-process — in a
  multi-instance Vercel deployment, the probe answers for whichever
  instance the GET hits. Acceptable for liveness alarms; if we ever
  need durable cross-instance liveness we'll persist the marker in
  the DB.
