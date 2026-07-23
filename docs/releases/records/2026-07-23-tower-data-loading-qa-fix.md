# 2026-07-23 Tower Data Loading QA Fix

## Release ID

`2026-07-23-tower-data-loading-qa-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the Tower mart projection path that left Airline Demo and FS Demo with
`$0` FY26 IT budget and `$0` AI-tagged spend even though their Tower value
programs were loaded. The projection now supports the universal rich V3
`08_spend_value` shape as a supplemental budget-envelope source and maps SA08
funded AI program spend into `program_ai_tagged_spend_usd`.

## Layer Impact

- `client-data-lane`: changes the Tower source-to-fact projection and the
  governed Tower mart operator job inputs for demo tenants.
- `qa-validation-lane`: adds a data-loading QA gate that fails when Tower value
  economics exist but budget or AI-tagged spend is still zero.

No schema migration, UI route change, active tenant promotion, or direct local DB
mutation is included in this PR.

## Client Applicability

- All clients: no direct runtime UI change.
- Specific clients: Meridian / Healthcare Demo, Airline Demo / `skyharbor-air`,
  and FS Demo / `first-capital-financial` are covered by the new dry-run QA
  matrix and mart job scripts.
- Internal only: the projection CLI, operator job scripts, and audit gate.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/mart-projection/facts-from-v3.ts`: reads universal rich
  `08_spend_value` rows into the budget envelope and maps SA08 funded spend to
  program AI-tagged spend.
- `src/scripts/tower/project-tower-mart.ts`: adds an explicit
  `--supplemental-dir` option and uses it only for budget/spend source files.
- `package.json`: adds a Meridian dry-run script, wires Airline/FS write jobs to
  the approved supplemental rich budget source, and adds
  `audit:tower-mart-data-loading-qa`.
- `scripts/tower/audit-tower-mart-data-loading-qa.mjs`: validates critical
  Tower mart data-loading invariants across the three pilot/demo tenants.
- `src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts`: adds
  regression coverage for universal budget rows and SA08 AI-tagged spend.

## QA / Validation

- PASS:
  `npx jest src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts --runInBand`
- PASS: `npm run project:tower-mart:meridian:dry-run`
- PASS: `npm run project:tower-mart:airline-demo:dry-run`
- PASS: `npm run project:tower-mart:fs-demo:dry-run`
- PASS: `npm run audit:tower-mart-data-loading-qa`
- PASS:
  `npx eslint src/lib/cio-tower/mart-projection/facts-from-v3.ts src/scripts/tower/project-tower-mart.ts src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`

Dry-run QA results:

| Tenant | FY26 IT budget | Run | Change | AI-tagged | Approved AI program budget | Promised value | Finance validated | Realized |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| meridian-health | 650000000 | 487500000 | 162500000 | 53700000 | 291900000 | 35500000 | 3800000 | 0 |
| skyharbor-air | 2599999976 | 1813157878 | 786842098 | 45100000 | 45100000 | 80200000 | 5650000 | 0 |
| first-capital-financial | 1150000004 | 801973687 | 348026317 | 37800000 | 37800000 | 50800000 | 1750000 | 0 |

## Rollout Plan

Merge to `main`, allow the ACA main deploy workflow to build and deploy the
digest-pinned image, verify the ACA runtime invariant, then rerun the governed
ACA operator write jobs for Meridian, Airline Demo, and FS Demo. Signed-in Tower
browser proof is required after the data jobs complete.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR; post-merge deployment must use the
  repo-owned ACA main workflow.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: required before governed operator write jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after operator write jobs refresh the mart.

## Rollback Plan

Revert this PR and rerun the previous governed Tower mart write job image if the
projection produces unexpected totals. The write path remains transactional and
tracked by `ai_control_refresh_runs`.

## Audit Evidence

- Local dry-run projection summaries:
  `reports/tower-mart-projection-meridian-health/projection-summary.json`,
  `reports/tower-mart-projection-skyharbor-air/projection-summary.json`,
  and
  `reports/tower-mart-projection-first-capital-financial/projection-summary.json`.
- Data-loading QA report:
  `reports/tower-mart-data-loading-qa/summary.json` and
  `reports/tower-mart-data-loading-qa/summary.md`.
- PR URL, ACA deploy run, ACA runtime invariant, operator write-job proof
  bundles, and signed-in screenshots will be added after merge/deploy.

## Known Gaps

This PR proves code and local dry-run projection. It does not itself mutate
Azure/Postgres. Live product truth requires post-merge ACA deploy, governed ACA
mart write jobs, and signed-in browser proof.
