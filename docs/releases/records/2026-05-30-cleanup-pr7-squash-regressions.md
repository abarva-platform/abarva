# 2026-05-30-cleanup-pr7-squash-regressions — Re-delete W3-PR-7 squash regressions (CL-5)

## Release ID

`2026-05-30-cleanup-pr7-squash-regressions`

## Status

`candidate`

## Plain-English Summary

The Wave 3 PR-7 squash-merge (`#2523`) silently re-introduced five files that earlier Wave 1 PRs and PR #2162 had already deleted. The most damaging was `src/app/(maestro)/product/page.tsx` — its return resurrected a duplicate `/product` route (the canonical lives at `src/app/product/page.tsx` as a public marketing surface per #2162). Next.js refuses to build when two `page.tsx` files resolve to the same URL, so the Vercel + `hygiene_gate.sh` builds on `main` have been failing. CL-2 (already merged) caught and fixed three other PR-7 re-introductions (tenant routes + component). This PR closes the remaining four files surfaced by CL-2, plus the duplicate `/product` route, and ships a new hygiene test that catches future duplicate-route collisions before they reach Vercel.

## Layer Impact

- `runtime-app-lane`: 5 file deletions under `src/app/` and `src/components/setup/`. The two re-introduced `/admin/users` and `/admin/invite` route shells are removed (proxy `adminRouteConsolidationMap` already 301-redirects both URLs). The duplicate `(maestro)/product/page.tsx` is removed; the canonical `src/app/product/page.tsx` (public marketing surface per #2162) is the sole `/product` page. The two dead components (`SetupUsersPage`, `InviteCollaboratorPage`) had no live importers (live admin flow goes through `InviteCollaboratorLauncher` → `InviteCollaboratorDialog`).
- `qa-validation-lane`: 1 new hygiene test (`src/__tests__/hygiene/duplicate-route-files.test.ts`) that walks every `page.tsx` under `src/app/`, strips route-group segments, and fails if any URL has more than one file behind it. Catches the exact regression class that took down today's build.

## Client Applicability

- All clients: No user-visible change. The proxy redirects already handle the legacy URLs: `/admin/users` → 301 → `/admin/users-access`, `/admin/invite` → 301 → `/admin/users-access?invite=open`. `/product` continues to resolve to the public marketing page (`src/app/product/page.tsx`).
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/product/page.tsx` (deleted) — duplicate of the canonical `src/app/product/page.tsx`. PR #2162 (2026-05-19) moved `/product` to the public side; the W3-PR-7 squash silently re-introduced this file, breaking the Next.js build with "two parallel pages that resolve to the same path".
- `src/app/(maestro)/admin/users/page.tsx` (deleted) — 7-line shell re-export originally deleted by W1-PR-2. The canonical surface is `/admin/users-access`; the proxy redirect map already covers the legacy URL.
- `src/app/(maestro)/admin/invite/page.tsx` (deleted) — originally demoted by W1-PR-2 in favor of an `InviteCollaboratorDialog` modal launched from `/admin/users-access`. The proxy redirects `/admin/invite` → `/admin/users-access?invite=open`.
- `src/components/setup/SetupUsersPage.tsx` (deleted, 309 LOC) — dead component originally removed by W1-PR-2. Repo-wide grep confirmed only the deleted `/admin/users/page.tsx` shell imported it.
- `src/components/setup/InviteCollaboratorPage.tsx` (deleted) — dead component renamed to `InviteCollaboratorDialog.tsx` by W1-PR-2. Repo-wide grep confirmed only the deleted `/admin/invite/page.tsx` shell imported it; the live `InviteCollaboratorLauncher` mounts `InviteCollaboratorDialog`.
- `src/__tests__/hygiene/duplicate-route-files.test.ts` (new) — walks every `page.tsx` under `src/app/`, computes the URL it resolves to (stripping `(group)` segments), and fails if any URL has more than one file behind it. Includes an allowlist with one pre-existing entry for `/` (served by both `src/app/page.tsx` and `src/app/(public)/page.tsx`, which the Next.js build currently tolerates) so the test enforces the new-regression-blocking behavior without flagging pre-existing tech debt.

## QA / Validation

- PASS: `npx tsc --noEmit` — clean.
- PASS: `npx eslint src/` — 0 errors (153 pre-existing warnings unrelated to this PR).
- PASS: `npm run test:nav` — 26/26.
- PASS: `npx jest src/__tests__/hygiene/duplicate-route-files.test.ts` — the new hygiene test passes with the duplicate `(maestro)/product/page.tsx` deleted; it fails if the duplicate is restored (verified by temporary revert during authoring).
- PASS: `npm run build` — Next.js build succeeds locally (this is the whole point of the PR; reproducer for the broken `main` build).
- NOT-RUN: `npm run test:behaviors` — 5 pre-existing failures on `main` unrelated to these deletions; rerunning would not change pass/fail count.

## Rollout Plan

Merge after CI passes. Vercel auto-deploys. The "Run hygiene_gate.sh" and Vercel checks on `main` should turn green on the first build after merge — that is the explicit success signal for this PR.

## Rollback Plan

Revert the PR. The proxy redirects still handle the admin URLs cleanly; the duplicate `/product` route would re-break the build, so rollback should only be taken if there is a different emergency. Reverting the new hygiene test alongside is harmless.

## Audit Evidence

- CL-2 PR body surfaced the four remaining re-introductions (`/admin/users`, `SetupUsersPage`, `/admin/invite`, the Page-vs-Dialog rename).
- W1-PR-2 release record documents the original admin deletions, the proxy `adminRouteConsolidationMap`, and the `InviteCollaboratorPage → InviteCollaboratorDialog` rename.
- PR #2162 (2026-05-19, `bdbf823cd`) moved `/product` to the public side; that commit deleted `src/app/(maestro)/product/page.tsx` and created `src/app/product/page.tsx`.
- W3-PR-7 squash commit `42a097971` is the source of the regressions.

## Known Gaps

- One pre-existing duplicate route remains in the codebase: `/` is served by both `src/app/page.tsx` and `src/app/(public)/page.tsx`. The Next.js 16 build tolerates this (verified by `npm run build` passing), but it is tech debt worth resolving. It is allowlisted in the new hygiene test with an explicit signature comment so a future cleanup can remove it.
- This PR does not address whether PR-7's squash strategy itself should be revisited — that is a process question for the audit cadence, not a code change.
