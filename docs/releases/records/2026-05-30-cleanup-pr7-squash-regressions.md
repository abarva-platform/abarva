# CL-5 — Re-delete W3-PR-7 squash regressions (incl. duplicate /product)

**Date:** 2026-05-30
**Branch:** `claude/cl5-pr7-cleanup`
**Type:** build-fix · cleanup
**Layer Impact:** runtime-app-lane (file deletes, Next.js build fix), qa-validation-lane (new hygiene test)

## Plain-English

The Wave 3 PR-7 squash-merge (`#2523`) silently re-introduced five files
that earlier Wave 1/Wave 2 PRs had already deleted. The most damaging
was `src/app/(maestro)/product/page.tsx` — its return resurrected a
duplicate `/product` route (the canonical lives at
`src/app/product/page.tsx`, per PR #2162). Next.js refuses to build
when two `page.tsx` files resolve to the same URL, so Vercel + the
`hygiene_gate.sh` builds on `main` have been failing.

CL-2 caught and fixed three other PR-7 re-introductions (tenant routes
+ component). This PR (CL-5) closes the remaining four files surfaced
by CL-2 plus the duplicate `/product` route, and adds a new hygiene
test that catches future duplicate-route collisions before they reach
Vercel.

## Client Applicability

All clients (Apex Retail, Meridian Health, First Capital). No
user-visible change: the proxy redirects already handle the URLs.

- `/admin/users` → 301 → `/admin/users-access` (already in
  `adminRouteConsolidationMap`, W1-PR-2).
- `/admin/invite` → 301 → `/admin/users-access?invite=open` (already
  in `adminRouteConsolidationMap`, W1-PR-2).
- `/product` resolves to the public marketing surface
  (`src/app/product/page.tsx`, PR #2162) — unchanged from canonical.

## Changes

### Deleted (re-deletions of PR-7 regressions)

| Path | Originally deleted by | PR-7 re-introduced |
| --- | --- | --- |
| `src/app/(maestro)/product/page.tsx` | #2162 (2026-05-19) | `#2523` |
| `src/app/(maestro)/admin/users/page.tsx` | W1-PR-2 | `#2523` |
| `src/app/(maestro)/admin/invite/page.tsx` | W1-PR-2 | `#2523` |
| `src/components/setup/SetupUsersPage.tsx` (309 LOC) | W1-PR-2 | `#2523` |
| `src/components/setup/InviteCollaboratorPage.tsx` | W1-PR-2 (renamed to `InviteCollaboratorDialog.tsx`) | `#2523` |

Each deletion was verified dead before removal:

- The two route files (`/admin/users`, `/admin/invite`) were
  single-line shells importing the dead components — no other callers.
- A repo-wide grep for `SetupUsersPage` and `InviteCollaboratorPage`
  showed the deleted route shells were the only importers; live admin
  routing goes through `/admin/users-access` →
  `InviteCollaboratorLauncher` → `InviteCollaboratorDialog`.

### Added

- `src/__tests__/hygiene/duplicate-route-files.test.ts` — walks every
  `page.tsx` under `src/app/`, computes the URL it resolves to
  (stripping `(group)` segments), and fails if any URL has more than
  one file behind it. Catches the exact failure mode that took down
  Vercel today.

## QA

Run from the worktree:

- `npx eslint src/` — pass.
- `npx tsc --noEmit` — pass.
- `npm run test:nav` — pass (includes the new hygiene suite).
- `npm run build` — pass (this is the whole point of the PR).
- `npm run test:behaviors` — 5 pre-existing failures unrelated to this
  change.

## Rollout

Merge → Vercel auto-deploys. The `Run hygiene_gate.sh` and Vercel
checks on `main` should turn green on the first build after merge.

## Rollback

Revert the PR. The redirects in `src/proxy.ts` will still handle the
admin URLs cleanly; the duplicate `/product` route will re-break the
build, so rollback should only be taken if there is a different
emergency.

## Audit Evidence

- CL-2 PR body surfaced the four remaining re-introductions
  (`/admin/users`, `SetupUsersPage.tsx`, `/admin/invite`, the
  Page-vs-Dialog rename check).
- W1-PR-2 release record documents the original deletions and the
  proxy redirect map.
- PR #2162 release context documents the `/product` route move
  (public marketing → `src/app/product/page.tsx`).
