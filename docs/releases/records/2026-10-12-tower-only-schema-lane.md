# 2026-10-12 Tower exact schema lane

## Release ID

`2026-10-12-tower-only-schema-lane`

## Status

`candidate`

## Plain-English Summary

Adds an operator workflow that can inspect and apply exactly two approved Tower schema files. It refuses changed files, an incomplete migration ledger, missing prerequisites, active Tower selection changes, and a busy private operator. Other pending migrations stay pending. The general migration workflow now checks schema against its ledger before any broad apply.

## Layer Impact

- **Release lane:** `client-data-lane` for the shared schema apply and private operator proof.
- **Canonical model and projection schema:** Allows the declared Tower lifecycle selector and Foundation page/object types. No intake data is loaded by this release.
- **Products:** No Tower page changes or serving promotion occur in this release.

## Client Applicability

- **All clients:** The workflow is available to operators, but it applies only its two exact Tower files to the shared lab schema after an explicit dispatch.
- **Specific clients:** No real client data is included. The registered synthetic intake candidate is the only bound data scope.
- **Internal only:** Operator workflow and private proof.
- **Public/demo only:** No direct surface change.
- **Feature flag:** None.

## Changes Included

- `scripts/tower/tower-only-schema-lane.ts` and its redacted proof verifier.
- `.github/workflows/tower-only-schema-lab.yml` and the early reconciliation guard in `.github/workflows/db-migration-lab.yml`.
- Three npm operator script entries and focused tests.

## QA / Validation

- **Pass:** Local focused Node tests, ESLint, and YAML parsing.
- **Pass:** Release validation after this record is finalized.
- **Not run:** Live status/apply/readback dispatch; a merged PR is not a migration apply.
- The live read-only run must separately confirm the exact ledger state, prerequisites, and private proof readback before any apply. A merged PR is not a migration apply.

## Rollout Plan

Merge to `main` through a protected PR. The repo-owned ACA main deploy workflow builds and deploys the exact main image. Run `tower-only-schema-lab.yml` in `status` mode first. Review its private Blob proof, the redacted public receipt, operator idle restoration, and current main digest. Dispatch `apply` only for the exact two-file Tower batch with the explicit confirmation. Then require its independent read-only `verify` job and private proof readback before any Tower data stage.

The `apply` script commits both SQL files and their ledger hashes in one database transaction under the shared migration advisory lock. If database commit succeeds but Blob proof upload fails, the workflow fails without implying a rollback; run a new read-only `status` dispatch to confirm actual ledger/schema state. Never rerun `apply` to repair a proof-upload failure.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this workflow; it reads the deployed digest and uses the existing private ACA operator job.
- Approved image digest: derived from current `main` tag and checked against the web template, sole 100% traffic revision, and both required worker images before any job.
- ACA runtime invariant: workflow fails on image/revision mismatch and rechecks before apply.
- Worker image invariant: both required worker jobs must match the main digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after separate data stage and serving promotion; this schema lane alone proves no page behavior.

## Rollback Plan

Do not erase applied migration ledger rows or manually reverse shared schema. Stop before data stage if readback fails; repair with a new reviewed migration and exact proof. Application code may be rolled back through the repo-owned ACA main deploy lane. The broad migration lane remains blocked by its pre-apply reconciliation gate until historical drift is addressed.

## Audit Evidence

Inspect the PR, focused test output, the workflow's redacted receipt and idle evidence, the SHA-bound private Blob proof and readback, and the migration ledger. Full catalog, selector, and tenant evidence is kept in private Blob; the public workflow artifact contains no raw database readback.

## Known Gaps

The shared database has historical ledger/schema findings outside these two Tower files. This lane does not repair them or authorize unrelated pending schema. Source approvals, Tower data staging, serving promotion, and signed-in page proof remain separate gates.
