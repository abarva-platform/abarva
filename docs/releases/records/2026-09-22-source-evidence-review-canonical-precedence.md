# Source evidence review canonical identity precedence

## Release ID

`2026-09-22-source-evidence-review-canonical-precedence`

## Status

`candidate`

## Plain-English Summary

Source evidence-availability review now attributes a review to the canonical person resolved by tenancy during the current request, even when the earlier user snapshot still carries an older person identifier.

## Release Lane

`global-control-lane`

## Layer Impact

- `global-control-lane`, Layer 4 Source workflow identity resolution only.
- No intake, adapter, canonical-model, schema, migration, or tenant-data change.

## Client Applicability

- All clients using Source evidence-availability review.
- No client-specific behavior or data is embedded in this release.

## Changes Included

- Prefers the canonical UUID returned by `requireTenancy()` over the pre-reconciliation current-user person identifier.
- Continues to require a persisted person row with a non-placeholder display name and email.
- Keeps the review availability-only and grants no legal, security, commercial, supplier, finance, or artifact approval.

## QA / Validation

- Red-first route coverage reproduced a stale current-user UUID alongside a different canonical tenancy UUID; the preview failed before the correction.
- The focused route suite passes all identity, preview, and write-path cases after the correction.
- Mutation proof restored current-user-first precedence and the new regression failed while the seven prior cases remained green.
- TypeScript, scoped ESLint, release control, and diff checks are required before merge.

## Rollout Plan

Squash merge through a pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merged SHA. After the runtime invariant passes, repeat the signed-in preview on the synthetic Source event before recording any review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: required before signed-in proof.
- Worker image invariant: required before signed-in proof.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, preview first; any review submission remains a separate confirmed action.

## Rollback Plan

Revert the squash merge through a pull request and redeploy through the repository-owned workflow. No data or schema rollback is required.

## Audit Evidence

- Focused route regression and mutation proof.
- Pull request checks and merge SHA.
- Repository-owned deployment run and runtime-invariant artifact.
- Signed-in preview proof after deployment.

## Known Gaps

This release changes identity precedence only. It does not create or approve evidence, advance a sourcing phase, select a supplier, contact a supplier, or perform any legal, security, commercial, finance, or signature action.
