# 2026-08-30-home-ecl-deferred-narrative — Home ECL Missing-Claims Terminal State

## Release ID

`2026-08-30-home-ecl-deferred-narrative`

## Status

`candidate`

## Plain-English Summary

Home ECL preview no longer throws a production error when the governed projection rows are present but verified chapter-claim rows have not been published yet. Instead, Home renders an explicit deferred narrative state and avoids synthesizing executive claims from counts alone.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: updates the Home preview read path for missing ECL narrative claim rows. No product-owned data is introduced.

## Client Applicability

- All clients: yes, for Home preview tenants served from ECL projection rows.
- Specific clients: none named.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home ECL serving path.

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts`: replaces the missing `chapter_claim` throw path with a deferred terminal state.
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`: proves missing chapter claims do not create synthesized claims and do not throw.

## QA / Validation

- `npx jest src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts --runInBand` — passed.
- `npx jest src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand` — passed.
- `npx eslint src/lib/home/preview/ecl-projection-bundle.ts src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx` — passed.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: assigned by the repo-owned workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Home preview must render without the generic error boundary.

## Rollback Plan

Revert the PR and redeploy the prior known-good image through the repo-owned ACA workflow.

## Audit Evidence

- PR URL: to be added.
- ACA deploy workflow: to be added after merge.
- Runtime proof: to be added after deploy.

## Known Gaps

This does not publish or improve the chapter narrative itself. It only prevents a missing governed narrative layer from crashing Home.
