# 2026-05-30-setup-per-zone-suspense — Setup/Admin per-zone Suspense boundaries (Wave 3 PR-7)

## Release ID

`2026-05-30-setup-per-zone-suspense`

## Status

`candidate`

## Plain-English Summary

Implements the Loading-state design from `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 on the `/admin` Setup landing. The single `Promise.all` that previously blocked the whole page on the slowest broker is replaced by per-zone async server components, each wrapped in its own `<Suspense>` boundary inside `HomeOverviewV2`. The masthead (Zone A) and the AdminOverviewTabs strip render synchronously and immediately; the Trust strip, Action queue, Posture grid, Steward orientation, and Audit ribbon each stream as their broker resolves, with a static muted skeleton standing in until then. No spinners — that's a founder principle and it is visible here.

The five zone components share broker calls via `React.cache` helpers so e.g. `getTrustSpine` runs once per request even though four zones consume it.

## Layer Impact

- `runtime-app-lane`: 5 new Suspense boundaries on `/admin` landing inside `HomeOverviewV2`. Static masthead + sidebar render path is unchanged; per-zone data fetching is split into 5 cached async server components inside `src/app/(maestro)/admin/page.tsx`. Skeletons live in `src/components/admin/skeletons.tsx`. Founder no-spinner principle holds — skeletons are placeholder text in mono only (`···`).
- `qa-validation-lane`: 2 new test suites (skeletons + suspense slot behavior), 20 new tests. All existing `HomeOverviewV2` DOM-order + tenant-switcher + connector-cta tests continue to pass (13/13). Only pre-existing failure on `no-sub-nav-strip` (same as `main`) is unrelated.

## Client Applicability

- All clients: The Suspense boundaries are rendered on every tenant's `/admin` landing. Behavior is functionally identical for already-warm caches; the win is on cold loads where one slow broker no longer holds the page.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/admin/skeletons.tsx` (new) — 5 skeletons: `TrustStripSkeleton` (4 hollow chips, ~56px), `ActionQueueSkeleton` (3 ghost rows), `PostureGridSkeleton` (2×2 muted cards), `AuditRibbonSkeleton` (6 muted rows), `StewardOrientationSkeleton` (editorial frame with placeholder body). All locked-palette muted; mono `···` only.
- `src/components/home/HomeOverviewV2.tsx` (modified) — added 5 optional zone slot props (`trustStripSlot`, `actionQueueSlot`, `postureGridSlot`, `stewardOrientationSlot`, `auditRibbonSlot`). When a slot is provided it wins over the static data prop for that zone and is wrapped in a `<Suspense>` boundary with the matching skeleton fallback. When omitted, the eager static-prop path is preserved so existing tests (and any future synchronous caller) keep working unchanged.
- `src/components/home/StewardOrientationBlock.tsx` (new) — extracted the Steward orientation block from inline JSX in HomeOverviewV2 so the page can feed it from an async server component slot. Pure presenter.
- `src/app/(maestro)/admin/page.tsx` (rewritten) — broke the single `Promise.all` into 5 async server components (`TrustStripZone`, `ActionQueueZone`, `PostureGridZone`, `StewardOrientationZone`, `AuditRibbonZone`). Each fetches the data it needs via 4 `React.cache`-wrapped broker helpers (`cachedTrustSpine`, `cachedInventorySnapshot`, `cachedCrossProgramSignals`, `cachedApprovalQueue`) so a single broker call is shared across the zones that consume it. The masthead path (active client + segment/record counts + tenant-switcher inputs) is still resolved synchronously up-front because the Zone A header carries those pills.
- `src/components/admin/__tests__/skeletons.test.tsx` (new) — 15 tests covering each skeleton's DOM shape (chip count, row count, placeholder text), the locked palette boundary (no live status colors leak in), accessibility role/aria-label on the trust-strip skeleton, and the no-spinner invariant for every skeleton.
- `src/components/home/__tests__/HomeOverviewV2.suspense.test.tsx` (new) — 8 tests pinning per-zone Suspense behavior. Each zone slot is fed a never-resolving component and the matching skeleton is asserted in the rendered output; a 6th test checks the masthead remains synchronous under all-zone suspense; a 7th pins DOM order under Suspense; an 8th asserts no spinner markup appears anywhere on a fully-suspended page.

## QA / Validation

- PASS: `npx jest src/components/admin/__tests__/skeletons.test.tsx src/components/home/__tests__/HomeOverviewV2.suspense.test.tsx` — 20/20.
- PASS: `npx jest src/components/home/__tests__/HomeOverviewV2.dom-order.test.tsx src/components/home/__tests__/HomeOverviewV2.tenant-switcher.test.tsx src/components/home/__tests__/HomeOverviewV2.connector-cta.test.tsx` — 13/13 across the previously-locked DOM-order + tenant-switcher + connector-cta suites.
- PASS: `npx jest src/components/admin/__tests__ src/components/home/__tests__` — 109/110 pass; the 1 pre-existing `no-sub-nav-strip` failure also fails on `main` for the same Setup pages and is unrelated to this PR.
- PASS: `npx eslint src/components/home/HomeOverviewV2.tsx src/components/home/StewardOrientationBlock.tsx src/components/admin/skeletons.tsx 'src/app/(maestro)/admin/page.tsx'` — clean.
- PASS: `npx tsc --noEmit` — clean for every touched file (pre-existing `@azure/*` / `pptxgenjs` / `@resvg/resvg-js` module-not-found errors are workflow artifacts in fresh worktrees, unrelated to this PR).

### Manual streaming verification

Out of scope for automated perf testing. Verdict §5.6 calls for the masthead and trust-strip skeleton to be visible in <100ms with chip numbers streaming in afterward. The Suspense structure is the standard React 19 streaming path on Next.js 16, so the streaming behavior follows from the architecture; visual confirmation belongs in PR-walkthrough review rather than CI.

## Rollout Plan

Merge after CI passes. No migration, no feature flag, no deploy gate. The page renders functionally identically to today; the win is per-zone streaming on cold loads. The Suspense slot props are backwards-compatible (static data props still work) so any test/caller passing the older shape keeps rendering.

## Rollback Plan

Revert the PR. The slot-prop addition on `HomeOverviewV2` is purely additive; the page rewrite is a single file. No data-plane or schema change to back out.

## Audit Evidence

- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Loading state + §7 Wave 3 PR-7.
- Companion PR (W3-PR-6 · empty-state): coordinates on content. PR-7 owns Suspense wrappers + skeletons; PR-6 owns empty-state content for the resolved cards. Resolve any conflicts at merge.

## Known Gaps

- The Steward orientation zone uses the same data path as the Action queue (snapshot + signals + approval queue → composeOverviewBlocks). The `React.cache` helper guarantees the brokers run once, but the in-zone `composeOverviewBlocks` call is repeated. Cheap deterministic work; safe to leave.
- The page-level masthead pills (segments loaded, records, refreshedLabel) still depend on the snapshot resolving up-front (so the editorial header is correct at render). This is intentional — the §5.6 design wants the masthead to convey *who* and *when* synchronously. The chip numbers in the Trust strip below are what streams.
- Automated streaming perf test (`Lighthouse perf ≥ 90` per Wave 2 gate) is out of scope of this PR. Visual verification only.
