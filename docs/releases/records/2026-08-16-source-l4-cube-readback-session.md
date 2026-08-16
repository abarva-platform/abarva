# 2026-08-16 — Source L4 Cube Readback Session Context

## Release ID

`2026-08-16-source-l4-cube-readback-session`

## Status

`candidate`

## Plain-English Summary

The Source L4/cube refresh proof now counts governed consumption views with the same tenant session context used by product readers. This prevents readback from reporting empty cube views when the rows are present but protected by tenant-scoped view predicates.

## Layer Impact

Layer 4 / Products (`internal-admin` lane): corrects operator proof for governed Source cube views. It does not change the Source projection rows or runtime UI behavior by itself.

## Client Applicability

- All clients: none directly.
- Specific clients: applies to the current approved Source L4/cube refresh proof for scoped demo tenants.
- Internal only: private operator readback and evidence capture.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/data-build/refresh-source-l4-cube.ts` now counts `consumption.*` views per tenant after setting `app.tenant_key`.

## QA / Validation

- Pass: targeted ESLint on the Source L4/cube refresh script.
- Pending: `npm run release:check`.
- Not run: ACA readback job rerun against the already written Source L4/cube rows; requires merge and deployed digest-pinned image first.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main workflow. Then rerun the Source L4/cube readback job using the deployed digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: approved session authority.
- Shared runtime mutators: repo-owned ACA main deploy only.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed directly.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is operator proof only.

## Rollback Plan

Revert the PR and redeploy. The data rows remain governed by the Source L4/cube write job; only the readback count method changes.

## Audit Evidence

- PR and deploy evidence to be added after merge.
- Targeted ESLint output.
- Release control gate output.
- Follow-up ACA Source L4/cube readback proof.

## Known Gaps

This does not add new cube slices; it only fixes the readback method for existing governed consumption views.
