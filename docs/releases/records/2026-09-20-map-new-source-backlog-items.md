# Map new Source backlog items

## Release ID

`2026-09-20-map-new-source-backlog-items`

## Status

`candidate`

## Plain-English Summary

The generated Source execution board now places two newly filed items in the
correct structural tracks. Deployment-proof bookkeeping remains in platform
integrity, while the approval gate for vendor-facing renders and exports is
shown as part of the RFI/RFP lifecycle. The map records structure only; it does
not assign status, proof, ownership, or completion.

## Layer Impact

- Release lane: `internal-admin`.
- Operator tracking: updates the repository-owned lifecycle map used by the
  generated execution board and queue.
- Product and data layers: unchanged.

## Client Applicability

- All clients: No product behavior changes.
- Specific clients: None.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Map deployment-proof bookkeeping to platform integrity.
- Map the vendor-facing render/export approval control to the RFI/RFP stage.
- Add a lifecycle capability label for that approval control.
- Pin the generated-census item to its exact legacy definition so the board
  cannot attribute its status to an unrelated item that reused the number.

## QA / Validation

- Status: PASS.
- The repository-owned board generator reports zero unmapped items.
- The repository-owned queue generator completes from the regenerated board.
- The execution-script behavior suite and release control pass.

## Rollout Plan

Squash-merge through the protected pull-request path. Regenerate the private
operator board and queue from the merged map.

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

This change does not close either mapped item. It only makes both visible to the
shared generated planning views.
