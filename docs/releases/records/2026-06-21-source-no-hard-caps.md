# 2026-06-21-source-no-hard-caps — Source artifact profiles: no hard caps update

## Release ID

`2026-06-21-source-no-hard-caps`

## Status

`candidate`

## Plain-English Summary

The first documentation standards layer set hard word/slide/section caps on all 40 Source artifacts. The founder brief "No Hard Caps Update" corrects this: the problem is not length — it is mechanical, AI-like, template-driven writing. Depth is allowed when the decision, audience, commercial risk, or delivery complexity requires it.

This PR makes three targeted changes to the documentation standards layer:

**1. Profile fields replaced**
- Removed `maxWords`, `maxSlides`, `maxSections` from the `SourceArtifactProfile` interface and all 40 profiles.
- Added `riskDepth` (low / medium / high / board-grade) — controls how much evidence, controls, and detail are justified per artifact.
- Added `readerMode` (executive-narrative / decision-brief / vendor-pack / workbook-log / html-cockpit / internal-binder) — defines the structural reader experience.

**2. QA gates replaced**
- Removed `length_discipline` gate (was warning-only but still referenced hard caps as a failure signal).
- Renamed `executive_readability` → `decision_clarity` (same logic, cleaner name).
- Renamed `banned_terms` → `mechanical_language` (same logic, expresses the quality intent).
- Renamed `missing_input_consolidation` → `no_placeholder_spam`.
- Renamed `no_fabrication` → `evidence_discipline`.
- Added `human_consultant_voice` gate (warning): detects generic template filler phrases ("the purpose of this document", "framework overview", etc.) that signal AI-template authoring.
- Added `exhibit_interpretation` gate (warning): detects tables/scorecards/matrices without a "what this means for the decision" interpretation.
- Result: 9 gates (was 8): 3 blockers + 6 warnings.

**3. Language policy block updated**
- `buildLanguagePolicyBlock()` now injects `riskDepth` and `readerMode` into generation prompts.
- Adds the master quality prompt from Section 6 of the brief: layered-detail instruction, "What this means for the decision" after every exhibit, consultant-voice quality bar, no arbitrary shortening for board-grade artifacts.

## Layer Impact

- **global-control-lane**: changes to 3 files under `src/lib/source/documentation-standards/`. No schema, migration, route, or environment change.

## Client Applicability

All clients: standards apply to all Source artifact generation regardless of tenant.

## Changes Included

- `src/lib/source/documentation-standards/source-artifact-profiles.ts`: interface updated, all 40 profiles updated (max* removed, riskDepth + readerMode added)
- `src/lib/source/documentation-standards/source-documentation-standards.ts`: 9 QA gates (3 blockers, 6 warnings), updated `buildLanguagePolicyBlock`, new LANGUAGE_REPLACEMENTS entries (P1–P5 stage names, [CLIENT TO COMPLETE])
- `src/lib/source/documentation-standards/__tests__/source-documentation-standards.test.ts`: 30 tests (was 25), added: no-maxWords enforcement test, human_consultant_voice tests, exhibit_interpretation tests, riskDepth/readerMode presence tests

## QA / Validation

- TypeScript: PASS — `tsc -p tsconfig.json --noEmit` clean
- Tests: PASS — 30/30 (`npx jest src/lib/source/documentation-standards`)
- Release check: PASS

## Deployment Authority

- Repo-owned deploy workflow: aca-main-deploy auto-deploys on push to main
- Shared runtime mutators: none
- Env var change required: none
- Live signed-in proof required: no (library only; proof deferred to generation wiring)

## Rollout Plan

1. Merge PR to `feat/source-documentation-standards` (squash) — amends the open PR in place
2. That PR auto-merges to main; ACA auto-deploys
3. Library-only change; no observable product change until generation prompts are wired

## Rollback Plan

Revert to previous commit on `feat/source-documentation-standards`. Library-only; no runtime impact.

## Known Gaps

- Generation prompts are not yet bound to profiles
- QA gates are not yet wired into the artifact save path
- Three golden reference samples (Strategy Memo, RFP Executive Summary, Executive Award Recommendation) are not yet authored

## Audit Evidence

- PR URL: (assigned on merge)
- CI: tsc + 30-test suite
- Post-deploy: library-only; no ACA proof required
