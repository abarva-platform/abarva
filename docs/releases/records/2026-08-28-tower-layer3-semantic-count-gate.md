# 2026-08-28-tower-layer3-semantic-count-gate - Tower Layer 3 semantic count gate

## Release ID

`2026-08-28-tower-layer3-semantic-count-gate`

## Status

`deployed`

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

Completed Azure validation:

- Pass: PR #6965 merged to `main` at `5215b79647aed9aaa4d8e7670f2875878dcbf6bd`.
- Pass: ACA main deploy run `33205727414` completed successfully for that SHA.
- Pass: production ACA revision `ca-abarva-web-lab-eastus--m5215b796` received 100% traffic.
- Pass: production template image was digest-pinned to `acrabarvalab001.azurecr.io/abarva/web@sha256:cc74769e4132a526c8ad806b4e78751c6c2b6ef53290d5a4a340cb3644d7458c`.
- Pass: public health endpoint returned `ok: true` with Postgres checks green.
- Pass: governed ACA operator execution `job-abarva-private-operator-eus-jqbfme9` completed successfully on the same digest.
- Pass: Azure readback validation returned `status: PASS` with zero semantic-type gaps.
- Pass: operator job restored to idle image `acrabarvalab001.azurecr.io/abarva/web@sha256:918b6cbf298ebd5bd20782b15f7d1817111d94e438436d64f2ea64db543db8a9`.

Expected semantic object counts:

- Budget: 8
- Program: 140
- AI use case: 42
- AI tool: 13
- Value observation: 504
- Finance approval event: 84
- Evidence item: 196

## Rollout Plan

Merged by PR #6965 to `main`. The repo-owned Azure Container Apps deploy workflow built and deployed the digest-pinned image. The Layer 3 canonical write was rerun through the governed ACA operator wrapper, and the Azure proof bundle includes semantic object readback counts.

Only after the Azure semantic readback passes should downstream cubes be built. Product projections and old-layer sunset remain later-layer work.

## Deployment Authority

Repo-owned deploy workflow: Required before ACA job execution because the hardened loader and validator must exist in the digest-pinned image.

Shared runtime mutators: None for the web runtime outside the governed deploy workflow.

Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:cc74769e4132a526c8ad806b4e78751c6c2b6ef53290d5a4a340cb3644d7458c`.

Live signed-in proof required: Not for this Layer 3 validator hardening alone. Product proof is required only after cube/projection and page refresh work.

## Rollback Plan

Revert this candidate. Existing Azure Layer 3 data remains valid under the previous physical-family gate, but cube builds should stay blocked until semantic object counts are available in readback.

## Audit Evidence

- Local dry-run summary: `/tmp/tower-layer3-semantic-gate-local/tower_layer3_ecl_context_load_summary.json`
- Local readback: `/tmp/tower-layer3-semantic-gate-local/postgres_readback.json`
- Negative readback fixture: `/tmp/tower-layer3-semantic-gate-local/postgres_readback_missing_semantic.json`
- Azure operator proof bundle: `/tmp/tower-layer3-semantic-gate-aca-proof-5215b796-rerun/proof/meridian-tower-layer3-canonical`
- Azure readback: `/tmp/tower-layer3-semantic-gate-aca-proof-5215b796-rerun/proof/meridian-tower-layer3-canonical/03-readback.json`

## Known Gaps

This release hardens validation but does not promote `canonical_semantic_type` to a physical database column or unique-key component. That schema hardening remains a separate Layer 3 migration decision.
