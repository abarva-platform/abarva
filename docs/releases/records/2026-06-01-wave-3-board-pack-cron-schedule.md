# 2026-06-01-wave-3-board-pack-cron-schedule - Quarterly Board Pack Cron Delivery

## Release ID

`2026-06-01-wave-3-board-pack-cron-schedule`

## Status

`candidate`

## Plain-English Summary

Adds the scheduled delivery layer for Wave 3 board packs. The new cron route authenticates with `CRON_SECRET`, builds quarterly board packs from Tower outcome-ledger data, and emails configured CXO recipients through the existing Resend notification channel. If recipients are not configured, the route reports skipped delivery rather than pretending an email was sent.

## Layer Impact

- `global-control-lane`: shared scheduled board-pack delivery for all configured clients.
- API/cron: new `GET /api/cron/board-pack` route protected by the existing bearer-secret cron pattern.
- Export/rendering: adds delivery helpers around the quarterly board-pack renderer.
- Vercel schedule: updates the existing `vercel.ts` config with the new quarterly board-pack cron while preserving the notifications tick.

## Client Applicability

- All clients: any client configured in `BOARD_PACK_CXO_RECIPIENTS_JSON` can receive the quarterly pack.
- Specific clients: no client is hard-coded into the cron route.
- Internal only: no.
- Public/demo only: no.
- Feature flag: configuration-driven through env recipients.

## Changes Included

- `src/app/api/cron/board-pack/route.ts`
- `src/app/api/cron/board-pack/__tests__/route.test.ts`
- `src/lib/programs/expert-kernel/exports/board-pack/quarterly-delivery.ts`
- `src/lib/programs/expert-kernel/exports/board-pack/__tests__/quarterly-delivery.test.ts`
- `vercel.ts`

## QA / Validation

- Focused cron route Jest suite: passed locally.
- Focused quarterly delivery Jest suite: passed locally. Combined focused run passed 10 tests. Jest printed pre-existing duplicate manual mock warnings for markdown/GFM mocks.
- Behavior suite: passed locally, 90 tests. Jest printed the same pre-existing duplicate manual mock warnings.
- TypeScript: passed locally with `npx tsc --noEmit --pretty false`.
- ESLint: passed locally for the cron route and quarterly delivery files.
- Release check: passed locally with `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment. Vercel cron jobs run only on production deployments. Configure `BOARD_PACK_CXO_RECIPIENTS_JSON`, `CRON_SECRET`, and `RESEND_API_KEY` in production before expecting live email delivery.

## Rollback Plan

Use `gh pr revert <PR_NUMBER>` to remove the cron route, delivery helper, and Vercel cron entry. No database state or migration rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local test output: pending.

## Known Gaps

This PR sends to env-configured CXO recipient lists. A user-managed board-pack subscription UI and persistent recipient preferences remain a future enhancement.
