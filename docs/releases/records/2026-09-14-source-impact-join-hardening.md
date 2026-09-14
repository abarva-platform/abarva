# 2026-09-14 — Source impact join hardening

## Release ID

`2026-09-14-source-impact-join-hardening`

## Status

`candidate`

## Plain-English Summary

Source portfolio impact coverage now qualifies shared contract keys in its canonical spend and performance joins. This prevents a database ambiguity from being converted into an empty evidence result by the adapter's fail-closed error handling.

## Layer Impact

- **`global-control-lane` — Layer 4 Products:** Hardens the Source portfolio impact read path for all clients using the ECL projection database provider.
- **Layer 3 — Canonical model:** No schema, migration, or data mutation. Existing canonical rows are read without alteration.

## Client Applicability

- All clients: Source workspaces using the ECL projection database provider.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing provider selection only.

## Changes Included

- Qualify tenant and contract keys in canonical spend and performance coverage CTEs.
- Add a regression assertion for the qualified canonical query shape.

## QA / Validation

- Targeted `portfolioAdapter.ecl.test.ts`: 10 tests passed.
- ESLint on changed TypeScript files: passed.
- `git diff --check`: passed.
- Full CI checks are required before merge.

## Rollout Plan

Merge through the protected pull-request lane. The repo-owned Azure Container Apps deploy workflow builds the exact merge SHA, publishes a digest-pinned image, assigns traffic after health checks, and emits the runtime invariant bundle. No data-build job or migration is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned ACA deploy workflow only.
- Approved image digest: Recorded by the deploy workflow after merge.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify portfolio evidence coverage is populated and action rows remain present.

## Rollback Plan

Revert the application release through the protected pull-request lane and redeploy the prior known-good digest. No migration rollback or data rollback is required.

## Audit Evidence

- Pull request and CI checks for this release.
- ACA deployment image and runtime invariant bundle.
- Live signed-in Source portfolio API and browser smoke output.
- Adapter regression test output.

## Known Gaps

This release does not add source documents, classify contracts without authoritative mappings, or change the Azure data-build package. Those remain separate data-quality and intake work.
