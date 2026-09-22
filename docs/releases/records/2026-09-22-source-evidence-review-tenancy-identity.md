# Source evidence review tenancy identity

## Release ID

`2026-09-22-source-evidence-review-tenancy-identity`

## Status

`candidate`

## Plain-English Summary

Source evidence-availability review now uses the canonical person identity resolved or safely provisioned by tenancy during the same request. A signed-in operator with a newly provisioned person record can therefore preview and record an availability-only review without weakening the named-person requirement.

## Release Lane

`global-control-lane`

## Layer Impact

- `global-control-lane`, Layer 4 product workflow only.
- No intake, adapter, canonical-model, schema, or tenant-data migration.

## Client Applicability

- All clients using Source evidence-availability review.
- No client-specific behavior or data is embedded in this release.

## Changes Included

- Reuses the UUID person identity returned by `requireTenancy()` when the pre-provision user snapshot has no person ID.
- Continues to load the canonical `persons` row and require a non-placeholder name and email.
- Keeps the review availability-only and does not grant legal, security, commercial, supplier, finance, or artifact approval.

## QA / Validation

- Red-first route test reproduced the live sequence: the current-user snapshot had no person ID while tenancy returned the canonical provisioned UUID.
- The preview and write paths now attribute the review to that canonical person.
- Mutation proof removed the tenancy identity handoff and the new test failed.
- Existing missing-person and placeholder-name refusal tests remain green.
- Focused TypeScript, ESLint, release-control, and route tests are required before merge.

## Rollout Plan

Squash merge through a pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merged SHA. After the runtime invariant passes, repeat the signed-in evidence-review action on the synthetic Source event and verify the before/after evidence state and activity attribution.

## Deployment Authority

- `.github/workflows/aca-main-deploy.yml` only.
- No manual ACA update, traffic shift, environment change, or mutable runtime image.

## Rollback Plan

Revert the squash merge through a pull request and redeploy through the repository-owned workflow. No data or schema rollback is required.

## Audit Evidence

- Focused route test and mutation proof.
- Pull request checks and merge SHA.
- Repository-owned deployment run and runtime-invariant artifact.
- Signed-in before/after evidence-review proof after deployment.

## Known Gaps

This release only repairs the identity handoff. It does not review any evidence automatically, create a person without the tenancy guard, approve content, advance a sourcing phase, or contact a supplier.
