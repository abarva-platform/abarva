# 2026-08-23-source-vendor-proposal-parse-proof-job — Source Vendor Proposal Parse Proof Job

## Release ID

`2026-08-23-source-vendor-proposal-parse-proof-job`

## Status

`candidate`

## Plain-English Summary

Adds a governed operator proof job for the Source vendor-proposal ingestion path. The job extracts structured facts from a controlled proposal text, writes artifact metadata and candidate proposal facts through the existing tenant-scoped proposal-fact repository, then reads those rows back with source quote and locator evidence. It exists to prove the upload/parse/persist/readback seam without changing the user-facing Source workflow.

Update: the proof job now explicitly writes the artifact registry `version` column. The first live ACA attempt found that `source_artifacts.version` is required in the deployed table; this patch keeps the operator harness aligned with the live artifact registry contract.

Second update: the live ACA retry found that `source_artifacts.created_at` is also required in the deployed table. The proof job now writes `created_at` and `updated_at` when those columns are present while keeping the required-column guard strict.

Third update: the next live ACA retry found that `source_artifacts.generated_at` is also required in the deployed table. The proof job now writes `generated_at` from the same operator timestamp used for `created_at` and `updated_at`, preserving the strict required-column guard.

Fourth update: the next live ACA retry found that `source_artifacts.missing_inputs` is also required in the deployed table. The proof job now writes the File Cabinet JSON metadata trio (`missing_inputs`, `client_complete_items`, and `assumptions`) when those columns are present, using explicit JSON values rather than relying on deployed defaults.

Fifth update: the next live ACA retry found that `source_artifacts.cited_source_artifact_ids` is also required in the deployed table. The proof job now writes an empty UUID array for the uploaded proof artifact because it is the source artifact itself, not a generated artifact citing prior source artifacts.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 1 Client Intake: no template or client-facing intake change.
- Layer 2 Source Adapters: adds an operator-only proof harness for the existing vendor-proposal parser path.
- Layer 3 Canonical Model: no schema change. Writes only to existing Source artifact and proposal fact ledgers when explicitly run in apply mode.
- Layer 4 Products: no UI or route behavior change.

## Client Applicability

- All clients: the proof job is tenant-parameterized and uses shared Source proposal-fact services.
- Specific clients: none hardcoded.
- Internal only: operator proof execution.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/source/vendor-proposal-parse-proof-job.ts`
- `scripts/source/__tests__/vendor-proposal-parse-proof-job.test.mjs`
- `package.json` script `source:vendor-proposal-parse:proof-job`
- Explicit `source_artifacts.version = 1` population for the controlled proof artifact.
- Explicit `source_artifacts.generated_at`, `source_artifacts.created_at`, and `source_artifacts.updated_at` population for timestamped proof rows when those columns exist.
- Explicit File Cabinet JSON metadata population for `source_artifacts.missing_inputs`, `source_artifacts.client_complete_items`, and `source_artifacts.assumptions` when those columns exist.
- Explicit Workspace Explorer citation-lineage array population for `source_artifacts.cited_source_artifact_ids` when that column exists.

## QA / Validation

- PASS: focused syntax/operator launch check with an intentionally unreachable local database endpoint; result proved the script compiles past `server-only` imports and fails only on database connectivity.
- PASS: `node --test scripts/source/__tests__/vendor-proposal-parse-proof-job.test.mjs`
- PASS: `node --test scripts/source/__tests__/source-substrate-lineage-report.test.mjs`
- FAIL THEN FIXED: first ACA apply attempt failed before mutation because the live artifact registry required `version`; this release candidate now populates that field and pins it in the focused test.
- FAIL THEN FIXED: second ACA apply attempt failed before mutation because the live artifact registry required `created_at`; this release candidate now populates source artifact timestamps and pins them in the focused test.
- FAIL THEN FIXED: third ACA apply attempt failed before mutation because the live artifact registry required `generated_at`; this release candidate now populates that artifact timestamp and pins it in the focused test.
- FAIL THEN FIXED: fourth ACA apply attempt failed before mutation because the live artifact registry required `missing_inputs`; this release candidate now populates the File Cabinet JSON metadata trio and pins it in the focused test.
- FAIL THEN FIXED: fifth ACA apply attempt failed before mutation because the live artifact registry required `cited_source_artifact_ids`; this release candidate now populates an empty UUID array for the uploaded source artifact and pins it in the focused test.
- NOT RUN: live ACA proof is required before calling the mutation path live-proven.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds the new web image. Operators can then run the proof job through `npm run ops:aca-job` against the digest-pinned image with explicit apply acknowledgement and database secret binding.

## Deployment Authority

- Repo-owned deploy workflow: required for the script to be present in the ACA image.
- Shared runtime mutators: none from this PR.
- Approved image digest: determined by the main ACA deploy workflow.
- ACA runtime invariant: required before live proof.
- Worker image invariant: required for the private operator job when executed.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no UI change; data readback proof required for the operator job.

## Rollback Plan

Revert the application commit. Already-written artifact/fact proof rows remain append-only evidence and should be handled by a separate, reviewed data-cleanup run if removal is required.

## Audit Evidence

- PR URL and merge commit.
- Focused test output.
- ACA operator job plan/logs for live proof execution.
- Proof files emitted by the job under the operator output directory.

## Known Gaps

- The operator proof writes artifact registry metadata and governed candidate facts. It does not upload original bytes to Blob storage.
- Candidate proposal facts still require human review before becoming accepted facts.
