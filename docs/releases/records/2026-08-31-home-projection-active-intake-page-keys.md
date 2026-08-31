# 2026-08-31-home-projection-active-intake-page-keys — Home Projection Active Intake Page Keys

## Release ID

`2026-08-31-home-projection-active-intake-page-keys`

## Status

`candidate`

## Plain-English Summary

Home projection loading now preserves additional application fields already consumed by the Home read path and emits active-intake record rows for Home source families that were previously absent from the projection stream.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 client intake remains the upstream record shape. Layer 4 projection loading carries selected source rows into the Home projection table without renaming the source payload at the projection boundary. A schema constraint migration is included so the added Home page keys are accepted by the projection table when the migration is explicitly applied.

## Client Applicability

- All clients: No default runtime change from this PR alone.
- Specific clients: Active registered demo tenants when their local/source-room projection load is run.
- Internal only: Local projection proof and source-room generation validation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/generate_dense_source_room_extracts.py`
- `scripts/ecl/load_dense_source_room_source_projection_layer.py`
- `docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql`
- `supabase/migrations/20260831123000_home_projection_active_intake_page_keys.sql`
- `scripts/ecl/__tests__/run-home-projection-page-key-loader-tests.mjs`

## QA / Validation

- `node scripts/ecl/__tests__/run-home-projection-page-key-loader-tests.mjs` passed.
- `python3 scripts/ecl/load_dense_source_room_source_projection_layer.py --dense-out-dir /tmp/ecl-home-page-keys-dense --out-dir /tmp/ecl-home-page-keys-proof` passed against disposable Postgres.
- Local readback reported `home_enterprise_landscape=3317`, `home_application_count_basis_drift=0`, `home_refusal_without_payload=0`, `projection_entry_count_drift=0`, required Source serving empties `0`, and all planted failures rejected.
- `node scripts/release-check.mjs --base origin/main --head HEAD` is required before merge.

## Rollout Plan

Merge by PR. The code change becomes available in the next repo-owned ACA image build. The included migration must be applied through the approved migration lane before any production data-build job emits the new Home projection page keys into a shared data plane.

## Deployment Authority

- Repo-owned deploy workflow: Required only if deploying the app image after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable before deploy.
- ACA runtime invariant: Required only if deployed.
- Worker image invariant: Required only if deployed.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this write-side loader change until the data-build/migration path is run.

## Rollback Plan

Revert the PR before migration apply. If the migration has already been applied, a follow-up migration can restore the prior Home page-key check after projection rows using the added page keys are removed or rebuilt.

## Audit Evidence

Inspect the PR, local test output, `/tmp/ecl-home-page-keys-proof/dense_source_room_ecl_source_projection_load_summary.json`, and release check output.

## Known Gaps

No Azure migration apply, data-plane reload, deploy, or live browser proof is performed by this local write-side slice.
