# Airline Source Landing AAD DB Auth

## Release ID

`2026-07-30-airline-source-landing-aad-db-auth`

## Status

`candidate`

## Plain-English Summary

This release updates the Airline source landing operator so it can write its source registry and
operation checkpoints through the managed-identity PostgreSQL path used by the current lab jobs. It
also emits the initial versioned source synchronization manifest required before the full Airline V2
load. It does not change source files, review decisions, publications, baselines, projections, or
product provider selection.

## Layer Impact

- **Layer 1 / Client Intake:** Controlled synthetic Airline source package landing can record its
  immutable source versions after Blob upload. Each source version now carries sync mode, business
  key, row count, field count, completeness, availability, schema hash, and delta classification.
- **Source adapters / operator lane:** The landing operator reuses the existing AAD PostgreSQL
  connection helper and tenant context setter.
- **No product surface change:** Home, Cube, aVa, and runtime provider behavior are unchanged by
  this release.

## Client Applicability

- **All clients:** No.
- **Specific clients:** Airline synthetic lab execution only.
- **Internal only:** Yes.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `scripts/knowledge/land-airline-source-corpus.mjs`: uses the existing managed-identity/AAD
  PostgreSQL connection helper and sets tenant context before recording landing proof. The result
  now includes `airline-source-sync-manifest/v1`.
- `scripts/knowledge/__tests__/run-airline-source-landing-tests.mjs`: asserts the J0 sync manifest
  shape and initial full-load counts.

## QA / Validation

- **PASS:** Airline source landing regression tests:
  `node scripts/knowledge/__tests__/run-airline-source-landing-tests.mjs`.
- **PASS:** Focused lint:
  `npx eslint scripts/knowledge/land-airline-source-corpus.mjs scripts/knowledge/build-review-decision-ledger.mjs`.
- **PENDING:** Repository release validation with `npm run release:check`.
- **BLOCKED UNTIL DEPLOY:** Governed ACA operational source landing rerun.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow builds
the updated image. After deployment, run the governed Airline source landing job with the exact
approved tenant, release, package, freeze manifest, and ACK controls.

## Deployment Authority

- **Repo-owned deploy workflow:** Required after merge.
- **Shared runtime mutators:** None in this PR.
- **Approved image digest:** To be captured after deployment.
- **ACA runtime invariant:** To be captured after deployment.
- **Worker image invariant:** Airline data-build jobs must use a digest-pinned image.
- **Feature/env flag update path:** No feature flag change.
- **Live signed-in proof required:** Required later at J11, not in this PR.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. Any
failed landing run remains auditable by run ID and idempotency key; do not purge source data.

## Audit Evidence

- PR URL after opening.
- Test, lint, and release-check outputs.
- Post-deploy source landing job ID, image digest, Blob manifest URI, and source registry
  reconciliation.

## Known Gaps

J2-J12 remain separate execution gates after source landing succeeds.
