# 2026-08-28-home-preview-hydration-stability — Home preview hydration stability

## Release ID

`2026-08-28-home-preview-hydration-stability`

## Status

`candidate`

## Plain-English Summary

Home preview now renders deterministic first-pass text for the ECL preview route. The first client
render no longer depends on browser-only URL state, and the compiled-date line is formatted in UTC
so the server and browser agree on the displayed day.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Home preview route rendering only.
- Data layers: no tenant intake, adapter, canonical object, serving-row, artifact, or chat data is
  changed.

## Client Applicability

- All clients using the Home preview route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing ECL provider routing only.

## Changes Included

- Starts the Home v4 preview on the same default view for server and client hydration.
- Syncs hash-selected Home preview views after mount instead of during the hydration render.
- Formats the Home preview compiled date with an explicit UTC timezone.
- Adds a regression test for deterministic Home preview hydration inputs.

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' --runInBand`.
- Pass: `npx eslint src/components/home/v4/HomeV4App.tsx 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts'`.
- Pass: `npx prettier --check src/components/home/v4/HomeV4App.tsx 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' docs/releases/records/2026-08-28-home-preview-hydration-stability.md`.
- Pass: `node scripts/ecl/run_product_ecl_predeploy_gate.mjs`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge by PR. The route rendering change becomes active through the repo-owned Azure Container Apps
main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required after deployment before making live-product claims.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Home preview ECL route after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data
rollback is required because this release does not write tenant data.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI run: to be added after PR creation.
- ACA revision and digest: to be captured after merge/deploy.
- Signed-in browser proof: to be captured after deployment.

## Known Gaps

This release does not change Home preview information design or underlying ECL serving rows.
