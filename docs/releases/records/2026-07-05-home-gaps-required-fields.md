# 2026-07-05-home-gaps-required-fields — Home evidence-gap counts scoped to real evidence fields

## Release ID

`2026-07-05-home-gaps-required-fields`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-07-05-home-dimension-tabs-v7`. That change made the Home
"evidence gaps" count accurate over the full dimension, but it still counted
**any** blank or caveat cell as a gap. In the synthetic V7 data that inflates
the number: every row carries `validated_by = "not client validated"` and a
blanket `known_gaps` caveat, and structural columns (a top-level entity's
`parent_entity_name`) are legitimately blank. So "Business Functions" showed 30
"evidence gaps" when only a handful were real.

This scopes the gap count to fields that actually represent missing business
evidence:

1. **Required-field contract (preferred).** If the live `column_registry`
   carries a populated `required_level`, gaps are counted only on columns marked
   `required*` — the authored per-dimension required set.
2. **Provenance denylist (fallback).** When that contract column is absent or
   empty, gaps are counted on business-content columns only, excluding internal,
   provenance/lineage (`validated_by`, `source_*`, `generated_by`, `known_gaps`,
   …) and relationship-reference (`*_ref`/`*_refs`) columns.

The read adapter self-configures by probing the schema at runtime. Because the
Home read session is autocommit, a failed probe cannot poison the connection or
collapse Home — it simply falls back. Measured effect on Lakeshore (denylist
path): Business Functions 30→5, Vendors 88→13, Applications 259→124.

## Layer Impact

- `global-control-lane`: read-adapter (`src/lib/home/v7-context-browser.ts`)
  behavior for all tenants. No schema/RLS/write changes; no new required DB
  column (the `required_level` path is used only if already present).

## Client Applicability

- All clients: Yes — every tenant on the V7 Home pack.
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/lib/home/v7-context-browser.ts`: new `loadGapRows()` with runtime
  required-field-contract probe + required-field gap query, provenance-denylist
  fallback query, and shared `GAP_VALUE_PREDICATE` / `NON_EVIDENCE_COLUMNS`.
- `src/lib/home/__tests__/v7-context-browser.test.ts`: routing tests for the
  required-contract path and the denylist fallback path.

## QA / Validation

- `jest` v7-context-browser (3) + HomeSurface (7) → all green.
- Predicted counts validated directly against the live V7 CSVs
  (`abarva-v7-synthetic-client-data-v2-20260703`): Business Functions 30→5,
  Vendors 88→13, Applications 259→124, Enterprise Profile 2→1.
- `eslint` clean; `tsc --noEmit` 0 errors.
- Live signed-in QA on `app.abarva.ai/home` after ACA deploy — read the live
  numbers to confirm which path (required-contract vs denylist) is active.

## Rollout Plan

Merge to `main` → ACA image build/deploy to `ca-abarva-web-lab-eastus` from the
merge SHA → shift 100% ingress after healthy.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy (serialized concurrency, asserts HEAD==origin/main).
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
- Live: dropdown/gap numbers before vs after on `app.abarva.ai/home`.

## Known Gaps

- When the `required_level` contract is absent, the denylist path can still
  count structurally-optional columns (e.g. `parent_entity_name` blank for a
  top-level entity) as gaps. Fully resolving that requires the authored
  `required_level` contract to be present in `intelligence_v7.column_registry`.
  See [[project_home_context_explorer_v7]].
