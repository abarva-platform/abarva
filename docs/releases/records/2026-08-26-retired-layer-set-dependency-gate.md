# 2026-08-26-retired-layer-set-dependency-gate — Retired Layer Dependency Gate Uses Full Set

## Release ID

`2026-08-26-retired-layer-set-dependency-gate`

## Status

`candidate`

## Plain-English Summary

The retired-layer purge dry run now evaluates dependencies against the complete set of schemas being considered together. A dependency from one retiring schema to another retiring schema no longer appears as an outside blocker. The operator also supports compact structured output for broad dry runs, so dependency and row-count proof remains readable in ACA logs.

## Layer Impact

Data-plane operations: hardens the dry-run and apply gate for retired schema inventory. It does not change product runtime reads or application behavior.

## Client Applicability

- All clients: No direct product behavior change.
- Specific clients: None.
- Internal only: Applies to governed database retirement operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ops/purge-retired-data-layers.mjs`: dependency detection now treats the requested schemas as one retirement set.
- `scripts/ops/purge-retired-data-layers.mjs`: adds compact stdout support with a structured summary event, including per-schema table, view, routine, and row-count summaries.
- `scripts/ops/purge-retired-data-layers.mjs`: adds a self-test for the set-scoped dependency query.

## QA / Validation

- PASS: `node scripts/ops/purge-retired-data-layers.mjs --self-test`
- PASS: `node scripts/ops/purge-retired-data-layers.mjs --validate-only`
- PASS: `npx eslint scripts/ops/purge-retired-data-layers.mjs`

## Rollout Plan

Merge through a pull request. The repo-owned ACA deploy workflow will build and deploy the updated operator image. Broad retirement inventory should be rerun in dry-run mode before any apply action.

## Deployment Authority

- Repo-owned deploy workflow: Required for the updated operator script to be available in ACA.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned ACA deploy workflow after merge.
- ACA runtime invariant: Required after deployment before using the updated image for ACA operator jobs.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an internal data-plane operator hardening change.

## Rollback Plan

Revert the PR and redeploy the previous digest if the operator change misbehaves. No database mutation is performed by this release itself.

## Audit Evidence

- PR URL: To be attached after creation.
- Local validation commands listed above.
- Follow-on dry-run proof bundle from ACA operator.

## Known Gaps

This release does not authorize or perform schema retirement. Apply remains gated by dry-run evidence, outside-dependency review, rollback planning, and explicit operation execution.
