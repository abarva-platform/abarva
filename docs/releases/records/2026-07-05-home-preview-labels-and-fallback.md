# 2026-07-05-home-preview-labels-and-fallback — Home Summary examples and fallback columns show real data only

## Release ID

`2026-07-05-home-preview-labels-and-fallback`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-07-05-home-preview-columns`, found during live verification
of the fixed dimensions.

1. **Summary "examples in this tenant" showed a source-file name** (e.g.
   `v7-synthetic-depth-pass-v2.csv`) repeated for every example, on dimensions
   with no natural "record name" field (Client Rate Card). Root cause:
   `firstMeaningfulValue()` only excluded a narrow internal-key set
   (`tenant_key`, `record_key`…), not the full structural/provenance denylist,
   so it could return `entity_scope` or a filename as the "first meaningful
   value." Fixed by widening the exclusion to the same denylist used for
   preview-column selection, plus a defensive filename-shape check applied to
   both `record_name` and `firstMeaningfulValue` results.
2. **An auto-filled 6th preview column could be near-empty** — observed on
   Source / Evidence Registry, where the fallback column showed "Needs
   evidence" for every visible row. Fixed by requiring a fallback candidate to
   have at least one non-blank value in the actual rendered records before it
   is selected, rather than assuming any non-denylisted column has real data.

## Layer Impact

- `global-control-lane`: Home read adapter (`v7-context-browser.ts`) for all V7
  tenants. Presentation-layer label/column-selection logic only.

## Client Applicability

- All clients: Yes.
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/lib/home/v7-context-browser.ts`: `meaningfulLabel`/`isFilenameLike`
  guards on source-row labels; `firstMeaningfulValue` uses the full
  `isNonPreviewColumn` denylist; `previewColumns` fallback requires
  `hasSignalInPreview` (real data in the actual rendered records).

## QA / Validation

- `jest` v7-context-browser (6) + HomeSurface (6) → green.
- `eslint` clean; `tsc --noEmit` 0 errors.
- Live signed-in QA on `app.abarva.ai/home`: Client Rate Card Summary
  "examples" and Source / Evidence Registry Data columns re-checked after
  deploy.

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
- Live: `app.abarva.ai/home` before/after screenshots for the two dimensions above.

## Known Gaps

- None known for this fix. See [[project_home_context_explorer_v7]] for the
  full series of Home fixes.
