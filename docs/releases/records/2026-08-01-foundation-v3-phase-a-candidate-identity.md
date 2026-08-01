# 2026-08-01-foundation-v3-phase-a-candidate-identity — Candidate Identity Repair

## Release ID

`2026-08-01-foundation-v3-phase-a-candidate-identity`

## Status

`candidate`

## Plain-English Summary

Repairs the Foundation candidate identity path so parsed source rows produce row-specific entity candidates instead of collapsing to a tenant-level display name. The change preserves existing raw evidence, adds indexed working-layer row handles, carries entity evidence refs forward, promotes accepted entity evidence refs into canonical knowledge, and replaces filename guessing with a declared source identity map.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2 / evidence: No rebuild or mutation of existing evidence tables is required by this code change.

Layer 3 / working candidates: Adds first-class source row identity columns on `working.entity_candidate` and populates `natural_key`, `source_row_ref`, `source_object_ref`, and `original_row_id`.

Layer 4 / knowledge: Promotion now carries accepted entity evidence refs instead of emitting empty evidence arrays.

Products: No product route, UI, Cube, Superset, or aVa runtime change is included.

## Client Applicability

- All clients: tenant-neutral candidate identity repair.
- Specific clients: none.
- Internal only: migration/operator rollout evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Script: `scripts/knowledge/processing/process-handlers.mjs`
- Script: `scripts/knowledge/processing/executor-framework.mjs`
- Test: `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Migration: `supabase/migrations/20260801172500_foundation_v3_phase_a_candidate_identity.sql`
- Declared identity configuration for the 26 currently loaded source files, including composite display labels where no single complete human-readable name column exists.

## QA / Validation

- Pass: `node --check scripts/knowledge/processing/process-handlers.mjs`
- Pass: `node --check scripts/knowledge/processing/executor-framework.mjs`
- Pass: `npx eslint scripts/knowledge/processing/process-handlers.mjs scripts/knowledge/processing/executor-framework.mjs scripts/knowledge/build-foundation-v3-finding-catalogue.mjs`
- Pass: `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Pass: `node scripts/knowledge/__tests__/run-hcdn-job-runner-tests.mjs`
- Pass: regression assertion confirms a parsed application source row emits a row-specific display name, natural key, source row ref, original row id, and entity evidence ref.
- Pass: all 26 declared source names emit their expected entity type and a display name that is not the tenant key.
- Pass: unmapped sources and rows missing the declared name column fail closed instead of falling back to the first non-empty cell.
- Pass: actual export-column validation across 26 sources found 0 missing maps, 0 missing declared name columns, 0 blank display names, and 0 tenant-key display names.
- Pass: vendor contract source maps to `vendor` for 65 exported rows.
- Pass: actual export display-name validation found 0 duplicate-display warnings after composite labels were declared for repeated-label source grains.
- Pass: the interview crosswalk source uses an explicit composite identity instead of row-position fallback.

## Rollout Plan

Apply the additive migration through the governed lab migration path. Rerun from the affected candidate extraction/normalization layer, then run the review dry-run before writing approvals. Only after review and projection gates pass should baseline enforcement move from `warn` to `fail` for the repaired expectations.

## Deployment Authority

- Repo-owned deploy workflow: required only if this code is promoted to the ACA worker image.
- Shared runtime mutators: none in this change.
- Approved image digest: pending normal workflow build.
- ACA runtime invariant: required after any worker image rollout.
- Worker image invariant: required before DB-backed job execution.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no, because no product route changes.

## Rollback Plan

Revert the migration and script changes before applying them to a database. If the migration has already been applied, leave the additive nullable columns in place and roll back the worker code path; the columns are non-destructive and can remain unused.

## Audit Evidence

- Direct process executor test output.
- Direct HCDN runner test output.
- Lint and syntax checks.
- Release control check.

## Known Gaps

This change does not auto-approve regenerated candidates, publish a new baseline, build Cube models, sync Superset, or execute a live Azure database load by itself. Those remain governed downstream steps after dry-run review and reconciliation pass.
