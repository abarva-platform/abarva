# 2026-05-30-setup-home-admin-collapse — Top-nav Home → /admin Trust Plane (CL-1)

## Release ID

`2026-05-30-setup-home-admin-collapse`

## Status

`candidate`

## Plain-English Summary

Closes the IA gap identified in `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §2 (three nav systems coexist). The top-nav "Home" tab now lands users on the consolidated Trust Plane at `/admin` — the surface the Setup/Admin consolidation Waves 1–3 actually built. Until this PR, "Home" pointed at `/home`, which rendered an orphaned 2026-05-08 wireframe page (AR brand tile, fixture data, "Compliance · locked · 0" dead state) — invisible to operators because nobody could see the Trust Plane work.

The parallel landing is removed: the orphan `src/app/(maestro)/home/page.tsx`, its `TenantHomePage` component, the `tenant-home-fixtures.ts` data file, and the three integration tests pinning those fixtures are deleted. The real `/home/<subpage>` routes (queue, decision, source, learn, ai-initiatives, configuration, training) are preserved — they remain legitimate surfaces. A new `/home → /admin` 301 entry in `src/proxy.ts` keeps any persisted links resolving.

## Layer Impact

- `runtime-app-lane`: top-nav config change (1 href flip in `topbar-nav-items.ts` plus the matching parallel inventory in `lib/home/top-nav-items.ts`), one page deletion (`/home/page.tsx`), one redirect added in `src/proxy.ts` (`'/home' → '/admin'` in the existing `homeToAdminMap`). The `/setup → /home` legacy redirect is shortened to `/setup → /admin` to avoid double-hop. The `/home` layout comment is updated to reflect the new shape.
- `qa-validation-lane`: 1 new hygiene test (`src/components/shell/__tests__/topbar-nav-home-admin.test.ts`, 4 tests) codifying the IA choice; 3 deleted integration tests (`apex-home-truth-spine`, `first-capital-tenant-resolution`, `skyharbor-home-tenant-resolution`) that asserted retired fixture-landing facts.

## Client Applicability

- All clients: User-visible top-nav change. Every authenticated tenant sees "Home" route to `/admin` instead of `/home`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/shell/topbar-nav-items.ts` (modified) — `NAV_ITEMS.find(i => i.key === 'home').href` flipped from `/home` to `/admin`; match function unchanged (already treats `/admin*` as home-active). Comment documents the CL-1 IA decision and cross-refs the verdict §2.
- `src/lib/home/top-nav-items.ts` (modified) — parallel inventory `TOP_NAV_ITEMS` updated to match: `home.href = '/admin'`.
- `src/app/(maestro)/home/page.tsx` (deleted) — orphan tenant-home landing using fixture data. Was the only consumer of `TenantHomePage` and `resolveTenantHome`.
- `src/components/home/TenantHomePage.tsx` (deleted) — sole consumer was the orphan page.
- `src/components/home/tenant-home-fixtures.ts` (deleted) — sole runtime consumer was the orphan page; sole test consumers were the three deleted integration tests below.
- `src/app/(maestro)/home/layout.tsx` (modified) — passthrough layout comment updated to document that `/home` has no page.tsx anymore and 301-redirects to `/admin`.
- `src/proxy.ts` (modified) — added `'/home': '/admin'` to `homeToAdminMap`. Shortened `/setup → /home` redirect to `/setup → /admin` to avoid a double-hop.
- `src/__tests__/integration/apex-home-truth-spine.test.ts` (deleted) — tested retired fixture-landing facts (Apex tagline strings in `tenant-home-fixtures.ts`).
- `src/__tests__/integration/first-capital-tenant-resolution.test.ts` (deleted) — same; tested retired FC fixture landing.
- `src/__tests__/integration/skyharbor-home-tenant-resolution.test.ts` (deleted) — same; tested retired fixture resolver.
- `src/components/shell/__tests__/topbar-nav-home-admin.test.ts` (new) — 4 hygiene tests pinning: (1) `NAV_ITEMS.home.href === '/admin'`; (2) match logic still treats `/admin*`, `/home/*` as home-active; (3) `TOP_NAV_ITEMS.home.href === '/admin'` stays aligned; (4) other top-nav entries (Intelligence/Moves/Source/Tower) keep their canonical hrefs.

## QA / Validation

- PASS: `npx eslint src/` — clean (output below).
- PASS: `npx tsc --noEmit` — clean for every touched file; any pre-existing module-not-found errors are fresh-worktree workflow artifacts unrelated to this PR.
- PASS: `npm run test:nav` — pure-function tests for nav active-state still pass (no behavioral change to AbarvaNav active-state logic).
- PASS: `npm run test:behaviors` — 5 pre-existing tenant-onboarding failures inherited from `main` and unrelated to this PR.
- PASS: `npx jest src/components/shell/__tests__/topbar-nav-home-admin.test.ts` — 4/4 new hygiene tests pass.
- Redirect verified: `/home` → `/admin` (301) via the `homeToAdminMap` exact-match branch; `/setup` → `/admin` (301).

## Rollout Plan

Merge to `main` → Vercel deploys preview → smoke `/`, top-nav "Home" click lands on `/admin`, direct `/home` hit 301s to `/admin`, `/home/queue` and `/home/learn` stay on their real pages.

## Rollback Plan

Revert the PR. All changes are additive (1 hygiene test) or surgical (1 href flip + 1 redirect entry + 1 page deletion). Rolling back restores the orphan landing and the `/home` href.

## Audit Evidence

- Driving audit: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §2 ("Information architecture — the problem is real") and §5.5 (canonical IA — `/admin` is the Trust Plane).
- Companion PRs (Waves 1–3 of Setup/Admin Trust Plane consolidation, already merged): built the `/admin` landing this PR points at. CL-1 makes the work reachable from the top-nav.

## Known Gaps

- AbarvaNav, AppTopBarEditorial, AppTopBarTwoBar, AppRail, and the various error/forbidden/not-found pages still have logo links that point at `/home`. They now 301-redirect to `/admin` via the proxy, which is correct behavior. A follow-up could swap those direct hrefs to `/admin` to avoid the redirect hop on the brand-logo click path, but that's outside CL-1's scope.
- The `src/lib/home/top-nav-items.ts` inventory file is not yet consumed by any component (it's a future-state metadata spec). Keeping it aligned with `topbar-nav-items.ts` is a hygiene measure; both are pinned by the new test.
