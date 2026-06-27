# 2026-06-27-north-star-scale-quality-contract — North-Star Scale Quality Gate

## Release ID

`2026-06-27-north-star-scale-quality-contract`

## Status

`candidate`

## Plain-English Summary

Adds a repo-owned North-Star Scale Quality Contract and wires a release gate into `npm run release:check`. The goal is to prevent the same class of failures from returning as the product adds dimensions: row counts masquerading as quality, hollow dossiers marked ready, divergent metric math between dashboard and chat, and surface-specific answer paths that bypass the shared substrate.

## Layer Impact

- `global-control-lane`: Adds a cross-surface release rule for Home, Intelligence, Tower, Source, Moves, semantic2 dossiers, answer shapers, and quality harnesses.
- Standards layer: Establishes the North-Star contract: one path, content-gated readiness, contract computed once, deterministic facts with model prose, continuous proof, populated-content capacity, and locked control plane.
- Release-control layer: Extends `release:check` so changes to answer/substrate paths must explicitly document the north-star impact in the release record.

## Client Applicability

- All clients: Yes. The gate applies to shared product quality and release discipline.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `docs/standards/NORTH_STAR_SCALE_QUALITY_CONTRACT.md`.
- Adds `scripts/release-control/check-north-star-quality-contract.mjs`.
- Updates `scripts/release-check.mjs` to run the new gate.

## QA / Validation

- Pass planned: `node scripts/release-control/check-north-star-quality-contract.mjs`.
- Pass planned: `npm run release:check`.
- The release record explicitly documents the required terms for the new gate: north-star, one path, content-gated readiness, contract computed once, and proof is continuous.

## Rollout Plan

Merge to `main`. The enforcement becomes active immediately in CI and local `npm run release:check`. No runtime deploy, database migration, feature flag, or tenant data load is required.

## Deployment Authority

- Repo-owned deploy workflow: Not required; this is a CI/release-control change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not applicable; this release changes release-control policy, not runtime UI.

## Rollback Plan

Revert this PR. `release:check` returns to the prior gates and the North-Star standard remains absent unless separately restored.

## Audit Evidence

- Standard: `docs/standards/NORTH_STAR_SCALE_QUALITY_CONTRACT.md`.
- Gate script: `scripts/release-control/check-north-star-quality-contract.mjs`.
- Release-check wiring: `scripts/release-check.mjs`.
- Validation commands listed above.

## Known Gaps

This is a release-control and standards gate, not the full implementation of content-gated dossier readiness, metric-contract unification, or continuous browser proof. Those closures still need implementation PRs against the semantic2, Home, Intelligence, and Tower runtime paths.
