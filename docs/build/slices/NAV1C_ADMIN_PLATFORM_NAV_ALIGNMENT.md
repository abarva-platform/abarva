# NAV1C — Admin / Platform Nav Alignment

**Wave:** NAV1
**Slice ID:** NAV1C
**Type:** docs
**Status:** code_complete

## Purpose

Document the canonical-shell, legacy-chrome, and banned-token state of every
admin / platform route. No app code changes.

## Findings

- `AdminCanonShell` is the canonical admin page shell. It is canonical
  (navy single-accent, no banned tokens).
- 5 of 20 admin routes use `AdminCanonShell` today; the remaining 15 render
  content directly under the `(maestro)` layout. NAV1 does not migrate them.
- No `<TopBar>`, `<PrimaryNav>`, or `<AdminPortalHeader>` imports remain in
  the admin/platform tree.
- No admin/platform page hand-codes the wordmark.
- Banned `#14B8A6` (teal) and `#0E9F8C` (teal-adjacent) remain in 7 page
  bodies as visual styling (KPI accents, color palettes). Removing them is
  a NAV2 / banned-token-sweep concern; NAV1 records them as deferred.

## Files Added

- `docs/platform-design/experience-system/implementation-reviews/NAV1_ADMIN_PLATFORM_NAV_ALIGNMENT_REVIEW.md`
- `docs/build/slices/NAV1C_ADMIN_PLATFORM_NAV_ALIGNMENT.md` — this file.

## Files Updated

- `docs/build/build-slices.json` — NAV1C entry.

## Validation

- `git diff --check` — clean.
- `npx tsc --noEmit` — clean.
- `npm run build` — pass.
