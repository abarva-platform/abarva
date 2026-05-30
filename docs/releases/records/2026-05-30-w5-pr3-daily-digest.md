# 2026-05-30-w5-pr3-daily-digest — Daily Notification Digest

## Release ID

`2026-05-30-w5-pr3-daily-digest`

## Status

`candidate`

## Plain-English Summary

Adds the deterministic daily digest assembler and the `system.daily_digest` email template. Steward can now summarize the last 24 hours of notification events into a tenant-scoped payload and render a compliant email that points recipients back to `/admin/inbox`.

## Layer Impact

`global-control-lane`: Adds shared digest assembly and email-template code for the enterprise notification spine.

## Client Applicability

- All clients: receive the shared digest assembly and template once later dispatch wiring calls it.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/admin/broker/notification-digest-broker.ts`
- `src/lib/admin/broker/__tests__/notification-digest-broker.test.ts`
- `src/lib/notifications/templates/daily-digest.tsx`
- `src/lib/notifications/templates/index.ts`
- `src/lib/notifications/templates/__tests__/template-shape.test.ts`

## QA / Validation

- PASS — `npx jest src/lib/admin/broker/__tests__/notification-digest-broker.test.ts src/lib/notifications/templates/__tests__/template-shape.test.ts --runInBand -u`
- PASS — `npx eslint src/lib/admin/broker/notification-digest-broker.ts src/lib/admin/broker/__tests__/notification-digest-broker.test.ts src/lib/notifications/templates/daily-digest.tsx src/lib/notifications/templates/index.ts src/lib/notifications/templates/__tests__/template-shape.test.ts`
- PASS — `npm run release:check`

## Rollout Plan

Merge to `main`; no migration is required. Later Wave 5 cron wiring should call the assembler at 08:00 in the tenant timezone, emit `system.daily_digest`, and let the Wave 4 dispatch worker send the registered template.

## Rollback Plan

Revert the PR to remove the assembler and template registration. No database rollback is required.

## Audit Evidence

PR URL, CI checks, release-control output, focused Jest output, and template snapshot diff.

## Known Gaps

This PR does not schedule or enqueue daily digests. W5 digest cron wiring remains a follow-up slice.
