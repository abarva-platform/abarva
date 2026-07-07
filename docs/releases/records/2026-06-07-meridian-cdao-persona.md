# 2026-06-07-meridian-cdao-persona — Meridian CDAO persona coverage

## Release ID

`2026-06-07-meridian-cdao-persona`

## Status

`candidate`

## Plain-English Summary

The Source E2E auth helper now recognizes the Meridian CDAO persona key used by agent auth priming and signed-in QA materials. Operators and tests can request `meridian-cdao` directly and receive the canonical `cdao@meridian-health.example.com` account when provisioned, with the existing Meridian demo-account fallback for tenant-context smoke coverage.

## Layer Impact

- Control-plane QA/auth fixtures: adds a first-class Source E2E persona key and docs entry.
- Crawl validation: strengthens smoke assertions so Meridian CDAO remains part of the production crawl roster.

## Client Applicability

- All clients: No runtime product behavior changes.
- Specific clients: Meridian Health System QA/persona coverage.
- Internal only: Agent, QA, and E2E operators using the auth helpers.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `tests/e2e/source/_auth.ts` adds `meridian-cdao`.
- `tests/e2e/source/README.md` documents the persona.
- `src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts` requires the persona in crawl coverage.
- `scripts/smoke/p21-post-deploy-crawl.spec.ts` asserts the CDAO email resolver.

## QA / Validation

- PASS: `npm run smoke:p21-post-deploy-crawl`
- PASS: `npx jest src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`
- PASS: `npx eslint tests/e2e/source/_auth.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts scripts/smoke/p21-post-deploy-crawl.spec.ts`
- BLOCKED then fixed: first validation attempt failed because `node_modules` was absent in this cloud workspace; `npm ci` installed lockfile dependencies and the targeted checks above then passed.
- NOT RUN: full Playwright E2E; this change only adds a helper persona key and requires live Clerk/test credentials for browser sign-in coverage.

## Rollout Plan

Merge to main. The new persona key becomes available to Source E2E/auth-helper callers immediately; no migration, secret, or feature flag is required.

## Rollback Plan

Revert this PR. Existing `meridian-cdio` behavior remains unchanged and can continue to serve Meridian QA paths.

## Audit Evidence

- PR diff and commit history for this release record.
- Local validation output from the smoke/Jest/type checks listed above.

## Known Gaps

`meridian-cdao` still requires the canonical Clerk user to be provisioned for role-specific assertions. Without that user, the helper uses the existing Meridian demo fallback for tenant-context smoke coverage.
