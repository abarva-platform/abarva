# ADMIN10 — Legacy `/platform/admin/*` Route Consolidation

## Metadata
- ID: ADMIN10
- Title: Legacy `/platform/admin/*` route consolidation (REDIRECT / DEPRECATE / MERGE prep)
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: docs+ops
- Dependencies: ADMIN9 audit
- Estimated complexity: M

## Purpose
Execute the disposition decisions from the ADMIN9 legacy route audit. After this slice, the `/platform/admin/*` tree contains only redirects (to canonical `/admin/*` or `/intelligence`) plus the four KEEP routes that will be migrated in follow-up waves. All DEPRECATE routes are deleted; all REDIRECT routes are converted from full UIs (or client-side redirects) to thin server-side `redirect()` files. MERGE source pages stay in place during this slice — their content is consumed by ADMIN11/13/14/15.

## Context
ADMIN8 retired 3 legacy routes (`/platform/admin`, `/platform/admin/architecture`, `/platform/admin/production-readiness`). 16 live legacy sub-routes remain. Per ADMIN9 audit: 4 KEEP, 5 MERGE (consumed by Tier-2 slices), 2 REDIRECT (intelligence + users), 6 DEPRECATE (brief, context, data-guide, outcomes, playbook, revenue). One nav-source reference (`src/components/AbarvaNav.tsx` line 130) still points the admin pill at `/platform/admin` — retarget to `/admin` to drop the redirect hop.

## Target state
- 6 DEPRECATE routes deleted (page.tsx + sibling route assets if any).
- 2 REDIRECT routes (intelligence, users) replaced with thin server-side `redirect()` files.
- 1 nav-source file (`AbarvaNav.tsx`) retargeted to `/admin` directly.
- 5 MERGE routes (build-progress, connectors, data, data-governance, quality) preserved untouched — Tier-2 slices consume their content separately.
- 4 KEEP routes (approvals, audit, experience-gallery, new-client) preserved untouched with a one-line "legacy — being migrated" banner comment in each file. Migration to canonical happens in a follow-up wave (NOT this one).
- ADMIN7 visual-lock regression test extended to assert the new redirects.

## Allowed files
- `src/app/(maestro)/platform/admin/intelligence/page.tsx` (rewrite to server redirect)
- `src/app/(maestro)/platform/admin/users/page.tsx` (rewrite to server redirect once ADMIN11 lifts the form)
- `src/app/(maestro)/platform/admin/brief/**` (delete)
- `src/app/(maestro)/platform/admin/context/**` (delete)
- `src/app/(maestro)/platform/admin/data-guide/**` (delete)
- `src/app/(maestro)/platform/admin/outcomes/**` (delete)
- `src/app/(maestro)/platform/admin/playbook/**` (delete)
- `src/app/(maestro)/platform/admin/revenue/**` (delete)
- `src/components/AbarvaNav.tsx` (retarget admin link)
- `src/__tests__/integration/admin/admin7-visual-lock.test.ts` (extend redirect assertions)
- `docs/build/slices/ADMIN10_LEGACY_ROUTE_CONSOLIDATION.md` (this file)

## Forbidden files
- Any `/admin/*` canonical page or component
- `src/lib/agent/**`
- Migrations / package.json
- The 4 KEEP routes' page.tsx content (only banner comment additions allowed)

## Implementation scope
1. Delete 6 DEPRECATE routes — `brief`, `context`, `data-guide`, `outcomes`, `playbook`, `revenue`.
2. Convert `/platform/admin/intelligence/page.tsx` from client-side `window.location.replace` to server-side `redirect('/intelligence')`.
3. Wait for ADMIN11 to lift InviteUserForm + listing into canonical, then convert `/platform/admin/users/page.tsx` to `redirect('/admin/users-access')`. (If ADMIN11 hasn't merged, ADMIN10 ships without the users redirect and a follow-up commit lands once ADMIN11 merges.)
4. Retarget `AbarvaNav.tsx` admin link from `/platform/admin` to `/admin`.
5. Add a 1-line banner comment to each of the 4 KEEP routes: `// LEGACY · being migrated to /admin/<x> in a follow-up wave (post-wave-admin-completion).`
6. Extend ADMIN7 visual-lock regression test to assert intelligence + users (after ADMIN11) are thin redirects.
7. Verify no remaining nav source references `/platform/admin/<deleted>` paths via grep.

## Tests
- Extend `src/__tests__/integration/admin/admin7-visual-lock.test.ts`:
  - assert `/platform/admin/intelligence/page.tsx` imports `redirect` from `next/navigation` and calls it with `/intelligence`
  - assert (after ADMIN11) `/platform/admin/users/page.tsx` is a thin redirect to `/admin/users-access`
  - assert no source file imports a deleted route
- New `src/__tests__/integration/admin/admin10-legacy-disposition.test.ts`:
  - asserts the 6 DEPRECATE routes do NOT exist on disk
  - asserts `AbarvaNav.tsx` admin link target is `/admin`

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/app src/components
npx jest src/__tests__/integration/admin/admin10-legacy-disposition
npx jest src/__tests__/integration/admin/admin7-visual-lock
bash scripts/integration/hygiene_gate.sh --skip-build
```

## Acceptance criteria
1. 6 DEPRECATE routes deleted; build still succeeds.
2. 2 REDIRECT routes are thin server `redirect()` files.
3. `AbarvaNav.tsx` admin link points to `/admin`.
4. 4 KEEP routes preserved with banner comments.
5. 5 MERGE routes untouched (Tier-2 slices consume separately).
6. All ADMIN7 regression tests pass + new ADMIN10 disposition test passes.

## Risks
- Deleted `outcomes` / `revenue` pages may have inbound links from marketing or demo flows; sweep `grep -r "/platform/admin/outcomes"` etc before deletion.
- `/platform/admin/users` redirect cannot land until ADMIN11 ships canonical users-access depth; sequence carefully.

## Founder review
Visit `/platform/admin/intelligence` → should 308 to `/intelligence`. Visit `/platform/admin/brief` → 404. Visit `/platform/admin/users` → 308 to `/admin/users-access` (after ADMIN11). Top-nav admin pill → straight to `/admin` (no redirect hop).
