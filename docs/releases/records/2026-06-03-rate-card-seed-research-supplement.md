# 2026-06-03-rate-card-seed-research-supplement — Rate-card Seed Research Supplement

## Release ID

`2026-06-03-rate-card-seed-research-supplement`

## Status

`candidate`

## Plain-English Summary

Adds a machine-readable research supplement for the Moves rate-card workbook and future seed population. The supplement resolves the BLS bulk-download blocker for targeted extraction by using the official BLS Public Data API, records verified national wage-spine rows, records software-developer metro labor-ratio evidence, and keeps unresolved vendor/offshore gaps explicit.

## Layer Impact

`global-control-lane`: Adds research/data documentation only. No runtime code, database schema, routes, migrations, or UI behavior changes.

## Client Applicability

- All clients: Future rate-card research and workbook population can use this evidence spine.
- Specific clients: None.
- Internal only: This is an internal build/research artifact under `docs/build/`.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/build/MOVES_RATE_CARD_SEED_RESEARCH_SUPPLEMENT_2026-06-03.json`.
- Added this release record.

## QA / Validation

- Passed: `python3 -m json.tool docs/build/MOVES_RATE_CARD_SEED_RESEARCH_SUPPLEMENT_2026-06-03.json`
- Passed: `git diff --check`
- Passed after this QA wording fix: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No deployment or data-plane rollout is required because this is docs/data-only.

## Rollback Plan

Revert the docs/data commit or remove the supplement and release record. No migration rollback is required.

## Audit Evidence

- Official BLS OEWS table index: `https://www.bls.gov/oes/tables.htm`
- Official BLS time-series directory: `https://download.bls.gov/pub/time.series/oe/`
- Official BLS Public Data API: `https://api.bls.gov/publicAPI/v2/timeseries/data/`
- Official BLS ECEC release: `https://www.bls.gov/news.release/ecec.nr0.htm`
- Supplement file: `docs/build/MOVES_RATE_CARD_SEED_RESEARCH_SUPPLEMENT_2026-06-03.json`

## Known Gaps

- Direct shell downloads from `download.bls.gov` still return HTTP 403 in this environment; targeted official extraction works through the BLS Public Data API.
- The supplement is not a full production `seed.json`.
- Offshore vendor/SI rates still require named public schedules, buyer invoice history, or tenant upload before population.
