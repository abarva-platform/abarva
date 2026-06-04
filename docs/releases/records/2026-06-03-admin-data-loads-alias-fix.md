# 2026-06-03-admin-data-loads-alias-fix — Admin Data Loads Alias Fix

## Release ID

`2026-06-03-admin-data-loads-alias-fix`

## Status

`candidate`

## Plain-English Summary

Fixes stale Data Loads links so older Setup/Home/Admin URLs land on the current `/admin/setup` Data Loads page instead of falling through to missing pages. This prevents users with older bookmarks or stale navigation paths from seeing a 404 when trying to open Admin Data Loads.

## Layer Impact

- `global-control-lane`: Updates shared proxy route compatibility behavior for all clients.
- `public-demo`: Improves demo/pilot navigation resilience for legacy links, but does not change page content or data.

## Client Applicability

- All clients: Applies to every tenant using the Admin/Data Loads route tree.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/proxy.ts` now redirects `/home/data-loads`, `/setup/data-loads`, `/admin/data-loads`, and `/admin/data-load` to `/admin/setup`.
- `src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts` pins the `/home/data-loads` legacy redirect.
- `src/__tests__/integration/setup/setup-admin-route-registry-parity.test.ts` pins the Admin Data Loads aliases.

## QA / Validation

- Pass: Focused Jest route-contract tests.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.
- Pending: PR CI after push.

## Rollout Plan

Merge to `main`; Vercel production deploy will update proxy routing. No database migration or feature flag is required.

## Rollback Plan

Revert the proxy/test commit. The canonical `/admin/setup` page remains unchanged.

## Audit Evidence

- PR URL and CI status.
- Focused Jest output for route-contract tests.
- Release Control Gate output.
- Live route checks after deployment.

## Known Gaps

This fixes stale Data Loads aliases. It does not diagnose user-specific Clerk/session metadata issues that could still affect authenticated Admin access for a particular account.
