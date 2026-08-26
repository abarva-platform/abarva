# 2026-08-26-ecl-client-grc-adapter — ECL GRC Intake Adapter

## Release ID

`2026-08-26-ecl-client-grc-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local ECL adapter proof for the GRC intake family. The adapter maps risk, control, exception, and audit-finding records into ECL source, context, relationship, and measure rows with explicit references to impacted applications or platforms.

## Layer Impact

Layer 1 - Client intake: Reads the GRC source-family extract at risk/control/exception/finding summary grain. Completion lane affected: `L-CLIENT`.

Layer 2 - Source adapters: Adds a GRC adapter with a disposable Postgres proof and planted foreign-key failure. Completion lane affected: `L-CLIENT`.

Layer 3 - Canonical model: Produces risk, control, business-function, impacted-object reference, dependency, metric, and measure rows for local validation. Completion lane affected: `L-CLIENT`.

Layer 4 - Products: No product route or runtime behavior changes in this release. Product cutover lane `L-CUTOVER` is not changed.

## Client Applicability

- All clients: Adapter pattern and local proof only.
- Specific clients: None.
- Internal only: ECL build and validation workflow.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/load_client_intake_grc_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-grc-adapter-tests.mjs`
- Package scripts for loading and testing the GRC adapter.
- ECL no-stop pipeline proof step for the GRC adapter.
- Four-lane ECL completion status update from 6/14 to 7/14 client-intake adapters.

## QA / Validation

- Pass: `npm run test:ecl-client-intake-grc-adapter`
- Pass: Disposable Postgres load against the ECL draft schema.
- Pass: Risk, control, severity, control-state, impacted-object, metric, and measure assertions.
- Pass: Planted risk/control target reference failure rejected by the database foreign key.

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
- `npm run test:ecl-client-intake-grc-adapter`
- CI ECL no-stop data pipeline proof after PR creation.

## Known Gaps

The adapter preserves application and platform references from the GRC extract and validates them against generated lookup extracts. A shared identity convergence service is still needed before independently run client-intake adapters can guarantee identical object IDs across every family.
