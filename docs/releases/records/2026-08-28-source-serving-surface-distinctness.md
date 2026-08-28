# 2026-08-28-source-serving-surface-distinctness — Source Serving Surface Distinctness

## Release ID

`2026-08-28-source-serving-surface-distinctness`

## Status

`candidate`

## Plain-English Summary

Tightens Source serving-view contracts so named Source surfaces answer distinct product questions
instead of returning identical row-key sets under different labels. The Source workspace reader now
reads the named serving views for vendor portfolio, events, comparison, and approvals instead of
collapsing those surfaces onto one broad backing table.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source preview workspace reads named serving views for the affected surfaces.
- Layer 5 Serving: Source serving SQL draft filters vendor, value, event, comparison, approval, and
  renewal views according to their declared product question.
- Data layers: no tenant intake, canonical object, commercial fact, or review-event data is changed.

## Client Applicability

- All clients using the ECL Source serving path.
- Specific clients: none.
- Internal only: local proof and release gating.
- Public/demo only: none.
- Feature flag: existing ECL provider routing only.

## Changes Included

- Filters Source vendor portfolio vs. vendor-detail serving rows so the portfolio remains the broad
  vendor book and the detail surface focuses on vendors with multi-contract depth.
- Filters Source value vs. sourcing-opportunity rows so sourcing opportunities do not repeat every
  gated evidence-request row.
- Filters Source events, compare, and approvals views by their declared workspace tab.
- Updates the Source workspace adapter to read the named Source serving views.
- Adds a projection-load assertion that fails when two populated Source serving surfaces return the
  same row-key set.
- Reports empty Source serving views explicitly while allowing optional future-state views to remain
  empty when no backing rows exist.

## QA / Validation

- Pass: `python3 -m py_compile scripts/ecl/load_dense_source_room_source_projection_layer.py`.
- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand`.
- Pass: `npm run ecl:source-room-source-projection:load -- --out-dir /tmp/ecl-source-surface-distinctness-proof`.
- Disposable load readback: `source_serving_duplicate_row_key_sets = 0`,
  `source_serving_required_empty_views = 0`, and `source_serving_empty_view_keys =
  ["source_approvals", "source_compare", "source_renewal"]`.
- Pass: `node scripts/ecl/run_product_ecl_predeploy_gate.mjs`.
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' scripts/ecl/run_product_ecl_predeploy_gate.mjs`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`.
- Pass: `npm run release:check`.
- Pass: `git diff --check -- docs/architecture/sql-drafts/ecl_serving_views_v1_draft.sql scripts/ecl/load_dense_source_room_source_projection_layer.py scripts/ecl/run_product_ecl_predeploy_gate.mjs 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' docs/releases/records/2026-08-28-source-serving-surface-distinctness.md`.

## Rollout Plan

Merge by PR. The application adapter change rolls out through the repo-owned web deployment lane.
Serving SQL changes affect future governed data-build runs; no shared data-plane load is performed by
this release.

## Deployment Authority

- Repo-owned deploy workflow: required for the application adapter change.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: verify after deployment before making live-product claims.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the ECL Source workspace route after deployment.

## Rollback Plan

Revert the PR. The workspace adapter will resume reading the prior broad serving paths. Because this
release performs no tenant-data mutation, rollback does not require data cleanup unless an operator
separately applies the serving SQL draft through a data-build job.

## Audit Evidence

- Local proof directory to be attached after validation:
  `/tmp/ecl-source-surface-distinctness-proof`.

## Known Gaps

- Dedicated comparison and approval backing rows are still separate future work; those named serving
  views may be empty until such rows are generated.
- This release does not run live aVa prompts or mutate tenant chat/evidence records.
