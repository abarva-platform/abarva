# 2026-06-04-home-autoscroll-admin-redirect — Fix Home auto-scroll + /home/admin 404

## Release ID

`2026-06-04-home-autoscroll-admin-redirect`

## Status

`candidate`

## Plain-English Summary

Two live UX bugs fixed. (1) **`/home` auto-scrolled to the bottom on load** — the shared
`AgentColumn` (mounted via `AppShell` on every surface incl. Home) ran a mount-time
`threadEndRef.scrollIntoView({behavior:'smooth'})` with no guard, and DOM-level `scrollIntoView`
pulls the whole page down even when the conversation thread is empty. Fixed by guarding on
`hasThread` (no scroll on empty mount) and scrolling the **internal thread container** via
`scrollTop` instead of the page — the same pattern `AtlasDrawer` already uses. (2) **`/home/admin`
returned a 404** — `/admin` is the canonical route but legacy `/home/admin*` paths (stale bookmarks)
had no redirect. Added `permanent` redirects `/home/admin → /admin` and `/home/admin/:path* →
/admin/:path*` in `next.config.ts`.

## Layer Impact

- `global-control-lane`: shared shell component (`AgentColumn`) + app routing config; affects all
  surfaces. Presentation + routing only — no data, schema, or auth change.

## Client Applicability

- All clients: yes — the auto-scroll affected every tenant's Home; the redirect fixes a global 404.
  No client singled out. Internal-only: no. Feature flag: none.

## Changes Included

- `src/components/shell/AgentColumn.tsx` — auto-scroll now guards `hasThread` and scrolls the thread
  container (`threadScrollRef.scrollTop = scrollHeight`) instead of page-level `scrollIntoView`.
- `next.config.ts` — added `/home/admin` + `/home/admin/:path*` → `/admin` permanent redirects.

## QA / Validation

- Status: **pass** — `npx tsc --noEmit` clean on touched files; `npx eslint` clean on
  `AgentColumn.tsx`. Behavior reasoned from the existing `AtlasDrawer` fix (DOM `scrollIntoView`
  pulls the page; container `scrollTop` does not). Redirect verified by adding to the same
  `redirects()` array the other legacy redirects use.
- Note: full authenticated visual confirmation of the Home no-longer-scrolls behavior is best done
  via the server-ticket crawl (credentials can't be typed here); the code path is deterministic.

## Rollout Plan

Merge to `main` → Vercel production deploy. No migration, env var, or feature flag.

## Rollback Plan

`gh pr revert <pr>` + redeploy. Presentation/routing only; both changes are additive/local.

## Audit Evidence

- Root cause for auto-scroll: `AgentColumn.tsx` mount-time `scrollIntoView`; corroborated by the
  explicit warning comment in `AtlasDrawer.tsx` ("DOM-level scrollIntoView can pull the entire page
  down"). `AppShell` mounts `AgentColumn` on Home (ImpactInsightsHome wraps AppShell).
- 404 root cause: no `/home/admin` entry in `next.config.ts` `redirects()`.

## Known Gaps

- None functional. Visual confirmation of the live Home scroll behavior pending an authenticated
  crawl (deterministic code path; low risk).
