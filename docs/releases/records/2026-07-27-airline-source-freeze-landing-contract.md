# 2026-07-27-airline-source-freeze-landing-contract — Source Freeze And Landing Contract

## Release ID

`2026-07-27-airline-source-freeze-landing-contract`

## Status

`candidate`

## Plain-English Summary

This release turns an approved synthetic source-corpus package into an executable landing contract. It does not publish product data or make a client-facing runtime claim. It separates operational source files from evaluator-only truth files, requires explicit tenant and release IDs, and records the source landing in the shared operations and source-registry tables.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: No client-facing templates change.
- Source adapters: Adds a controlled source-corpus landing launcher for one frozen release.
- Canonical model: No canonical business objects are written by this release.
- Products: No Home, Intelligence, Moves, Source, Tower, Learn, Pricing, or Cube runtime wiring changes.
- Operations/governance: Adds a freeze manifest and execution checks so source and evaluator truth cannot be mixed.

## Client Applicability

- All clients: No.
- Specific clients: One synthetic execution tenant only.
- Internal only: Yes, this is an operator/data-plane execution contract.
- Public/demo only: No product-facing public demo change.
- Feature flag: None.

## Changes Included

- `clients/airline-demo-new/execution/airline-demo-new-source-corpus-v1.0.0.freeze-manifest.json`
- `scripts/knowledge/land-airline-source-corpus.mjs`
- `scripts/knowledge/__tests__/run-airline-source-landing-tests.mjs`
- `package.json` script `test:airline-source-landing`

## QA / Validation

Local validation status before PR: pass.

- `npm run test:airline-source-corpus-repair` — pass.
- `npm run test:airline-source-landing` — pass.
- `npm run test:airline-phase1-plan` — pass.
- `npm run test:phase3c2e-data-layer` — pass.
- `git diff --check` — pass.
- `npm run release:check` — pass after this record update.

## Rollout Plan

Merge the contract first. After merge, run the ACA data-job lane for the exact tenant and release with `ABARVA_SOURCE_LANDING_EXECUTE_ACK=LAND_AIRLINE_SOURCE_CORPUS`. Operational source files land to the operational storage account and are registered in `source_registry`. Restricted evaluator files land separately and are not written to the source registry.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; no web runtime deploy required.
- Shared runtime mutators: None.
- Approved image digest: Data-job execution must record the image digest used.
- ACA runtime invariant: Not applicable for web traffic.
- Worker image invariant: Required before claiming job execution complete.
- Feature/env flag update path: None.
- Live signed-in proof required: No product proof until a published Knowledge Baseline exists.

## Rollback Plan

The fastest rollback is to stop before executing the data job. After execution, the immutable source files remain as an auditable landed release; downstream parser/publication waves can be blocked or rolled forward with a superseding release. Product surfaces are unaffected because this release does not wire runtime consumption.

## Audit Evidence

- Freeze manifest for tenant/release/action authority.
- Source-corpus semantic audit from the approved package.
- Source-landing plan output for operational and evaluator scopes.
- ACA job logs and operation checkpoints after execution.
- Source-registry row counts after operational landing.

## Known Gaps

- Parser waves are not included.
- Canonical object writes are not included.
- Knowledge Baseline publication is not included.
- Home/Source/Cube/aVa consumption proof is not included.
