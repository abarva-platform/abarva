# Admin Ops Surface Build Manifest

## Scope

T035 repository foundation for an admin-only Ops Console.

## Implemented

- Added `/admin/ops` under the existing admin layout and Clerk/admin access gate.
- Added a deterministic operations read model with approval, dry-run,
  validation, rollback, and audit-evidence metadata.
- Added sidebar and admin-home discoverability.
- Added the Ops Console to the admin surface completeness inventory.
- Added focused tests, verifier, runbook, and release record.

## Operations Represented

- Re-index search corpus
- Run migration dry-run
- Backfill Source events
- Replay Defender quarantine decisions
- Export immutable audit evidence
- Rotate data-plane secret

## Guardrails

- No direct production execution from the page.
- High-risk operations require human approval evidence.
- Data-changing operations require dry-run evidence.
- Every operation needs an explicit client or shared control-plane scope.
- Audit evidence must include target, actor, validation, and rollback path.

## Remaining Evidence

T035 should remain `In progress` until production execution is backed by a job
runner with idempotency, locks, retries, immutable audit-log writes, and live
approval capture.
