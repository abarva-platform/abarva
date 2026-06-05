# 2026-06-05-databricks-modernization-quality-hardening — Databricks Modernization Quality Hardening

## Release ID

`2026-06-05-databricks-modernization-quality-hardening`

## Status

`candidate`

## Plain-English Summary

Strengthens the healthcare modernization corpus and agent QA curriculum so Sentinel, Nexus, Atlas, Source, and Steward can answer CDAO-grade Azure Databricks modernization questions without inventing exact counts. The change teaches the agents how to discuss Epic and ERP ingestion, external healthcare datasets, silver and gold data products, metadata-driven ETL, Unity Catalog governance, DBU/TCO controls, and SI bid proof in clear executive language.

## Layer Impact

`global-control-lane`: Adds a shared agent-grounding golden deck and training documentation that apply to the common agent QA harness.

`client-data-lane`: Updates Meridian healthcare modernization corpus artifacts that are import-ready through the governed loader path. No production tenant data is mutated by this PR.

## Client Applicability

- All clients: The agent QA harness and documentation are shared.
- Specific clients: The new 100-case golden deck is Meridian Health focused.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updated `scripts/corpus/generated/healthcare-meridian-wave6/generate-healthcare-meridian-wave6.mjs` so generated modernization overlays include explicit Azure Databricks, Unity Catalog, medallion, Epic, ERP, DBU/TCO, Lakebridge, and metadata-driven ETL vocabulary.
- Regenerated the six Meridian wave-6 overlay JSONL files plus their healthcare hardening audit outputs.
- Added `docs/build/DATABRICKS_MODERNIZATION_QUALITY_HARDENING_2026-06-05.md`.
- Added `tests/agent-grounding/curriculum/databricks-modernization-golden.jsonl` with 100 Meridian modernization cases.
- Updated `tests/agent-grounding/__tests__/curriculum.test.ts` to enforce the 100-case golden deck and required healthcare modernization terms.
- Updated `docs/agent-training/AGENT_GROUNDING_TRAINING_SPINE.md` with the Databricks modernization training path.

## QA / Validation

- PASS: `npx jest tests/agent-grounding/__tests__/curriculum.test.ts --runInBand`.
- PASS: `npm run qa:agent-grounding:dry -- --tenant meridian-health --limit 10`.
- PASS: `npm run qa:agent-grounding:dry -- --tenant meridian-health` includes `dbx-mod-001` through `dbx-mod-100`.
- PASS: generated corpus term-count smoke for Databricks, Unity Catalog, Lakebridge, DBU/TCO, Epic Clarity, Caboodle, ERP, medallion, and Delta tables.
- PASS: `git diff --check`.
- PASS: `node --check scripts/corpus/generated/healthcare-meridian-wave6/generate-healthcare-meridian-wave6.mjs`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main. The QA curriculum and docs become available immediately. The generated corpus overlays are not loaded into production by this PR; they remain governed-loader input artifacts until an approved loader run imports them.

## Rollback Plan

Revert the PR. This removes the new golden deck, documentation, and generated overlay text changes without touching live tenant data.

## Audit Evidence

- Agent grounding curriculum file: `tests/agent-grounding/curriculum/databricks-modernization-golden.jsonl`.
- Modernization quality doctrine: `docs/build/DATABRICKS_MODERNIZATION_QUALITY_HARDENING_2026-06-05.md`.
- Generator source: `scripts/corpus/generated/healthcare-meridian-wave6/generate-healthcare-meridian-wave6.mjs`.

## Known Gaps

This PR does not prove Meridian's live Epic object count, ERP table count, integration count, report count, or Databricks job count. Those must come from the governed admin loader after the real Meridian context inventory is loaded.
