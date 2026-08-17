# 2026-08-17-l3-entity-resolution-metrics — L3 Entity Resolution Metrics

## Release ID

`2026-08-17-l3-entity-resolution-metrics`

## Status

`candidate`

## Plain-English Summary

The canonical build now treats source rows as mentions and collapses matching mentions into distinct canonical entities. Relationship references are resolved against those canonical entity IDs and reported as resolved or unresolved, so the operator proof no longer uses row-count parity as evidence of integration.

## Layer Impact

- Lane: `client-data-lane`.
- Layer 1: No intake files change.
- Layer 2: No adapter output format changes.
- Layer 3: Canonical build semantics now produce distinct entities with source mention lineage and reference-resolution metrics.
- Layer 4: No product read model or mart changes. Product marts remain downstream projections of Layer 3.

## Client Applicability

- All clients: Applies to canonical build/operator scripts for active tenant inputs.
- Specific clients: None named in this public record.
- Internal only: Operator reports and dry-run proof semantics.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Canonical build drops row ordinals from canonical entity keys.
- Canonical build records source mentions on each distinct entity.
- Relationship candidates include source and target canonical keys when uniquely resolvable.
- Canonical and integrated refresh summaries replace row-integration metrics with source mentions, distinct entities, duplicate mentions collapsed, and reference-resolution rate.
- Candidate-version validation no longer treats mention collapse as low coverage.

## QA / Validation

- `npx tsx scripts/data-build/audit-canonical-data-build.ts` passed.
- `npx tsx scripts/data-build/refresh-runtime-layers.ts --tenant <scoped> --tenant <scoped> --out-dir <tmp> --build-version entity-resolution-local --input-source-version current-main --idempotency-key entity-resolution-local` passed in dry-run mode.
- `npx tsx scripts/data-build/build-candidate-version.ts` passed.
- `node scripts/data-build/run-integrated-layer-refresh.mjs --tenant <scoped> --tenant <scoped> --out-dir <tmp> --build-version entity-resolution-local --input-source-version current-main --idempotency-key entity-resolution-local` passed all dry-run phases.
- `npx eslint src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts src/lib/enterprise-data/candidate-version-build/candidate-version-build.ts scripts/data-build/audit-canonical-data-build.ts scripts/data-build/build-canonical-tenant-data.ts` passed.
- `node --check scripts/data-build/run-integrated-layer-refresh.mjs` passed.

## Rollout Plan

Merge through a normal PR. This is an operator-script/reporting change; it does not itself run a governed data write, materialize graph tables, refresh product marts, update retrieval indexes, or change runtime routes.

## Deployment Authority

- Repo-owned deploy workflow: May run after merge; no runtime code path is changed by this release.
- Shared runtime mutators: None.
- Approved image digest: Not applicable for this script-only candidate.
- ACA runtime invariant: Not required unless the repo-owned deploy workflow runs.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. No tenant data, canonical tables, product read models, retrieval indexes, feature flags, or runtime routes are mutated by this change.

## Audit Evidence

- Local canonical audit output reported source mentions, distinct entities, duplicate mentions collapsed, and reference-resolution counts.
- Local runtime-layer dry-run output reported planned canonical objects below represented source mentions, with graph writes disabled.
- Local integrated dry-run artifact path: `/tmp/nexus-integrated-entity-resolution.iuroDV/integrated-layer-refresh-run.md`.

## Known Gaps

- This does not perform the governed runtime refresh write/readback.
- This does not improve unresolved source references beyond uniquely resolvable canonical entity matches.
- This does not build or deploy product adapters, product marts, or retrieval indexes.
