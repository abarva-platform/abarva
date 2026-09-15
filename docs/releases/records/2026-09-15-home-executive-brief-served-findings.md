# 2026-09-15-home-executive-brief-served-findings — Home Executive Brief Served Findings

## Release ID

`2026-09-15-home-executive-brief-served-findings`

## Status

`candidate`

## Plain-English Summary

Home's default Executive Brief now opens from deterministic findings already computed from the served record when authored chapter claims have not been published yet. A reader no longer sees an empty "not answered" page while the same served record carries application, data, contract, platform, metric, risk, program, AI, organization, or interview rows.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: Home presentation now uses existing read-only findings as the Executive Brief fallback. It does not create, mutate, or reinterpret Layer 3 records.

## Client Applicability

- All clients: Home tenants served through the governed Home record path receive the rendering fix.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/v4/chapter-page-content.ts`: lets the Executive Brief draw deterministic findings from served estate families without duplicating the specialist chapters' detailed tables.
- `src/components/home/v4/__tests__/served-record-surface.test.tsx`: fixes the served-path fixture row type and adds a regression test for authored-claim-absent Executive Brief rendering.

## QA / Validation

- `NODE_PATH=/Users/anand/Projects/nexus/node_modules ./node_modules/.bin/jest --runTestsByPath src/components/home/v4/__tests__/served-record-surface.test.tsx src/components/home/v4/__tests__/chapter-ownership.test.ts src/components/home/v4/__tests__/page-tables.test.ts --runInBand` — passed, 63 tests.
- Mutation check: removing the Executive Brief deterministic-source bridge made the served-path regression test fail on the old empty headline, then restoring the bridge made the focused suite pass.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for `/home?tenant=<tenant>#executive_brief` after deployment.

## Rollback Plan

Revert the merge commit and allow the repo-owned Azure Container Apps main deploy workflow to redeploy the prior Home rendering behavior.

## Audit Evidence

- PR and CI run for this release candidate.
- Post-merge ACA deploy workflow summary and runtime invariant proof.
- Signed-in Home route proof when an authenticated proof path is available.

## Known Gaps

Signed-in browser proof depends on an authenticated session or browser-proof path. The prior local proof attempt was blocked before app route load by the authentication provider.
