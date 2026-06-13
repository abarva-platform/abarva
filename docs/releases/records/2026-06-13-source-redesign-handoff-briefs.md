# 2026-06-13-source-redesign-handoff-briefs — Source Redesign Handoff Briefs

## Release ID

`2026-06-13-source-redesign-handoff-briefs`

## Status

`candidate`

## Plain-English Summary

This release records the Source redesign execution briefs that were prepared for autonomous implementation planning, plus the HTML companion for the Apex Retail Source CXO testing brief. It does not change Source product behavior; it preserves design, testing, and execution evidence so the backlog can be reviewed without stale open PR clutter.

## Layer Impact

- `internal-admin` lane and `public-demo` lane are affected.
- `internal-admin`: Adds execution handoff material for AbarVa operators and agents.
- `public-demo`: Adds a buyer-facing HTML companion artifact for the Apex Retail Source CXO testing brief.

No runtime code, database schema, tenant data, ingestion path, or Azure infrastructure layer changes are included.

## Client Applicability

- All clients: None.
- Specific clients: Apex Retail only for the CXO testing brief artifact.
- Internal only: Source redesign autonomous execution briefs.
- Public/demo only: CXO primer HTML artifact.
- Feature flag: None.

## Changes Included

- Adds `docs/build/codex-handoff/2026-06-04-SOURCE_REDESIGN_WAVE_1_AUTONOMOUS.md`.
- Adds `docs/build/codex-handoff/2026-06-04-SOURCE_REDESIGN_FULL_AUTONOMOUS.md`.
- Adds `docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.html`.
- Preserves current-main Source design docs instead of reintroducing older duplicate copies from the original PR.

## QA / Validation

- PASS: `npm run release:check` must pass before merge.
- PASS: `npm run validate:context-corpus` must pass before merge.
- PASS: GitHub CI must pass before merge.

No browser QA or Azure validation is required because this is documentation and static evidence only.

## Rollout Plan

Merge to `main`. No Azure Container Apps deployment, database migration, feature flag, operator job, or traffic change is required.

## Rollback Plan

Revert the merge commit to remove the added documentation artifacts. No runtime rollback is needed.

## Audit Evidence

- PR #3045 after repair.
- This release record.
- GitHub CI checks on the repaired branch.

## Known Gaps

The original PR also contained Source design package files that are already present on current `main`; those duplicate/stale files were intentionally not re-landed in this repaired branch.
