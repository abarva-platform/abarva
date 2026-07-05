# 2026-07-05-home-plain-english-labels — Home dimension names and column labels use plain English

## Release ID

`2026-07-05-home-plain-english-labels`

## Status

`candidate`

## Plain-English Summary

Founder review of Home's dimension dropdown and Data-tab columns found several
labels that read as database/AI-engineering jargon rather than language an
average CXO would understand at a glance — e.g. dimension names like "Chunk /
Retrieval Registry" and "Graph Registry / Relationship Dictionary", and column
headers like "Edge Type", "Object Ref", "Semantic Tags", and "Retrieval
Eligibility". Worse: the "Chunk / Retrieval Registry" dimension's auto-filled
6th preview column surfaced a **raw internal chunk id**
(`lakeshore-industries-v2-chunk-00003`) directly on screen — the exact
internal-identifier leak this surface's own drawer copy already promises not
to show ("Internal row identifiers, chunk ids, embedding ids, and graph
mechanics are intentionally hidden from the executive report").

This is a labels/text-only change — no data, no layout, no new columns.

1. **8 dimension names renamed** to plain English (e.g. "Chunk / Retrieval
   Registry" → "AI Search Coverage", "Graph Registry / Relationship
   Dictionary" → "Relationship Types Reference"). Dimensions whose existing
   name is already ordinary business language (Rate Card, Service Tower,
   Vendors & Contracts, etc.) are untouched.
2. **14 column labels overridden** to plain English regardless of the
   authored `column_registry.client_field` text (e.g. "Entity Name" → "Company
   / Unit", "Edge Type" → "Relationship Type", "Object Ref" → "Connected To",
   "Semantic Tags" → "Topics", "Retrieval Eligibility" → "Searchable by aVa").
3. **Raw `*_id` columns (including `chunk_id`) can no longer be auto-selected**
   as a fallback preview column — closes the internal-id leak. Columns
   explicitly listed in `PREVIEW_COLUMNS` are unaffected (a human author can
   still deliberately choose to show an id column).

## Layer Impact

- `global-control-lane`: Home read adapter (`v7-context-browser.ts`) for all
  V7 tenants. Presentation/label-text only; no schema, data, or layout change.

## Client Applicability

- All clients: Yes.
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/lib/home/v7-context-browser.ts`: `friendlyDimensionLabel()` +
  `FRIENDLY_DIMENSION_LABELS` (8 renames); `FRIENDLY_COLUMN_LABELS` (14
  overrides) applied in `clientLabel()`; `isNonPreviewColumn()` now excludes
  any `*_id` column from auto-fallback selection.
- `src/lib/home/__tests__/v7-context-browser.test.ts`: tests locking in the
  dimension-name override, the column-label overrides, and the chunk_id
  leak fix (asserts the raw id string never appears in the returned preview).

## QA / Validation

- `jest` v7-context-browser (8, incl. 2 new label tests) + HomeSurface (6) →
  green (14/14 total).
- `eslint` clean; `tsc --noEmit` 0 errors.
- Verified against the live V7 dataset (Lakeshore): all 4 previously
  jargon-heavy dimensions (Chunk/Retrieval Registry, Graph Registry,
  Function-System Bridge, Client Rate Card) now show plain-English columns
  with zero raw ids.
- Live signed-in QA on `app.abarva.ai/home` after deploy.

## Rollout Plan

Merge to `main` → ACA image build/deploy → 100% ingress after healthy.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy (serialized; asserts HEAD==origin/main).
- Shared runtime mutators: none.
- Live signed-in proof required: Yes.

## Rollback Plan

ACA traffic set to the prior healthy revision. No migrations.

## Audit Evidence

- PR URL (added on open).
- CI: jest + eslint + tsc above.
- Live: `app.abarva.ai/home` dropdown + Data tab for the 4 previously
  jargon-heavy dimensions, before/after.

## Known Gaps

- Not every possible jargon term was audited (this pass covered the dimension
  names and column labels found in the founder's review + a targeted sweep of
  the 4 most graph/AI-infrastructure-flavored dimensions). Remaining wordier
  copy (e.g. "How to read the numbers" explainer text) was left as-is since it
  is already plain, just slightly long. See [[project_home_context_explorer_v7]].
