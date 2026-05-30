# Release Record: Admin Inbox Empty Fallback

## Release ID

`2026-05-30-admin-inbox-empty-fallback`

## Status

`candidate`

## Plain-English Summary

The top navigation inbox badge no longer turns an unresolved active tenant into
a production crawl 404. The inbox API now returns an empty, unavailable inbox
payload for GET requests when the active tenant cannot be resolved, while
preserving the existing 401 response for unauthenticated callers.

This keeps the global shell resilient during tenant bootstrap and crawler
sessions without exposing cross-tenant notification data.

## Layer Impact

- Runtime API: `/api/admin/inbox`
- UI surface: top navigation inbox badge fetch
- Data plane: no schema or data changes
- Tenant isolation: no tenant data is returned when tenant resolution fails

## Client Applicability

- All tenants using the maestro shell.
- Apex Retail post-corpus deploy crawl.
- No feature flag.

## Changes Included

- Changed `GET /api/admin/inbox` so `tenant_not_found` returns HTTP 200 with:
  `ok: false`, `items: []`, and `unreadCount: 0`.
- Left unauthenticated requests as HTTP 401.
- Left mutation behavior unchanged for PATCH.

## QA / Validation

PASS — focused lint:

```bash
npx eslint src/app/api/admin/inbox/route.ts
```

PASS — whitespace:

```bash
git diff --check
```

PASS after this release record is included — release control:

```bash
npm run release:check -- --base origin/main --head HEAD
```

Post-merge:

- Verify production deployment completed.
- Verify production alias points to the new deployment.
- Verify `/api/admin/inbox?limit=1` no longer returns HTTP 404 in the crawl path.

## Audit Evidence

- The post-deploy crawl after the Apex Retail AI corpus release reported P0
  failures for `/api/admin/inbox?limit=1`.
- Code inspection showed the route exists and the 404 came from the
  `tenant_not_found` branch in `requireInboxContext()`, not from a missing
  App Router file.
- The route is only used by the top-navigation badge for a read-only count, so
  an empty unavailable payload is safer than a global shell 404 when tenant
  resolution is incomplete.

## Known Gaps

- The root tenant-resolution miss still deserves a separate audit if it appears
  on tenant-owned pages, but it should not block every shell crawl through the
  inbox badge.
- PATCH behavior is unchanged and still requires a valid authenticated tenant
  context.

## Rollout Plan

1. Merge to `main` after local checks and CI pass.
2. Allow Vercel production deployment to complete.
3. Smoke `/api/health` and `/api/admin/inbox?limit=1` on the production alias.
4. Rerun or inspect the post-deploy crawl for the admin inbox 404.

## Rollback Plan

Revert this release PR if the empty fallback masks a real tenant-resolution
issue on the admin inbox page. The previous behavior was a hard 404 for
`tenant_not_found`.
