# 2026-08-30-home-architecture-wheel-denominators — Home Architecture Wheel Denominator Cleanup

## Release ID

`2026-08-30-home-architecture-wheel-denominators`

## Status

`candidate`

## Plain-English Summary

The Home architecture wheel now presents the conceptual architecture basis as business blocks, applications, platforms, and data movements rather than summing overlapping slices into a misleading record total. System anchor labels are also cleaned for display so generated numeric suffixes do not read as separate architecture concepts.

## Layer Impact

Release lane: global-control-lane.

Products layer: Updates the Home preview architecture presentation only. The source, ECL, serving views, and loaded tenant data are unchanged.

## Client Applicability

- All clients: Yes, for the Home preview architecture component when rendered.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider behavior is unchanged.

## Changes Included

- `src/components/home/v4/ArchitecturePage.tsx`
- `src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx`

## QA / Validation

- `npx jest src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand` passed.
- `npx eslint src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx` passed.

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Determined by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home preview architecture route after deploy.

## Rollback Plan

Revert the PR and redeploy the previous known-good digest through the repo-owned ACA workflow.

## Audit Evidence

- Focused Jest output.
- ESLint output.
- PR and deploy workflow evidence after merge.
- Signed-in Home preview screenshot after deploy.

## Known Gaps

This change does not solve the larger Home narrative quality issue or generate published chapter claims. It only fixes the wheel denominator and display-anchor quality issue found during live Home review.
