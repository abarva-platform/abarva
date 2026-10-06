# 2026-09-17 Source opportunity state readback

## Release ID

`2026-09-17-source-opportunity-state-readback`

## Status

`candidate`

## Plain-English Summary

The governed contract optimization readback now reports the recorded lifecycle state of each scoped opportunity. Operators can distinguish a loader rewrite refusal caused by existing opportunity state from approvals or finance realization without changing tenant data.

## Layer Impact

- Release lane: `client-data-lane`.
- Layers 1-4: No schema, input, canonical row, cube, or product-surface change.
- Operator readback: An existing read-only job includes opportunity stage, approval state, amount state, and finance confirmation state for exact tenant, dataset, and contract IDs.

## Client Applicability

All tenants using the governed contract optimization readback. No tenant exception or public/demo route change.

## Changes Included

- Add an exact-scope opportunity-state query to the existing operator readback.
- Run the readback queries inside a read-only transaction.

## QA / Validation

- TypeScript: PASS.
- Scoped ESLint: PASS.
- Release gate: pending rerun after this record update.
- ACA job readback and idle restoration: NOT RUN until merged digest is deployed.

## Rollout Plan

Merge through PR and deploy through the repo-owned ACA main workflow. Verify the web and worker digest invariant. Run the named read-only operator job with explicit tenant and dataset scope. No data load is authorized by this readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest and ACA runtime invariant: Captured from the deployment artifact after merge.
- Live signed-in proof required: No product behavior changes in this release.

## Rollback Plan

Revert by PR and redeploy the prior approved digest. The readback writes no tenant rows.

## Audit Evidence

PR checks, runtime-invariant artifact, and scoped ACA readback job logs with idle restoration proof.

## Known Gaps

Recorded state alone does not establish who advanced it or justify overwriting it. The separate rewrite guard stays fail-closed; any correction requires a reviewed, non-destructive plan.
