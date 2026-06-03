# 2026-06-03-moves-modernization-research-spine — Moves Rate Card + Modernization Research Spine

## Release ID

`2026-06-03-moves-modernization-research-spine`

## Status

`candidate`

## Plain-English Summary

Strengthens the Moves rate-card and data-platform modernization program with a deeper cited research
spine before the next build slices populate workbook seeds or wire runtime ingestion. The change
keeps the platform honest: official wage, benefits, geo, SI rate, Databricks methodology, migration
disposition, and RFP-scorecard sources are documented with confidence and extraction status.

## Layer Impact

- `global-control-lane`: Research and release-governance documentation for the shared Moves
  estimator and modernization pattern-pack program. No runtime route, schema, data-plane, or UI
  behavior changes.
- `client-data-lane`: Future tenant-specific rate-card and analyzer-inventory loads are informed by
  this research, but no client data is loaded or modified by this release.

## Client Applicability

- All clients: Applies as shared planning/research guidance for future Moves estimation and
  modernization pattern-pack builds.
- Specific clients: None.
- Internal only: AbarVa engineering, product, and research operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updated `docs/build/MOVES_RATE_CARD_RESEARCH_NOTES_2026-06-03.md` with source URLs, calibration
  rules, ECEC-derived overhead, GSA ceiling-proxy posture, and source-ledger field requirements.
- Added `docs/build/MOVES_RATE_CARD_SOURCE_LEDGER_2026-06-03.json` as a machine-readable evidence
  ledger for official statistics, public contract ceiling rates, Databricks methodology, 7-R
  disposition, and best-value source-selection anchors.
- Added `docs/build/MODERNIZATION_RESEARCH_NOTES_2026-06-03.md` covering Databricks/Lakebridge
  methodology, Well-Architected pillars, 7-R disposition treatment, scorecard logic, industry-profile
  calibration, and open research gaps.

## QA / Validation

- `node -e "JSON.parse(require('fs').readFileSync('docs/build/MOVES_RATE_CARD_SOURCE_LEDGER_2026-06-03.json','utf8')); console.log('source-ledger-json-ok')"` — passed.
- `git diff --check` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed.

## Rollout Plan

Merge to `main`. This is a docs/research spine only; no Vercel runtime deploy validation is required
for functional behavior, though normal CI and deploy checks may still run.

## Rollback Plan

Revert the documentation commit. No migrations, feature flags, environment variables, or runtime
data changes are involved.

## Audit Evidence

- PR URL: pending.
- Source documents:
  - BLS OEWS May 2025 tables: `https://www.bls.gov/oes/tables.htm`
  - BLS ECEC December 2025: `https://www.bls.gov/news.release/ecec.nr0.htm`
  - BEA RPP 2024: `https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area`
  - GSA CALC+: `https://buy.gsa.gov/pricing/calc`
  - Tata America/TCS GSA MAS price list: `https://www.taic.us.com/content/dam/tata-america/pdfs/taic-gsa-mas-tcs-pricing.pdf`
  - Databricks Lakebridge overview: `https://databrickslabs.github.io/lakebridge/docs/overview/`
  - Databricks Well-Architected framework: `https://docs.databricks.com/aws/en/lakehouse-architecture/well-architected`
  - AWS 7 Rs migration strategies: `https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html`
  - FAR Subpart 15.1 source selection: `https://origin-www.acquisition.gov/far/subpart-15.1`

## Known Gaps

- The research ledger is not a production seed. OEWS bulk extraction is still blocked from this
  environment and must be completed before populating workbook/seed rows.
- Offshore SI delivery rates still require second-source evidence before being treated as anything
  above low/medium confidence.
- Phase 2 still needs source-type-specific Lakebridge/BladeBridge automation benchmarks and a
  Lakebridge-style sample inventory for tests.
