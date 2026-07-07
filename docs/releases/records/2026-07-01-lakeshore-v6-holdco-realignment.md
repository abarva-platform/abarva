# 2026-07-01-lakeshore-v6-holdco-realignment — Lakeshore V6 Holdco Data Realignment

## Release ID

`2026-07-01-lakeshore-v6-holdco-realignment`

## Status

`candidate`

## Plain-English Summary

This release realigns the Lakeshore synthetic V6 data files around the actual product story: Lakeshore Holdings is a holding company with Corporate Shared Services, Corporate IT, a Corporate Innovation IT and Data AI group, and four portfolio companies that each have their own local IT leadership, systems, vendors, budgets, and programs.

The pack now separates direct IT budget from shared-services allocation and value measures, so Tower can avoid double-counting spend or treating value-at-stake as budget. It also adds a governed sync into the existing Tower standardized ingestion package, so the `cio_tower` loader can read the rebuilt V6 holdco facts instead of the older Lakeshore Tower package.

## Layer Impact

- `client-data-lane`: Updates Lakeshore-only synthetic V6 source files, adds a holdco/Tower supplemental source pack, and regenerates the Lakeshore standardized Tower ingestion files from V6.
- `global-control-lane`: Adds repeatable generation, validation, and sync scripts for the Lakeshore holdco model. Updates Tower aVa starter questions to use executive-grade CIO prompts. Adds an env-based tenant filter to the governed Tower standardized loader so private operator runs can load one tenant safely.

## Client Applicability

- All clients: No direct data change.
- Specific clients: Lakeshore Holdings synthetic V6 dataset only.
- Internal only: Generation and validation scripts.
- Public/demo only: Synthetic demo data pack.
- Feature flag: None.

## Changes Included

- Added `scripts/lakeshore/generate-lakeshore-v6-holdco-pack.mjs`.
- Added `scripts/lakeshore/validate-lakeshore-v6-holdco-pack.mjs`.
- Added `scripts/lakeshore/sync-lakeshore-v6-to-tower-standardized.mjs`.
- Replaced Lakeshore V6 template rows with holdco-aware synthetic rows across V6_01 through V6_16.
- Added `datasets/lakeshore-industries-synthetic-v6/holdco_tower/` with explicit entity hierarchy and dashboard metric mapping.
- Regenerated Lakeshore files under `tower-standardized-v1/lakeshore-industries/` that feed `cio_tower.source_registry`, `cio_tower.entities`, `cio_tower.facts`, `cio_tower.relationships`, and `cio_tower.measure_results`.
- Added `TOWER_STANDARDIZED_TENANTS` support to `scripts/tower/load-cio-tower-standardized-v1.mjs` for scoped private-operator loads.
- Updated Tower aVa pinned starter questions to focus on portfolio-company rollups, value proof, CIO inspection, run/change pressure, vendor exposure, AI-spend classification, and board-readiness evidence.
- Updated Lakeshore V6 README, generated manifest, and metadata dictionary labels from legacy demo wording to Lakeshore Holdings.

## QA / Validation

- `node scripts/lakeshore/generate-lakeshore-v6-holdco-pack.mjs`
  - Result: Passed. Generated Lakeshore Holdings V6 source files and holdco supplemental files.
- `node scripts/lakeshore/validate-lakeshore-v6-holdco-pack.mjs`
  - Result: Passed. Wrote `out/lakeshore-v6-holdco-validation.json`.
  - Validated: tenant key, display name, no blank cells, no legacy `Industrial Demo` label, portfolio-company coverage, IT leadership coverage, system ownership coverage, amount-type classification, non-additive allocation/component rules, program/value coverage, and relationship coverage.
- `rg -n "Industrial Demo|Lakeshore Industries|large private global industrial" datasets/lakeshore-industries-synthetic-v6`
  - Result: No matches.
- `node scripts/lakeshore/sync-lakeshore-v6-to-tower-standardized.mjs`
  - Result: Passed.
  - Synced rows: 15 initiatives, 34 contract/spend lines, 5 budget lines, 75 FY26 facts, 5 FY2025 trend facts, 79 dictionary entities, 26 capability-system edges, 24 vendor-system edges.
  - Reconciled direct FY26 IT budget: `$190.6M`.
  - Confirmed allocated shared-services view: `$36.5M`, excluded from additive Tower facts.
- `node scripts/tower/load-cio-tower-standardized-v1.mjs --dry-run --tenant=lakeshore-industries`
  - Result: Passed.
  - Loader saw 49 source files, 98 entities, 80 facts, 65 relationships, 8 measures, 10 question contracts, and 8 measure results for Lakeshore only.
- Focused Tower surface test: `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`
  - Result: Passed, 12 tests.
- `npm run release:check`
  - Result: Passed.

## Rollout Plan

Merge to `main`. Then run the governed private-operator Tower load with `TOWER_STANDARDIZED_TENANTS=lakeshore-industries` so Azure/Postgres refreshes the Lakeshore `cio_tower` layers from the regenerated standardized package. Browser proof is required before calling the dashboard/chat path live.

## Deployment Authority

- Repo-owned deploy workflow: Required for the UI/test/runtime parts. The data load must run through the private ACA operator using a digest-pinned image that contains this release.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after the private operator load.

## Rollback Plan

Revert this commit for source rollback. If the private operator load has run, rerun the previous approved Tower standardized package/load or restore from the prior `cio_tower` measure/fact snapshot before assigning release-ready status.

## Audit Evidence

- Validation proof: `out/lakeshore-v6-holdco-validation.json`.
- Download package: `lakeshore-v6-holdco-realigned-20260701.zip` can be generated from the updated dataset and proof output.
- Local Tower loader dry-run proof: 49 source files, 98 entities, 80 facts, 65 relationships, and 8 measure results for `lakeshore-industries`.

## Known Gaps

At candidate time, these files are locally generated and loader-validated. Azure/Postgres load and signed-in dashboard/chat parity proof are still separate states and must be reported separately.
