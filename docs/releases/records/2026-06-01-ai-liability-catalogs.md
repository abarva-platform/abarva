# 2026-06-01-ai-liability-catalogs — Cross-Module AI Liability Catalogs

## Release ID

`2026-06-01-ai-liability-catalogs`

## Status

`candidate`

## Plain-English Summary

Adds two audit catalogs for the AI liability backlog: one inventory of consequential actions across Intelligence, Moves, Source, Tower, and Setup, and one inventory of generated or agent-authored UI elements. These documents turn T231 and T232 into a concrete control baseline for the remaining module retrofits.

## Layer Impact

- `internal-admin`: Adds control documentation and updates the pilot readiness tracker.
- `global-control-lane`: No runtime behavior change, but the catalogs define follow-up control requirements for shared product surfaces.

## Client Applicability

- All clients: No runtime change; future controls driven by these catalogs will apply by module and lane.
- Specific clients: None.
- Internal only: Catalog docs and tracker status.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md` catalogs consequential action paths, current controls, and required next controls.
- `docs/legal/AI_GENERATED_UI_CATALOG.md` catalogs generated-output UI paths, labels, evidence/citations, confidence/assumption disclosure, and required next controls.
- `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` marks T231-T232 as done for PR #2723.
- `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx` was updated locally with the same T231-T232 tracker notes for Anand's working copy.

## QA / Validation

- Passed: `git diff --check`
- Passed: workbook inspection for `Plan!A21:M22` in `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` and `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx`
- Passed: `npm run release:check -- --base origin/main --head HEAD` (release-control reported no release-relevant runtime files changed)

## Rollout Plan

Merge to main after CI is green. No runtime deployment, migration, feature flag, or tenant action is required.

## Rollback Plan

Revert the PR to remove the catalog docs and tracker status update. No data rollback is required.

## Audit Evidence

- Pull request: https://github.com/anandsundaram-hash/abarva/pull/2723
- Explorer audit outputs for T231 and T232 reviewed in-thread.
- Tracker evidence: `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` rows T231-T232.

## Known Gaps

The catalogs identify follow-up work; they do not implement the Source, Tower, Setup, or CI enforcement controls. Rows T238-T245 and T250 remain follow-on execution items.
