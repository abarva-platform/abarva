# 2026-09-12-source-layer3-run-id-guard — Source Layer 3 Run Resolution

## Release ID

`2026-09-12-source-layer3-run-id-guard`

## Status

`candidate`

## Plain-English Summary

The Source package loader now refuses to guess which Layer 3 projection run a phased Layer 4 activation should use. When the operator does not provide an explicit projection run ID, the loader derives one from the contract IDs in the package and fails if the package maps to zero or multiple runs. Layer 3 readback also requires a complete contract identity before the transaction can complete.

## Layer Impact

Release lane: `client-data-lane` (internal operator path; shared loader logic).

- **Layer 3 — Canonical model:** The loader verifies that each package contract has a non-empty contract name, vendor legal name, expiration date, and matching load run before reporting success.
- **Layer 4 — Products/read models:** Layer 4 activation and verification use the uniquely resolved Layer 3 run, preventing a valid overlay from being attached to a different phased load.

## Client Applicability

- All clients: The loader behavior is shared.
- Specific clients: None.
- Internal only: Operator package load and verification paths.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Source cloud-consumption package loader run-ID resolution and identity readback guard.
- Focused loader tests for phased projection resolution and complete contract identity.

## QA / Validation

- `node --check scripts/source/load-cloud-consumption-package.mjs` — passed.
- Focused Jest suite — 9 tests passed.
- ESLint on the changed loader and test — passed.
- Non-mutating package plan — passed with the committed dataset manifest and expected Layer 2/3/4 counts.
- No Azure data mutation was run for this change.

## Rollout Plan

Merge through the protected `main` PR lane. The repo-owned ACA deploy workflow builds and deploys the exact merge SHA using the approved digest-pinned image. Any data refresh remains an explicit ACA Job operation governed by its separate runbook and quality gate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Set by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required for the web deployment if the merge triggers a release.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Source package-loader UI consumers should be checked after deployment; the loader guard itself is verified by the operator test and plan path.

## Rollback Plan

Revert the merge commit through the protected PR lane and redeploy the prior approved digest. Do not bypass the run-ID guard with a mutable runtime image. A failed data job remains transactional and must be rerun only after its proof bundle and input package are reviewed.

## Audit Evidence

- PR and CI checks for this release candidate.
- Focused loader test output.
- Non-mutating package plan output and its proof directory.
- ACA deployment and digest readback, if the merge is deployed.

## Known Gaps

- This change does not perform a data reload.
- It does not classify contracts that lack an authoritative identity/archetype mapping.
- Email/PDF report delivery remains a separate product workflow.
