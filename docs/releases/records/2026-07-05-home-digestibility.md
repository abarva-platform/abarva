# 2026-07-05-home-digestibility — Home dimension readability fixes

## Release ID

`2026-07-05-home-digestibility`

## Status

`candidate`

## Plain-English Summary

Readability fixes on the Home Context Explorer dimension view, from live review:

1. **Bug: source-file ordinal read as a count.** The data-derived Summary said
   "25 loaded records from 04 workforce personas" — but "04" is the source file's
   sequence number (`V7_04_workforce_personas.csv`), not a count of personas. It
   read as "from 4 personas," directly contradicting the 25-record count. The
   summary now says "25 loaded records across 1 source file," and
   `clientFacingFileName` strips the file ordinal everywhere (the Data-tab source
   chip now shows "vendors contracts", not "07 vendors contracts").
2. **Data preview grouped by entity.** Preview rows were shown in raw load order,
   so the same operating company appeared scattered down the table. They are now
   ordered by `entity_name` (the owning company), so rows cluster by who-owns-what
   and the table is scannable. Dimensions without an entity fall back to source
   order.
3. **Preview scope note moved above the table.** "Showing the first 8 of 25 rows,
   grouped by entity" now sits above the table instead of below it, so the
   preview framing is visible before the data.

## Layer Impact

- `global-control-lane`: Home surface (`HomeSurface.tsx`) + V7 read adapter
  (`v7-context-browser.ts`) for all V7 tenants. Presentation only; no
  schema/RLS/write changes.

## Client Applicability

- All clients: Yes — every tenant on the V7 Home pack.
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`: summary bullet uses source-file count
  not the mangled file name; `clientFacingFileName` strips the `V7_04_` ordinal;
  preview scope note moved above the table.
- `src/lib/home/v7-context-browser.ts`: preview query orders rows by
  `entity_name` (nulls last) so the preview groups by entity.
- `src/components/home/__tests__/HomeSurface.test.tsx`: updated summary + source
  chip assertions; guards that the file ordinal does not leak as a count.

## QA / Validation

- `jest` HomeSurface (7) + v7-context-browser (5) → green.
- Verified against live Lakeshore data: Workforce Personas = 25 records
  (confirmed in source CSV); the large numbers in the preview are the
  POPULATION COUNT column (headcount per persona), not record counts.
- `eslint` clean; `tsc --noEmit` 0 errors.
- Live signed-in QA on `app.abarva.ai/home` after ACA deploy.

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
- Live: `app.abarva.ai/home` Workforce Personas summary + Data tab before/after.

## Known Gaps

- Evidence-gap scoping still uses the provenance denylist (structurally-optional
  columns like `parent_entity_name` can still count); the required-field
  contract via `intelligence_v7.column_registry` remains the complete fix,
  pending live-schema verification. See [[project_home_context_explorer_v7]].
