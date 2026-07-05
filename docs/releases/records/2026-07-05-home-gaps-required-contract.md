# 2026-07-05-home-gaps-required-contract — Home evidence gaps use the authored required_level contract

## Release ID

`2026-07-05-home-gaps-required-contract`

## Status

`candidate`

## Plain-English Summary

Replaces the name-based provenance denylist for Home "evidence gaps" with the
authored `intelligence_v7.column_registry.required_level` contract. A cell now
counts as an evidence gap only when its column is **Required- or
Recommended-level**; Optional/System/derived columns are ignored.

This was verified against the live schema first (read-only VNet probe,
2026-07-05):

- `required_level` exists and is populated (344 Required, 334 Recommended,
  40 Optional, plus System/conditional variants).
- `column_registry.column_name` joins cleanly to the `values_json` keys
  (34/34 for Business Functions).
- Strictly-Required fields have **0 blanks** across every dimension and tenant
  (the synthetic generator fills all required fields), so the gaps surfaced are
  Recommended-level blanks such as `parent_entity_name`.

Because some caveat columns (e.g. `validated_by = "not client validated"`) are
Recommended-level but carry the same blanket caveat on every row, the
provenance/internal/relationship-reference exclusions are kept alongside the
contract so they are not counted as missing business fields. If the contract
query is ever unavailable, it falls back to the same predicate without the
required_level join (autocommit session — a failed primary query does not poison
the connection), and a genuinely-empty result reads as 0 rather than the preview
sample.

## Layer Impact

- `global-control-lane`: read adapter (`src/lib/home/v7-context-browser.ts`) for
  all V7 Home tenants. No schema/RLS/write changes; relies only on the existing,
  already-populated `required_level` column.

## Client Applicability

- All clients: Yes — every tenant on the V7 Home pack.
- Specific clients: —
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/lib/home/v7-context-browser.ts`: `loadGapRows()` primary query joins
  `column_registry` and filters `required_level ~* '^(required|recommended)'`,
  keeping the provenance/ref exclusions; denylist query retained as fallback.
- `src/lib/home/__tests__/v7-context-browser.test.ts`: routing tests for the
  contract path, the zero-gap case, the contract→denylist fallback, and the
  both-throw→sample fallback.

## QA / Validation

- Live read-only VNet schema probe (operator migrate job, image-override,
  restored after) confirmed required_level presence, join integrity, and the
  0-required-gaps fact.
- `jest` v7-context-browser (6) + HomeSurface (6) → green.
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
- Worker image invariant: unchanged. The migrate operator job image was
  temporarily overridden for the read-only probe and restored to
  `sha256:918b6cbf298ebd5bd20782b15f7d1817111d94e438436d64f2ea64db543db8a9`.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes.

## Rollback Plan

ACA traffic set to the prior healthy revision. No migrations.

## Audit Evidence

- PR URL (added on open).
- VNet probe output (Log Analytics, exec `job-abarva-db-migrate-lab-eastus-xfwmx5y`).
- CI: jest + eslint + tsc above.
- Live: `app.abarva.ai/home` dropdown gap numbers before/after.

## Known Gaps

- `parent_entity_name` (Recommended) still counts when blank for top-level
  entities; distinguishing "blank because inapplicable" needs row-level
  conditional logic beyond the column-level contract. Accepted per the chosen
  Required+Recommended definition. See [[project_home_context_explorer_v7]].
