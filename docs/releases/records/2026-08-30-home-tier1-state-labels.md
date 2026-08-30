# 2026-08-30-home-tier1-state-labels — Home Tier 1 State Labels

## Release ID

`2026-08-30-home-tier1-state-labels`

## Status

`candidate`

## Plain-English Summary

Home preview removes the last raw section-state wording from the executive story surface. Section headers and fallback copy now use review-friendly language instead of internal lifecycle labels.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 Products: Home preview visible labels are changed only on the Tier 1 executive story page.

## Client Applicability

- All clients: Home preview visible language.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Section headers render `ready`, `held`, or `deferred` instead of raw internal state labels.
- Opening-readout fallback copy says `reviewed numbered claim` instead of using publication-state vocabulary.

## QA / Validation

- PASS: `npm test -- src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx --runInBand`
- PASS: `npx eslint src/components/home/v4/ExecutiveStoryPage.tsx src/components/home/v4/HomeV4App.tsx src/components/home/v4/__tests__/HomeV4App.tier1.test.tsx`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: required for live rollout.
- Shared runtime mutators: none outside the deploy workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming product proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. This is a copy-only product-surface change with no database migration.

## Audit Evidence

- PR, deploy workflow, live ACA invariant, and signed-in Home proof to be added after merge and deploy.
- Local focused test, ESLint, and release-check commands listed above.

## Known Gaps

- This release does not regenerate Home narrative content. It only removes raw lifecycle wording from the Tier 1 executive story surface.
