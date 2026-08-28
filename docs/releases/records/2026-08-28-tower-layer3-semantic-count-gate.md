# 2026-08-28-tower-layer3-semantic-count-gate - Tower Layer 3 semantic count gate

## Release ID

`2026-08-28-tower-layer3-semantic-count-gate`

## Status

`candidate`

## Plain-English Summary

Hardens the synthetic Tower Layer 3 loader and validator so canonical object readback proves business semantic counts, not only physical object-family counts. This protects budget, value-observation, finance-event, and evidence populations from being hidden inside broader physical families without a gate.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 client intake: No change.

Layer 2 source adapters: No change.

Layer 3 canonical model: The loader now emits `objects_by_semantic_type` in expected counts and readback SQL, fails generated packages with unexpected semantic object populations, and reports objects missing `canonical_semantic_type`.

Layer 4 products: No Tower, Home, Source, Moves, Intelligence, projection, cube, or UI rows are written by this release.

## Client Applicability

All clients: None.

Specific clients: Synthetic healthcare fixture tenant only.

Internal only: AbarVa operators reviewing the Tower synthetic data package.

Public/demo only: The source package is demo/synthetic and must not be represented as real client data.

Feature flag: None.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer3-canonical.mjs`
- `scripts/tower/validate-healthcare-demo-layer3-canonical.mjs`
- Layer 3 signoff document in the generated synthetic healthcare fixture package.

## QA / Validation

Completed local validation:

- Pass: `node --check scripts/tower/load-healthcare-demo-layer3-canonical.mjs`
- Pass: `node --check scripts/tower/validate-healthcare-demo-layer3-canonical.mjs`
- Pass: `npm run tower:healthcare-demo-layer3-canonical:load -- --out-dir /tmp/tower-layer3-semantic-gate-local`
- Pass: local Postgres readback using `/tmp/tower-layer3-semantic-gate-local/tower_layer3_ecl_context_readback.sql`
- Pass: `npm run tower:healthcare-demo-layer3-canonical:validate -- --summary /tmp/tower-layer3-semantic-gate-local/tower_layer3_ecl_context_load_summary.json --readback /tmp/tower-layer3-semantic-gate-local/postgres_readback.json`
- Pass: negative validation fails when `objects_by_semantic_type` is removed from readback.

Expected semantic object counts:

- Budget: 8
- Program: 140
- AI use case: 42
- AI tool: 13
- Value observation: 504
- Finance approval event: 84
- Evidence item: 196

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps deploy workflow builds the digest-pinned image. After that image is available, rerun the Layer 3 canonical write through the governed ACA operator wrapper so the Azure proof bundle includes semantic object readback counts.

Only after the Azure semantic readback passes should downstream cubes be built. Product projections and old-layer sunset remain later-layer work.

## Deployment Authority

Repo-owned deploy workflow: Required before ACA job execution because the hardened loader and validator must exist in the digest-pinned image.

Shared runtime mutators: None for the web runtime outside the governed deploy workflow.

Approved image digest: Required for the ACA operator job rerun.

Live signed-in proof required: Not for this Layer 3 validator hardening alone. Product proof is required only after cube/projection and page refresh work.

## Rollback Plan

Revert this candidate. Existing Azure Layer 3 data remains valid under the previous physical-family gate, but cube builds should stay blocked until semantic object counts are available in readback.

## Audit Evidence

- Local dry-run summary: `/tmp/tower-layer3-semantic-gate-local/tower_layer3_ecl_context_load_summary.json`
- Local readback: `/tmp/tower-layer3-semantic-gate-local/postgres_readback.json`
- Negative readback fixture: `/tmp/tower-layer3-semantic-gate-local/postgres_readback_missing_semantic.json`

## Known Gaps

This release hardens validation but does not promote `canonical_semantic_type` to a physical database column or unique-key component. That schema hardening remains a separate Layer 3 migration decision.
