# 2026-08-03-source-v3-live-proof-hardening — Source V3 Live Proof And Numeric Hardening

## Release ID

`2026-08-03-source-v3-live-proof-hardening`

## Status

`candidate`

## Plain-English Summary

This release adds a read-only live proof command for the Source V3 data foundation and Tower measurement layer, hardens the shared ACA operator wrapper so structured JSON job events are captured even when a job does not emit a tarball proof bundle, and fixes Source portfolio arithmetic when PostgreSQL numeric values arrive in Node as strings.

## Layer Impact

- `internal-admin`: improves proof extraction in the ACA operator wrapper for JSON event logs.
- `client-data-lane`: adds a read-only Source/Tower inspection command for the loaded Source contract/vendor rows and Tower metric/value-claim tables.
- `global-control-lane`: fixes Source portfolio view-model arithmetic so contract values, concentration percentages, and sourcing-opportunity rankings use finite numeric values.

## Client Applicability

- All clients: the operator wrapper extraction improvement applies to all operator jobs that emit JSON event logs; the numeric coercion fix applies wherever the Source portfolio view-model receives PostgreSQL numeric strings.
- Specific clients: none.
- Internal only: the live proof command is an internal operator/audit tool.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ops/submit-aca-operator-job.mjs`: extracts structured JSON events into `05-proof-extraction.json` when tarball proof markers are absent.
- `scripts/source/inspect-skyharbor-v3-live-proof.ts`: read-only Source/Tower live proof command.
- `package.json`: adds `source:skyharbor-v3:live-proof`.
- `src/lib/source/data-model/vendor-contract-portfolio.ts`, `vendor-portfolio-view.ts`, `sourcing-opportunities.ts`: coerce PostgreSQL numeric strings before rollups, shares, sorting, and display.

## QA / Validation

- Pass: `node scripts/ops/submit-aca-operator-job.mjs --self-test`
- Pass: `./node_modules/.bin/eslint scripts/ops/submit-aca-operator-job.mjs scripts/source/inspect-skyharbor-v3-live-proof.ts`
- Pass: `./node_modules/.bin/eslint scripts/ops/submit-aca-operator-job.mjs scripts/source/inspect-skyharbor-v3-live-proof.ts src/lib/source/data-model/vendor-contract-portfolio.ts src/lib/source/data-model/vendor-portfolio-view.ts src/lib/source/data-model/sourcing-opportunities.ts src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts`
- Pass: `./node_modules/.bin/jest src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts src/lib/source/data-model/__tests__/sourcing-opportunities.test.ts src/lib/source/data-model/__tests__/contract-360-view.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' ./node_modules/.bin/tsc --noEmit --pretty false`
- Expected fail-closed: running the live proof command locally without `DATABASE_URL` exits with `Missing DATABASE_URL`.

## Rollout Plan

Merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image, then run the read-only proof command through `npm run ops:aca-job` using the deployed image and the database URL secret.

## Deployment Authority

- Repo-owned deploy workflow: required for the new npm script to exist in the ACA image.
- Shared runtime mutators: none from this release.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: verify after deploy.
- Worker image invariant: the read-only proof job uses the shared ACA operator wrapper and restores the operator to idle.
- Feature/env flag update path: none.
- Live signed-in proof required: still required separately for the affected product pages.

## Rollback Plan

Revert this release record, the proof script, package script, and operator wrapper extraction fallback. No data rollback is required because the command is read-only and the wrapper change only affects local proof files.

## Audit Evidence

- PR URL, CI, ACA deploy run, deployed image digest, operator job summary, `05-proof-extraction.json`, and local proof ZIP will be captured after merge/deploy.

## Known Gaps

Signed-in browser proof must be rerun after deploy to prove the Source portfolio no longer renders `Infinity`, `NaN`, or scientific notation in money/percentage fields.
