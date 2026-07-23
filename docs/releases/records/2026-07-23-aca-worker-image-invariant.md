# ACA Worker Image Runtime Invariant

## Release ID

`2026-07-23-aca-worker-image-invariant`

## Status

`candidate`

## Plain-English Summary

The main ACA deploy previously updated the web revision and reported worker-job updates, but it did not read the worker templates back. A live Moves P3 proof found the event worker still running an older digest, which failed Target Architecture before quality evaluation. This release targets the named worker container explicitly and makes both the update step and the final runtime-invariant check fail unless every required deliverable worker reads back the exact approved web digest.

## Layer Impact

- `global-control-lane`: shared ACA deployment and verification only.
- No product, prompt, data, tenant, or feature behavior changes.

## Client Applicability

- All clients: yes, for asynchronous deliverable generation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/deploy/update-worker-jobs.sh`: names the worker container and verifies each job template after update.
- `scripts/deploy/check-aca-runtime-invariant.mjs`: includes both required worker jobs in the final digest invariant and proof JSON.

## QA / Validation

- Pass: shell syntax check for the worker update script.
- Pass: Node syntax check for the runtime-invariant script.
- Pass: simulated two-worker update and exact-image readback using a non-Azure fake CLI.
- Pass: release-control and release-record validation.
- Pending: the repo-owned ACA main deploy must read both worker jobs back at the approved digest, followed by a retry of the disposable First Capital P3 assembly.

## Rollout Plan

Merge through PR to `main`. The repo-owned main deploy updates web and workers, then verifies web traffic, health, and both worker job template images before succeeding.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned main deploy only.
- ACR build policy: unchanged; the repo-owned Docker Buildx workflow, GitHub Actions cache, Premium registry check, and digest-pinned image contract remain authoritative.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy and readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on the disposable First Capital Move only.

## Rollback Plan

Revert through PR. No schema or data rollback is required.

## Audit Evidence

- Trigger: First Capital disposable P3 run `f5ce5189-67fa-4259-84e5-590228ed9488` failed under stale event-worker digest `sha256:4c49ccf...` while the web runtime was on `sha256:6e4033a...`.
- PR, deploy run, final digest, and retry proof: pending.

## Known Gaps

- The separate Source artifact-acceptance migration readback has an idempotency defect in its synthetic event seed; it does not invalidate the successfully applied Moves dependency migration but remains a separate release-lane finding.
