# Release Record: Admin Inbox Badge Disable

## Release ID

`2026-05-30-admin-inbox-badge-disable`

## Status

`candidate`

## Plain-English Summary

The global top-navigation admin inbox badge is disabled by default behind
`NEXT_PUBLIC_ENABLE_ADMIN_INBOX_BADGE`. The full Notifications inbox remains
available from Setup/Admin, but the shell no longer polls
`/api/admin/inbox?limit=1` on every authenticated page.

This is a production-stability fix: the badge poll was creating P0 crawl
failures across otherwise healthy tenant surfaces.

## Layer Impact

- UI shell: `AdminInboxTopNavBadge`
- Runtime API: no API behavior changes in this slice
- Data plane: no schema or data changes
- Tenant isolation: no cross-tenant access; the disabled badge performs no
  read at all unless explicitly enabled

## Client Applicability

- All signed-in tenants using the maestro shell.
- Apex Retail post-corpus deployment verification.
- Feature flag: `NEXT_PUBLIC_ENABLE_ADMIN_INBOX_BADGE=true` re-enables the
  top-nav badge after the route is proven stable under crawl.

## Changes Included

- Wrapped the top-nav inbox badge in a build-time public feature flag.
- Kept the inner badge implementation intact for later re-enable.

## QA / Validation

PASS — focused lint:

```bash
npx eslint src/components/shell/AdminInboxTopNavBadge.tsx
```

PASS — release control:

```bash
npm run release:check -- --base origin/main --head HEAD
```

PASS — whitespace:

```bash
git diff --check
```

Post-merge:

- Verify Vercel production deployment completed.
- Verify production alias health.
- Verify post-deploy crawl no longer reports `/api/admin/inbox?limit=1` P0
  failures.

## Audit Evidence

- The crawl after PR #2609 still reported P0 network/console failures caused
  by `/api/admin/inbox?limit=1` returning HTTP 404.
- The failing request came from the global top-nav badge and repeated across
  unrelated surfaces.
- The top-nav badge is nonessential for demo and pilot navigation because the
  Notifications page remains reachable through Setup/Admin.

## Known Gaps

- The badge should stay disabled until the inbox route is separately verified
  with authenticated tenant sessions and the crawl baseline is updated.
- This does not remove the inbox page or notification broker.

## Rollout Plan

1. Merge to `main` after local checks and CI pass.
2. Allow Vercel production deployment to complete.
3. Smoke `/api/health` on the production alias.
4. Confirm the post-deploy crawl no longer reports inbox-badge P0 failures.

## Rollback Plan

Set `NEXT_PUBLIC_ENABLE_ADMIN_INBOX_BADGE=true` in the production environment
or revert this PR to restore the prior always-on top-nav badge behavior.

