# Source Contract Depth Package Normalization

## Change

The contract-depth loader now accepts the equivalent column names used by the
staged contract packages for application identifiers, clause identifiers, and
evidence document links. It also treats package-level metadata omissions as
missing metadata while still rejecting any conflicting tenant or dataset
identity. Existing evidence-document IDs on change-order rows are preserved.

## Layer and applicability

- Release lane: `client-data-lane`
- Layers: Layer 1 package intake and Layer 2 source adapter normalization.
- Client applicability: synthetic internal demo tenant only; no production
  client data is changed by this code release.
- Product impact: enables the same governed loader contract to validate dense
  cloud-consumption and managed-services packages before an Azure data build.

## Validation

- Databricks contract-depth package plan: PASS.
- Managed-services contract-depth package plan: PASS.
- Managed-services event-rich package plan: PASS.
- Older thin five-contract package remains blocked by its declared missing
  managed-services evidence lanes; it is not promoted by this change.
- Loader regression tests and lint are required in CI.

## Rollout and rollback

Deploy through the protected ACA main workflow. Run each approved package as a
tenant- and dataset-scoped ACA operator job with a distinct `load_run_id`, then
require Layer 2/3/4 readback, quality-gate output, proof bundle, and signed-in
Source verification. Rollback is a code revert through the same PR and ACA
workflow; data-build rows remain isolated by dataset version and load run and
must be retired only through an explicitly approved data operation.

## Audit evidence

The operator job must retain the package hash, row counts by adapter, quality
gate, readback counts, active overlay identity, and post-load product proof.
