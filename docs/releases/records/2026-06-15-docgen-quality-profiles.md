# 2026-06-15-docgen-quality-profiles — Tunable Quality Budgets for Board-Grade Deliverables

## Release ID

`2026-06-15-docgen-quality-profiles`

## Status

`candidate`

## Plain-English Summary

Board-grade deliverable generation now has explicit quality profiles. The default profile keeps the current safe six-pass token ceilings, while real engagement and premium final profiles can be enabled by environment flag when AbarVa is producing a high-value client artifact where spending more on Claude is acceptable. This removes hidden hardcoded 16k pass limits from the orchestrator and makes quality/cost posture centrally controlled.

## Layer Impact

- `global-control-lane`: document-generation policy now owns both tier model selection and six-pass token budgets.
- `ai-egress-lane`: Claude calls receive pass token budgets from the central policy, including larger budgets for approved engagement/final profiles.
- `experimental`: no global rollout change; higher-cost profiles remain operator-controlled through environment configuration.

## Client Applicability

- All clients: default `standard` profile preserves existing safe pass budgets.
- Specific clients: none automatically receive premium budgets.
- Internal only: operators can set `ABARVA_DOCGEN_QUALITY_PROFILE=real_engagement` or `premium_final` for named validation or client work.
- Public/demo only: none.
- Feature flag: no product feature flag added; this is controlled by document-generation environment settings.

## Changes Included

- Added `ABARVA_DOCGEN_QUALITY_PROFILE` with `standard`, `real_engagement`, and `premium_final` profiles.
- Added central per-pass budget resolution for the six-pass orchestrator.
- Added pass override environment variables and a global max-pass cap.
- Wired `prompt-builder.ts` to use policy budgets instead of hardcoded pass limits.
- Updated `docs/build/DOCUMENT_GENERATION_MODEL_POLICY.md` with the quality-profile contract.
- Added tests for standard, real engagement, premium final, and pass cap behavior.

## QA / Validation

- PASS — Focused Jest tests for document-generation policy and orchestrator prompt budget behavior: 3 suites / 36 tests passed.
- PASS — ESLint on touched TypeScript files.
- PASS — `git diff --check`.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main and deploy through the normal Azure Container Apps build. Runtime remains on `standard` unless an operator sets `ABARVA_DOCGEN_QUALITY_PROFILE`. For a real engagement, set `ABARVA_DOCGEN_QUALITY_PROFILE=real_engagement`; for a final board/executive pack, set `ABARVA_DOCGEN_QUALITY_PROFILE=premium_final` and regenerate the artifact with trace review.

## Rollback Plan

Unset `ABARVA_DOCGEN_QUALITY_PROFILE` to return to the standard profile immediately. If code rollback is required, revert this PR; the orchestrator will return to its previous hardcoded pass budgets.

## Audit Evidence

- PR for this release record.
- CI checks and focused tests.
- Post-deploy generation traces should show higher `maxTokens` values only when the profile is explicitly enabled.

## Known Gaps

This PR raises and centralizes the budget controls. It does not implement slide-batch orchestration for very large 50-slide decks; that remains the correct next step for full PowerPoint package generation.
