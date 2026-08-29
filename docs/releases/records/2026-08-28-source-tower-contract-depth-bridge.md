# 2026-08-28-source-tower-contract-depth-bridge - Source/Tower Contract Depth Bridge

## Release ID

`2026-08-28-source-tower-contract-depth-bridge`

## Status

`candidate`

## Plain-English Summary

Adds a governed bridge from Source contract-depth consumption rows into the
Tower facts substrate. Contract optimization opportunities can now appear in
Tower as evidence-bound action lanes that hand back to Source for review, while
finance-confirmation gaps remain explicit and no realized value is invented.

Also fixes a Source Layer 4 operator readback query that passed an unused SQL
parameter and caused Postgres to reject the apply run before readback could
finish.

## Layer Impact

Release lane: `client-data-lane`.

Layer 4 - Products/projections. Source consumption views can contribute
contract-value, spend, performance, and opportunity facts to the Tower mart
projection after the governed Source Layer 4 and Tower mart jobs are run.

Layer 4 - Operator readback. The Source Layer 4 job now reads package contract
IDs using the same parameter shape as the query, avoiding an operator-only
readback failure.

## Client Applicability

- All clients: The projection code path is available but has no effect until a
  governed tenant-scoped operator job is run.
- Specific clients: Applies to the active governed healthcare demo tenant when
  Source Layer 4 and Tower mart jobs are refreshed for that tenant.
- Internal only: Operator scripts and release evidence are internal.
- Public/demo only: The loaded package remains synthetic demo evidence, not
  live-client truth.
- Feature flag: None.

## Changes Included

- `scripts/source/project-contract-depth-package-layer4.ts`
- `scripts/source/__tests__/project-contract-depth-package-layer4.test.ts`
- `src/lib/cio-tower/mart-projection/facts-from-source-contracts.ts`
- `src/lib/cio-tower/mart-projection/__tests__/facts-from-source-contracts.test.ts`
- `src/lib/cio-tower/mart-projection/assemble-mart.ts`
- `src/scripts/tower/project-tower-mart.ts`

## QA / Validation

- PASS: `npx jest scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/cio-tower/mart-projection/__tests__/facts-from-source-contracts.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts src/scripts/tower/__tests__/project-tower-mart-client-resolver.test.ts --runInBand`
- PASS: `npx eslint scripts/source/project-contract-depth-package-layer4.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/cio-tower/mart-projection/facts-from-source-contracts.ts src/lib/cio-tower/mart-projection/__tests__/facts-from-source-contracts.test.ts src/lib/cio-tower/mart-projection/assemble-mart.ts src/scripts/tower/project-tower-mart.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
- BLOCKED until rerun after this release: Source Layer 4 ACA apply/verify and
  Tower mart write/readback.

## Rollout Plan

Merge through PR-only governance, deploy through the repo-owned Azure Container
Apps main workflow, then rerun the governed Source Layer 4 apply/verify job.
After Source Layer 4 passes, run the governed Tower mart write job for the same
tenant and capture readback proof from `cio_tower.mart_*`.

## Deployment Authority

- Repo-owned deploy workflow: Required before rerunning the operator jobs.
- Shared runtime mutators: No direct shared web runtime mutation outside the
  repo-owned workflow.
- Approved image digest: Captured after the main ACA deploy succeeds.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before each operator job.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after Source and Tower jobs both pass.

## Rollback Plan

Revert this release and redeploy. If the Tower mart job has already run with
the bridge, rerun the previous approved Tower mart projection job for the tenant
to restore the prior mart contents.

## Audit Evidence

- Local focused Jest, ESLint, TypeScript, and release-control output.
- Source Layer 4 failed apply evidence showing the readback parameter error:
  `/tmp/source-contract-depth-package-layer4-apply-20260829T0134Z/04-logs.txt`.
- Future evidence after rollout: Source Layer 4 apply/verify summaries, Tower
  mart write proof bundle, and signed-in Tower page proof.

## Known Gaps

Source Layer 4 apply/verify, Tower mart write/readback, and signed-in Tower UI
proof still need to run after this release is merged and deployed.
