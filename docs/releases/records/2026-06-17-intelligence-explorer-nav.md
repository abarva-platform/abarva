# 2026-06-17-intelligence-explorer-nav — Restore global nav on Intelligence Explorer (V4 flag path)

## Release ID

`2026-06-17-intelligence-explorer-nav`

## Status

`candidate`

## Plain-English Summary

When the `context_corpus_explorer_enabled` feature flag is on for a tenant (currently SkyHarbor Air), the Intelligence page renders `IntelligenceExplorerPage` — a fully custom React component built as a self-contained widget. `MaestroChrome` (the app-level nav wrapper) intentionally passes through all `/intelligence` routes without rendering `AbarvaNav` because shell-native surfaces are expected to call `AppShell` themselves. `IntelligenceExplorerPage` never calls `AppShell`, so the global nav bar (Tower · Intelligence · Source · Moves) never appears.

Fix: wrap the V4 branch in `<AppShell>` inside `(maestro)/intelligence/page.tsx` (the server-component gate), and change `IntelligenceExplorerPage`'s root `div` height from `calc(100vh - 54px)` to `100%` so it fills `AppShell`'s content area rather than trying to subtract an independent nav offset.

## Layer Impact

- **global-control-lane**: Two files changed — `page.tsx` and `IntelligenceExplorerPage.tsx`. No schema, migration, or data-plane change. Scoped behind the `context_corpus_explorer_enabled` feature flag; V3 path for all other tenants is unchanged.

## Client Applicability

Feature flag (`context_corpus_explorer_enabled`) — only SkyHarbor Air is affected today. All other tenants continue to see V3 (which already calls `AppShell` correctly).

## Changes Included

- `src/app/(maestro)/intelligence/page.tsx`: import `AppShell`; wrap `<IntelligenceExplorerPage>` in `<AppShell surface="intelligence" topBarProps={...} hasTenantKey={!!client?.key}>`.
- `src/components/intelligence-v4/IntelligenceExplorerPage.tsx`: root `div` height changed from `calc(100vh - 54px)` to `100%`.

## QA / Validation

- `npx tsc --noEmit --skipLibCheck` passes with zero errors.
- After ACA deploy: sign in as a SkyHarbor Air user, navigate to `/intelligence` — global nav (Tower · Intelligence · Source · Moves) must appear in the top bar; Explorer content (Insights / Explore / Change Log / Coverage & Trust / Corpus tabs) must appear below it.
- V3 tenants (Apex Retail, Meridian, etc.) must be unaffected.

## Rollout Plan

Merge to main → ACA image rebuild → deploy to `ca-abarva-web-lab-eastus`. No migration. No feature flag change.

## Rollback Plan

Revert this PR. The Explorer still loads; the global nav disappears again. No data loss.

## Known Gaps

- Signed-in browser QA (SkyHarbor Air with flag on) is pending post-deploy — not blocked on merging.
- Old J0 sub-routes under `src/app/intelligence/` are dead code; formal removal PR planned after PostHog traffic audit.

## Audit Evidence

- Root cause: `MaestroChrome.tsx` line 14 — `/intelligence` in `SHELL_SURFACE_PREFIXES` skips `AbarvaNav`; `IntelligenceExplorerPage` never calls `AppShell`.
- Fix confirmed via TypeScript clean compile.
- Live browser QA pending post-deploy.
