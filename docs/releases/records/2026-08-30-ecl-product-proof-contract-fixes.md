# 2026-08-30-ecl-product-proof-contract-fixes — ECL Product Proof Contract Fixes

## Release ID

`2026-08-30-ecl-product-proof-contract-fixes`

## Status

`candidate`

## Plain-English Summary

Repairs the local ECL product pre-deploy proof contract so it checks the active Source workspace route, keeps Home provider detection aligned with the current route signature, and shows Source serving-surface coverage when the workspace is backed by the ECL projection database.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — product proof and presentation guardrails only. This change does not mutate intake data, ECL schema, serving views, projections, Azure data, or runtime configuration.

## Client Applicability

- All clients: yes, for product surfaces using the ECL product provider.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing ECL product provider selection.

## Changes Included

- `scripts/ecl/run_product_ecl_predeploy_gate.mjs` now validates the active Source workspace route instead of the historical preview redirect.
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx` renders Source serving-surface coverage when the active provider is `ecl_projection_db`.

## QA / Validation

- Pass — `npm run ecl:product-browser:predeploy-gate`
- Pass — `npx jest --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts src/lib/ecl/__tests__/product-provider.test.ts --runInBand`
- Pass — `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`
- Pass — `git diff --check`
- Pass — `npm run release:check -- --base origin/main --head HEAD`
- Not run — live signed-in browser proof; requires repo-owned deploy workflow completion.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow will publish the product proof and Source presentation adjustment.

## Deployment Authority

- Repo-owned deploy workflow: required for live rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by deploy workflow.
- ACA runtime invariant: required before claiming live proof.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming live product proof.

## Rollback Plan

Revert the commit or redeploy the previous approved ACA image. No database rollback is required.

## Audit Evidence

Inspect the PR diff, local predeploy gate output, Source provider tests, TypeScript validation, release check output, and post-deploy live proof workflow.

## Known Gaps

This change does not redesign Home narrative quality or alter the ECL data model.
