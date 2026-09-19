# 2026-09-05-moves-rich-context-deep-fixture - Moves Rich-Context Deep Fixture Pack

## Release ID

`2026-09-05-moves-rich-context-deep-fixture`

## Status

`candidate`

## Plain-English Summary

Adds a deeper unloaded synthetic evidence pack for testing Moves rich-context ingestion, packing, and generated-artifact citation behavior. The pack gives testers structured CSV/XLSX evidence and narrative Markdown/DOCX evidence with enough internal friction to catch shallow or dishonest prompt coverage.

## Layer Impact

- Release lane: `global-control-lane` for shared internal Moves fixture/testing assets. No client data lane is touched.
- Layer 1 Client Intake: adds synthetic fixture extracts only.
- Layer 2 Source Adapters: no adapter behavior changes.
- Layer 3 Canonical Enterprise Model: no schema, migration, or canonical data changes.
- Layer 4 Products: no runtime product behavior changes.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: fixture generation and validation for internal Moves testing.
- Public/demo only: no live demo surface change.
- Feature flag: none.

## Changes Included

- `scripts/moves/build_population_health_deep_pack.py`
- `scripts/moves/validate_population_health_deep_pack.py`
- `docs/status/moves-rich-context/fixtures/population-health-command-center/`
- `docs/status/moves-rich-context/STATUS.md`
- `package.json` scripts for rebuilding and validating the fixture pack

## QA / Validation

- PASS: `npm run moves:rich-context-pack:build`
- PASS: `npm run moves:rich-context-pack:validate`
- The validator re-opens generated XLSX files with `openpyxl`, re-opens DOCX files with `python-docx`, reconciles care-gap totals, checks upload references, and scans text files for prohibited location/client hints.

## Rollout Plan

Merge by PR. No Azure Container Apps deployment, database migration, feature flag, or tenant data load is required for this docs/fixture/script change.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to remove the fixture pack and generator/validator scripts.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7367
- Local validation report: `docs/status/moves-rich-context/fixtures/population-health-command-center/validation-report.md`
- Machine-readable validation report: `docs/status/moves-rich-context/fixtures/population-health-command-center/validation-report.json`

## Known Gaps

This release does not load the fixture into any tenant, does not prove live prompt coverage, and does not implement any auto-commit or approval-gate decision.
