# Context & Corpus Readiness Backfill (2026-06-08) — runbook + report

PR-3 of the Context & Corpus Governance Framework. Seeds the
`governed_object_readiness` sidecar (migration
`supabase/migrations/20260608160000_governed_object_readiness.sql`) with one
governance row per governed object across all stores.

This file is the **runbook + reverse SQL**. The live populated report
(distribution counts) is overwritten in place when an operator runs the backfill
as an ACA job (the private Azure DB is unreachable from a workstation).

## What the backfill does (and refuses to do)

- **Additive only.** It writes only to the new sidecar table. It NEVER mutates a
  source row (it `SELECT`s ids, nothing else against the source stores).
- **Never auto-promotes.** No object is set to `agent_ready`. `agent_ready` is an
  earned, evidenced transition (grounded + retrievable + cite-render-verified
  end-to-end — the #3322 gate), assigned by the runtime/PR-7 path, never by a
  bulk pass. This is encoded as a unit-tested invariant
  (`auto_promoted === 0`) in `src/lib/governance/readiness-backfill.ts`.
- **Conservative seeding.** Existing un-governed rows seed to the truthful floor:
  - sensitive data in shared corpus → `blocked`
  - sensitive (pii/phi/restricted) tenant data → `restricted`
  - missing grounding (source_basis/confidence) → `not_reviewed`
  - committed but not in a retrievable index → `committed_not_indexed`
  - grounded + retrievable but not cite-verified → `not_reviewed`
- **Idempotent.** Upserts on `(object_table, object_id, client_key)`; a row that
  has already been promoted or fenced (`agent_ready` / `restricted` /
  `quarantined` / `retired`) is left untouched on replay.

## Step 0 — apply the migration (manual paste step)

The migration is additive (new table + indexes). Apply via the repo runner:

```
npm run db:migrate
```

> ⚠️ Paste step: `npm run db:migrate` runs `src/scripts/run-migrations.ts`. From
> a workstation the private DB is unreachable; run the migration from inside the
> VNet (ACA job / bastion) or paste the SQL of
> `20260608160000_governed_object_readiness.sql` into a session that can reach
> `pg-abarva-context-lab-001`. Verify: `\d governed_object_readiness` shows the
> table and the four indexes.

## Step 1 — dry-run (no writes)

```
npm run governance:readiness-backfill
```

Writes the proposed distribution into this file (mode: **dry-run**). Review the
per store × scope table. Confirm `auto-promoted` is **0**.

## Step 2 — commit (ACA job, inside the VNet)

```
npm run governance:readiness-backfill -- --commit
```

Upserts one sidecar row per governed object. Re-runnable; safe to repeat.

### Run as an ACA Container-Apps Job

```
az containerapp job start \
  --name caj-governance-readiness-backfill \
  --resource-group <rg> \
  --image <acr>/abarva-web:<tag> \
  --command "npm run governance:readiness-backfill -- --commit"
```

(Reuse the same job template as the PR-2 inventory scan; it only needs read on
the source stores + insert/update on `governed_object_readiness`.)

## Reverse / rollback

The migration is a single additive table. To fully reverse PR-3:

```sql
DROP TABLE IF EXISTS public.governed_object_readiness;
```

No source data is affected by the forward migration, the backfill, or the
reverse — the sidecar is governance metadata only.

---

<!-- The live distribution report is written below this line by the backfill run. -->

_No live run yet — run `npm run governance:readiness-backfill` (dry-run) or
`-- --commit` as an ACA job to populate this section._
