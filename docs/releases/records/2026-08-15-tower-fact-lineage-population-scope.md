# 2026-08-15-tower-fact-lineage-population-scope - Tower Fact Lineage Population Scope

## Release ID

`2026-08-15-tower-fact-lineage-population-scope`

## Status

`candidate`

## Plain-English Summary

This candidate separates two different uses of the Tower fact lineage report. The default `quote` mode now evaluates only active tenant intake files, which are the governed population for deciding whether a number is safe to quote. A separate `migration-audit` mode still compares active intake against legacy standardized packs so migration drift remains visible without making retired or template-derived files look like competing client facts.

## Layer Impact

Release lane: `global-control-lane`.

Layer 3 / governance tooling: Adds an explicit population-scope declaration for fact-lineage reporting and teaches the report to honor it. The change does not alter tenant data, loaders, product read models, Source/Tower pages, model prompts, or runtime permissions.

## Client Applicability

- All clients: Applies to internal fact-lineage checks across configured tenant inputs.
- Specific clients: None.
- Internal only: Yes, this is governance/reporting behavior.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `datasets/tenant-inputs/fact-lineage-population-scope.json`
- `scripts/tower/fact-lineage-report.mjs`
- `docs/releases/records/2026-08-15-tower-fact-lineage-population-scope.md`

## QA / Validation

- PASS: `node --check scripts/tower/fact-lineage-report.mjs`.
- PASS: `node scripts/tower/fact-lineage-report.mjs` completed in default `quote` mode with active intake only and emitted `ABSENT 27`, `ONE_SOURCE 13`, `AGREE 2`, and no `CONFLICT` rows.
- PASS: `node scripts/tower/fact-lineage-report.mjs --mode migration-audit` completed with active plus legacy standardized packs and still emitted the six cross-tree conflicts, proving migration drift remains visible when explicitly requested.

## Rollout Plan

Merge through a PR. No Azure Container Apps runtime rollout, data-plane load, migration, feature flag, or signed-in browser proof is required because this is offline governance/reporting behavior. Operators should run default quote mode before quoting a metric, and `--mode migration-audit` when investigating drift between active intake and legacy standardized packs.

## Deployment Authority

- Repo-owned deploy workflow: Not required for script-only governance tooling.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the script, scope config, and release-record changes in a follow-up PR. No database or runtime rollback is required.

## Audit Evidence

- Local validation output from default quote mode.
- Local validation output from `--mode migration-audit`.
- PR diff for `scripts/tower/fact-lineage-report.mjs` and `datasets/tenant-inputs/fact-lineage-population-scope.json`.

## Known Gaps

The report still covers only configured headline metrics and configured source locations. Additional metrics should be added deliberately with their own population-scope expectations.
