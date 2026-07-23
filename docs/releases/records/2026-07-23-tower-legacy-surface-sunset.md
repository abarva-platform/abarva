# 2026-07-23 Tower Legacy Surface Sunset

## Release ID

`2026-07-23-tower-legacy-surface-sunset`

## Status

`candidate`

## Plain-English Summary

The old Tower page is no longer available as a user-visible product surface. `/tower`
always renders the governed Tower Command Center. `/tower/legacy` is kept only as a
stale-link redirect back to `/tower`, so users cannot open the previous Tower page.

## Layer Impact

- `global-control-lane`: changes the shared Tower route behavior for all tenants.
- `presentation layer`: removes the previous Tower runtime fallback and legacy direct route.
- `client-data-lane`: none; no Tower mart rows or tenant data are changed.

## Client Applicability

- All clients: `/tower` now resolves to the Command Center surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `tower_command_center_v2` becomes platform-on; it no longer controls a fallback to
  the previous Tower surface.

## Changes Included

- `src/app/(maestro)/tower/page.tsx` removes the flag-off `TowerLegacySurface` fallback.
- `src/app/(maestro)/tower/legacy/page.tsx` redirects stale legacy links to `/tower`.
- `src/components/tower/TowerLegacySurface.tsx` is deleted.
- `src/lib/features/registry.ts` updates `tower_command_center_v2` to platform-on and removes
  rollback language that described the old Tower fallback.
- E2E and invariant tests now assert the Command Center is the only runtime Tower surface.

## QA / Validation

- `pass` — focused Tower invariant and feature flag tests.
- `pass` — focused ESLint for changed Tower route/registry/test files.
- `pass` — targeted TypeScript compile.
- `pass` — `git diff --check`.
- `pass` — `npm run release:check`.
- `not-run` — ACA deploy and signed-in proof after merge.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the image.
After deploy, prove the ACA runtime invariant and run signed-in `/tower` and `/tower/legacy`
browser proof for Meridian, Airline Demo, and FS Demo.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the normal deploy workflow.
- Approved image digest: resolved by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required by the deploy invariant.
- Feature/env flag update path: static registry change in this PR.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR through the normal PR/ACA deploy path if the Command Center needs to be rolled back.
The old Tower surface is intentionally not retained as a no-deploy runtime fallback.

## Audit Evidence

- PR URL after opening.
- CI checks after opening.
- Post-deploy ACA invariant.
- Signed-in browser proof that `/tower` renders Command Center and `/tower/legacy` redirects to
  `/tower`.

## Known Gaps

Live deploy and signed-in proof remain pending until this candidate is merged.
