# 2026-07-01-lakeshore-v6-holdco-realignment — Lakeshore V6 Holdco Data Realignment

## Release ID

`2026-07-01-lakeshore-v6-holdco-realignment`

## Status

`candidate`

## Plain-English Summary

This release realigns the Lakeshore synthetic V6 data files around the actual product story: Lakeshore Holdings is a holding company with Corporate Shared Services, Corporate IT, a Corporate Innovation IT and Data AI group, and four portfolio companies that each have their own local IT leadership, systems, vendors, budgets, and programs.

The pack now separates direct IT budget from shared-services allocation and value measures, so Tower can avoid double-counting spend or treating value-at-stake as budget.

## Layer Impact

- `client-data-lane`: Updates Lakeshore-only synthetic V6 source files and adds a holdco/Tower supplemental source pack. No database mutation is included.
- `global-control-lane`: Adds repeatable generation and validation scripts for the Lakeshore holdco model; no runtime route or UI behavior changes.

## Client Applicability

- All clients: No direct data change.
- Specific clients: Lakeshore Holdings synthetic V6 dataset only.
- Internal only: Generation and validation scripts.
- Public/demo only: Synthetic demo data pack.
- Feature flag: None.

## Changes Included

- Added `scripts/lakeshore/generate-lakeshore-v6-holdco-pack.mjs`.
- Added `scripts/lakeshore/validate-lakeshore-v6-holdco-pack.mjs`.
- Replaced Lakeshore V6 template rows with holdco-aware synthetic rows across V6_01 through V6_16.
- Added `datasets/lakeshore-industries-synthetic-v6/holdco_tower/` with explicit entity hierarchy and dashboard metric mapping.
- Updated Lakeshore V6 README, generated manifest, and metadata dictionary labels from legacy demo wording to Lakeshore Holdings.

## QA / Validation

- `node scripts/lakeshore/generate-lakeshore-v6-holdco-pack.mjs`
  - Result: Passed. Generated Lakeshore Holdings V6 source files and holdco supplemental files.
- `node scripts/lakeshore/validate-lakeshore-v6-holdco-pack.mjs`
  - Result: Passed. Wrote `out/lakeshore-v6-holdco-validation.json`.
  - Validated: tenant key, display name, no blank cells, no legacy `Industrial Demo` label, portfolio-company coverage, IT leadership coverage, system ownership coverage, amount-type classification, non-additive allocation/component rules, program/value coverage, and relationship coverage.
- `rg -n "Industrial Demo|Lakeshore Industries|large private global industrial" datasets/lakeshore-industries-synthetic-v6`
  - Result: No matches.

## Rollout Plan

Merge to `main`. This does not become live data until a future governed ingestion/load job explicitly reads these files and refreshes the Azure data plane. No ACA deployment is required for this data-file-only candidate.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this file-only data candidate.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this file-only candidate. Required later when these files are ingested and wired to Tower.

## Rollback Plan

Revert this commit. Since no database migration or live load is included, rollback is source-only.

## Audit Evidence

- Validation proof: `out/lakeshore-v6-holdco-validation.json`.
- Download package: `lakeshore-v6-holdco-realigned-20260701.zip` can be generated from the updated dataset and proof output.

## Known Gaps

These files are not loaded to Azure/Postgres in this release. The next release must run the governed ingestion path, refresh Tower/semantic read models, and prove dashboard/chat parity against the loaded rows.
