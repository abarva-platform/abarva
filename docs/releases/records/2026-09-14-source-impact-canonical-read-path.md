# 2026-09-14 — Source impact coverage canonical read path

## Release ID

`2026-09-14-source-impact-canonical-read-path`

## Status

`candidate`

## Plain-English Summary

Source portfolio impact coverage now reads the canonical contract evidence lanes written by the Azure data-build path. The portfolio no longer depends on optional compatibility projections or nullable summary columns to decide whether spend, performance, scope, opportunity, and document-depth evidence exists.

## Layer Impact

- **`global-control-lane` — Layer 4 Products:** Source portfolio impact coverage uses the canonical rows and preserves the existing governed status, blocker, and evidence-basis output contract for all clients.
- **Layer 3 — Canonical model:** No schema or data mutation. Existing canonical observations, opportunities, scopes, and fact assertions remain the source of truth.

## Client Applicability

- All clients: Source workspaces using the ECL projection database provider.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing provider selection only; no new flag.

## Changes Included

- Source portfolio impact coverage read-path update.
- Canonical evidence-lane lineage labels in the returned evidence basis.
- Regression coverage for the canonical query shape.

## QA / Validation

- Targeted `portfolioAdapter.ecl.test.ts`: 10 tests passed.
- `git diff --check`: passed.
- The live API investigation established the prior failure mode: action rows returned while the optional coverage query failed and was converted to an empty result. Final live proof is required after deployment.

## Rollout Plan

Merge through the protected pull-request lane. The repo-owned Azure Container Apps deploy workflow builds the exact merge SHA, publishes a digest-pinned image, assigns traffic after health checks, and emits the runtime invariant bundle. No data-build job or migration is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned ACA deploy workflow only.
- Approved image digest: Recorded by the deploy workflow after merge.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required by the deploy workflow even though this change is read-path only.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Verify portfolio evidence coverage is populated, action counts remain present, and selected Contract 360 tabs remain reachable.

## Rollback Plan

Revert the application release through the protected pull-request lane and redeploy the prior known-good digest. No migration rollback or data rollback is required.

## Audit Evidence

- Pull request and CI checks for this release.
- ACA deployment image and runtime invariant bundle.
- Live signed-in Source portfolio and Contract 360 smoke output.
- Adapter regression test output.

## Known Gaps

This release does not classify contracts without an authoritative archetype mapping, add missing source documents, or change the Azure data-build package contents. Those remain separate data-quality and intake work.
