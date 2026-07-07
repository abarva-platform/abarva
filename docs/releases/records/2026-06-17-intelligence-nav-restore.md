# 2026-06-17-intelligence-nav-restore — Move /intelligence into (maestro) route group

## Release ID

`2026-06-17-intelligence-nav-restore`

## Status

`candidate`

## Plain-English Summary

The Intelligence Context/Corpus Explorer (shipped S1–S5, 2026-06-16) was placed at `src/app/intelligence/page.tsx` — outside the `(maestro)` route group. This meant the global navigation bar (Tower / Intelligence / Source / Moves) was absent from the page. This PR moves the page and loading skeleton into `src/app/(maestro)/intelligence/` and removes the now-unnecessary passthrough `layout.tsx`. No code changes inside either file; the move is the entire diff.

## Layer Impact

- **global-control-lane**: Route-only change — three files moved/deleted (`intelligence/page.tsx` → `(maestro)/intelligence/page.tsx`, same for `loading.tsx`; `intelligence/layout.tsx` deleted). No schema, migration, or data-plane change.

## Client Applicability

All clients — the global nav is not feature-gated; restoring it is a universal fix. The Explorer body remains gated by `context_corpus_explorer_enabled` (currently on for SkyHarbor Air only).

## Changes Included

- `src/app/intelligence/page.tsx` → **deleted** (moved to maestro group)
- `src/app/intelligence/loading.tsx` → **deleted** (moved to maestro group)
- `src/app/intelligence/layout.tsx` → **deleted** (passthrough wrapper no longer needed; `(maestro)/layout.tsx` provides `AppChrome`)
- `src/app/(maestro)/intelligence/page.tsx` → **new** (identical content, now inherits global nav)
- `src/app/(maestro)/intelligence/loading.tsx` → **new** (identical content)

## QA / Validation

- `npx tsc --noEmit --skipLibCheck` passes (only pre-existing `vendorSpendRows` test-fixture errors in `intelligence-v3` and `pilot-dashboard`, unrelated to this move)
- Manual: navigate to `/intelligence` after deploy → global nav bar (Tower / Intelligence / Source / Moves) is present; Explorer tabs and Sentinel rail render correctly
- Regression: non-SkyHarbor tenants see V3 Intelligence surface with nav restored

## Rollout Plan

Merge to main → ACA image rebuild → deploy to `ca-abarva-web-lab-eastus`. No migration. No feature flag change required.

## Rollback Plan

Revert this PR. The three original files are restored and the passthrough layout returns.

## Known Gaps

- The old J0-era sub-routes (`/intelligence/patterns`, `/intelligence/topics`, etc.) remain at `src/app/intelligence/` and still lack the global nav. These routes are dead code from the pre-Context/Explorer surface and are not linked from the product; cleanup is deferred.

## Audit Evidence

- PR on `abarva-platform/abarva`, branch `fix/intelligence-nav-restore`
- Browser verification: nav bar visible on `app.abarva.ai/intelligence` after ACA deploy
