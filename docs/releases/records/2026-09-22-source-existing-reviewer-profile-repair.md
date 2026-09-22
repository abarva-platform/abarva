# Source existing reviewer profile repair

## Release ID

`2026-09-22-source-existing-reviewer-profile-repair`

## Status

`candidate`

## Plain-English Summary

Authenticated Source operators with an existing canonical person record now pass through the same idempotent identity reconciliation used for first-time provisioning. This lets an authenticated profile repair a legacy placeholder reviewer name while preserving the governed evidence-review requirement for a named person with email.

## Release Lane

`global-control-lane`

## Layer Impact

- Release lane: `global-control-lane`.
- Identity control and Layer 4 product workflow only.
- No client intake, source adapter, canonical business object, schema, migration, or business-data change.

## Client Applicability

- All clients: receives the idempotent authenticated-person reconciliation when using governed Source evidence review.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.
- No client-specific fact, identity, or outcome is embedded in this release.

## Changes Included

- Runs authenticated Clerk identities through the existing canonical-tenant, email-keyed, idempotent person provisioner even when tenancy already resolved a UUID person.
- Keeps private-proof identities outside the provisioning path.
- Preserves fail-safe behavior and the downstream named-person review guard.

## QA / Validation

- PASS: red-first behavior test proved that an existing UUID person previously skipped identity reconciliation.
- PASS: 17 focused tenancy and provisioner tests cover existing-person repair, idempotency, private-proof exclusion, and canonical tenant guards.
- PASS: mutation restoring the fallback-only condition failed the new behavior test.
- PASS: scoped ESLint.
- PASS: diff check.
- PASS: TypeScript with an 8 GB heap.
- PASS: release-control recheck.

## Rollout Plan

Squash merge through a pull request. The repository-owned ACA main deploy workflow builds and deploys the merged SHA. After the runtime invariant passes, repeat the signed-in review preview on the synthetic Source event before recording any review.

## Deployment Authority

- `.github/workflows/aca-main-deploy.yml` only.
- No manual Azure update, traffic shift, environment change, or mutable image.

## Rollback Plan

Revert the squash merge through a pull request and redeploy with the repository-owned workflow. No schema or data rollback is required.

## Audit Evidence

- Focused behavior tests and mutation proof.
- Pull request checks and squash merge SHA.
- Repository-owned deployment run and runtime-invariant artifact.
- Signed-in preview and review proof after deployment.

## Known Gaps

This release does not approve evidence, advance an event, contact a supplier, infer a legal decision, or repair identities outside authenticated canonical tenants.
