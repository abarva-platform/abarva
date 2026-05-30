# 2026-05-30-w5-pr2-top-nav-unread-badge — Admin Inbox Top-Nav Badge

## Release ID

`2026-05-30-w5-pr2-top-nav-unread-badge`

## Status

`candidate`

## Plain-English Summary

Adds a compact unread badge to the product top bar for sessions that can access the Steward admin inbox. The badge reads the canonical W5 inbox API and links directly to `/admin/inbox`, so the nav count and inbox list share one source of truth.

## Layer Impact

`global-control-lane`: Updates shared shell chrome and adds a client-side inbox badge for admin-capable sessions.

## Client Applicability

- All clients: receive the shared top-bar badge behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

Only users authorized to access `/admin/inbox` see the badge; unauthorized sessions receive no badge because the API returns unauthorized.

## Changes Included

- `src/components/shell/AdminInboxTopNavBadge.tsx`
- `src/components/shell/AppTopBar.tsx`
- `docs/releases/records/2026-05-30-w5-pr2-top-nav-unread-badge.md`

## QA / Validation

- PASS — `npx eslint src/components/shell/AdminInboxTopNavBadge.tsx src/components/shell/AppTopBar.tsx`
- PASS — `npm run release:check`

## Rollout Plan

Merge to `main` after W5-PR-1. The badge becomes visible after deployment for authorized admin/tenant-admin sessions with a resolvable active tenant.

## Rollback Plan

Revert the PR to remove the badge import and component. No database rollback is required.

## Audit Evidence

PR URL, CI checks, release-control output, and shell diff.

## Known Gaps

The badge polls every 60 seconds. Live push updates remain out of scope for Wave 5.
