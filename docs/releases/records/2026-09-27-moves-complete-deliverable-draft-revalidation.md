# 2026-09-27-moves-complete-deliverable-draft-revalidation — Moves Draft Refresh Lifecycle Flag

## Release ID

`2026-09-27-moves-complete-deliverable-draft-revalidation`

## Status

`candidate`

## Plain-English Summary

Refreshing an existing governed Moves deliverable draft now writes the lifecycle revalidation flag as `false` instead of leaving the fluent Azure/Postgres compatibility layer to send a null value. This keeps regenerated phase outputs in the governed deliverable table so reviewers can inspect and sign them off.

## Layer Impact

- Release lane: `global-control-lane`
- CANONICAL MODEL: The governed deliverable row remains the single sign-off source of truth. Draft refreshes now preserve the required lifecycle flag explicitly.
- PRODUCTS: Moves phase rebuilds can refresh existing governed deliverable rows without failing before review.

## Client Applicability

- All clients: Yes, for Moves governed deliverable regeneration.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves build flags still control access; no flag change is included.

## Changes Included

- `src/lib/programs/mutations.ts`
- `src/lib/programs/__tests__/complete-deliverable-actor.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath src/lib/programs/__tests__/complete-deliverable-actor.test.ts src/lib/programs/__tests__/deliverable-lifecycle.test.ts src/lib/programs/__tests__/sign-off-deliverable-approved-upload.test.ts --runInBand`
- Pending: lint, typecheck, release check, PR CI, deploy, runtime invariant, and signed-in Moves proof.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. No database migration, feature flag change, or manual data edit is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, rerun a Moves governed build and confirm generated outputs become reviewable/signable.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No schema rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Deployment run: Pending.
- Signed-in proof: Pending.

## Known Gaps

This release only repairs the existing-deliverable draft refresh path. It does not sign off generated outputs automatically, bypass readiness scanning, or alter phase-gate policy. Live signed-in proof must still confirm the regenerated outputs become reviewable/signable after deployment.
