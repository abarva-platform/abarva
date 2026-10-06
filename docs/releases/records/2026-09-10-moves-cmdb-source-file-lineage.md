# 2026-09-10-moves-cmdb-source-file-lineage — Moves CMDB Source File Lineage

## Release ID

`2026-09-10-moves-cmdb-source-file-lineage`

## Status

`candidate`

## Plain-English Summary

The CMDB tower table now has the source-file lineage column required by the Moves current-state ingest writer and schema readback. This is an additive schema repair only: existing rows are preserved and not backfilled.

## Layer Impact

Release lane: `client-data-lane`.

Canonical model: adds the nullable source-file lineage field expected by the structured current-state upload path.

Layer 4 product proof: enables the Moves current-state schema verifier to distinguish a complete upload path from a partially repaired schema.

## Client Applicability

All clients using the structured CMDB current-state upload path. No client data is deleted or rewritten.

## Changes Included

- `supabase/migrations/20260910161000_tower_cmdb_source_file_lineage_repair.sql`

## QA / Validation

- PASS: exact schema readback before this fix reported `tower_cmdb_cis.source_file_id` missing.
- PENDING: `npm run test:integration -- --runTestsByPath src/lib/programs/__tests__/current-state-ingest.test.ts`
- PENDING: `npm run release:check -- --base origin/main --head HEAD`
- PENDING: governed lab migration apply run from `main`.

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main deploy workflow, then apply through the governed lab migration workflow with explicit apply confirmation.

## Deployment Authority

- Repo-owned deploy workflow: required before the migration apply uses this image.
- Shared runtime mutators: governed migration workflow only.
- Data-plane mutation: additive migration only.
- ACA runtime invariant: required after deploy.
- Live signed-in proof required: yes, as part of the targeted synthetic Moves smoke.

## Rollback Plan

If rollback is required before application use, revert the PR before applying. After apply, rollback requires an explicitly reviewed follow-up migration; do not drop the column while any ingest rows may reference it.

## Audit Evidence

- PR diff and CI result.
- Governed migration apply logs.
- Exact Moves current-state schema readback output.

## Known Gaps

This migration does not backfill source-file lineage for existing rows. Existing live rows remain untouched unless a separate governed backfill is approved.
