# 2026-07-28-evidence-gap-projection-hash — Evidence Gap Projection Hash

## Release ID

`2026-07-28-evidence-gap-projection-hash`

## Status

`candidate`

## Plain-English Summary

This release fixes the consumption projection builder so evidence-gap rows receive a stable projection hash without requiring the source gap registry to store its own `content_hash` column. The change keeps projection rows versionable while preserving the existing source schema boundary.

## Layer Impact

- Release lane: `client-data-lane`
- Canonical model: No canonical facts or review decisions are changed.
- Publication and consumption: Evidence-gap consumption rows now derive their row hash from governed gap fields during projection materialization.
- Operations: The governed projection-build job can continue past the evidence-gap projection stage when the runtime source table does not expose a native hash column.

## Client Applicability

- All clients: Any client using the shared Knowledge consumption projection builder.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`

## QA / Validation

- Pass: `node --check scripts/knowledge/processing/executor-framework.mjs`
- Pass: `npm run test:knowledge-process-executors`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through pull request, deploy through the repo-owned Azure Container Apps main workflow, then rerun the governed projection-build job against the digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after merge by the ACA deploy workflow.
- ACA runtime invariant: Required before rerunning projection-build.
- Worker image invariant: Required before rerunning projection-build.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this code-only projection-job fix; downstream product proof remains required after projection and analytics gates pass.

## Rollback Plan

Revert the PR and redeploy the previous ACA image. Existing projection rows remain governed by their baseline/projection identifiers and can be rebuilt by rerunning the previous approved projection process.

## Audit Evidence

- Pull request URL: to be added after PR creation.
- CI checks: to be captured on the pull request.
- Runtime job proof: governed projection-build rerun after deployment.

## Known Gaps

This does not declare the analytics phase complete. Projection count proof, metric parity, governed semantic definitions, analytics provisioning, and signed-in product proof remain separate gates.
