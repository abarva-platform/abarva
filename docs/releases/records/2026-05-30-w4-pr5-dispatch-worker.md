# 2026-05-30 Enterprise Comms Spine · Dispatch worker (W4-PR-5)

## Release ID

`2026-05-30-w4-pr5-dispatch-worker`

## Status

`candidate`

## Plain-English Summary

The Vercel cron worker that flushes the notification queue. Every
minute the platform now picks up `notification_deliveries.status='queued'`
rows, dispatches them through the Resend email channel (or the
in-app inbox), and transitions the delivery status. Retries on
transient failures with linear backoff (1m, 5m, 25m) and a 3-attempt
ceiling. Idempotent: a row is claimed via an atomic
`UPDATE … WHERE status='queued' RETURNING id`, so a concurrent tick
cannot dispatch the same row twice. Time-budgeted at 10 seconds per
tick so a slow provider cannot wedge the worker.

The cron route at `/api/cron/notifications-tick` requires the
`Authorization: Bearer $CRON_SECRET` header that Vercel attaches to
scheduled invocations. A companion `/api/cron/notifications-tick/health`
returns the queue depth + oldest-queued / last-sent / last-failed
watermarks so an external monitor can alarm on a stuck queue.

Per Spine §11 W4-PR-5: **immediate-frequency dispatch only**.
Daily and weekly digest assembly is deferred to Wave 5 (W5-PR-3 /
W5-PR-4). The worker filters strictly to channels it can deliver
in Phase 1 (email + in_app); other channels enqueued by mistake
are counted as `skipped` without status change.

## Layer Impact

- **Runtime / app-lane:**
  - New cron handler `src/app/api/cron/notifications-tick/route.ts`.
  - New health route `src/app/api/cron/notifications-tick/health/route.ts`.
  - New broker module `src/lib/admin/broker/notification-dispatch-broker.ts`.
    All Supabase reads + writes live here; the routes only authenticate
    and forward (broker-boundary doctrine preserved).
- **Data-plane lane:** No schema changes. The worker consumes the
  four tables defined in W4-PR-1.
- **QA-validation lane:** New test suites:
  - `src/lib/admin/broker/__tests__/notification-dispatch-broker.test.ts`
    (queue selection, in_app, email success, no template, no recipient,
    retryable + non-retryable failures, MAX_RETRIES promotion, deadline,
    eligibility math, health snapshot).
  - `src/app/api/cron/notifications-tick/__tests__/route.test.ts`
    (CRON_SECRET enforcement, dispatch result shape, health endpoint auth).
- **Infrastructure / deploy lane:** New `vercel.json` at repo root
  registering the 1-minute cron schedule.

## Client Applicability

- All clients: Yes — the worker is tenant-agnostic; each queued row
  carries its own tenant_id and gets dispatched on its own merit.
- Specific clients: None.
- Internal only: No — once the cron registers in Vercel and a CXO
  emits the first urgent event, the queue drains into real emails.
- Public/demo only: No.
- Feature flag: None at the worker level. Email dispatch short-
  circuits via `provider_not_configured` when `RESEND_API_KEY` is
  unset (W4-PR-2 behaviour), so dev / preview environments without
  the key still process in_app deliveries cleanly.

## Changes Included

- `src/lib/admin/broker/notification-dispatch-broker.ts` — the
  dispatch broker. `dispatchTick()` claims and dispatches queued
  rows; `dispatchHealth()` returns queue snapshot. Injection seams
  for tests (`__setEmailAdapterForTest`, `__setRecipientResolverForTest`,
  `__setTenantResolverForTest`).
- `src/app/api/cron/notifications-tick/route.ts` — Vercel cron
  handler. Bearer-token auth, JSON response with counters.
- `src/app/api/cron/notifications-tick/health/route.ts` — health
  probe with the same auth.
- `vercel.json` — registers the 1-minute cron schedule.
- `src/lib/admin/broker/__tests__/notification-dispatch-broker.test.ts`
  — 21 broker tests across queue, channels, retry / backoff, deadline,
  idempotency, eligibility math, health.
