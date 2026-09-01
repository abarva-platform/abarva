# 2026-09-01-aca-worker-registry-normalization — ACA worker registry normalization

## Release ID

`2026-09-01-aca-worker-registry-normalization`

## Status

`candidate`

## Plain-English Summary

The repo-owned Azure Container Apps deploy workflow now normalizes each present worker job's container-registry entry to the job's existing managed identity before updating the worker image. This keeps worker image readback strict while avoiding stale registry credential fields that can block an otherwise digest-pinned deployment.

## Layer Impact

Deployment lane (`global-control-lane`): updates the shared deployment script used by the repo-owned ACA main deploy workflow.

Layer 4 / Products: no application behavior change beyond allowing the normal deploy workflow to complete.

Layer 3 / Canonical Model: no schema, row, or canonical-data mutation.

## Client Applicability

- All clients: yes, for shared runtime deployment reliability.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Worker job registry entries are normalized to their configured managed identity before image update.
- Worker job image updates still require digest-pinned images and verified readback.

## QA / Validation

- Pass: `bash -n scripts/deploy/update-worker-jobs.sh`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --changed-only`

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow builds and rolls out the runtime image after merge.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: only the repo-owned ACA main deploy workflow.
- ACR build policy: unchanged; shared web images continue to be built only by the repo-owned ACA main deploy workflow with the approved ACR registry policy.
- Approved image digest: resolved by the repo-owned deploy workflow.
- ACA runtime invariant: verified by the repo-owned deploy workflow.
- Worker image invariant: verified by the repo-owned deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the product changes already present on main after deployment succeeds.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. If a deployment had already shifted traffic, use the workflow evidence bundle to identify the prior healthy revision.

## Audit Evidence

- PR URL: to be added when opened.
- CI checks: to be added after PR validation.
- Deployment evidence: to be added after the repo-owned deploy workflow completes.
- Live proof: to be added after signed-in route verification.

## Known Gaps

This does not grant managed identities registry permissions. If an identity truly lacks pull rights, the deploy workflow should continue to fail instead of silently skipping the worker invariant.
