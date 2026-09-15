# 2026-09-15-home-executive-brief-served-findings — Home Briefing Served Readout

## Release ID

`2026-09-15-home-executive-brief-served-findings`

## Status

`candidate`

## Plain-English Summary

Home's briefing chapters now open from a deterministic executive orientation when authored chapter claims have not been published yet. Executive Brief and Our Business no longer promote a specialist row-level finding into the chapter thesis, and they no longer show the empty "not answered" readout while the served record carries governed evidence families.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: Home presentation now uses existing read-only record counts and governed briefing packet state as the briefing-chapter fallback. It does not create, mutate, or reinterpret Layer 3 records.

## Client Applicability

- All clients: Home tenants served through the governed Home record path receive the rendering fix.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/v4/HomeV4App.tsx`: builds one governed business briefing packet per render and supplies Executive Brief / Our Business fallback openings only when the chapter text is a generator deferral.
- `src/components/home/v4/ChapterPage.tsx`: adds a briefing-opening readout that replaces the generic empty-state bands on those fallback chapters.
- `src/components/home/v4/chapter-page-content.ts`: removes the broad Executive Brief extra-finding source so a specialist finding cannot become the briefing hero.
- `src/components/home/v4/__tests__/served-record-surface.test.tsx`: fixes the served-path fixture row type and asserts Executive Brief and Our Business do not open as empty or row-level finding chapters.
- `src/components/home/v4/__tests__/every-surface.test.tsx`: adds a deferral-state guard proving briefing chapters use the briefing opening rather than the findings block.

## QA / Validation

- `NODE_PATH=/Users/anand/Projects/nexus/node_modules ./node_modules/.bin/jest src/components/home/v4/__tests__/served-record-surface.test.tsx src/components/home/v4/__tests__/every-surface.test.tsx src/components/home/v4/__tests__/HomeV4App.depth.test.tsx --runInBand` — passed, 86 tests.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules ./node_modules/.bin/jest src/components/home/v4/__tests__ src/components/home/preview/__tests__ src/app/'(maestro)'/home/__tests__ --runInBand` — passed, 369 tests.
- `npx tsc --noEmit --pretty false` — passed.
- `npx eslint src/components/home/v4/HomeV4App.tsx src/components/home/v4/ChapterPage.tsx src/components/home/v4/chapter-page-content.ts src/components/home/v4/__tests__/served-record-surface.test.tsx src/components/home/v4/__tests__/every-surface.test.tsx` — passed.
- Mutation check: disconnecting the briefing-opening prop made the served-path regression fail on the old "not yet answered" Executive Brief and Our Business headlines, then restoring the prop made the suite pass.

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
