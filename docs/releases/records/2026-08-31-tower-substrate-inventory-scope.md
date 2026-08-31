# 2026-08-31-tower-substrate-inventory-scope — Tower Substrate Inventory Scope

## Release ID

`2026-08-31-tower-substrate-inventory-scope`

## Status

`candidate`

## Plain-English Summary

The substrate inventory, diff probe, and baseline emitter now include the legacy `tower` schema in
their default schema scope. The existing ECL baseline tooling covered the current projection path,
but it did not cover the older Tower schema that still has prior drift evidence. This keeps future
schema captures from proving only the newer path while leaving the older Tower substrate out of
view.

## Layer Impact

Release lane: `internal-admin`.

Layer 3 CANONICAL MODEL and Layer 4 PRODUCTS governance tooling only. This is read-only operator
coverage; it does not change product rendering, tenant rows, serving views, policies, migrations,
or runtime data access.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: yes, operator schema-inventory tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/ops/probe-ecl-substrate-inventory.mjs`
- `scripts/ops/probe-ecl-substrate-diff.mjs`
- `scripts/ops/emit-ecl-substrate-baseline.mjs`
- `scripts/ops/__tests__/run-ecl-substrate-baseline-emitter-tests.mjs`

## QA / Validation

Status: PASS.

- PASS — `node scripts/ops/emit-ecl-substrate-baseline.mjs --self-test`
- PASS — `node scripts/ops/__tests__/run-ecl-substrate-baseline-emitter-tests.mjs`
- PASS — `node --check scripts/ops/probe-ecl-substrate-inventory.mjs && node --check scripts/ops/probe-ecl-substrate-diff.mjs && node --check scripts/ops/emit-ecl-substrate-baseline.mjs`
- PASS — `npx eslint scripts/ops/probe-ecl-substrate-inventory.mjs scripts/ops/probe-ecl-substrate-diff.mjs scripts/ops/emit-ecl-substrate-baseline.mjs scripts/ops/__tests__/run-ecl-substrate-baseline-emitter-tests.mjs`

## Rollout Plan

Merge through the protected PR path. The standard repo-owned Azure Container Apps main deploy
workflow will publish the widened read-only operator tooling in the next image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before using the image for operator work.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: No; this is read-only operator tooling.

## Rollback Plan

Revert the PR. No migration or data rollback is required.

## Audit Evidence

The PR diff and validation output should show the default schema list widened consistently across
the inventory probe, diff probe, and baseline emitter.

## Known Gaps

This does not regenerate or apply a new baseline migration. It only widens the default scope for the
next inventory or baseline-emitter run.
