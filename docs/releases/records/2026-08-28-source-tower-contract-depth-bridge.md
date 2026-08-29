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

Follow-up hardening fixes the Tower mart writer so JSONB evidence-lineage
columns are serialized before insert. This keeps the governed Tower refresh
from failing when outcome-proof lineage arrays are present.

Follow-up bridge hardening establishes the Source tenant session context before
Tower reads guarded Source consumption views. Source read failures now stop the
operator job with the underlying database error instead of silently projecting
zero Source contract facts.

Follow-up view-shape hardening reads contract display headers from the governed
Source Contract 360 projection and keeps opportunity/performance facts on their
consumption views. This avoids depending on an older consumption contract view
shape that may omit display columns in deployed databases. The bridge aliases
`annual_value` into the Tower contract-fact input shape so deployed Source
projections do not need a duplicate display column.

## Layer Impact

Release lane: `client-data-lane`.

Layer 4 - Products/projections. Source consumption views can contribute
contract-value, spend, performance, and opportunity facts to the Tower mart
projection after the governed Source Layer 4 and Tower mart jobs are run.

Layer 4 - Operator readback. The Source Layer 4 job now reads package contract
IDs using the same parameter shape as the query, avoiding an operator-only
readback failure.

Layer 4 - Tower mart persistence. Evidence-lineage JSON arrays are now encoded
for Postgres JSONB columns during the tracked Tower mart write.

Layer 4 - Source-to-Tower tenant context. The Tower mart projection sets and
clears the Source tenant session selector around guarded Source consumption
reads so the bridge reads the same tenant-scoped views proven by Source Layer 4.

Layer 4 - Source-to-Tower view shape. Contract header facts are read from the
Source Contract 360 projection, while opportunity and performance facts continue
to read from governed consumption projections.

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
- `src/scripts/tower/project-tower-mart-write.ts`
- `src/scripts/tower/__tests__/project-tower-mart-write.test.ts`
- `src/scripts/tower/__tests__/project-tower-mart-source-contracts.test.ts`

## QA / Validation

- PASS: `npx jest scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/cio-tower/mart-projection/__tests__/facts-from-source-contracts.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts src/scripts/tower/__tests__/project-tower-mart-client-resolver.test.ts --runInBand`
- PASS: `npx eslint scripts/source/project-contract-depth-package-layer4.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/cio-tower/mart-projection/facts-from-source-contracts.ts src/lib/cio-tower/mart-projection/__tests__/facts-from-source-contracts.test.ts src/lib/cio-tower/mart-projection/assemble-mart.ts src/scripts/tower/project-tower-mart.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
- PASS: `npx jest src/scripts/tower/__tests__/project-tower-mart-write.test.ts src/lib/cio-tower/mart-projection/__tests__/facts-from-source-contracts.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts --runInBand`
- PASS: `npx eslint src/scripts/tower/project-tower-mart-write.ts src/scripts/tower/__tests__/project-tower-mart-write.test.ts`
- BLOCKED until rerun after this release: Source Layer 4 ACA apply/verify and
  Tower mart write/readback.
- PASS: `npx jest src/scripts/tower/__tests__/project-tower-mart-source-contracts.test.ts src/scripts/tower/__tests__/project-tower-mart-write.test.ts src/lib/cio-tower/mart-projection/__tests__/facts-from-source-contracts.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts --runInBand`
- PASS: `npx eslint src/scripts/tower/project-tower-mart.ts src/scripts/tower/__tests__/project-tower-mart-source-contracts.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
- PARTIAL: Source Layer 4 ACA apply/verify succeeded before this bridge
  hardening. A Tower mart write on the JSONB fix image succeeded but reported
  zero Source contract facts, proving the need for the tenant-context bridge
  hardening before final Tower readback.
- FAIL BEFORE FIX: Tower mart write after tenant-context hardening stopped on a
  deployed Source view-shape mismatch (`vendor_name` missing from the older
  consumption contract view), proving the bridge now fails loud instead of
  silently projecting partial Source contract facts.
- FAIL BEFORE FIX: A follow-up Tower mart write reached the Source Contract 360
  projection and stopped on the deployed projection's annual-value column name.
  The bridge now aliases that governed value into the Tower input shape.

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
- Tower mart failed write evidence showing the JSONB serialization error:
  `/tmp/tower-mart-projection-meridian-health-20260829T0221Z/04-logs.txt`.
- Tower mart successful write with zero Source contract facts before
  tenant-context hardening:
  `/tmp/tower-mart-projection-meridian-health-20260829T0245Z/proof/tower-mart-projection-meridian-health/projection-summary.json`.
- Tower mart failed write before view-shape hardening:
  `/tmp/tower-mart-projection-meridian-health-20260829T0306Z/04-logs.txt`.
- Tower mart failed write before annual-value aliasing:
  `/tmp/tower-mart-projection-meridian-health-20260829T0327Z/04-logs.txt`.
- Future evidence after rollout: Source Layer 4 apply/verify summaries, Tower
  mart write proof bundle, and signed-in Tower page proof.

## Known Gaps

Final Tower mart write/readback and signed-in Tower UI proof still need to run
after this release is merged and deployed.
