# 2026-10-12-source-candidate-scope-binding

## Release ID

`2026-10-12-source-candidate-scope-binding`

## Status

Offline candidate. No shared data apply or signed-in fact acceptance.

## Plain-English Summary

An unapplied synthetic evidence package now uses the application reference from its exact canonical contract-scope readback. A system reference is not treated as an equivalent application identity. The generator leaves an undeclared service identity absent rather than reusing the application reference as a service. Amounts, observations, document text and unsized-value discipline are unchanged.

## Layer Impact

Release lane: `public-demo` for unapplied synthetic inputs and `global-control-lane` for the bounded generator's undeclared service reference.

- Layer 1: correct declared synthetic application identity; no real-client extracts changed.
- Layer 2: genuinely regenerate the same source package with no assumed service identity.
- Layer 3: offline plans only; no row, selector, schema or RLS mutation.
- Layer 4: no automatic product change or readiness promotion.

## Client Applicability

- All clients: no live data change.
- Specific clients: one existing synthetic package remains unapplied.
- Internal only: offline generation and scope verification.
- Public/demo only: explicitly authored reference scenario, not observed client evidence.
- Feature flag: none; no authentication or RLS change.

## Changes Included

- Declared native application reference in the existing fixture.
- No fabricated service reference in generated performance rows.
- Regenerated application/scope/performance CSVs and governance declaration.
- Regression assertions over the actual fixture and generated rows.

## QA / Validation

- Actual fixture binding regression failed before correction. A separate service-identity assertion failed before removing the application-as-service assignment.
- The existing generator suite passes 16 tests. No new Jest file or census count is introduced.
- Offline real-loader plan passes adapter and projection gates: 71 adapter rows and 68 canonical facts. No database connection or writes occur in plan mode.
- Regeneration changes only the three identity-bearing source CSVs. Original document bytes and monetary measurements remain unchanged. The old package hash is superseded, not reused as authority for the new candidate.

## Rollout Plan

Sequence after the writer provenance prerequisite. Review and squash merge with complete exact-head CI and applicable fetched-ref coordination. The repo-owned ACA main workflow alone may deploy. No package load follows automatically: active selector/access controls, namespace-safe actual writers, exact before-images, write/restore plan and a distinct delegated apply decision remain required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none.
- Approved image digest: not captured for this candidate.
- ACA runtime invariant: digest-pinned template, healthy active single100%-traffic revision and both workers must match after deployment.
- Worker image invariant: separate verification required.
- Feature/env flag update path: none.
- Live signed-in proof required: affected scope, economics, evidence and opportunity views after a separately approved import.

## Rollback Plan

Revert the offline candidate through a reviewed PR. No data rollback is implied because no stored rows changed. Any future apply requires a private before-image backup and a drift-guarded restore, including explicit selector and dependent-row scope.

## Audit Evidence

Private scoped native readback, delegated offline binding review, source/document/manifest fingerprints, red/green generator tests, real-loader plan, PR and CI evidence. Private before-images and authority receipts remain outside the public repository.

## Known Gaps

No shared apply, selector promotion, observed contract evidence, client review, signature, financial sizing, Finance confirmation, indexing/retrieval or live citation acceptance. Legacy writer service/role namespace compatibility and current active-view access controls remain prerequisites before a future apply.
