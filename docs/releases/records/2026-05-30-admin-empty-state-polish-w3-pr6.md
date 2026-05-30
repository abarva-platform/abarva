# 2026-05-30-admin-empty-state-polish-w3-pr6 — Setup/Admin Empty-State Polish (Wave 3 PR-6)

## Release ID

`2026-05-30-admin-empty-state-polish-w3-pr6`

## Status

`candidate`

## Plain-English Summary

Polishes the brand-new-tenant empty state on `/admin` per
`docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6. Today the page works
for active tenants but the first-15-seconds experience for a freshly
provisioned tenant is undefined. This release defines four editorial
empty-state surfaces, all gated on `trustSpine.substrate.segmentsTotal
=== 0`:

1. **Trust strip** — already returned four hollow-dot `no data yet` chips
   from W1-PR-5; covered here by a new dedicated test so the contract
   stays load-bearing.
2. **Action queue** — replaced by a single primary editorial card
   ("Upload your first dataset to begin grounding.") plus two ghost
   suggestion cards linking directly to org_structure and kpi_dictionary
   on Data Trust.
3. **Posture grid (Zone D)** — replaced by a 4-column upload affordance
   tile (Organization · KPIs · Vendors · Customer) — the "first 4
   datasets" per the verdict. Each tile pre-seeds the data-trust segment
   selector.
4. **Steward orientation** — renders a single editorial sentence
   ("AbarVa has no substrate for this tenant. Once you load enterprise
   profile, Sentinel can begin answering with provenance.") in place of
   the two-column loaded / missing read.
5. **Audit ribbon** — already showed the muted "No activity in the last
   24 hours" line from W1-PR-6; covered here with the empty-state
   snapshot so regressions surface quickly.

The non-empty path is unaffected — the standard action queue, 2×2
posture grid, and two-column Steward read all render exactly as before
for any tenant with at least one substrate segment.

## Layer Impact

- `runtime-app-lane`: Adds an `emptyTenant` prop to `HomeOverviewV2` and
  gates three sections (action queue, posture grid, Steward orientation)
  on it. Page composer in `src/app/(maestro)/admin/page.tsx` derives
  `emptyTenant` from `trustSpine.substrate.segmentsTotal === 0` (only
  when the spine resolves; broker outage continues to render the legacy
  path so an outage doesn't masquerade as a brand-new tenant).
- `architecture-lane`: No new seams. `OverviewBlocks.orientation` gains
  an `isEmptyTenant: boolean` field so the editorial empty register is
  expressible without a string-equality heuristic.
- `qa-validation-lane`: 10 new HomeOverviewV2 empty-state tests + 6 new
  PostureGrid affordance tests + 2 new overview-composer
  `isEmptyTenant` tests. All existing 34 admin-surface tests pass
  unchanged.
- `data-plane-lane`: No schema change. No new tables. No migration. No
  new broker reads.

## Client Applicability

- All clients: No behavior change for tenants with substrate loaded.
  Brand-new-tenant empty state renders for any tenant where
  `data_inventory_segments` is empty (today: none of the 5 canonical
  tenants — Apex, Meridian, FCF, Northstar, Skyharbor — all have
  substrate). Surfaces only in pilot onboarding before the first dataset
  lands.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/admin/PostureGrid.tsx` (modified) — adds
  `EmptyTenantUploadAffordance` sibling component + `firstFourDatasetTiles()`
  exporter, gated by the page composer.
- `src/components/home/HomeOverviewV2.tsx` (modified) — accepts
  `emptyTenant` prop; gates action queue, posture grid, and Steward
  orientation sections on it; adds `EmptyTenantPrimaryCard` sub-component.
- `src/app/(maestro)/admin/page.tsx` (modified) — derives `emptyTenant`
  from `trustSpine.substrate.segmentsTotal === 0` and threads it through.
- `src/lib/admin/overview-composer.ts` (modified) — adds
  `orientation.isEmptyTenant` to the contract; emits editorial empty
  copy when `segments.length === 0`.
- `src/components/home/__tests__/HomeOverviewV2.empty-state.test.tsx`
  (new) — 10 snapshot tests covering the empty + non-empty paths.
- `src/components/admin/__tests__/PostureGrid.test.tsx` (modified) —
  6 new tests covering `firstFourDatasetTiles` and
  `EmptyTenantUploadAffordance`.
- `src/lib/admin/__tests__/overview-composer.test.ts` (modified) — 2
  new tests covering `orientation.isEmptyTenant`.
- `src/components/home/__tests__/HomeOverviewV2.*.test.tsx` (3 fixtures
  updated) — `isEmptyTenant: false` added to existing orientation
  fixtures to match the new contract.

## QA / Validation

- PASS: `npx jest src/components/home/__tests__/HomeOverviewV2.empty-state.test.tsx` — 10/10.
- PASS: `npx jest src/components/admin/__tests__/PostureGrid.test.tsx` — 21/21 (15 pre-existing + 6 new).
- PASS: `npx jest src/lib/admin/__tests__/overview-composer.test.ts` — all tests including 2 new.
- PASS: `npx jest src/components/home/__tests__/HomeOverviewV2.{dom-order,connector-cta,tenant-switcher}.test.tsx` — all pre-existing tests pass with the new fixture field.
- PASS: `npx jest src/components/admin/__tests__/AuditRibbon.test.tsx` — unchanged.
- PASS: `npx tsc --noEmit` — zero errors in changed code (pre-existing Azure SDK type gaps remain — workflow artifact per memory).
- PENDING: PR CI.

## Rollout Plan

Merge to main after CI passes. No runtime rollout step; no migration; no
deploy gate. The empty-state branch fires for any tenant whose
`trust_spine.substrate.segmentsTotal === 0`. None of the 5 canonical
demo tenants meet that condition today, so the empty register is dormant
until the first pilot tenant is provisioned.

## Rollback Plan

Revert the PR. The change is layered cleanly: removing the `emptyTenant`
prop and the new sub-components restores the page to its pre-PR
behavior; the `isEmptyTenant` field on `OverviewBlocks.orientation`
becomes orphaned but does not break any consumer (TypeScript widens it
back to optional). No data or migration rollback is required.

## Audit Evidence

- Audit verdict driving this work:
  `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 ("Empty state")
  and §7 Wave 3 PR-6 in the 90-day execution slicing.
- Mission directive (parent agent): Wave 3 PR-6 — polish brand-new
  tenant empty state per verdict §5.6.
- Coordinating PR (parallel): Wave 3 PR-7 (loading-state polish — touches
  wrappers/suspense; this PR touches content). No overlap on the same
  components except shared types; merged independently.

## Known Gaps

- "Customer" tile uses `?segment=customer_signals` as the data-trust
  query slug. There is no canonical 14-segment row named
  "customer signals" today — the slug is a forward-looking convention
  the data-trust segment selector resolves leniently. If the segment
  catalog is extended to include a canonical customer-signals segment
  (Wave 3 PR-2 or later), no change to this empty-state surface is
  required.
- The `liveSnapshotPresent` masthead "Substrate live" pill is already
  conditionally hidden for brand-new tenants (W1-PR-5). No further work
  required here.
- Wave 3 PR-7 (loading-state polish) ships the per-zone Suspense
  boundaries; this PR is content-only and does not alter the page's
  streaming shape.
