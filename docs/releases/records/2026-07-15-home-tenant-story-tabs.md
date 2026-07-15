# 2026-07-15-home-tenant-story-tabs — Home Dimension Tabs Tell Tenant Stories

## Release ID

`2026-07-15-home-tenant-story-tabs`

## Status

`candidate`

## Plain-English Summary

Home dimension tabs now explain the selected tenant's actual loaded context instead of describing what each tab is for. Summary, Data, Relationships, Gaps, and Evidence use tenant name, loaded record counts, representative records, visible relationships, validation gaps, and evidence sources so the page can support a client story for tenants such as Meridian or SkyHarbor without inventing unsupported facts.

## Layer Impact

- Lane: `global-control-lane` because Home rendering behavior is shared across tenants and does not mutate tenant data.
- Product UI: Home Knowledge dimension pages now render tenant-specific story copy for each tab.
- Data access: No data layer, ingestion, promotion, or candidate behavior changed. The copy is derived from the existing Home explorer area, module context, evidence references, relationships, and gap payloads already supplied to Home.
- AI/egress: No new Claude call was added. The existing Home summary snapshot and module-context explanation fields are still used when present; this change improves deterministic fallback and tab-level rendering.

## Client Applicability

- All clients: Yes, all tenants using Home Knowledge dimension pages receive the tenant-story tab rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/components/home/HomeSurface.tsx`: adds deterministic tenant tab story generation for Data, Relationships, Gaps, and Evidence; updates Summary fallback to include tenant-specific loaded context; removes generic profile-requirement copy from the visible Summary tab.
- `src/components/home/__tests__/HomeSurface.test.tsx`: updates Home tests to assert tenant-specific tab storytelling and tab interaction.

## QA / Validation

- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`
- Pass: `npx jest --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Known warning during Jest: existing duplicate manual mock warnings for markdown/GFM mocks; tests passed.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the resulting image to the shared lab/product runtime. No manual data load, migration, feature flag, or candidate promotion is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after ACA main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home route crawl/proof after deploy.

## Rollback Plan

Revert the PR or roll back the ACA revision to the previous digest-pinned image. No data rollback is required because this change is UI rendering only.

## Audit Evidence

- Focused lint output.
- Focused Jest output.
- PR diff and release check output.
- Post-deploy ACA revision, image digest, runtime invariant, health, and signed-in crawl once merged.

## Known Gaps

This PR does not improve tenant data depth, relationships, evidence quality, or Claude-generated summaries. It ensures the Home UI tells a tenant-specific story from the context it already receives.
