# 2026-09-17-source-opportunity-ownership-cutover-job - Governed archive and retirement job

## Release ID

`2026-09-17-source-opportunity-ownership-cutover-job`

## Status

`candidate`

## Plain-English Summary

Adds an operator job to move an explicitly approved, superseded opportunity set into a durable, restorable archive. A read-only plan inventories the installed database and publishes exact row IDs and hashes. Apply refuses changed scope, unknown references, existing human decisions, missing operator approval, or unavailable private proof storage. Verify and restore are separate modes. This candidate does not execute a cutover.

The plan separately inventories legacy opportunity rows for the same tenant and contract or approved opportunity IDs. Apply blocks while any such row exists, because a legacy branch in the product projection could reappear when its canonical suppressor is retired. This job does not delete or rewrite legacy rows.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3 canonical model: archives and retires only the approved opportunity-spine rows and their dependent records.
- Layer 2 adapters and Layer 1 intake: unchanged.
- Layer 4 products: no direct edit; projections must be refreshed and reconciled separately before making new claims.

## Client Applicability

- All clients: the generic operator job is available but inert until run.
- Specific clients: only an explicit reciprocal evidence-only tuple in the ownership manifest can be selected.
- Internal only: the ACA operator job and proof outputs.
- Public/demo only: none.
- Feature flag: none; apply requires an explicit approval token and exact hashes.

## Changes Included

- `scripts/source/opportunity-ownership-cutover-job.mjs`: plan, apply, verify, restore and private Blob proof readback.
- `scripts/source/__tests__/opportunity-ownership-cutover-job.test.mjs`: focused scope and fail-closed guards.
- `package.json`: separate ACA operator script entries for plan, apply, verify, and restore. The operator wrapper invokes a named npm script without forwarding extra arguments, so each mode is explicit in the release image.
- This release record. The archive-table migration is a separate prerequisite, not changed here.

## QA / Validation

- PASS: eight focused Node tests, including human-decision and explicit `AZURE_CLIENT_ID` guards; syntax check, scoped ESLint, `npx tsc --noEmit`, and `git diff --check`.
- PASS: socket-only disposable PostgreSQL integration test with the real optimization-spine and archive migration DDL, 21 linked spine rows, a canonical-writer control, and an unrelated same-version control. The job ran as a non-owner role under tenant-dependent RLS: rows were hidden before the transaction-local `app.tenant_key` setting and visible afterward. Plan blocks human-action rows, then applies to 16 unreviewed rows. Zero-root rejection, legacy-row block, precommit Blob failure rollback, postcommit final-proof failure, archive tamper rejection, control-drift rejection, verify retry, and exact restore passed. The test used a private-target mock Blob client; no Azure connection was made.
- PASS: `npm run release:check` after this record was aligned to the release template.
- NOT RUN: installed Azure schema and row readback, real managed-identity Blob write/read proof, ACA job, Layer 4 reconciliation, and signed-in product proof.

## Rollout Plan

Review the separate archive migration and apply it through the approved database migration lane. Run plan through the private ACA operator job using a digest-pinned image. Review the exact inventory, IDs, external references, writer hash, and proof target. Apply only with a recorded approval, then run verify, refresh derived cubes, reconcile Source consumers and perform signed-in proof. No web request or local direct database mutation is permitted.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for code delivery only.
- Shared runtime mutators: none in this candidate.
- Approved image digest: required at job run time; not selected here.
- ACA runtime invariant: must be proved after a future deployment.
- Worker image invariant: same approved digest required at execution.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after data and projection reconciliation.

## Rollback Plan

Restore from the run's row-level archive with the exact manifest, opportunity IDs, inventory hash, writer hash, explicit restore approval, and conflict-free destination. Restore checks full inventory parity and never overwrites a live row. An aborted transaction leaves a prepared Blob proof marked uncommitted; a post-commit proof-upload failure leaves the database archive durable and requires operator verification and proof repair.

## Audit Evidence

The candidate produces a JSON proof, private Blob URL and readback, ACA bundle markers, DB run ledger, per-table row counts and row hashes, installed constraints, exact scope, and quality-gate status. The wrapper learns the ACA execution ID only after job start; its saved execution record must be correlated with the job run ID rather than supplying a guessed ID before start. Later execution must also retain the ACA wrapper logs and signed-in acceptance evidence.

## Known Gaps

Installed Azure archive schema, exact live cutover inventory, Blob permissions, and external consumers are not verified by this code PR. Blob authentication requires an explicit `AZURE_CLIENT_ID` for the approved user-assigned identity; it never falls back to another attached identity or developer credentials. A dedicated private proof container may need to be provisioned through the approved storage lane. The job does not create a container, change network rules, or use a public-container workaround. The canonical-writer loader currently deletes and reinserts its opportunity rows on rerun; a separate approval/claim guard or governed freeze must prevent an unreviewed rerun after cutover. The cutover job detects subsequent writer-hash drift but does not control that loader. The archive migration is merged separately and must be confirmed applied on the target database before this job can mutate rows. A successful local rehearsal does not authorize a live run.
