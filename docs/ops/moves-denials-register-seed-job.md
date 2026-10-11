# Synthetic Move register seed operator job

This job runs only through the private ACA operator path. It does not create a Move, approve a gate, confirm an assumption, price a delivery option or serve rows to an agent. Its source is the unchanged 22-row synthetic proposal pinned by `scripts/moves/denials-pack/seed-contract.ts`.

## Execution order

1. Confirm the dedicated Clerk operator can sign in and its product profile is active on the serving digest. Create a **new** Move through the product, reach P3 Step 4, and record its ID and the operator's person ID. Never use the protected earlier Move.
2. Verify the private ACA job has `replicaRetryLimit: 0`, a digest-pinned image and the approved timeout. Run `preflight` through `npm run ops:aca-job -- --script moves:denials-register:seed-job` with the arguments below. The preflight reads the live Move, account binding, participant, origination audit and complete register. It emits a binding with exact occupied rows and revisions, next DL/V IDs, source hash and idempotency key. It writes no register row.
3. Record a reviewed `load_approval` in `docs/governance/dataset-manifests/moves-denials-register-seed-v1.json`. It must name Anand Sundaram, the exact new Move in both `assessment_id` and `move_id`, the preflight source-set hash and the release record for this job. Merge that approval through a PR. The declaration's existing `approved_by` is not a load approval.
4. Pass the **unchanged** preflight binding JSON and idempotency key to `dry_run`. Review the proof bundle and exact row plan. Any changed Move timestamp, register ID, row revision, operator binding or source byte refuses the run. Do a new preflight if anything changed.
5. Dispatch `apply` once through the same private job with `MOVES_DENIALS_SEED_CONFIRMATION=APPLY_FRESH_DENIALS_REGISTER_SEED`. It creates only proposed rows, through the register store, in one serializable transaction. Inspect its post-commit readback, actor events and Blob proof before continuing P3. If status or proof is uncertain, inspect the Move; do not retry automatically.

## Required job environment

All modes require `DATABASE_URL` from the private Azure secret, `MOVES_DENIALS_SEED_TENANT_KEY` set to the canonical synthetic demo tenant key declared by the registry, `MOVES_DENIALS_SEED_RETRY_COUNT=0`, `MOVES_DENIALS_SEED_TIMEOUT_SECONDS`, `MOVES_DENIALS_SEED_MODE`, `MOVES_DENIALS_SEED_MOVE_ID`, `MOVES_DENIALS_SEED_OPERATOR_CLERK_ID`, `MOVES_DENIALS_SEED_OPERATOR_PERSON_ID`, `MOVES_DENIALS_SEED_APPROVAL_REFERENCE`, `MOVES_DENIALS_SEED_SOURCE_SET_SHA256`, `MOVES_DENIALS_SEED_RUN_ID`, `MOVES_DENIALS_SEED_BUILD_VERSION` and `MOVES_DENIALS_SEED_IMAGE_DIGEST`. The build version is the 40-character Git SHA; the image digest is `sha256:<64 hex>`.

`dry_run` and `apply` also require `MOVES_DENIALS_SEED_BINDING_JSON` and `MOVES_DENIALS_SEED_IDEMPOTENCY_KEY` from the preflight. `apply` additionally requires the confirmation above, `AZURE_STORAGE_ACCOUNT_NAME` and `ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID`. The source-set hash can be checked offline with `npm run moves:denials-register:seed-job -- --seed-hash`; this command reads repository files only.

The operator wrapper emits the private proof bundle and restores its idle job configuration. The proof manifest records run ID, build/image, tenant-scoped Move, operator, source hash, exact binding, retry count, timeout, transaction result and readback. Validation and quality-gate JSON files are in the bundle. An apply proof is also written once under `moves-denials-register-seed/runs/<run-id>/proof.json` in the private Blob proof container.

## Refusals

The job refuses the old protected Move, another tenant, a Move not created by the dedicated operator, a Move outside P3, an operator without its single scoped membership and participant row, a changed source set, changed register IDs or revisions, a repeated apply, missing named manifest approval, and any attempt to use a non-Azure database URL. It does not fall back to the old case-number seed job or a web API write.
