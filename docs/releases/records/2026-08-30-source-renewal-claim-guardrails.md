# 2026-08-30-source-renewal-claim-guardrails — Source Renewal Claim Guardrails

## Release ID

`2026-08-30-source-renewal-claim-guardrails`

## Status

`candidate`

## Plain-English Summary

Separates expired/stale contract dates from live commercial renewal exposure in the Source workspace cockpit. The action queue now excludes already-expired contracts, and the proof rail reports lapsed auto-renew exposure, still-cancellable value, and stale-date exclusions as separate facts.

## Layer Impact

Layer 4 Products / `global-control-lane`: Source product derivation and UI proof wording.

Layers 1-3: No change. No intake files, adapters, canonical tables, loaders, or tenant rows are changed.

## Client Applicability

- All clients: Source users benefit from stricter renewal/exposure claim wording.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `expiredAsOfDate` and `expiredAsOfDateAnnualValue` to deterministic renewal exposure output.
- Excludes expired rows from Source cockpit action queue deadlines.
- Updates the Source cockpit proof rail to separate lapsed auto-renew exposure, still-cancellable value, and stale-date exclusions.
- Adds regression tests for stale-date exclusion and cockpit proof wording.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/data-model/vendor-contract-portfolio.ts src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS: `npm run release:check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run build` confirmed `/source/360` remains registered as a dynamic app route.

## Rollout Plan

Open a PR, squash merge to main, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact main SHA.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Source workspace renewal proof text.

## Rollback Plan

Revert the renewal exposure/action queue changes and redeploy through the same ACA main workflow. No data rollback is required because this release does not mutate data.

## Audit Evidence

PR, CI/deploy run, ACA runtime invariant, and signed-in browser proof for the Source workspace.

## Known Gaps

This release does not rewrite any upstream dataset values, add utilization-entitlement rows, or finance-confirm opportunity amounts. It only prevents expired rows and unsupported labels from becoming executive deadline claims.
