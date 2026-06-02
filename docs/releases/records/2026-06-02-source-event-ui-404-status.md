# 2026-06-02-source-event-ui-404-status — Source Event UI Exact 404

## Release ID

`2026-06-02-source-event-ui-404-status`

## Status

`candidate`

## Plain-English Summary

This release closes the remaining live Source isolation test failure after PR #2788. The data leak is closed, but the App Router streamed the generic not-found page with HTTP 200. This release adds an early proxy-level 404 for locked client users who request a Source event slug that clearly belongs to another client, so the browser receives the exact anti-enumeration status before the React route can stream.

## Layer Impact

- `global-control-lane`: authenticated Source event page navigation now has an early proxy anti-enumeration guard for tenant-hinted event slugs.
- `client-data-lane`: no data-model change; this is a status-code enforcement layer over the Source route.

## Client Applicability

- All clients: locked client sessions asking for another client's tenant-hinted Source event slug receive generic 404.
- Specific clients: Meridian Health versus Apex Retail is the live regression pair.
- Internal only: none.
- Public/demo only: seeded/demo Source event slugs with tenant hints.
- Feature flag: none.

## Changes Included

- `src/lib/auth/access-routing.ts`: add pure helpers to infer a Source event client key from tenant-hinted slugs and decide whether a locked client should be denied.
- `src/proxy.ts`: return a generic no-store HTTP 404 before App Router rendering when a locked client requests another client's Source event slug.
- `tests/unit/access-routing.test.ts`: add regression coverage for Source event slug client inference and locked-client denial.
- `docs/releases/records/2026-06-02-source-seed-tenant-boundary.md`: correct post-deploy evidence to show content leak closed but status still red.

## QA / Validation

- PASS: `npx jest tests/unit/access-routing.test.ts --runInBand`
- PASS: `npx eslint src/lib/auth/access-routing.ts src/proxy.ts tests/unit/access-routing.test.ts`
- FAIL before this release: live cross-tenant E2E against `https://app.abarva.ai` returned HTTP 200 with a generic not-found body after PR #2788 deployed.

## Rollout Plan

Open a follow-up PR from `codex/source-event-ui-404-status`, merge only on green CI, allow Vercel production deployment, then rerun `DOTENV_CONFIG_PATH=/Users/anand/Projects/nexus/.env.local BASE_URL=https://app.abarva.ai SOURCE_AUTH_REFRESH=1 node -r dotenv/config ./node_modules/.bin/playwright test tests/e2e/source/cross-tenant-isolation.spec.ts --reporter=list`.

## Rollback Plan

Revert this release commit if legitimate home-tenant Source event page navigation is blocked. Rollback would return the strict-status failure, so it should be paired with a replacement exact-404 mechanism.

## Audit Evidence

- Live status failure packet: `reports/2026-06-02-source-xtenant-isolation/raw.json`
- Live status failure context: `test-results/source-cross-tenant-isolat-9648b-vent-id-returns-exactly-404-chromium/error-context.md`
- Unit regression: `tests/unit/access-routing.test.ts`

## Known Gaps

- Live cross-tenant E2E must pass after deployment before the P0 is called fully closed.
- This proxy guard covers tenant-hinted Source event slugs. Opaque UUID event IDs still rely on the page/API access-policy boundary.
