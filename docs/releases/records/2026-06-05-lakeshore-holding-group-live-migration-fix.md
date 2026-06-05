# 2026-06-05-lakeshore-holding-group-live-migration-fix — Lakeshore Holding-Group Live Migration Fix

## Release ID

`2026-06-05-lakeshore-holding-group-live-migration-fix`

## Status

`candidate`

## Plain-English Summary

This release fixes the Lakeshore L01 holding-group migration so it can apply safely against the live production `clients` table. The original migration assumed `clients.name` had a unique constraint for `ON CONFLICT`; production does not expose that constraint, so the migration now inserts missing child HoldCo rows and then normalizes all seeded rows explicitly.

## Layer Impact

- `client-data-lane`: Updates the Lakeshore holding-group tenancy migration that adds L0/L1 metadata to the shared `clients` table and seeds Lakeshore child HoldCos.

## Client Applicability

- All clients: No runtime behavior change for existing standalone clients.
- Specific clients: Lakeshore Holdings receives the L0 sponsor row normalization plus three L1 HoldCo seed rows for the federated demo substrate.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No feature flag; this is migration substrate.

## Changes Included

- `supabase/migrations/20260605130000_lakeshore_holding_group_clients.sql`
  - Replaces the fragile `ON CONFLICT (name)` L1 seed path with an idempotent seed-and-normalize flow that does not depend on a production-only uniqueness assumption.

## QA / Validation

- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: Corrected migration applied to the live Postgres data plane through the Node `pg` client.
- PASS: Live verification found all four `clients` hierarchy columns, all five helper functions, and Lakeshore Holdings plus Morgan Street, Roosevelt, and Lakefront rows under holding group `830de810-0000-4c9e-8f59-000000000000`.

## Rollout Plan

Merge to `main`, let Vercel/CI complete normally, then apply or re-apply the corrected migration to the live Postgres data plane. The migration is intended to be idempotent, so repeat application should converge the same Lakeshore L0/L1 rows and functions.

## Rollback Plan

Rollback is manual because this changes schema metadata and security helper functions. If needed, clear the Lakeshore-only `holding_group_*` metadata, delete the three seeded child HoldCo client rows if they have no downstream data, and drop or replace the five helper functions from the prior L01 migration.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI: Release Control Gate plus normal migration replay checks.
- Live proof: Postgres apply output `lakeshore-holding-group-migration-applied`; query showing `clients.holding_group_id`, `parent_client_id`, `holding_group_role`, and `aggregate_visibility_level`; query showing helper functions; query showing Lakeshore L0 plus Morgan Street, Roosevelt, and Lakefront L1 rows under the same holding group.

## Known Gaps

This release only fixes the live migration contract. It does not add Tower federated UI, CXO loader screens, or Source/Moves artifact generation for the child HoldCos.
