# 2026-07-29-airline-live-reconciliation-readback — Governed Source-to-Consumption Readback

## Release ID

`2026-07-29-airline-live-reconciliation-readback`

## Status

`candidate`

## Plain-English Summary

Adds a read-only verifier that recomputes a governed tenant's source-file,
source-row, and source-field control totals from the approved source corpus,
then reads the tenant PostgreSQL data plane inside a read-only transaction and
emits reconciliation evidence across source registration, evidence extraction,
candidates, review decisions, canonical publication, baseline activation,
consumption projections, and Cube-facing parity records.

Runtime update: the verifier can now hydrate source authority from the live
source registry and landed Azure Blob URIs when the local source-corpus folder
is not present in the deployed runtime image. This preserves the runtime image
boundary while allowing VNet operator jobs to verify the actual landed source
files.

Operator-readback update: adds an explicit Airline-only admin helper that grants
the evaluator role read access to the schemas required for reconciliation
readback, then verifies the role's schema/table privileges before exiting. The
helper is guarded by exact tenant/database assertions and a required
acknowledgement env var. It grants SELECT/USAGE only and does not mutate
foundation data.

Projection-readback update: makes projection-table summarization schema-aware,
so projection tables that do not expose optional `content_hash` or
`availability_state` columns are reported with unavailable metadata instead of
crashing the readback before downstream reconciliation evidence is emitted.

The verifier does not load data, approve records, publish a baseline, switch a
provider, or alter Azure resources.

## Layer Impact

- Release lane: `client-data-lane`.
- CLIENT INTAKE: Recomputes source control totals from the approved source CSVs.
- SOURCE ADAPTERS: Identifies whether source rows reached live evidence rows.
- CANONICAL MODEL: Reads candidate, review, canonical, and publication counts
  without mutation.
- PRODUCTS: Reads consumption projection and Cube parity records; does not wire
  any product surface.

## Client Applicability

- All clients: No.
- Specific clients: Governed tenant foundation readback lane.
- Internal only: Yes, QA/operator evidence generation.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- `scripts/ops/airline-grant-reconciliation-readback.mjs`
- `package.json` script: `qa:airline-e2e-live-reconciliation-readback`
- `package.json` script: `ops:airline-grant-reconciliation-readback`

## QA / Validation

Status: `pass` for local/source-side validation; `not-run` for governed VNet
database readback until this candidate is merged/deployed into the operator
runtime image.

- `pass`: `node --check scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- `pass`: `node --check scripts/ops/airline-grant-reconciliation-readback.mjs`
- `pass`: local source-ledger generation with `--skip-db --no-field-detail`
  against 25 source files, 99,883 rows, and 1,014,830 field instances.
- `pass`: missing local source-root negative test fails closed instead of
  silently running against fixtures.
- `pass`: row-count discrepancy register marks 99,883 authoritative and 110,895
  as stale prior-audit documentation drift.
- `pass`: projection summaries tolerate projection tables without optional
  `content_hash` / `availability_state` columns.
- `pass`: governed VNet read-only grant helper execution against the Airline
  database.
- `pass`: governed VNet database readback reaches the live source-registry and
  source Blob authority with the evaluator identity.
- `pass`: proof bundle emission now writes the full field-level archive to a
  durable Blob destination when configured, and emits only a small pointer
  bundle through ACA logs. This prevents log-size / tar stdout failures during
  full field-level reconciliation.
- `not-run`: product certification; this verifier intentionally does not wire
  product surfaces.

Live certification still requires governed VNet execution with tenant database
configuration and durable proof-bundle readback.

## Rollout Plan

Merge to main and deploy through the normal Azure Container Apps main lane so
the readback script exists in the digest-pinned runtime image. Then run it
through the private ACA operator job with tenant-scoped read-only database
configuration and `AIRLINE_E2E_PROOF_UPLOAD_CONTAINER` configured for the
durable proof bundle.

## Deployment Authority

- Repo-owned deploy workflow: Required before VNet operator execution.
- Shared runtime mutators: None in this change.
- Approved image digest: Captured by the normal deploy.
- ACA runtime invariant: Required before operator execution.
- Worker image invariant: Required before operator execution.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this script; product proof follows only
  after reconciliation passes.

## Rollback Plan

Revert the script and package script. No data rollback is required because the
verifier is read-only.

## Audit Evidence

- PR diff
- CI/release checks
- Local source-ledger proof
- Governed ACA operator proof pointer bundle after deploy
- Durable full proof bundle in tenant-scoped Azure Blob storage after deploy

## Known Gaps

This release provides the verifier. It does not repair missing lineage,
projection, Cube, or product-consumer defects found by the verifier.
