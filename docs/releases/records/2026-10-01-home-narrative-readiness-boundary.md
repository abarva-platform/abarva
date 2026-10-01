# 2026-10-01 Home Narrative Readiness Boundary

## Release ID

`2026-10-01-home-narrative-readiness-boundary`

## Status

`candidate`

## Plain-English Summary

The Home narrative builder now requires independently recorded evidence-readiness proof before it can use projected facts or derived signals in model context. Unadmitted intake and source-ledger rows no longer enter the narrative packet. If the proof is missing or stale, the builder refuses to generate rather than presenting unsupported claims.

## Layer Impact

- Release lane: `global-control-lane`.
- Source adapters: no data or adapter changes. Direct repository-intake promotion in the narrative job is removed.
- Canonical model: no schema or record changes. The job reads the existing governance readiness ledger.
- Product: Home narrative generation is fail-closed pending tenant-scoped, version-matched indexing and citation proof. Existing published Home content is unchanged.

## Client Applicability

- All clients: shared narrative-builder boundary.
- Specific clients: none.
- Internal only: operator job diagnostics and tests.
- Public/demo only: none.
- Feature flag: existing approved-write gate remains unchanged.

## Changes Included

- Narrative builder governance-ledger read and exact source/content-hash matching for projected rows and derived signals.
- Intake-source quarantine and removal of locally fabricated retrieval/citation readiness.
- Focused planted readiness cases and updated narrative contract tests.

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`.
- PASS: `tsc --noEmit --pretty false` under Node 24 with an 8 GB heap.
- PASS: `npm run release:check`.
- PASS: Home ratchet, 798/826 tests with 12 existing baselined suites and no movement.
- PASS with warnings: targeted ESLint, zero errors and five unused-function warnings in the dormant writer source path.
- NOT RUN: tenant data build or narrative generation.

## Rollout Plan

Squash-merge the reviewed PR. The repository ACA main deploy workflow builds and deploys the exact merged SHA. No migration, tenant data operation, or feature-flag change is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: recorded in workflow output after deployment.
- ACA runtime invariant: template image and 100% traffic revision must match the approved digest.
- Worker image invariant: required worker jobs must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: verify Home record state and counts without claiming new narrative publication.

## Rollback Plan

Revert this PR through a new reviewed PR and the same ACA main workflow. Do not bypass the governance gate through an ad-hoc data or runtime edit.

## Audit Evidence

PR, test output, ACA main deploy run, digest invariant, and signed-in Home readback in the private completion ledger.

## Known Gaps

The current narrative writer remains unavailable until its projected facts and signals have independent indexed and cite-render proof in the governance ledger. Source-family context needs its own admitted, versioned path. This release does not regenerate or publish tenant narrative.