- `src/app/api/cron/notifications-tick/__tests__/route.test.ts` — 7
  route tests across auth gate + success path + health endpoint.
- `docs/releases/records/2026-05-30-w4-pr5-dispatch-worker.md` —
  this file.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx eslint src/lib/admin/broker/notification-dispatch-broker.ts src/app/api/cron/notifications-tick` — clean.
- `npx jest src/lib/admin/broker/__tests__/notification-dispatch-broker.test.ts src/app/api/cron/notifications-tick` — all pass.
- Broker boundary preserved: route files do not import
  `getServerSupabase`, `azureRead`, or `getAzureWriteFluentClient`
  directly. They import only the broker.

## Rollout Plan

1. Merge to `main`.
2. Vercel auto-deploys. The 1-minute cron schedule registers on
   the new deployment (`vercel.json` is read at deploy time).
3. **Deployment prerequisite:** the project must be on a Vercel Pro
   plan or higher. Free plan caps cron schedules at 2 invocations
   per day; the 1-minute schedule will be silently downgraded or
   rejected. If the team is on free, update `vercel.json` to a
   coarser schedule (e.g. `*/30 * * * *` for every-30-min) until
   the plan upgrade lands.
4. `CRON_SECRET` env var must be set in Vercel project settings
   (Production, Preview, Development). Without it the route returns
   401 for every invocation and the queue never drains.
5. `RESEND_API_KEY` env var must be set for email dispatch. Without
   it, the email channel short-circuits to
   `provider_not_configured` (non-retryable) and rows transition to
   `failed` — surfacing that the provider is dormant rather than
   silently swallowing the queue.

## Rollback Plan

- App-tier rollback: revert this PR. The cron handler + broker
  disappear; queued rows stop draining. Module emitters from W4-PR-3+
  continue to enqueue (no producer-side break).
- Cron-schedule rollback: remove `vercel.json` (or rename to
  `.vercel.json.disabled`) and redeploy. Vercel deregisters the cron
  within one deploy cycle.
- No DB rollback needed.

## Audit Evidence

- Source doctrine: Enterprise Comms Spine §6 (throttle / dedup /
  quiet hours — quiet hours and dedup gates live in W4-PR-2;
  this PR handles dispatch + retry / backoff per §6 cron cadence),
  §8 (broker + worker contracts — `dispatchTick()` matches the
  signature spec), §11 W4-PR-5 (dispatch worker scope —
  immediate-frequency only; digest assembly deferred).
- Spine §11 acceptance: a real email fires within 60s when a program
  approval is requested. With the cron registered and `RESEND_API_KEY`
  set, the path is now:
  `emitNotification → notification_deliveries.status='queued'
  → cron tick (within 60s) → sendEmail → status='sent' →
  Resend delivers → recipient inbox`.

## Known Gaps

- Digest assembly is **not** in this PR (deferred to W5-PR-3 /
  W5-PR-4). Rows with `frequency='digest_daily'` /
  `frequency='digest_weekly'` are not yet enqueued by the
  broker (W4-PR-2 only enqueues immediate); when they are, this
  worker will need a per-tenant TZ digest builder.
- The brief specifies linear backoff via a per-row `next_retry_at`
  column. To avoid a schema migration in this PR, the eligibility
  check is computed in app code as `created_at + cumulative_backoff
  <= now()`. A `next_retry_at` column can be added later without
  breaking the worker's behaviour — `eligibilityCutoffSeconds()`
  becomes a fallback when the column is null.
- Resend bounce / complaint webhook handling lives in W4-PR-7;
  until it lands, `delivered` / `bounced` / `complained` statuses
  do not transition (only `sent` and `failed` do).
- No on-call escalation when the queue is stuck. The health endpoint
  exposes `oldestQueuedAt` for external alerting; PagerDuty wiring
  lands in Wave 7.
