# 2026-06-07-loader-live-proof-fixes — Loader live-proof fixes (id-default drift + attestation version)

## Release ID

`2026-06-07-loader-live-proof-fixes`

## Status

`candidate`

## Plain-English Summary

Two defects surfaced while running the Admin Loader end-to-end against the live
(lab) data plane:

1. **`enterprise_context_*` `id` default drift.** The original DDL defines
   `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, but the Supabase→Azure
   data-plane restore recreated `enterprise_context_chunks` / `_records` /
   `_facts` / `_source_files` **without** the default. Any committed context
   chunk failed with `null value in column "id"`, which means the governed
   CSV-commit path was broken for every tenant in that environment — not just
   the loader. This migration restores the default (idempotent; harmless on
   fresh DBs that already have it).

2. **Attestation version bug in the loader UI.** `AdminLoaderClient` sent
   `operatorAttestationVersion: "1"`, but the validator requires the exact
   constant `pilot-loader-data-load-attestation-v1`. The commit would have been
   rejected from the browser. Now imports and sends the constant.

## Layer Impact

- **client-data-lane**: the migration alters column defaults on the
  `enterprise_context_*` tables (schema only; no data rows changed).
- **global-control-lane**: the `AdminLoaderClient` attestation fix (shared admin
  UI behavior).

## Client Applicability

- All clients: Yes. The id-default repair fixes context commits for every tenant
  whose `enterprise_context_*` tables were restored without the default; the
  attestation fix affects every admin using the loader UI.
- Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `supabase/migrations/20260607190000_enterprise_context_id_defaults.sql` — idempotent `ALTER COLUMN id SET DEFAULT gen_random_uuid()` for the four `enterprise_context_*` tables, guarded by `to_regclass`.
- `src/components/setup/loader/AdminLoaderClient.tsx` — send `PILOT_UPLOAD_ATTESTATION_VERSION` instead of `"1"`.

## QA / Validation

- **Live**: the drift was confirmed and repaired via the private operator-job
  against the lab Azure DB — all four tables went `beforeDefault: null` →
  `afterDefault: gen_random_uuid()`. After the repair, the loader committed a
  real CSV through the governed pipeline (see the live write-side proof).
- Migration is idempotent and replay-safe (guarded `to_regclass`, `SET DEFAULT`
  is a no-op when already correct) — passes the Fresh Postgres migration replay
  gate.
- Attestation fix: type-checked; the constant is the same one the validator
  compares against (`upload-attestation.ts`).

## Rollout Plan

Merge to `main`. The migration auto-applies on the next migrate run / deploy.
The UI fix ships with the normal control-lane deploy. The live lab DB has
already had the default restored ad-hoc via the operator-job; this migration
makes it permanent and reproducible everywhere.

## Rollback Plan

Revert the PR. The migration is additive (a column default); to undo, `ALTER
COLUMN id DROP DEFAULT` — but there is no reason to, as the default matches the
original table definition. The UI change is a one-line revert.

## Audit Evidence

- Operator-job drift-repair payload: all four tables `null → gen_random_uuid()`.
- Live write-side proof run (preserve → understand → commit → retrieve).
- PR URL + CI (migration replay, typecheck, release:check).

## Known Gaps

- The root cause (restore stripping column defaults) may affect other restored
  tables beyond `enterprise_context_*`; a broader audit of restored-table
  defaults is worth a follow-up but is out of scope here.
