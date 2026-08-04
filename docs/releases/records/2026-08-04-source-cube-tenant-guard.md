# 2026-08-04-source-cube-tenant-guard - Source Cube Tenant Guard

## Release ID

`2026-08-04-source-cube-tenant-guard`

## Status

`candidate`

## Plain-English Summary

This release makes the Source Cube REST API fail closed with a controlled `403` when a request has no authorization token or carries a valid Cube token without `tenant_key`. The semantic model still applies tenant filters in `query_rewrite`; this adds a small container-level guard before requests reach Cube so missing tenant context does not surface as a Cube Core `500`.

## Layer Impact

- Release lane: `client-data-lane`
- Source semantic runtime: Cube REST API requests under `/cubejs-api/` now pass through a tenant guard before hitting Cube.
- Source projections and data: no database, schema, model, or data mutation.
- Product surfaces: Source UI, aVa, BI tools, and other Cube REST consumers receive a controlled authorization failure instead of server-error telemetry when tenant context is missing.

## Client Applicability

- All clients: applies to the shared Source Cube REST runtime behavior.
- Specific clients: none.
- Internal only: deploy proof and runtime diagnostics.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `scripts/source/cube-tenant-guard.mjs`.
- Updates `scripts/source/cube-runtime-entrypoint.mjs` to run Cube behind a local tenant-guard proxy.
- Updates `Dockerfile.cube` to package the guard helper.
- Tightens `scripts/source/verify-source-cube-runtime.mjs` so missing tenant context must return controlled `403`.

## QA / Validation

- Pass: local tenant-guard proxy probe showed no authorization `403`, valid token without `tenant_key` `403`, and valid token with `tenant_key` forwarded to upstream `200`.
- Pass: `node --check scripts/source/cube-runtime-entrypoint.mjs`
- Pass: `node --check scripts/source/cube-tenant-guard.mjs`
- Pass: `node --check scripts/source/verify-source-cube-runtime.mjs`
- Pending until merge: repo-owned Cube lab deploy workflow proof against the live private Cube runtime.

## Rollout Plan

Merge through pull request. The repo-owned Cube lab deployment workflow builds and deploys the Cube image. The workflow runtime verifier must record no-auth `403` and missing-tenant `403` before this release is called live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-cube-lab-deploy.yml`
- Shared runtime mutators: GitHub Actions only
- Approved image digest: assigned by the Cube lab deploy workflow after merge
- ACA runtime invariant: required after deployment
- Worker image invariant: not applicable to the Cube service
- Feature/env flag update path: none
- Live signed-in proof required: required separately for Source Workspace UI claims; not required for this runtime guard alone

## Rollback Plan

Revert this release and rerun the repo-owned Cube lab deployment workflow. No data rollback is required.

## Audit Evidence

- Pull request and merge commit for this release.
- Cube lab deployment workflow artifact after merge.
- `cube-runtime-verifier.txt` showing no authorization `403` and missing tenant `403`.
- Existing Source/Cube reconciliation proof remains the metric parity baseline.

## Known Gaps

This does not complete signed-in Source Workspace browser proof or the broader aVa answer-quality pressure test. It only closes the Cube missing-tenant `500` behavior.
