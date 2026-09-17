# 2026-09-17-source-depth-l4-money-typmod - Preserve money types in a governed view rebuild

## Release ID

`2026-09-17-source-depth-l4-money-typmod`

## Status

`candidate`

## Plain-English Summary

The Layer 4 overlay rebuild now casts accepted-sizing aggregates to the existing `numeric(18,2)` view contract. PostgreSQL cannot replace a view column with an unconstrained numeric expression. This change preserves the published column types while retaining the evidence-gated sizing rule.

## Layer Impact

- Release lane: `client-data-lane`.
- Layers 1-3: unchanged.
- Layer 4: the governed operator can replace existing read views without changing their money-column types. No new schema object, value formula, or approval state is introduced.

## Client Applicability

- All clients: only the existing Layer 4 operator path changes; ordinary reads are unchanged until a governed overlay run.
- Internal only: exact-load-run projection and readback.
- Public/demo: no unsupported monetary amount is promoted by this release.

## Changes Included

- Explicit `numeric(18,2)` casts on the accepted-sizing low, high, and annual-value expressions.
- Focused regression assertions for the published view-column contract.

## QA / Validation

- PASS: nine focused tests, scoped ESLint, TypeScript, and release check before PR.
- NOT RUN: CI is pending the PR.
- NOT RUN: digest invariant, ACA operator Layer 3/4 row-count reconciliation, and verification of the six writer opportunities as unsized require deployment.
- NOT RUN: signed-in client proof remains separate from data-plane verification.

## Rollout Plan

Squash-merge after CI and deploy through `.github/workflows/aca-main-deploy.yml`. Run the Layer 4 operator on the read-back load-run ID. The operator builds views and validates counts inside one transaction; any mismatch rolls the transaction back.

## Deployment Authority

- Repo-owned ACA main deploy only.
- Data-plane execution through the governed ACA operator job only.
- Runtime template, active revision, and workers must match the approved digest.

## Rollback Plan

Revert code by PR. If a later overlay is activated, use its governed release record and prior view definition to restore it; do not overwrite shared views ad hoc.

## Audit Evidence

Focused tests, CI checks, ACA digest-invariant proof, operator readback, and any signed-in proof captured after the overlay.

## Known Gaps

Preserving a SQL type does not validate a savings estimate. Accepted sizing still requires an evidence-backed claim and a recorded calculation or benchmark basis.
