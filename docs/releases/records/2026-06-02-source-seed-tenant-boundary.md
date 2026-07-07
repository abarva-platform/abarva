# 2026-06-02-source-seed-tenant-boundary — Source Seed Event Tenant Boundary

## Release ID

`2026-06-02-source-seed-tenant-boundary`

## Status

`released`

## Plain-English Summary

This release closes the remaining Source UI leak found after PR #2785 deployed. The live test proved that Meridian could still load the Apex Retail seeded event page because the persisted event lookup failed closed, but `getSourcingEvent()` then fell through to global demo seed data. This change makes seeded Source events obey the same active-client and Source-access-policy boundary as persisted events.

Post-deploy note: this release closed the content leak. The live route now renders a generic 404 body with no Apex content. The strict HTTP status contract still failed because Next.js streamed the not-found UI with status 200. Follow-up release `2026-06-02-source-event-ui-404-status` adds an early proxy 404 for cross-client seeded Source event slugs.

## Layer Impact

- `global-control-lane`: shared Source event detail lookup now denies seeded events when the active client is absent or does not match the seed owner.
- `client-data-lane`: seeded demo Source events are no longer a cross-client fallback when persisted tenant data is missing or unavailable.

## Client Applicability

- All clients: Source event detail and Source event list behavior.
- Specific clients: Apex Retail and Meridian Health are the live regression pair.
- Internal only: none.
- Public/demo only: seeded Source demo event fallback behavior is tightened.
- Feature flag: none.

## Changes Included

- `src/lib/source/queries.ts`: `listSourcingEvents()` returns no seed events when no active client is resolved.
- `src/lib/source/queries.ts`: `getSourcingEvent()` returns seed detail only when an active client exists, the seed owner matches that active client, and `canReadSourceEvent()` allows the event.
- `src/lib/source/__tests__/queries-tenant-scope.test.ts`: regression coverage for Meridian asking for the Apex seed event, Apex happy path, and no-active-client seed denial.
- `docs/releases/records/2026-06-02-source-prod-isolation-fix.md`: post-deploy evidence corrected to record the failed live UI retest.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/queries-tenant-scope.test.ts src/lib/auth/__tests__/source-access-policy.test.ts --runInBand`
- FAIL before this release: `DOTENV_CONFIG_PATH=/Users/anand/Projects/nexus/.env.local BASE_URL=https://app.abarva.ai SOURCE_AUTH_REFRESH=1 node -r dotenv/config ./node_modules/.bin/playwright test tests/e2e/source/cross-tenant-isolation.spec.ts --reporter=list` returned 200 for `/source/events/apex-retail-ams-outsourcing-2026` under Meridian and rendered Apex event content.
- FAIL after deployment on status only: the same live spec rendered a generic not-found body with no Apex content, but the response status remained 200. Follow-up release `2026-06-02-source-event-ui-404-status` is required for the exact 404 status contract.

## Rollout Plan

Merged to `main` via PR #2788 and deployed to Vercel production. Follow-up release `2026-06-02-source-event-ui-404-status` is required before the live cross-tenant Source E2E spec can pass its exact-status assertion.

## Rollback Plan

Revert this release commit if home-tenant seeded Source demo events disappear unexpectedly. The rollback would re-open the cross-tenant seed fallback risk, so rollback should be paired with an immediate replacement guard.

## Audit Evidence

- Production failure packet: `reports/2026-06-02-source-xtenant-isolation/raw.json`
- Screenshot/error context: `test-results/source-cross-tenant-isolat-9648b-vent-id-returns-exactly-404-chromium/error-context.md`
- Unit regression: `src/lib/source/__tests__/queries-tenant-scope.test.ts`

## Known Gaps

- Full Source Golden Event E2E remains red on product-readiness controls outside this security patch.
- Exact HTTP 404 status remains open until follow-up release `2026-06-02-source-event-ui-404-status` is merged and deployed.
