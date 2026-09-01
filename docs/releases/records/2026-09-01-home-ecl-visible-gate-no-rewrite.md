# 2026-09-01-home-ecl-visible-gate-no-rewrite - Home ECL Visible Gate No Rewrite

## Release ID

`2026-09-01-home-ecl-visible-gate-no-rewrite`

## Status

`candidate`

## Plain-English Summary

This change removes a Home ECL narrative cleanup path that replaced visible chapter text with a generated terminal-state headline. The operator job now keeps generated chapter prose intact after identifier scrubbing, treats raw object IDs as uppercase machine identifiers, and lets the visible-quality gate refuse any remaining unsupported or implementation-facing language.

## Layer Impact

Products: Home narrative generation.

Data plane: No schema or row changes. Mutating writes remain gated by the existing approved-plan controls.

Source adapters and canonical model: No change.

## Client Applicability

- All clients: Applies to Home ECL narrative operator behavior.
- Specific clients: None.
- Internal only: Operator script execution path and contract tests.
- Public/demo only: None.
- Feature flag: Existing write approval environment variables still gate mutation.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- PASS: `git diff --check`
- PASS: raw-ID detector smoke confirms ordinary lower-case risk phrases are not blocked while uppercase IDs still are

## Rollout Plan

Merge by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image. Operator jobs should use the deployed digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by main deploy workflow after merge.
- ACA runtime invariant: Required after deployment before live proof.
- Worker image invariant: Required before operator execution.
- Feature/env flag update path: No runtime flag update.
- Live signed-in proof required: Yes, after any approved narrative write.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No database migration or data-plane mutation is included.

## Audit Evidence

- PR URL after creation
- CI check output
- ACA deploy evidence after merge
- Operator plan proof bundle after deployment

## Known Gaps

This release does not itself generate, approve, or persist Home narrative rows. It only ensures the visible-quality gate receives the generated chapter artifact without a terminal-state rewrite.
