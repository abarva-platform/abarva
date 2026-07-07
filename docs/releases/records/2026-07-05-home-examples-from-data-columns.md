# 2026-07-05-home-examples-from-data-columns — Home Summary examples built from real Data columns

## Release ID

`2026-07-05-home-examples-from-data-columns`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-07-05-home-preview-labels-and-fallback`, found in the same
live verification pass. That fix stopped the Summary "examples in this
tenant" bullet from showing a source-file name — but the underlying
row-labeling heuristic (`record_name` then a "first meaningful value" scan)
could still surface an unrelated field, such as a boilerplate caveat note
("Synthetic rate row for V7 demo; replace with client/vendor evidence.")
repeated for every example on Client Rate Card.

The row-label heuristic is inherently unreliable for dimensions with no
natural "name" field (rate cards, registries, dictionaries) — there is no
single column that always holds a meaningful label.

Fix: build "Examples in this tenant" directly from the **same preview
columns and formatting already shown in the Data tab**, instead of a separate
label-guessing heuristic. For each of the first 3 rows, join the first 2
non-blank cells (through the same `formatPreviewCell` used by the Data table,
so currency/counts format identically). This guarantees examples are always
genuine, displayed business data — never a filename or an unrelated caveat
field — because they come from `PREVIEW_COLUMNS`, the same verified mapping
fixed in the prior two records in this series.

## Layer Impact

- `global-control-lane`: Home surface (`HomeSurface.tsx`) for all V7 tenants.
  Presentation logic only.

## Client Applicability

- All clients: Yes.
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`: `generatedSpecFromPreview`'s
  `examples` now built from `preview.rows`/`preview.columns` via
  `formatPreviewCell`, not `sourceRows[].label`.
- `src/components/home/__tests__/HomeSurface.test.tsx`: updated assertion to
  match the new example format.

## QA / Validation

- Programmatic simulation of all 24 dimensions against the live dataset:
  every dimension now produces a genuine two-field example (e.g. "Lakeshore
  Holdings — Corporate Finance", "application — Program manager",
  "Lakeshore Holdings — $50.0K"). No filenames, no boilerplate notes.
- `jest` v7-context-browser (6) + HomeSurface (6) → green.
- `eslint` clean; `tsc --noEmit` 0 errors.
- Live signed-in QA on `app.abarva.ai/home`: Client Rate Card Summary
  examples re-checked after deploy.

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
- Live: `app.abarva.ai/home` Client Rate Card Summary before/after.

## Known Gaps

- None known for this fix. This closes the Home data-accuracy/formatting pass
  requested for all 24 dimensions. See [[project_home_context_explorer_v7]].
