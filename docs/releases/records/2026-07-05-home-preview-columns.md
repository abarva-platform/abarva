# 2026-07-05-home-preview-columns — Home Data preview shows real, well-formatted columns for every dimension

## Release ID

`2026-07-05-home-preview-columns`

## Status

`candidate`

## Plain-English Summary

Full data-quality pass over all 24 Home context dimensions (data accuracy and
formatting only, per founder request — no other surfaces touched). Found and
fixed a systematic issue: the `PREVIEW_COLUMNS` map (which chooses the Data-tab
preview columns and the Summary "readable fields") referenced an assumed
schema, but the loaded V7 data uses different column names. For **~13 of 24
dimensions** all the preferred columns were missing, so the preview fell back
to generic shared columns (`entity_scope`, `shared_service_flag`,
`budget_ownership_model`) — the Data tab for Client Rate Card,
Programs/Initiatives, Service Tower, Infrastructure, Expert Lenses, Source
Registry, Graph Registry, Operational Evidence, and Function-System Bridge
showed no useful business data.

Fixes:

1. **Rewrote `PREVIEW_COLUMNS` for all 24 dimensions** to the actual data
   column names — every column verified present and populated against the
   live V7 dataset.
2. **Hardened the fallback fill** (`isNonPreviewColumn`) so any remaining slots
   are filled only with real business columns, never generic structural,
   provenance/lineage, or relationship-reference columns.
3. **Fixed `enterprise_profile`** showing `Company Name` and `Entity Name` as
   duplicate columns (added `strategic_priorities` as the 6th column).
4. **Fixed acronym labels** so fields render "Revenue USD", "AI Use Case",
   "SLA" instead of "Revenue Usd", "Ai Use Case", "Sla".
5. **Fixed `graph_registry_relationship_dictionary`** auto-filling `node_type`,
   which duplicated the already-shown `allowed_from` value on every row —
   replaced with the explicit, distinct `evidence_required` column.

Value formatting and column selection were verified by programmatically
simulating the real render pipeline (`display()` → `formatPreviewCell()` →
`humanize()`) over all 24 dimensions against the live dataset: **0 of 24
dimensions** show generic-column leakage or same-row duplicate values after the
fix. USD compacts correctly (`$7.1B`, `$190.6M`, `$150K`), counts format with
commas (`11,800`), and acronyms render correctly.

## Layer Impact

- `global-control-lane`: Home read adapter (`v7-context-browser.ts`) for all V7
  tenants. Presentation/column-selection only; no schema/RLS/write changes.
  Column names are shared across tenants (same V7 template), so the fix
  applies to every tenant.

## Client Applicability

- All clients: Yes — every tenant on the V7 Home pack.
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/lib/home/v7-context-browser.ts`: corrected `PREVIEW_COLUMNS` (24
  dimensions); `isNonPreviewColumn` fallback guard; acronym-aware `humanize`.

## QA / Validation

- Programmatic audit of all 24 dimensions vs the live V7 dataset (column
  presence/population, generic-column leakage, same-row duplicate values):
  0 issues across all 24 after the fix.
- `jest` v7-context-browser (6) + HomeSurface (6) → green.
- `eslint` clean; `tsc --noEmit` 0 errors.
- Live signed-in QA on `app.abarva.ai/home` — spot-check the previously-broken
  dimensions (Client Rate Card, Programs, Service Tower, Infrastructure, Graph
  Registry).

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
- Live: `app.abarva.ai/home` Data tab for the previously-broken dimensions.

## Known Gaps

- Long structured fields (e.g. `business_capability`, `included_services`) are
  semicolon-joined lists and render as-is in the table cell; acceptable for a
  preview but not truncated/expandable.
- Benchmark `range_low`/`range_high` render as raw numbers (units are
  context-dependent, described in `benchmark_name`).
- See [[project_home_context_explorer_v7]] for prior Home fixes in this
  series (dimension tabs, gap scoping, digestibility).
