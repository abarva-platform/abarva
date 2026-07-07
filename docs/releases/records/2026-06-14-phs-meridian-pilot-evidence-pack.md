# 2026-06-14-phs-meridian-pilot-evidence-pack — PHS/Meridian Strategy Evidence Pack

## Release ID

`2026-06-14-phs-meridian-pilot-evidence-pack`

## Status

`candidate`

## Plain-English Summary

Adds a PHI-free Meridian/PHA pilot evidence pack that maps Liran's health-plan use cases into reusable strategy templates, starter corpus patterns, and an Excel-tracked backlog. The pack is designed for AbarVa's strategy workflow: it captures aggregated, de-identified, source-aware current-state context for Moves rather than raw transactional healthcare data.

## Layer Impact

- `client-data-lane`: Adds Meridian Health synthetic pilot evidence templates, manifest entries, verification counts, and a pilot readiness workbook update.
- `global-control-lane`: Adds a release/audit record and a docs/build report clarifying the governed process for future pilot uploads.

## Client Applicability

- All clients: The template/process pattern is reusable for future client pilots after review.
- Specific clients: Meridian Health/PHA strategy pilot baseline.
- Internal only: The planning workbook and release record are internal operating artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- New `datasets/meridian-health-synthetic-v1/19-pilot-strategy-evidence-pack/` templates and starter corpus files.
- Updated Meridian synthetic dataset README, manifest, changelog, and expected verification counts.
- New `docs/build/phs-pilot/PHS_MERIDIAN_STRATEGY_EVIDENCE_PACK_2026-06-14.md`.
- Updated `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` with a `PHS Pilot Backlog` tab and master plan rows `T405`-`T411`.

## QA / Validation

- `npm run verify:meridian-data-pack` passed.
- `npm run verify:meridian-context-showcase` passed.
- Structural validation passed for the new template catalog JSON, starter corpus JSONL, and CSV templates.
- Workbook integrity check confirmed the `PHS Pilot Backlog` sheet and `T405`-`T411` master plan rows.
- `git diff --check` passed for the scoped text files.

## Rollout Plan

Merge to `main`. No runtime deploy, Azure mutation, migration, or `agent_ready` promotion is required for this repo-side template/backlog release. Future activation requires a separate governed Admin bulk upload rehearsal and live Azure retrieval/context-bundle proof.

## Rollback Plan

Revert this release commit to remove the new evidence pack, manifest/count updates, workbook changes, and docs/build report. No database rollback is required because this release does not mutate live data.

## Audit Evidence

- PR for this branch once opened.
- The validation commands listed above.
- `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx`, especially the `PHS Pilot Backlog` tab and `T405`-`T411` rows.
- `datasets/meridian-health-synthetic-v1/19-pilot-strategy-evidence-pack/README.md`.
- `docs/build/phs-pilot/PHS_MERIDIAN_STRATEGY_EVIDENCE_PACK_2026-06-14.md`.

## Known Gaps

- Starter corpus is authored but not yet loaded into the canonical governed corpus.
- No rows were promoted to `agent_ready`.
- Live Meridian retrieval and context-bundle proof still require an ACA/VNet job or Search data-plane role grant.
