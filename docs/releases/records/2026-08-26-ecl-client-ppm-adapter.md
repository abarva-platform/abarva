# 2026-08-26-ecl-client-ppm-adapter — ECL PPM Intake Adapter

## Release ID

`2026-08-26-ecl-client-ppm-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local ECL adapter proof for the PPM intake family. The adapter maps program and initiative records, sponsor functions, status, approved budget, forecast, target value, and dependent application references into ECL source, context, relationship, and measure records.

## Layer Impact

Layer 1 - Client intake: Reads the PPM source-family extract at program and initiative summary grain. Completion lane affected: `L-CLIENT`.

Layer 2 - Source adapters: Adds a PPM adapter with a disposable Postgres proof and planted foreign-key failure. Completion lane affected: `L-CLIENT`.

Layer 3 - Canonical model: Produces program, sponsor-function, application-reference, metric, measure, and relationship rows for local validation. Completion lane affected: `L-CLIENT`.

Layer 4 - Products: No product route or runtime behavior changes in this release. Product cutover lane `L-CUTOVER` is not changed.

## Client Applicability

- All clients: Adapter pattern and local proof only.
- Specific clients: None.
- Internal only: ECL build and validation workflow.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/load_client_intake_ppm_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-ppm-adapter-tests.mjs`
- Package scripts for loading and testing the PPM adapter.
- ECL no-stop pipeline proof step for the PPM adapter.
- Four-lane ECL completion status update from 5/14 to 6/14 client-intake adapters.

## QA / Validation

- Pass: `npm run test:ecl-client-intake-ppm-adapter`
- Pass: Disposable Postgres load against the ECL draft schema.
- Pass: Program, status, sponsor-function, application-reference, metric, and measure assertions.
- Pass: Planted program-to-application reference failure rejected by the database foreign key.

## Rollout Plan

Merge to `main`. No Azure data-plane mutation, no product route repointing, and no runtime deployment is required for this adapter-only proof.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the adapter script, test, package-script entries, workflow proof step, and status update. No persisted data or runtime state is changed by this release.

## Audit Evidence

- Pull request for this release.
- `npm run test:ecl-client-intake-ppm-adapter`
- CI ECL no-stop data pipeline proof after PR creation.

## Known Gaps

The adapter preserves dependent application references from the PPM extract and validates them against the generated CMDB lookup. A shared identity convergence service is still needed before independently run client-intake adapters can guarantee identical application object IDs across every family.
