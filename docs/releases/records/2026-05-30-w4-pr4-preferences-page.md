# 2026-05-30 Enterprise Comms Spine · Per-user preferences page (W4-PR-4)

## Release ID

`2026-05-30-w4-pr4-preferences-page`

## Status

`candidate`

## Plain-English Summary

Users can configure how each notification event type reaches them
(email · in-app · none) and at what cadence (immediate · daily digest ·
weekly digest · off) from a new page at
`/admin/users-access/notifications`. The matrix is grouped by source
module — Setup, Moves, Source, Intelligence, Tower, System — and shows
every event type defined in the notifications registry. Mandatory
subscriptions (per the founder doctrine: approval requested / approval
escalated / RLS policy change / connector failed / billing alert) render
with a `LOCKED` chip; users can still adjust frequency on those rows
but cannot disable the channel. A quiet-hours / timezone / daily-cap
panel below the matrix carries the cadence guardrails. Per-channel
"test send" buttons dispatch a scoped `system.health_alert` event to
just the calling user so they can confirm a channel reaches them.

When a user has not configured any preferences yet, an empty-state
banner shows the registry defaults and offers a single primary button
"Apply defaults for my role" that seeds the rows in one upsert.

Every successful save writes one row to `admin_audit_log` with
`action='notification_preferences_updated'` so the Wave 4 audit ribbon
shows the change on the unified timeline.

## Layer Impact

