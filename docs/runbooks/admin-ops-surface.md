# Admin Ops Surface Runbook

This runbook covers T035: an admin-only operational surface for re-indexing,
migration dry-runs, backfills, audit exports, quarantine replay, and secret
rotation.

## Current State

`/admin/ops` is a governed read surface inside the existing `/admin/*` access
gate. It lists operational actions, their approval path, dry-run expectation,
validation, rollback path, and audit evidence.

No direct production execution is wired through the page.

## Operating Rules

- Scope every operation to one client or one shared control-plane target.
- Run dry-runs before data-changing work.
- Require human approval for high-risk actions.
- Capture actor, timestamp, target, validation output, and rollback path.
- Do not execute private data-plane jobs from the shared admin page until the
  production job runner, locks, retries, and audit writer are live.

## Operation Classes

- Re-index search corpus: refresh retrieval after approved commits.
- Migration dry-run: preview schema changes before apply.
- Source event backfill: repair approved Source read models.
- Defender quarantine replay: reprocess clean files only after security review.
- Immutable audit export: package append-only audit evidence for review.
- Data-plane secret rotation: rotate client-scoped secrets through Azure or
  Vercel secret-management runbooks.

## Validation

```bash
node scripts/admin/verify-admin-ops-surface.mjs
npx jest src/lib/admin/__tests__/ops-surface.test.ts src/lib/admin/__tests__/home-overview-v2-pre-w4-pr5.test.ts --runInBand
```

Run focused ESLint over the route, model, verifier, and modified admin files
before opening a release PR.

## Completion Boundary

The repository-side T035 foundation is complete when `/admin/ops`, sidebar
discovery, admin-home discovery, deterministic tests, verifier, runbook, and
release record merge.

T035 remains `In progress` until a production job runner owns execution with
idempotency, locks, retries, approval capture, and immutable audit-log writes.
