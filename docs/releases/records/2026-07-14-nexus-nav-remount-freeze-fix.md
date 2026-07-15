# 2026-07-14-nexus-nav-remount-freeze-fix — Stop the global top nav from remounting on every click

## Release ID

`2026-07-14-nexus-nav-remount-freeze-fix`

## Status

`candidate`

## Plain-English Summary

Clicking any primary nav link (Knowledge, Intelligence, Moves, Source, Tower, Learn) made the
top navigation bar go blank for a couple of seconds — no links, no user menu, just the logo
and a loading placeholder — before it snapped back. It read as the app freezing on every
click. The cause: each product page mounted its own copy of the top nav component
(`NexusTopNav`), so every navigation unmounted the old page's nav and mounted a brand-new one.
The new copy calls Clerk's `useUser()` fresh, and Clerk briefly reports "still loading" until
it re-syncs from its already-cached session — during that window the nav had nothing to show.
This release moves the nav to a place in the component tree that Next.js does not tear down
on navigation, so it mounts once per session instead of once per click.

## Layer Impact

- **global-control-lane**: `NexusTopNav` now mounts inside `MaestroChrome` (part of the
  shared `(maestro)` layout) instead of inside each page's own `AppShell`. This changes
  *where* the nav lives in the tree, not what it renders or who sees it.
- **Shell composition**: `AppShell` no longer renders its own top nav; the one caller
  (`/admin`) that previously hid product nav via an `AppShell` prop now gets the same
  behavior via an exact-route check inside `NexusTopNav` itself.

## Client Applicability

- All clients: yes — every authenticated route under the shell-native surfaces
  (`/admin`, `/home`, `/tower`, `/source`, `/intelligence`, `/learn`, `/strategic-moves`).
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/components/chrome/MaestroChrome.tsx` — for the existing `SHELL_SURFACE_PREFIXES`
  branch (routes that already render their own `AppShell`), now mounts `<NexusTopNav />`
  once, wrapping `{children}` in a flex column so the nav sits above the page content and
  reserves its own height. `MaestroChrome` lives inside the shared `(maestro)/layout.tsx`
  tree, which Next.js does not remount on client-side navigation — only `{children}` (the
  page) changes — so the nav (and Clerk's `useUser()` session state inside it) now persists
  across navigation instead of unmounting/remounting on every click.
- `src/components/shell/AppShell.tsx` — removed its own `<NexusTopNav>` render (now owned
  by `MaestroChrome`), removed the now-dead `showProductNav` prop and its plumbing.
- `src/components/navigation/NexusTopNav.tsx` — since the nav is now a single shared
  instance instead of one per page, per-page `showProductNav={false}` is no longer
  possible via props. The only existing caller that needed it (`/admin`'s Setup landing
  page) is replicated with an exact-path check (`pathname !== "/admin"`) — verified this
  is the *only* route that wants product nav hidden; every other `/admin/*` subpage
  (checked all of them) either omits the prop or explicitly passes `showProductNav` (true).
- `src/app/(maestro)/admin/page.tsx`, `src/app/(maestro)/admin/data-layer-explorer/page.tsx`
  — removed the now-nonfunctional `showProductNav` prop from their `<AppShell>` calls.
- `src/__tests__/integration/app-rail-home-nav.test.ts`,
  `src/__tests__/hygiene/shell-v2-mode-layout.test.ts` — updated the two assertions that
  checked for `showProductNav`'s default in `AppShell.tsx`'s source to instead check
  `NexusTopNav.tsx`, where that logic now actually lives.

## QA / Validation

- Root-caused live: navigated to `app.abarva.ai/home` in a real signed-in browser session,
  clicked "Intelligence", and captured the exact symptom (blank nav for ~2-3s, logo + loading
  pill only, before the full nav reappeared) — confirmed this was a genuine remount, not a
  network stall, by inspecting the render tree (`AppShell` instantiated per-page).
- `npx jest src/components/navigation/__tests__/NexusTopNav.test.tsx` — 10/10 passed.
- `npx jest src/__tests__/integration/app-rail-home-nav.test.ts src/__tests__/hygiene/shell-v2-mode-layout.test.ts` —
  updated assertions pass; the 6 remaining failures in these two files are pre-existing,
  unrelated stale assertions against `AppTopBar.tsx` (already a thin re-export shim before
  this change) — confirmed identical failure count/content on a clean baseline via
  `git stash` before/after comparison.
- `npm run test:nav` — 26/26 passed. `npm run test:behaviors` — 195/195 passed.
- Ran the full set of shell/design/source/programs test files that reference `AppShell` or
  `MaestroChrome` (19 files, 206 tests) — 195 passed / 11 failed, byte-identical to the same
  batch run against a clean pre-change baseline (`git stash` diff comparison) — zero net-new
  failures introduced by this change.
- `npx eslint` on all 5 changed source files — 0 errors.
- Local `npx tsc --noEmit -p .` crashes on this machine with a native V8 stack trace
  unrelated to any specific change (a known, previously-documented environment quirk on
  this machine) — CI's "Typecheck + reasoning-layer tests" check is authoritative here.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). No feature flag, no migration, no
worker job. Deploy proceeds through the repo-owned `aca-main-deploy` workflow per the
standard Azure Container Apps release lane.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none used directly; deploy proceeds through the standard
  workflow only.
- Approved image digest: to be recorded once the deploy workflow runs.
- ACA runtime invariant: to be proven after deploy (template image, 100%-traffic revision
  image, and worker job images must match the approved digest).
- Worker image invariant: N/A — no worker involved in this change.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof required: yes, on `app.abarva.ai` after deploy — click through the
  primary nav links and confirm no blank/loading flash between navigations, before calling
  this "live-proven".

## Rollback Plan

Revert the merge commit (single self-contained PR, no migration, no data change). The
previous per-page nav mount behavior returns immediately; no asset or data cleanup required.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added when the PR's checks complete.
- Deployment URL / ACA revision: to be added after deploy.

## Known Gaps

- `/programs/*` routes (a separate, non-`(maestro)` layout tree, largely superseded by
  `/strategic-moves` per prior product decisions) still mount their own per-page `AppShell`
  and were not touched — they were not part of the reported freeze (the primary nav links
  the user clicked all live under `(maestro)`), and fixing them would require giving
  `/programs` its own shared layout, out of scope for this fix.