- **Runtime-app-lane.** New page at
  `src/app/(maestro)/admin/users-access/notifications/page.tsx` wrapped
  in `AdminCanonShellV2`. New client component
  `src/components/admin/NotificationsPreferencesPage.tsx`. Three new
  server actions in `_actions/`: `save-preferences.ts`,
  `seed-defaults.ts`, `send-test.ts`. New broker
  `src/lib/admin/broker/notifications-preferences-broker.ts` plus a
  placeholder registry `src/lib/admin/broker/notifications-registry.ts`
  (will be replaced by the W4-PR-2 broker's registry on merge).
- **QA-validation lane.** New Jest tests:
  `src/components/admin/__tests__/NotificationsPreferencesPage.test.tsx`
  (13 tests; matrix rendering, mandatory-lock chip, channel ↔ frequency
  interplay, empty-state, save dispatch, test-send dispatch, error
  surfacing); `_actions/__tests__/save-preferences.test.ts` (9 tests;
  auth gates, tenant resolution, broker delegation, audit write,
  rate-limit); `_actions/__tests__/send-test.test.ts` (6 tests; channel
  validation, event + delivery writes).
- **Broker boundary.** Untouched. The page and the server actions
  import only from `@/lib/admin/broker/**` and (for the audit
  `admin_audit_log` write) `@/lib/data-plane/postgresCompat` — the
  same seam `invite-collaborator-audit.ts` and `egress-audit-writer.ts`
  use. `broker-boundary.test.ts` passes.

## Client Applicability

- All clients: Yes — the page renders for every signed-in user. The
  registry defaults shown in the empty-state banner are tenant-neutral.
  Mandatory subscriptions are resolved per-user from the (currently
  empty) `notification_subscriptions` table; until W4-PR-2 seeds those
  rows, the page surfaces the 5 default mandatory event types from
  `DEFAULT_ADMIN_MANDATORY_EVENT_TYPES`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — the page is reachable from the Steward sidebar
  the moment the migration `20260530220000_notifications.sql` lands.

## Changes Included

- `src/app/(maestro)/admin/users-access/notifications/page.tsx` — the
  server page. Resolves tenant via `resolveAdminTenant`, loads
  preferences + mandatory subscriptions via the broker, groups the
  registry by source module, and hands the lot to the client
  component along with three server-action callbacks.
- `src/components/admin/NotificationsPreferencesPage.tsx` — the
  matrix client component. Locked design system: ink / navy / cream /
  white / skyPale / mintSoft / amberSoft / coralSoft only. Georgia
  serif for headings, DM Sans for body, JetBrains Mono for eyebrows
  and event-type codes. No emoji, no banned palette.
- `src/app/(maestro)/admin/users-access/notifications/_actions/save-preferences.ts`
  — upserts every payload row through the broker, writes one audit
  row on success, in-process 30/60s rate-limit.
- `src/app/(maestro)/admin/users-access/notifications/_actions/seed-defaults.ts`
  — calls the broker's `seedDefaultPreferences` to bulk-upsert the
  registry defaults for the calling user.
- `src/app/(maestro)/admin/users-access/notifications/_actions/send-test.ts`
  — inserts one `notification_events` row scoped to the caller and
  one `notification_deliveries` row in `queued` status for the
  requested channel.
- `src/lib/admin/broker/notifications-preferences-broker.ts` — the
  read/write seam. Owns `resolveTenantId`, `loadUserPreferences`,
  `loadUserMandatorySubscriptions`, `upsertPreference` (with
  mandatory-flag enforcement + DB-mirroring validation),
  `seedDefaultPreferences`, and `groupRegistryBySourceModule`.
- `src/lib/admin/broker/notifications-registry.ts` — placeholder
  registry of every notification event type the preferences page
  surfaces. Will be replaced by the W4-PR-2 broker's registry on
  merge.
- `src/lib/admin/admin-shell-config.ts` — adds the `notifications`
  sub-section under the existing `Governance` group:
  label `"Notifications"`, href `/admin/users-access/notifications`,
  subtitle `"Email · in-app · digest preferences"`.
- `src/components/admin/__tests__/NotificationsPreferencesPage.test.tsx`
  — 13 tests covering matrix rendering, mandatory lock, channel ↔
  frequency interplay, empty-state, defaults hint, quiet-hours
  inputs, save dispatch, test-send dispatch, error feedback.
- `src/app/(maestro)/admin/users-access/notifications/_actions/__tests__/save-preferences.test.ts`
  — 9 tests covering auth, tenancy, broker delegation, audit write,
  fixture-mode skip, rate-limit.
- `src/app/(maestro)/admin/users-access/notifications/_actions/__tests__/send-test.test.ts`
  — 6 tests covering channel validation, event + delivery writes,
  DB error surfacing.
- `docs/releases/records/2026-05-30-w4-pr4-preferences-page.md` —
  this file.

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx eslint src/lib/admin/broker/notifications-preferences-broker.ts src/lib/admin/broker/notifications-registry.ts src/components/admin/NotificationsPreferencesPage.tsx 'src/app/(maestro)/admin/users-access/notifications' src/components/admin/__tests__/NotificationsPreferencesPage.test.tsx` — clean.
- `npx jest src/components/admin/__tests__/NotificationsPreferencesPage.test.tsx 'src/app/\(maestro\)/admin/users-access/notifications' src/lib/admin/__tests__/broker-boundary.test.ts` — 30 passed, 0 failed.

## Rollout Plan

1. Merge to `main`.
2. No env changes, no feature flag. The page becomes reachable the
   moment the W4-PR-1 migration has been applied (already in main).
3. Until W4-PR-2 seeds the mandatory-subscription rows for tenant
   admins, the page falls back to surfacing the 5 default mandatory
   event types from `DEFAULT_ADMIN_MANDATORY_EVENT_TYPES`. Once W4-PR-2
   lands and seeds rows in `notification_subscriptions`, the page
   reads those per-user.

## Rollback Plan

- App-tier rollback: revert this PR. The page, the broker, the
  registry, and the sidebar entry disappear. The migration tables
  stay in place; no rows have been written by this PR.

## Audit Evidence

- Source doctrine: Enterprise Comms Spine §7 UI surfaces.
- Founder-locked constraints honoured:
  1. Locked design system: ink / navy / cream / white / skyPale /
     mintSoft / amberSoft / coralSoft only. Georgia / DM Sans /
     JetBrains Mono. No emoji, no banned palette.
  2. Mandatory subscriptions render with the `LOCKED` chip and
     enforce "cannot disable" both at the UI layer (None button
     disabled on mandatory rows) and at the broker layer (the broker
     returns `mandatory_locked` if a write would toggle a mandatory
     row to `channel='none'` or `frequency='none'`).
  3. Broker boundary: the page and the server actions never import
     `@/lib/supabase-server`, `@/lib/supabase/server`, or any
     `@supabase/*` package. `broker-boundary.test.ts` passes.
  4. Email-first: the test-send buttons cover `email` and `in_app`;
     `slack`, `teams`, and `pagerduty` are valued in the registry
     channel union for forward-compat but no test-send wire exists
     for them in Phase 1.
  5. Safety: no PII collected on this page. The audit row carries
     only the actor user id, the row count, and the event-type keys
     — never the underlying payload.

## Known Gaps

- The placeholder registry at
  `src/lib/admin/broker/notifications-registry.ts` ships alongside the
  W4-PR-2 broker's canonical registry. When W4-PR-2 merges, this file
  must be retired (or re-pointed) and its consumers (broker + tests)
  updated to import from the canonical location.
- The full delivery worker (Resend / Slack / etc.) lands in a later
  wave. The test-send button writes the event + delivery row in
  `queued` status; the worker that materializes Phase 1 deliveries
  picks it up.
- The page currently surfaces the 5 default mandatory event types
  when no `notification_subscriptions` rows exist for the user. Once
  W4-PR-2 seeds the auto-subscribe rows at provisioning, the page
  reads them per-user; the fallback is preserved for users whose
  provisioning predates W4-PR-2.
- Persona-aware default channel/frequency is not in this PR — the
  defaults shown in the empty-state preview are the registry-wide
  defaults, not role-tailored. Persona defaults are slated for the
  W4-PR-5 broker-side tailoring pass.
