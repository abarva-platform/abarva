# 2026-06-05-meridian-sacramento-profile-loader-alignment — Meridian Sacramento Profile Loader Alignment

## Release ID

`2026-06-05-meridian-sacramento-profile-loader-alignment`

## Status

`candidate`

## Plain-English Summary

Aligns Meridian's loader-facing enterprise profile and visible home-card profile to the current PHS/Meridian pilot narrative: a Sacramento-based integrated delivery network with 30 hospitals, 280 ambulatory sites, 58,000 employees, 1.4M covered lives, Epic as the EHR spine, and Azure Databricks as the target governed data platform. The verification guard now fails if the stale 23-hospital or non-California profile returns to the Setup/Admin upload template.

## Layer Impact

- `client-data-lane`: Updates Meridian/PHS synthetic client context artifacts that are intended to be loaded through the governed Setup/Admin template path.
- `public-demo`: Updates the Meridian-facing home-card tagline so visible demo copy matches the loader-backed profile.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health System / PHS pilot lane.
- Internal only: No.
- Public/demo only: The visible home-card profile is demo-facing.
- Feature flag: None.

## Changes Included

- `datasets/meridian-health-synthetic-v1/17-upload-templates/enterprise-profile.yaml`
- `src/data/meridian.ts`
- `src/components/home/HomeOverviewV2.tsx`
- `docs/build/meridian/MERIDIAN_CONTEXT_LAYER_SHOWCASE.md`
- `datasets/meridian-health-synthetic-v1/README.md`
- `scripts/verify/meridian-context-showcase.mjs`

## QA / Validation

- `npm run verify:meridian-context-showcase` passed with `26` templates, `8` scenarios, and `26` dimensions.
- Stale-string scan passed for the edited profile surfaces: no `23 hospitals`, `142 clinics`, `187000`, `Charlotte, NC`, `Blue Ridge`, or old home-card hospital tagline remain in those surfaces.

## Rollout Plan

Merge to `main`, then deploy through the normal Vercel production path. This does not mutate live Azure/Postgres data by itself. The corrected profile becomes active in runtime fixtures and in the loader-facing upload template; live context reset still requires the governed Setup/Admin reload run.

## Rollback Plan

Revert the PR with `gh pr revert <PR number>`. No migration rollback is required because this release has no schema changes and does not perform destructive data mutation.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3133
- CI checks: to be added after PR checks complete.
- Local verification: `npm run verify:meridian-context-showcase`.
- Diff evidence: the enterprise profile template now includes Sacramento, 30 hospitals, 280 ambulatory sites, 58,000 employees, 1.4M covered lives, and Azure Databricks target platform.

## Known Gaps

This is not the live data reset. The live Meridian context layer must still be reset/reloaded through Setup/Admin so Sentinel, Nexus, Tower, and Intelligence answers use the updated profile with citations.
