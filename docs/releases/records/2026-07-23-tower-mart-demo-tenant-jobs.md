# 2026-07-23-tower-mart-demo-tenant-jobs — Shared Tower Mart Jobs for Demo Tenants

## Release ID

`2026-07-23-tower-mart-demo-tenant-jobs`

## Status

`candidate`

## Plain-English Summary

Tower Command Center must be one executive dashboard contract for every tenant:
the same `cio_tower.mart_*` tables, the same runtime reader, and tenant-specific
rows populated by a governed projection job. This release removes the
Meridian-only operational packaging gap by adding self-contained Tower mart job
scripts for Airline Demo and FS Demo, while keeping the shared mart schema and
Command Center UI unchanged.

The V3-to-facts mapper now reads the standard SA08 benefits ledger fields used
by the rich synthetic tenant packs: funded spend, promised value, active usage,
adoption rate, and finance validation. Those fields project into the same
unified facts vocabulary that the existing mart assembler already consumes.

## Layer Impact

- `internal-admin`: adds governed operator scripts for the reusable Tower mart
  projection path. These scripts are intended for ACA operator-job execution,
  not browser request mutation.
- `client-data-lane`: maps standard V3/SA08 tenant inputs into the shared
  `cio_tower.facts` layer and then the existing seven `cio_tower.mart_*` tables.
- `global-control-lane`: no dashboard layout fork, no new route, no schema
  change, and no feature-flag widening.

## Client Applicability

- All clients: the projection code remains shared and reusable.
- Specific clients: adds packaged dry-run/write jobs for `skyharbor-air`
  (Airline Demo) and `first-capital-financial` (FS Demo).
- Internal only: operator scripts and release proof.
- Public/demo only: no public route change.
- Feature flag: no change to `tower_command_center_v2`.

## Changes Included

- `src/lib/cio-tower/mart-projection/facts-from-v3.ts`
  - SA08 `funded_spend_usd` now projects to `program_approved_funding_usd`.
  - SA08 `usage_actual` now projects to `ai_tool_active_users`.
  - SA08 `adoption_rate_pct` / `usage_rate_pct` now projects to
    `ai_tool_seat_utilization`.
- `src/scripts/tower/project-tower-mart.ts`
  - resolves runtime canonical tenant keys before writing mart rows.
  - resolves client tracking IDs through app/data aliases such as
    `arcturus`, `first-capital`, and `first-capital-financial`.
- `package.json`
  - adds `project:tower-mart:airline-demo:dry-run`
  - adds `project:tower-mart:airline-demo:write-job`
  - adds `project:tower-mart:fs-demo:dry-run`
  - adds `project:tower-mart:fs-demo:write-job`
- `src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts`
  - pins the standard SA08 mapping contract.
- `reports/tower-mart-pilot-data-model/`
  - adds a pilot-facing HTML and summary view of the final shared Tower data
    model, layers, tables, facts, marts, volumetrics, and rollout flow.

## QA / Validation

- PASS: `jest src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts --runInBand`
  - 23 tests passed.
- PASS: Airline Demo local no-DB dry run:
  - `tenant_key`: `skyharbor-air`
  - V3 facts: 241
  - mart rows: 1 command center, 5 value funnel, 6 program decision lanes,
    219 AI portfolio, 3 CXO actions, 225 evidence lineage, 3 gaps.
  - command values: $45.1M approved program budget, $80.2M promised value,
    $5.65M partial finance-validated value, 213 candidate AI opportunities.
- PASS: FS Demo local no-DB dry run:
  - `tenant_key`: `first-capital-financial`
  - V3 facts: 255
  - mart rows: 1 command center, 5 value funnel, 7 program decision lanes,
    232 AI portfolio, 4 CXO actions, 239 evidence lineage, 6 gaps.
  - command values: $37.8M approved program budget, $50.8M promised value,
    $1.75M partial finance-validated value, 225 candidate AI opportunities.
- PASS: focused ESLint:
  - `src/lib/cio-tower/mart-projection/facts-from-v3.ts`
  - `src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts`
  - `src/scripts/tower/project-tower-mart.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- PASS: `NODE_OPTIONS=--max-old-space-size=6144 tsc -p tsconfig.json --noEmit`

## Rollout Plan

Merge through PR, then deploy through the repo-owned ACA main workflow so the
operator job image contains these scripts. After the digest-pinned image is
live, run the governed ACA operator job separately for:

1. `project:tower-mart:airline-demo:write-job`
2. `project:tower-mart:fs-demo:write-job`

After each job, verify `cio_tower.mart_*` counts by tenant and run signed-in
`/tower` proof for that tenant. Do not claim rich Tower runtime proof from the
job command alone.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by ACA main deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: no flag change.
- Live signed-in proof required: yes, after each tenant mart write job.

## Rollback Plan

Code rollback is a standard PR revert and ACA main redeploy. If a tenant mart
write produces bad rows, rerun the prior approved projection job or perform a
governed data-build rollback for that tenant's `cio_tower.facts` and
`cio_tower.mart_*` rows. The Command Center remains safe: a tenant with no mart
rows renders an honest empty state rather than fabricated numbers.

## Audit Evidence

- PR URL after publication.
- Local dry-run proof bundles under `reports/tower-mart-projection-*`.
- Pilot data-model view under `reports/tower-mart-pilot-data-model/`.
- ACA operator-job proof bundles after write execution.
- Live readback counts for `cio_tower.mart_*` by tenant.
- Signed-in `/tower` screenshots for Airline Demo and FS Demo after write.

## Known Gaps

- This release does not execute the ACA data-build jobs.
- This release does not mutate Azure/Postgres.
- This release does not claim Airline Demo or FS Demo rich Tower runtime proof
  until their mart rows are written and browser-proven.
