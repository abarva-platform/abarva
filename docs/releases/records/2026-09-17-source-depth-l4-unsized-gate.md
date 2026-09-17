# 2026-09-17-source-depth-l4-unsized-gate - Permit evidence-gated unsized projections

## Release ID

`2026-09-17-source-depth-l4-unsized-gate`

## Status

`candidate`

## Plain-English Summary

The Layer 4 operator no longer requires a positive opportunity-dollar total when every candidate is intentionally unsized. It still rejects negative or invalid totals, and the projection's evidence-backed sizing rule is unchanged.

## Layer Impact

- Release lane: `client-data-lane`.
- Layers 1-3: unchanged.
- Layer 4: readiness validation permits a zero dollar total; views and data remain unchanged until a governed operator run.

## Client Applicability

- All clients: the shared Layer 4 operator readiness check changes.
- Internal only: operator validation and proof.
- Public/demo: no unsized amount becomes a savings claim.

## Changes Included

- Replace the obsolete positive-total assertion with a finite, nonnegative amount check.
- Add behavioral tests for zero, positive, negative, and invalid totals.

## QA / Validation

- PASS: seven focused tests, scoped ESLint, and TypeScript.
- NOT RUN: CI and ACA runtime invariant require merge and deployment.
- NOT RUN: governed operator Layer 4 readback and signed-in proof remain separate post-deploy gates.

## Rollout Plan

Squash-merge after CI. Deploy only through `.github/workflows/aca-main-deploy.yml`, then rerun the governed Layer 4 operator. The operator rolls back if any readback fails.

## Deployment Authority

- Repo-owned ACA main deploy only.
- Data-plane execution through the governed ACA operator job only.

## Rollback Plan

Revert by PR. Do not restore a positive-dollar requirement or create a synthetic amount to satisfy it.

## Audit Evidence

Focused test results, CI, ACA digest-invariant proof, operator Layer 3/4 readbacks, and separate signed-in proof.

## Known Gaps

A zero total is not evidence that no opportunity exists. Candidate sizing remains blocked until a cited method-backed claim is accepted.
