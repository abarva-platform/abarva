# 2026-06-07-corpus-db-verification — Read-only corpus DB + Azure Search verification

## Release ID

`2026-06-07-corpus-db-verification`

## Status

`released`

## Plain-English Summary

Adds a **read-only** verification worker and an evidence runbook used to confirm which database the
corpus layer reads and whether the pattern id `PAT-LSH-D18-00479` (bound to the Lakeshore "Kyriba
global treasury rollout" decision card) is a real registry pattern. No runtime behavior changes; no
data mutated; no secrets printed. The verification ran from the private Azure VNet runtime and
confirmed the runtime reads `abarva_control`, the corpus is loaded (`corpus_patterns`=9,026,
`genome_patterns`=43,436), and `PAT-LSH-D18-00479` is absent from the treasury registry (a
cross-namespace mis-binding, not a missing id).

## Layer Impact

- **internal-admin lane:** an ops verification script + a runbook. No app/runtime/schema/data changes.

## Client Applicability

- All clients: No
- Internal only: Yes (ops verification + evidence)
- Feature flag: None

## Changes Included

- `scripts/ops/azure-corpus-verify.cjs` (new) — read-only Postgres + Azure Search verification, run
  via the private VNet operator path (managed identity; no local `DATABASE_URL`).
- `docs/runbooks/azure-corpus-db-verification-2026-06-07.md` (new) — evidence receipt (DB name,
  counts, pattern ids, read-only commands).

## QA / Validation

- Status: **passed** (read-only verification executed successfully). Run from the private Azure VNet
  runtime (Postgres private `10.43.1.4`); evidence in the runbook. No mutations; worker app restored
  to original state afterward.

## Rollout Plan

Docs/ops only. No runtime rollout.

## Rollback Plan

Revert the commit. Nothing to unwind.

## Audit Evidence

- Runbook: `docs/runbooks/azure-corpus-db-verification-2026-06-07.md`.
- Companion binder fix: `docs/releases/records/2026-06-07-binder-fail-closed-pattern-grounding.md`.

## Known Gaps

- The shared CI check `Verify canonical tenant allowlist` is red on `main` because the CI
  `DATABASE_URL` secret points at a retired Supabase pooler (`postgres.xtbymdryojmvoulaotce`,
  ENOTFOUND). That is an infra/secret issue (repoint CI `DATABASE_URL` to Azure Postgres), unrelated
  to this change.
