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

### Reusable private ACA Job entry points

`tower:registered-intake:preflight-job`, `tower:registered-intake:promote-job`, and the read-only
`tower:registered-intake:verify-job` run through
`npm run ops:aca-job -- --image <approved-image@sha256:...> --script <entry-point>`.
They use the private operator Job and do not change web traffic. Pass
`--secret-env DATABASE_URL=<existing-job-secret>` and the user-assigned Blob identity as
`--env AZURE_CLIENT_ID=<client-id>`. The wrapper must wait for completion and restore its idle
template; do not use `--no-wait` or `--no-restore-idle` for these runs.

Both entry points require these explicit `--env KEY=VALUE` bindings:

| Key suffix after `TOWER_PROMOTION_` | Meaning |
| --- | --- |
| `TENANT_KEY`, `ASSESSMENT_ID` | Exact declared tenant and staged assessment. |
| `STAGE_PROOF_URI`, `STAGE_PROOF_SHA256`, `CANDIDATE_SHA256`, `INPUT_SHA256` | Exact private stage ZIP, ZIP hash, candidate file hash, and source-set fingerprint. |
| `PROOF_BLOB_ACCOUNT`, `PROOF_BLOB_CONTAINER` | Private proof destination and stage proof scope. |
| `RUN_ID`, `IDEMPOTENCY_KEY` | Unique execution ID and reviewed idempotency binding. |
| `JOB_NAME`, `IMAGE_DIGEST`, `GIT_SHA`, `TIMEOUT_SECONDS`, `RETRY_COUNT` | Actual operator job name, approved image digest, image commit, wrapper timeout, and configured retry count. |
| `OPERATOR_IDENTITY`, `RELEASE_RECORD` | Responsible identity and reviewed release record path. |
| `EXECUTION_LANE` | Must be `aca_operator_job`. |

The wrapper checks that `JOB_NAME`, `IMAGE_DIGEST`, and `TIMEOUT_SECONDS` match its own request.
Use `--plan-only` first to review the invocation without touching Azure. Promotion also requires
`TOWER_PROMOTION_APPROVAL_REF`, `TOWER_PROMOTION_PREFLIGHT_PROOF_URI`, and
`TOWER_PROMOTION_PREFLIGHT_PROOF_SHA256`. The approval reference must equal the release record
path and must resolve to the named serving approval in the dataset manifest. An agent must not
fill that approval on a person's behalf.

Each run reads and hashes the exact candidate and receipt bytes inside the stage ZIP. Preflight
stores `preflight.json`, `progress.json`, and `job-contract.json` under
`operator-proof/tower-registered-promotion/<tenant>/<assessment>/<run-id>/` in private Blob.
Promotion downloads the reviewed preflight by its exact URI and SHA-256, uses the guarded
operator, and stores `promotion.json`, `serving-readback.json`, progress, and job-contract files.
The serving readback checks the active selector, lifecycle, all nine physical page populations,
all nine `serving.tower_*` views, and the saved prior-generation fingerprints. The command center
serving view contains its summary, decision lanes, and recommended actions; the value proof
serving view contains value proof and cost lens. The checker verifies each included population
separately against its staged count and fingerprint. Every uploaded
proof is downloaded and compared byte-for-byte. If promotion commits but a later proof step
fails, the runner records the operator's pending proof if present and a fresh read-only selector
observation; it fails the job and requires review. It never rolls back automatically.

Use `tower:registered-intake:verify-job` when the selector is already on the reviewed candidate
or when a separate post-commit readback is needed. Bind the exact staged ZIP and reviewed
`preflight.json` URI/SHA-256 as for promotion. This job does not run the promotion operator or
change the lifecycle pointer. It saves and reads back `serving-readback.json`, prints the exact
proof and checksum in the private Job log, and restores the operator Job's idle template.

## Promote after review

Bind the exact tenant, input fingerprint, stage receipt, preflight file SHA-256, and named approval's release-record path in the job request. `promote` requires `--candidate`, `--stage-receipt`, `--preflight-proof`, `--expected-proof-sha256`, `--expected-input-sha256`, `--approval-ref`, and `--out`. It resolves the manifest's Tower serving approval, repeats the database readback in a serializable transaction, locks the tenant's lifecycle pointer, retires the old row, activates the candidate, verifies the selector, and commits. Any failed check rolls the transaction back.

After commit, run the serving preflight and Layer 4 readback on the new assessment, then check the signed-in Tower tabs. Report these proofs separately from the database pointer change. Keep the prior assessment rows available during the rollback window.

## Roll back

Use the saved `tower-candidate-promotion/v1` proof with its exact SHA-256 and a named approval reference. `rollback` verifies the candidate is still active and every prior page population still matches its saved fingerprint, then restores the prior lifecycle pointer in one transaction. A changed or missing prior generation blocks the rollback; recover from the governed data-build proof instead.

No operator step changes shared web traffic. Only the repository-owned main deploy workflow may deploy the code or shift the Container App revision.
