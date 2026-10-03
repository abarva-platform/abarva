# 2026-09-27-moves-deliverable-revalidation-default — Moves Deliverable Lifecycle Default

## Release ID

`2026-09-27-moves-deliverable-revalidation-default`

## Status

`candidate`

## Plain-English Summary

Moves governed builds now write the deliverable lifecycle revalidation flag explicitly when the Azure/Postgres write adapter creates or refreshes a governed deliverable draft. This keeps generated phase outputs materialized in the authoritative deliverables table instead of failing on a required lifecycle column.

## Layer Impact

- Release lane: `global-control-lane`
- CANONICAL MODEL: The governed deliverable row continues to be the authoritative record for phase sign-off. The change preserves the existing lifecycle default explicitly in the Azure write path.
- PRODUCTS: Moves phase builds can continue from generated artifacts into review and sign-off without changing the gate logic or weakening readiness checks.

## Client Applicability

- All clients: Yes, for Moves governed deliverable generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Moves build flags still control access; no flag change is included.

## Changes Included

- `src/lib/data-plane/write-adapters/programsWriteAdapter.ts`
- `src/lib/data-plane/write-adapters/__tests__/slice-3f-shared-helper-write-adapters.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/jest --runTestsByPath src/lib/data-plane/write-adapters/__tests__/slice-3f-shared-helper-write-adapters.test.ts --runInBand`
- Pass: `./node_modules/.bin/jest src/lib/data-plane/write-adapters/__tests__ src/lib/deliverables/orchestrator/__tests__ src/lib/programs/__tests__/deliverable-lifecycle.test.ts src/lib/programs/__tests__/sign-off-deliverable-approved-upload.test.ts --runInBand`
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

This release repairs the required lifecycle-column write for governed deliverable drafts. It does not change phase-gate policy, does not sign off generated outputs automatically, and does not alter any reviewer acknowledgement or readiness-blocker rule. Live signed-in proof must still confirm the next generated output becomes reviewable/signable after deployment.
