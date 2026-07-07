# 2026-07-07-home-context-browser-polish — Remove Duplicate Home Quality Donut

## Release ID

`2026-07-07-home-context-browser-polish`

## Status

`candidate`

## Plain-English Summary

Home Context Browser keeps the Sources and Relationships tabs, but no longer shows the same context-quality donut twice. The header now focuses on enterprise totals, while the right rail owns the selected-context quality visual.

## Layer Impact

- `global-control-lane`: Home UI rendering polish for the shared Context Browser surface. No data-plane, auth, tenant-resolution, or answer-generation behavior changes.

## Client Applicability

- All clients: yes, for the shared `/home` Context Browser.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeSurface.tsx`: removes the duplicate top-header quality donut and keeps the right-rail context quality chart.
- `src/components/home/__tests__/HomeSurface.test.tsx`: preserves Sources and Relationships tab assertions and adds a one-ring regression assertion.

## QA / Validation

- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`.
- Pass: `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand` — 8 tests passed; existing duplicate manual mock warnings are unrelated repo baseline noise.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow will build and deploy the updated shared web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the main deploy workflow after merge.
- ACA runtime invariant: required after merge/deploy before claiming live.
- Worker image invariant: managed by the main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for `/home` visual confirmation.

## Rollback Plan

Revert the PR or redeploy the previous good `main` SHA through the approved ACA main deploy workflow.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4527
- Focused local validation: to be added before merge.
- Live screenshot: to be captured after deploy.

## Known Gaps

This does not yet add the future Impact/Recharts tab or run the full Home answer-quality audit against loaded V7 data.
