# Tower registered-intake candidate promotion

This path changes which staged Tower assessment a tenant sees. It does not turn a review-only candidate into database rows. The registered-intake candidate remains `dry_run_only` and `runtime_eligible: false`; a separate, reviewed data-build job must create a physical assessment and a passing stage receipt before promotion.

## What must exist first

1. The tenant is active in `datasets/tenant-inputs/tenant-input-registry.json` and has exactly one **declared** active row in `ecl_projection.tower_assessment_lifecycle`. A selector result produced by fallback ranking is insufficient.
2. A registered-intake candidate records each source file's SHA-256, row count, source path, nine page populations, and unknown money claims. The approved FY budget and claimable AI value remain `null` when the source does not establish them.
3. A separate ACA data-build job stages Layer 1–3 and all nine Layer 4 page populations under a **new** assessment ID. It does not activate the assessment. Its `tower-physical-stage-receipt/v1` records tenant key, assessment ID, input fingerprint, exact candidate file SHA-256, dataset ID, source-file/source-record/object counts, ingestion method, projection version, build version, run ID, idempotency key, status `staged_pending_independent_readback`, `quality_gate_status: pass`, `runtime_eligible: true`, and exact nine physical page counts and fingerprints. Each page fingerprint is SHA-256 of the JSON array of `{row_key,source_hash}` pairs sorted by row key then source hash. Physical counts may differ from preview counts because unapproved evidence detail and records without declared IDs remain gaps. The job uploads its candidate, receipt, validation, and quality proof to private Blob and reads back the uploaded ZIP. The job must satisfy the private data-plane job contract for non-demo tenants.
4. Migration `20261011210000_tower_active_lifecycle_fail_closed.sql` is applied and verified. Once a tenant has any lifecycle declaration, a missing active declaration returns no Tower generation instead of selecting a staged one by rank.
5. The dataset manifest has a named `load_approval` and a separate named `serving_approval` for `surface: tower`, both bound to this assessment and input fingerprint. An agent must not fill either approval on a person's behalf. The operator uses `resolveServingApproval`, which also checks the load approval and the exact object count.

Use the `candidate.json` emitted by the physical stage job **byte-for-byte** for preflight and promotion. A separate preview run can produce a different file SHA-256 even when assessment and source-set hashes match. Never regenerate or substitute the candidate after staging; the receipt and private Blob proof bind its exact bytes.

The existing generated-package Layer 4 loader cannot ingest the registered-intake candidate. It requires approved FY budget and project amounts that the current intake does not supply. Use the dedicated registered-intake physical stage job and its independent receipt.

## Read-only preflight

Run `npm run tower:registered-intake:promotion -- preflight --candidate <candidate.json> --stage-receipt <receipt.json> --out <preflight.json>` inside a digest-pinned ACA operator job with the tenant's private `DATABASE_URL`, `TOWER_RELOAD_PROOF_BLOB_ACCOUNT`, and `TOWER_RELOAD_PROOF_BLOB_CONTAINER`. It independently downloads the private Blob proof and compares the exact candidate and receipt bytes plus passing validation and quality outputs. It recomputes source-file hashes and the input fingerprint, runs the required active-intake Tower fact-lineage report, verifies the current declared lifecycle row, directly reads all nine staged page populations, checks each page count and fingerprint, checks canonical object and source-record counts, source-file hashes, zero orphan source references, excluded evidence/user-detail records, and nine projection manifests. Known cost amounts must match linked Layer 3 measures; displayed adoption counts must match usage measures; outcome baseline, target, and observed text must match raw text measures and projection references. Approved budget and claimable value remain unknown. It accepts an annual-spend amount only as a matching one-source planning estimate and blocks conflicting money headlines. It also fingerprints all nine prior page populations for rollback.

Without a passing physical stage receipt, preflight produces `status: blocked`. Keep this proof; it explains why no load may proceed.

## Promote after review

Bind the exact tenant, input fingerprint, stage receipt, preflight file SHA-256, and named approval's release-record path in the job request. `promote` requires `--candidate`, `--stage-receipt`, `--preflight-proof`, `--expected-proof-sha256`, `--expected-input-sha256`, `--approval-ref`, and `--out`. It resolves the manifest's Tower serving approval, repeats the database readback in a serializable transaction, locks the tenant's lifecycle pointer, retires the old row, activates the candidate, verifies the selector, and commits. Any failed check rolls the transaction back.

After commit, run the serving preflight and Layer 4 readback on the new assessment, then check the signed-in Tower tabs. Report these proofs separately from the database pointer change. Keep the prior assessment rows available during the rollback window.

## Roll back

Use the saved `tower-candidate-promotion/v1` proof with its exact SHA-256 and a named approval reference. `rollback` verifies the candidate is still active and every prior page population still matches its saved fingerprint, then restores the prior lifecycle pointer in one transaction. A changed or missing prior generation blocks the rollback; recover from the governed data-build proof instead.

No operator step changes shared web traffic. Only the repository-owned main deploy workflow may deploy the code or shift the Container App revision.
