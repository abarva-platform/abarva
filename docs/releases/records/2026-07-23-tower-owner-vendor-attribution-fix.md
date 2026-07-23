# 2026-07-23-tower-owner-vendor-attribution-fix — Tower Owner and Vendor Attribution Fix

## Release ID

`2026-07-23-tower-owner-vendor-attribution-fix`

## Status

`candidate`

## Plain-English Summary

Tower already had owner, vendor, and tool evidence in the SA08 benefits ledger, but the projection kept that detail hidden inside fact attributes. The executive dashboard therefore rendered named programs with weak ownership and vendor context, including "No owner recorded" even when the source file named the evidence owner. This change carries that governed source attribution into the Tower mart rows so the Command Center can show named owners and vendor concentration after the governed mart refresh job runs.

## Layer Impact

- `client-data-lane`: updates the Tower V3/SA08 source-to-fact mapper and mart assembler. No schema change is introduced.
- `runtime-read-model`: affects values read from `cio_tower.mart_program_decision_lanes` and `cio_tower.mart_ai_portfolio` after the operator job refreshes the mart.
- `qa-validation-lane`: adds regression tests proving owner/vendor attribution survives the fact-to-mart pivot.

## Client Applicability

- All clients: no.
- Specific clients: Meridian / Healthcare Demo, SkyHarbor Air / Airline Demo, and First Capital / FS Demo after their Tower mart jobs are rerun.
- Internal only: no.
- Public/demo only: applies to the governed demo tenants listed above.
- Feature flag: none. Tower visibility still follows the existing Tower routing/feature configuration.

## Changes Included

- `src/lib/cio-tower/mart-projection/facts-from-v3.ts`: consistently stamps SA08 facts with `evidence_owner`, `evidence_source_system`, `owner_attestation_status`, `vendor_name`, and `tool_name`.
- `src/lib/cio-tower/mart-projection/assemble-mart.ts`: promotes source-backed owner/vendor/tool attribution into decision-lane and AI-portfolio mart rows.
- `src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts`: covers SA08 attribution fields on funded AI spend facts.
- `src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts`: covers owner/vendor attribution in assembled mart rows.

## QA / Validation

- PASS: `npx jest src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts --runInBand`
- PASS: `npx eslint src/lib/cio-tower/mart-projection/facts-from-v3.ts src/lib/cio-tower/mart-projection/assemble-mart.ts src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts`
- PASS: `npm run project:tower-mart:meridian:dry-run`
- PASS: `npm run project:tower-mart:airline-demo:dry-run`
- PASS: `npm run project:tower-mart:fs-demo:dry-run`
- PASS: `npm run audit:tower-mart-data-loading-qa`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`

Dry-run mart inspection after the fix:

- Meridian: 12 of 12 decision lanes carry owner attribution; vendor-attributed AI spend is populated.
- Airline Demo: 6 of 6 decision lanes carry owner attribution; vendor-attributed AI spend is populated.
- FS Demo: 7 of 7 decision lanes carry owner attribution; vendor-attributed AI spend is populated.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow builds and shifts the digest-pinned web/worker image. Then rerun the governed Tower mart operator jobs for the affected tenants with the deployed digest:

- `project:tower-mart:meridian:write-job`
- `project:tower-mart:airline-demo:write-job`
- `project:tower-mart:fs-demo:write-job`

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned ACA main deploy and governed ACA operator jobs.
- Approved image digest: to be recorded after ACA main deploy.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: required after deploy before running operator jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after the mart jobs run.

## Rollback Plan

Revert this PR and redeploy through ACA main. Rerun the same governed Tower mart jobs to restore the previous projection shape. No schema rollback is required.

## Audit Evidence

- PR URL and CI checks for this release candidate.
- ACA main deploy run and runtime-invariant proof after merge.
- ACA operator job proof bundles for Meridian, Airline Demo, and FS Demo.
- Signed-in browser proof that Tower displays nonzero budgets/spend plus named owners/vendor attribution where source-backed.

## Known Gaps

Operator wrapper reliability is separate: the wrapper currently reports a nonzero exit when another unrelated execution is running on the shared operator job, even when the execution it started succeeded and emitted a proof bundle. That should be fixed in an operator-lane PR without stopping or altering unrelated executions.
