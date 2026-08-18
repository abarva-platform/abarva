# 2026-08-18-organization-spelling-consistency — Match the product's house spelling

## Release ID

`2026-08-18-organization-spelling-consistency`

## Status

`candidate`

## Plain-English Summary

The orientation pack generator used British spelling ("organisation") in headings, questions, a
block id, and comments. Checked against the rest of Home and the design system: American spelling
is the clear, deliberate house style — 19 "organization" occurrences to 4 "organisation" across
Home, and all 4 were inside this session's own new code. Fixed throughout, including the internal
block id (`"organisation"` → `"organization"`) and its reference in the tab-to-block mapping.

This is a narrow, cosmetic-but-correctness fix: user-facing headings on a live product tab were
inconsistent with the rest of the product's spelling convention.

## Layer Impact

Lane: `global-control-lane`. Generator strings and one internal id, no schema or data change.

## Client Applicability

All clients — user-facing text on Home's "Who we are" and "Strategy" tabs.

## Changes Included

- `scripts/data-build/build-home-orientation-pack.ts` — spelling throughout headings, questions,
  labels, and comments.
- `src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts` — block id
  reference updated to match.
- `tests/behaviors/home-orientation-pack-validation.test.ts` — spelling in test descriptions.

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors.
- `npx jest tests/behaviors/home-orientation-pack-validation.test.ts` — PASS, 21/21.
- Confirmed zero remaining "organisation"/"Organisation" occurrences in all three changed files.

## Rollout Plan

Merge to `main`. Takes effect on the next orientation-pack regeneration; existing stored packs are
unaffected until then (this is generator code, not a data migration).

## Deployment Authority

Not applicable — no runtime image, flag, or shared configuration changed directly by this PR.

## Rollback Plan

Revert the commit. No data or schema is touched by this change — it edits string literals inside
the orientation-pack generator and one internal block id. Reverting restores the prior spelling on
the next regeneration; nothing needs to be undone in the database, since already-stored packs keep
whatever spelling they were generated with regardless of which version of the generator produces
the next one.

## Audit Evidence

PR link recorded at merge.

## Known Gaps

The wider codebase (100+ files, mostly pre-existing seed/knowledge-data content from earlier
sessions) has the same UK/US spelling split at a much larger scale. Out of scope here — that's a
separate, larger cleanup, not something to fix incidentally inside this change.
