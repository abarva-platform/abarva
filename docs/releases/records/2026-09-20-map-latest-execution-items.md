# 2026-09-20-map-latest-execution-items — Map Latest Execution Items

## Release ID

`2026-09-20-map-latest-execution-items`

## Status

`candidate`

## Plain-English Summary

Classify newly filed execution and control-audit work in the generated planning
board so no item disappears and no platform work inflates Source lifecycle
progress.

## Layer Impact

- `internal-admin`: execution planning metadata only. No product, canonical
  data, adapter, read-model, or client-data behavior changes.

## Client Applicability

- All clients: No product behavior changes.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Map newly filed deployment bookkeeping, control-audit, and test-coverage work
  to the platform-integrity track.
- Map completed execution-tooling items to the same track so their status notes
  remain visible without affecting Source lifecycle stages.
- Preserve stage progress: none of these items represents a user-facing Source
  lifecycle capability.

## QA / Validation

- Repository-owned board generator reports zero unmapped items.
- Repository-owned queue generator completes from the regenerated board.
- Execution-queue behavior tests pass.
- TypeScript, ESLint, formatting, and release control pass.

## Rollout Plan

Squash-merge through the protected pull-request path, then regenerate the
private operator board and queue from the merged map.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` may build
  the resulting image.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned workflow after merge.
- ACA runtime invariant: Required from the workflow artifact if deployed.
- Worker image invariant: Required from the workflow artifact if deployed.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No; no product surface changes.

## Rollback Plan

Revert the squash merge and regenerate the private operator board and queue.

## Audit Evidence

- Pull request and required-check results.
- Generator output showing zero unmapped backlog items.

## Known Gaps

This change classifies work only. It does not perform any control audit,
bookkeeping closure, database readback, migration, or signed-in acceptance.
