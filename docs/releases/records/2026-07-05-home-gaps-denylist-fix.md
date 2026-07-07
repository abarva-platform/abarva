# 2026-07-05-home-gaps-denylist-fix — Fix Home evidence-gap regression; use validated denylist

## Release ID

`2026-07-05-home-gaps-denylist-fix`

## Status

`candidate`

## Plain-English Summary

Hotfix for `2026-07-05-home-gaps-required-fields` (#4438). That change tried a
`column_registry.required_level` contract query first, but in the live V7 schema
that query returned zero rows for every dimension — either the required columns
are all populated, or the column-name↔jsonb-key join does not match (cannot be
diagnosed without direct DB access). The per-dimension code then silently fell
back to the ≤12-row preview sample, which reverted every dimension's "evidence
gaps" number to the old inflated value (the recurring "14"). Confirmed live on
`app.abarva.ai/home`.

This removes the ambiguous `required_level` path and keeps only the deterministic
provenance/reference denylist (validated directly against the live V7 CSVs). It
also fixes the fallback: when the full-dimension aggregate runs successfully, a
dimension with no returned gap rows now reads as **0**, instead of silently
falling back to the inflated preview sample. The sample is used only if the
aggregate query itself throws.

## Layer Impact

- `global-control-lane`: read adapter (`src/lib/home/v7-context-browser.ts`) for
  all V7 Home tenants. No schema/RLS/write changes.

## Client Applicability

- All clients: Yes — every tenant on the V7 Home pack.
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/lib/home/v7-context-browser.ts`: `loadGapRows()` simplified to the
  denylist query; `gapLoadOk` gate so an empty full-dimension result reads as 0
  and only a thrown aggregate falls back to the preview sample.
- `src/lib/home/__tests__/v7-context-browser.test.ts`: tests for denylist
  counting, the zero-gap (regression) case, and the throw→sample fallback.

## QA / Validation

- `jest` v7-context-browser (5) + HomeSurface (7) → all green.
- Denylist counts validated against live V7 CSVs: Business Functions 30→5,
  Vendors 88→13, Applications 259→124, Enterprise Profile 2→1.
- `eslint` clean; `tsc --noEmit` 0 errors.
- Live signed-in QA on `app.abarva.ai/home` after ACA deploy: confirm the
  dropdown gap numbers reflect the denylist (no recurring "14").

## Rollout Plan

Merge to `main` → ACA image build/deploy to `ca-abarva-web-lab-eastus` from the
merge SHA → 100% ingress after healthy.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy (serialized; asserts HEAD==origin/main).
- Shared runtime mutators: none.
- Approved image digest: recorded at deploy time.
- ACA runtime invariant: new revision at 100% only after healthy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes.

## Rollback Plan

ACA traffic set to the prior healthy revision. No migrations.

## Audit Evidence

- PR URL (added on open).
- CI: jest + eslint + tsc above.
- Live: `app.abarva.ai/home` dropdown gap numbers before vs after.

## Known Gaps

- The denylist path can still count structurally-optional columns
  (`parent_entity_name` blank for a top-level entity, `source_of_record_for`) as
  gaps. A true required-field contract via `intelligence_v7.column_registry`
  remains the complete fix but must be verified against the live schema (VNet
  query) before it can be trusted — the blind attempt in #4438 regressed.
  See [[project_home_context_explorer_v7]].
