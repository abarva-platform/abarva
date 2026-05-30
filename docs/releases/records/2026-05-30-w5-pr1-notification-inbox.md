# 2026-05-30-w5-pr1-notification-inbox — Admin Notification Inbox

## Release ID

`2026-05-30-w5-pr1-notification-inbox`

## Status

`candidate`

## Plain-English Summary

Adds the first in-app notification inbox for tenant admins. Notifications emitted by the Wave 4 broker now have durable read/archive state and a canonical `/admin/inbox` surface where Steward can review the same operating events that email delivery sees.

## Layer Impact

`global-control-lane`: Adds shared admin inbox UI, API, and broker read/write logic for all tenants.

`client-data-lane`: Adds nullable read/archive columns and inbox indexes to the notification delivery ledger.

## Client Applicability

All clients receive the shared inbox surface once the migration is applied and Wave 4 notification deliveries exist.

## Changes Included

- `supabase/migrations/20260530250000_notification_inbox_state.sql`
- `src/lib/admin/broker/notification-inbox-broker.ts`
- `src/app/api/admin/inbox/route.ts`
- `src/app/(maestro)/admin/inbox/page.tsx`
- `src/components/admin/NotificationsInboxPage.tsx`
- Admin sidebar entry for `/admin/inbox`

## QA / Validation

- PASS — `npx jest src/lib/admin/broker/__tests__/notification-inbox-broker.test.ts --runInBand`
- PASS — `npx eslint src/lib/admin/broker/notification-inbox-broker.ts src/lib/admin/broker/__tests__/notification-inbox-broker.test.ts src/components/admin/NotificationsInboxPage.tsx 'src/app/api/admin/inbox/route.ts' 'src/app/(maestro)/admin/inbox/page.tsx'`
- BLOCKED — `npx tsc --noEmit --pretty false` exits on pre-existing missing optional packages: `@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, and `@resvg/resvg-js`. No W5-PR-1 file errors remain after the local fixes.
- PASS — `npm run release:check`

## Rollout Plan

Merge to `main`, apply the Supabase migration, then deploy the app. The route requires an authenticated admin or tenant-admin Clerk session and reads the active tenant binding.

## Rollback Plan

Revert the PR to remove the route, API, sidebar entry, broker, and UI. If database rollback is required, apply the commented down migration after confirming no operator needs existing `read_at` / `archived_at` values.

## Audit Evidence

PR URL, CI checks, release-control output, and migration replay logs.

## Known Gaps

Digest assembly, top-nav unread badge, and quiet-hours refinements are handled by later Wave 5 PRs.
