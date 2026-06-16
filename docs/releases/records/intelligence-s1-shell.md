# Intelligence S1 Shell — Context & Corpus Explorer

## Release ID

`2026-06-16-intelligence-s1-shell`

## Status

`candidate`

## Plain-English Summary

Adds the Context & Corpus Explorer S1 shell to the `/intelligence` page — a new layout consisting of a Sentinel conversation rail on the left and five tabs on the right (Insights, Explore, Change Log, Coverage & Trust, Corpus). The new layout is gated behind the `context_corpus_explorer_enabled` feature flag (default OFF), so the existing V3 Intelligence page continues to render for all tenants that don't have the flag set. No data model or schema changes are included in this release; all content in the new layout is stub/illustrative data representative of a SkyHarbor Air tenant.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** UI/frontend — new React components under `src/components/intelligence-v4/`, feature-flag gate added to `src/app/intelligence/page.tsx`, new `context_corpus_explorer_enabled` flag registered in `src/lib/features/registry.ts`.
- The server component (`page.tsx`) evaluates the feature flag server-side and renders either the new `IntelligenceExplorerPage` (client component) or the existing `IntelligenceV3Page` — no database reads, no migrations, no data-plane changes introduced by this release.

## Client Applicability

- **All clients:** Flag is registered as `tenant` policy with no `includeTenants` entries, so it is **default OFF** for every tenant.
- **Specific clients:** None enrolled at release time. Enroll via `includeTenants: ["skyharbor"]` (or equivalent) in `registry.ts`, or via the `ABARVA_FEATURE_CONTEXT_CORPUS_EXPLORER_ENABLED_TENANTS` env var on ACA.
- **Feature flag:** `context_corpus_explorer_enabled` — tenant-policy, default OFF.

## Changes Included

- `src/components/intelligence-v4/SentinelExplorerRail.tsx` — new: Sentinel left rail with conversation thread, 4 starter chips, auto-grow textarea, grounded chip on answers.
- `src/components/intelligence-v4/ContextInsightsFeed.tsx` — new: Insights tab with domain filter chips, insight cards, expand/collapse derivation chain, action buttons.
- `src/components/intelligence-v4/ContextExploreTab.tsx` — new: Explore tab with entity-type strip, segmented IT Systems table (18 systems, 6 segments), inline row expansion.
- `src/components/intelligence-v4/ContextChangeLogTab.tsx` — new: Change Log tab with filter chips and change table (5 stub rows).
- `src/components/intelligence-v4/ContextCoverageTrustTab.tsx` — new: Coverage & Trust tab with 4 KPI strip, 14-dimension heatmap, insight-unlock ladder, source health table, truth-state funnel, gaps band.
- `src/components/intelligence-v4/ContextCorpusTab.tsx` — new: Corpus tab with 3 sub-tabs (Relevant, Browse, Search) over 5 stub patterns.
- `src/components/intelligence-v4/IntelligenceExplorerPage.tsx` — new: main page wrapper (tenant header strip + Sentinel rail + tab routing).
- `src/app/intelligence/page.tsx` — modified: feature flag check added; routes to `IntelligenceExplorerPage` when flag is on, otherwise falls through to existing V3 render path unchanged.
- `src/lib/features/registry.ts` — modified: `context_corpus_explorer_enabled` flag added as `tenant` policy, default OFF.

## QA / Validation

- `npx tsc --noEmit` — passes clean (two pre-existing external module errors for `@azure-rest/ai-document-intelligence` and `@axe-core/playwright` are unrelated to this PR and were present before).
- `npx eslint src/components/intelligence-v4/ src/app/intelligence/page.tsx --max-warnings=0` — passes with 0 warnings, 0 errors.
- V3 render path: unchanged — the existing `IntelligenceV3Page` import and all its data-fetching calls are structurally identical; the feature flag check is an early-return before the parallel data fetches, so V3 tenants see no change.
- Feature flag contract: `isFeatureEnabled` with a `tenant` policy and empty `includeTenants` returns `false` for every tenant unless explicitly enrolled. Confirmed by reading the existing test suite in `src/__tests__/features/`.

## Rollout Plan

1. Merge PR to `main` (squash).
2. ACA image rebuild picks up new components and registry entry automatically.
3. To enable for a tenant: add the tenant key to `includeTenants` in `registry.ts` (requires a new deploy) **or** set `ABARVA_FEATURE_CONTEXT_CORPUS_EXPLORER_ENABLED_TENANTS=skyharbor` on the ACA container app (no redeploy needed — env var is read at request time).
4. No database migrations required.

## Rollback Plan

- **Flag off (fastest):** Remove the tenant from `includeTenants` (or unset the env var) — next request reverts to V3. No deploy needed if using the env var path.
- **Code revert:** Revert the feature flag gate change in `page.tsx` and the `registry.ts` entry. The new component files are inert without the flag and do not need to be deleted for rollback.
- No migration rollback required (no schema changes).

## Audit Evidence

- PR: to be added after push (feat/intelligence-s1-shell → main).
- TypeScript check: `npx tsc --noEmit` — zero errors in new files.
- ESLint check: `npx eslint src/components/intelligence-v4/ src/app/intelligence/page.tsx --max-warnings=0` — zero warnings/errors.
- V3 unaffected: confirmed by code inspection — the early-return for the flag precedes all data-fetching calls; when flag is OFF the code path is byte-identical to pre-PR.

## Known Gaps

- All tab content is stub/illustrative data. Real context data wiring (Sentinel LLM routing, live dimension coverage reads, real insight derivation engine) is deferred to S2+.
- The `SentinelExplorerRail` uses canned answers; live LLM routing is not wired.
- `ContextExploreTab` only implements the IT Systems entity type fully; the other 5 entity types show a placeholder ("same segmented pattern — wiring in S2").
- No Playwright E2E test for the new layout (requires running dev server with real Clerk credentials — out of scope for S1 shell).
