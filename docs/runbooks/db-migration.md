# Database Migration Runbook

## Purpose

Use this runbook for migrations, backfills, seed loads, and data-plane repair
scripts. The goal is simple: no unscoped client writes, no silent destructive
changes, and no migration without replayable evidence.

## Required Preflight

1. Classify lane:
   - `client-data-lane` for schema, RLS, seed, ingestion, retrieval, or private
     data-plane changes.
   - `global-control-lane` only when no client data-plane write is involved.
2. Identify affected clients with canonical `clients` / `client_id` naming.
3. Confirm whether the script touches production, preview, local, or synthetic
   data only.
4. Review SQL for:
   - `WHERE client_id = ...` or equivalent tenant scoping.
   - No legacy `tenant_id` introduction.
   - No unbounded `DELETE`, `UPDATE`, or `TRUNCATE`.
   - Explicit rollback/repair path.
5. Add or update a release record before opening the PR.

## Dry Run

Prefer existing dry-run scripts where available:

```bash
npm run db:migrate:dry
npm run db:verify:canonical-tenants
npm run release:check -- --base origin/main --head HEAD
```

For custom scripts, the dry run must print:

- Target database/environment.
- Clients affected.
- Tables affected.
- Rows that would be inserted, updated, deleted, or skipped.
- Whether the operation is idempotent.

## Apply

1. Confirm backup or restore posture for the target database.
2. Announce start time and expected duration in the release/incident thread.
3. Run one migration/backfill at a time.
4. Capture stdout/stderr to an audit artifact when the script emits row counts.
5. Run verification before any follow-up migration.

## Verification

Minimum checks:

- Migration table or version marker updated.
- Expected row counts match dry-run estimate or documented variance.
- Cross-client leakage query returns zero rows.
- RLS/client-scoped read path still works for each affected client.
- App route or API smoke test passes if runtime behavior changed.

## Rollback And Repair

Use the safest applicable path:

- Transaction rollback before commit when validation fails inside the script.
- Reverse migration if it was reviewed with the original PR.
- Additive repair migration when preserving audit history matters.
- Point-in-time restore only with founder/client approval and a clear data-loss
  window.

Do not hand-edit production rows to make tests pass. If manual repair is
unavoidable, record actor, SQL, timestamp, affected rows, and reason.

## Release Evidence

Attach these to the release record:

- Migration file or script path.
- Dry-run command and summary.
- Apply command and summary.
- Verification command and result.
- Rollback or repair plan.
- Known gaps and any deferred cleanup.
