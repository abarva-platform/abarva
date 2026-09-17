# 2026-09-17-source-cloud-output-profile-readback - Scoped calculation-output reconciliation

## Release ID

`2026-09-17-source-cloud-output-profile-readback`

## Status

`candidate`

## Plain-English Summary

The Layer 4 activation preflight now recognizes one already-loaded canonical package with two calculation outputs per run: an unpriced evidence count and a historical calculated amount. It requires the exact same shape for every scoped run and rejects unknown, missing, duplicated, or partly corrected rows. The package's authored Layer 3 expectation remains unchanged for new loads. The correction operator can now prove and unsize a writer set before activating its Layer 4 overlay, preventing a brief exposure of unsupported amounts.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 1 and Layer 2: unchanged.
- Layer 3: scoped correction job may clear unsupported amounts before projection; no loader write change.
- Layer 4: activation and verification may proceed only after the exact output profile passes. No view or metric formula changes. The correction job's preactivation mode requires zero projected writer rows in both views and an exact state token.

## Client Applicability

- All clients: no behavior change outside one explicitly versioned synthetic package.
- Internal only: governed operator readback and proof.
- Public/demo: no new claim or amount is exposed by this code change.

## Changes Included

- Per-run calculation-output profile validator and focused negative tests.
- Package-specific readback in Layer 3 verification and Layer 4 activation/verification.
- Proof summaries distinguish the historical priced and unpriced states.
- Explicit preactivation plan/apply/verify state for the governed correction job, with a zero-row Layer 4 proof and a post-activation null-amount test.

## QA / Validation

- PASS: focused behavior tests including disposable PostgreSQL preactivation/activation proof, TypeScript, scoped ESLint, and diff check before PR.
- PASS: release check after this record correction.
- NOT RUN: Azure Layer 4 activation, readback, and signed-in proof remain required after deployment.

## Rollout Plan

Squash-merge after CI, deploy through the repository-owned ACA main workflow, then run the scoped Layer 4 operator job. Require the output profile and all existing Layer 3/4 row-count gates to pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: selected by the deploy workflow.
- ACA runtime and worker image invariant: verify before operator execution.
- Live signed-in proof required after any Layer 4 activation.

## Rollback Plan

Revert the code through a PR if the readback contract is incorrect. Any separately activated Layer 4 overlay must use its governed rollback/run record; this release does not write one itself.

## Audit Evidence

Local negative tests, CI checks, ACA deployment summary, and subsequent Layer 4 operator proof bundle.

## Known Gaps

The historical amount-bearing outputs still require the separately governed unsizing correction. A readback pass does not make those amounts evidence-backed or finance-confirmed.
