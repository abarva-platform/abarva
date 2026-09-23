# 2026-09-23 Source supplier import proof summary

## Release ID

`2026-09-23-source-supplier-proof-summary`

## Status

`candidate`

## Plain-English Summary

The candidate-supplier operator now emits a compact, non-identifying proof line after its archive. The ACA wrapper can retain that line when a long archive falls outside captured logs. The manual import workflow fails unless the extracted proof matches the dispatched input and preserves the no-contact authority boundary.

## Layer Impact

- Release lane: `internal-admin`.
- Layer 2 source adapter/operator: proof output and validation only; supplier normalization is unchanged.
- Layer 3 canonical model: no schema or row change in this release.
- Layer 4 Source: no UI change; positive signed-in supplier acceptance remains separate.

## Client Applicability

- All clients: the guarded manual operator workflow when invoked for an explicit tenant.
- Specific clients: none.
- Internal only: operator proof extraction and workflow validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Candidate-supplier loader compact proof marker.
- ACA operator wrapper extraction of that marker after log truncation.
- Manual workflow proof validation for dry-run and separately approved apply modes.
- Focused behavior tests for extraction, no-write authority, and input identity.

## QA / Validation

- Red-first test reproduced a successful ACA job with missing captured proof.
- Three focused suites, 30 tests passed after implementation.
- Node 24 typecheck, scoped ESLint, release check, and mutation proof are required before PR merge.
- The prior live dry run is proof-incomplete; a new dry run is required after deployment.

## Rollout Plan

Squash-merge after applicable checks. The repo-owned ACA main workflow builds and deploys the digest-pinned image. The manual supplier import must then be rerun in dry-run mode and its proof read back. This release does not dispatch an apply.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolved by the workflow after merge.
- ACA runtime invariant: web template, 100% traffic revision, health, and workers must match the approved digest.
- Worker image invariant: both required jobs match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: only after separately authorized tenant data is available for positive supplier behavior.

## Rollback Plan

Revert the PR through a controlled release and redeploy the previous approved digest through the repo-owned workflow. Leave any separately imported tenant rows untouched; this change itself writes none.

## Audit Evidence

- Focused tests and hosted PR checks.
- Repo-owned ACA deployment invariant artifact.
- Governed supplier dry-run run and its extracted workflow proof artifact.

## Known Gaps

The existing supplier dry run succeeded but did not expose a complete captured proof. A fresh dry run on the merged image is owed. Tenant import and supplier acceptance require separate authority and product proof.
