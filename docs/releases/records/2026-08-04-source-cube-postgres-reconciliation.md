# 2026-08-04-source-cube-postgres-reconciliation — Source Cube Reconciliation Gate

## Release ID

`2026-08-04-source-cube-postgres-reconciliation`

## Status

`candidate`

## Plain-English Summary

This release adds an end-to-end reconciliation gate for the Source Cube deployment. After the Cube service is deployed in Azure Container Apps, the workflow now queries Cube metrics and independently queries the underlying Postgres Source tables and views, then fails the deployment evidence step if the numbers disagree.

## Layer Impact

- Release lane: `client-data-lane`
- Source adapters and canonical projections: no data mutation. The verifier reads the Source consumption views and raw Source V4 tables for the configured tenant.
- Products and semantic access: Cube now has a deployment-time guard that proves the semantic metrics exposed to product UI and analytical clients reconcile back to Postgres.
- Operations: the Cube lab deploy workflow records the reconciliation output in the deploy evidence artifact.

## Client Applicability

- All clients: applies to the shared Source Cube deployment workflow pattern.
- Specific clients: validates the configured synthetic airline tenant used by the current Source/Cube runtime.
- Internal only: deploy evidence and reconciliation logs.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `scripts/source/verify-source-cube-postgres-reconciliation.mjs`.
- Packages the verifier into `Dockerfile.cube`.
- Runs the verifier in `.github/workflows/aca-cube-lab-deploy.yml` after the existing private Cube API verifier.

## QA / Validation

- Pass: `node --check scripts/source/verify-source-cube-postgres-reconciliation.mjs`
- Pass: `npx eslint scripts/source/verify-source-cube-postgres-reconciliation.mjs`
- Pass: `git diff --check`
- Pending until merge: workflow-level validation through the repo-owned Cube lab deployment workflow.
- Pending until merge: the verifier checks Cube results against direct Postgres results across legacy Source consumption views and Source V4 canary/raw tables.

## Rollout Plan

Merge to main through pull request. The repo-owned Azure Container Apps Cube lab deploy workflow builds the Cube image, deploys it to the shared lab runtime, runs the existing Cube API verifier, and then runs the new Cube-to-Postgres reconciliation gate inside the private runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-cube-lab-deploy.yml`
- Shared runtime mutators: GitHub Actions only
- Approved image digest: recorded by the deploy workflow after merge
- ACA runtime invariant: unchanged existing workflow step
- Worker image invariant: not applicable to the Cube service
- Feature/env flag update path: none
- Live signed-in proof required: yes for product UI claims; not required for this semantic-layer verifier alone

## Rollback Plan

Revert the PR and rerun the repo-owned Cube lab deploy workflow. No schema or data rollback is required because this release only adds read-only verification code and workflow evidence collection.

## Audit Evidence

- Pull request and merge commit for this release.
- Cube lab deploy workflow run after merge.
- `aca-cube-lab-deploy` workflow artifact, especially `cube-postgres-reconciliation.txt`, `cube-runtime-verifier.txt`, and `runtime-invariant.json`.

## Known Gaps

This does not replace signed-in browser proof for Source UI pages. It proves semantic metrics reconcile from Cube to Source/Postgres; page rendering and tenant routing still need browser-level verification for UI release claims.
