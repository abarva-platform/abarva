# 2026-06-02-skyharbor-intelligence-fixture-isolation — SkyHarbor Intelligence Fixture Isolation

## Release ID

`2026-06-02-skyharbor-intelligence-fixture-isolation`

## Status

`candidate`

## Plain-English Summary

SkyHarbor's Intelligence non-corpus panels can no longer borrow Meridian Health demo fixtures when tenant-specific airline data is not loaded. The page now shows an honest empty state for sparse tenant panels instead of healthcare value pools, initiative codes, or vendors.

## Layer Impact

- `global-control-lane`: shared Intelligence rendering logic now treats Meridian fixtures as Meridian-only and uses neutral empty states for non-Meridian tenants without tenant-specific panel data.
- Tenant safety: this reduces the chance that a CXO sees another industry's labels, vendors, or initiative codes on the active tenant's Intelligence surface.

## Client Applicability

- All clients: receive the safer fallback behavior.
- Specific clients: SkyHarbor Air is the immediate QA-reported fix target.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Updates `src/components/intelligence-v3/IntelligenceV3Page.tsx` to route non-corpus fixtures by tenant instead of falling through to Meridian defaults.
- Adds a neutral empty Art of Possible fixture in `src/components/intelligence-v3/demo-data.ts`.
- Adds empty states for Art of Possible and Vendors canvases.
- Adds regression coverage for SkyHarbor Art of Possible and Vendors to ensure Meridian terms such as `MH-07`, `Clinical care`, `ambient AI`, `Innovaccer`, and `revenue cycle` do not render.

## QA / Validation

- PASS: `npx jest src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx --runInBand`
- PASS: `npx eslint src/components/intelligence-v3/IntelligenceV3Page.tsx src/components/intelligence-v3/ArtOfPossibleCanvas.tsx src/components/intelligence-v3/VendorsCxoCanvas.tsx src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx src/components/intelligence-v3/demo-data.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED: `npx tsc --noEmit --pretty false` fails before this patch on `tests/accessibility/public-axe.spec.ts(1,24): Cannot find module '@axe-core/playwright'`.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment to publish the safer Intelligence fallback. No database migration or manual data operation is required.

## Rollback Plan

Revert the PR. No data rollback is required because this only changes rendering fallback behavior and tests.

## Audit Evidence

- QA crawl report from June 2, 2026 identified SkyHarbor pages showing healthcare/Meridian terms.
- PR URL, CI results, post-deploy crawl, and production screenshots should be attached once the PR is opened and merged.

## Known Gaps

This does not load SkyHarbor enterprise context, vendor contracts, or per-Move audit packs. It prevents wrong-tenant fixture display while those tenant-specific datasets are loaded separately.
