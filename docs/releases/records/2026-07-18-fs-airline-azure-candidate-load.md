# 2026-07-18-fs-airline-azure-candidate-load — FS/Airline Azure Candidate Load

## Release ID

`2026-07-18-fs-airline-azure-candidate-load`

## Status

`candidate`

## Plain-English Summary

Adds the guarded operator script needed to load FS Demo and Airline Demo synthetic V3 candidate context into the Azure/Postgres candidate data plane. The loader writes candidate-scoped context rows, reconciles read-back counts, verifies tenant isolation, and leaves active tenant pointers untouched.

## Layer Impact

Data plane: adds a controlled load path for FS Demo and Airline Demo candidate context in Azure/Postgres.

Governance/proof: emits preload, load, read-back, checksum, isolation, rollback, candidate-preview, and default-runtime-invisibility reports.

Runtime: no default runtime route is changed. Candidate rows remain invisible unless a caller uses explicit candidate preview reads.

## Client Applicability

- All clients: no default runtime behavior change.
- Specific clients: `first-capital-financial` displayed as `FS Demo`; `skyharbor-air` displayed as `Airline Demo`.
- Internal only: ACA private operator job execution and proof reports.
- Public/demo only: synthetic demo candidate context.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/fs-airline-azure-candidate-load.mjs`
- `package.json` scripts:
  - `preload:fs-airline-azure-candidate`
  - `load:fs-airline-azure-candidate`
  - `audit:fs-airline-azure-candidate`

## QA / Validation

- PASS: `node --check scripts/knowledge/fs-airline-azure-candidate-load.mjs`
- PASS: `npm run tenant:data-factory -- --tenant first-capital-financial --mode candidate --skip-generate --dry-run`
- PASS: `npm run tenant:data-factory -- --tenant skyharbor-air --mode candidate --skip-generate --dry-run`
- PASS: `npm run audit:default-runtime-invisibility`
- PASS: `npm run audit:synthetic-tenant-richness -- --tenant all`
- NOT RUN YET: ACA private operator job execution. This waits until the PR is merged and the repo-owned ACA main workflow deploys an image containing the new script.

### 2026-07-18 operator follow-up

- PASS: `node --check scripts/knowledge/fs-airline-azure-candidate-load.mjs`
- PASS: `env -u DATABASE_URL -u AZURE_LAB_DATABASE_URL -u TARGET_DATABASE_URL -u ABARVA_AZURE_DATABASE_URL -u AZURE_DATABASE_URL npm run preload:fs-airline-azure-candidate`
- PASS: `npm run audit:default-runtime-invisibility`
- The npm lifecycle pre-step is intentionally local-artifact-only when no database URL is present. The load and audit actions still enforce the approved Azure lab Postgres target before any database access or mutation.
- The local lineage gate now requires source/evidence linkage and allows missing confidence to use the loader's conservative default for the generated evidence-source rows.

### 2026-07-18 delete-parameter follow-up

- The candidate pre-cleanup delete planner now passes exact bind parameters per table predicate.
- This preserves rollback/idempotency scope while avoiding Postgres bind-count failures before candidate inserts.

### 2026-07-18 graph-node reference follow-up

- V7 graph node projection now uses the generated `node_key` as `node_ref`.
- Display labels remain in `entity_name`; uniqueness no longer depends on repeated synthetic display names.

## Rollout Plan

Merge by PR into `main`, let the repo-owned ACA main deploy workflow build and deploy the image, then run the private ACA operator job with `TENANT_CANDIDATE_LOAD_APPROVED=true` and `load:fs-airline-azure-candidate`. Do not promote active context in this release.

## Deployment Authority

- Repo-owned deploy workflow: required before operator execution so the job image contains the new script.
- Shared runtime mutators: none in this PR.
- Approved image digest: supplied by ACA main deployment after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: private operator job must run the same digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this candidate-load PR; signed-in runtime proof is a later promotion-review lane.

## Rollback Plan

Rollback application code by reverting the PR and redeploying main if needed. Rollback candidate data by deleting rows scoped by `tenant_key`, `candidate_contract_version`, `load_run_id`, and `source_system=tenant_data_factory_candidate`. The loader emits `rollback-ready.csv`; no active pointer mutation is performed.

## Audit Evidence

- PR diff and CI checks.
- ACA main deployment run and digest after merge.
- ACA operator job logs and extracted proof bundle.
- `reports/fs-airline-azure-candidate-load/summary.md`
- `reports/fs-airline-azure-candidate-load/readback-validation.csv`
- `reports/fs-airline-azure-candidate-load/tenant-isolation-validation.csv`
- `reports/fs-airline-azure-candidate-load/checksum-validation.csv`
- `reports/fs-airline-azure-candidate-load/proof.html`

## Known Gaps

This is candidate data-plane load only. It does not promote active tenant context, does not claim default runtime visibility, and does not claim signed-in browser proof.
