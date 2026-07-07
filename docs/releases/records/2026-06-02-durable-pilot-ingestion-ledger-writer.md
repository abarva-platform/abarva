# 2026-06-02-durable-pilot-ingestion-ledger-writer - Durable Pilot Ingestion Ledger Writer

## Release ID

`2026-06-02-durable-pilot-ingestion-ledger-writer`

## Status

`candidate`

## Plain-English Summary

Adds a durable writer for pilot ingestion audit-only load records. Accepted landing-zone files now have a tested path to write upload-run and file-manifest ledger rows, and quarantined files can also create an open quarantine case.

## Layer Impact

Client data lane: adds runtime write support for existing tenant-scoped pilot ingestion ledger tables. The writer does not commit parsed facts into operational data stores.

## Client Applicability

- All clients: Applies to tenant-scoped pilot loader runs when the caller supplies client/user/attestation identity.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/pilot-ingestion-ledger.ts` adds `writeDurablePilotIngestionAuditOnlyLedger`.
- `src/lib/admin/__tests__/pilot-ingestion-ledger.test.ts` covers accepted files, quarantined files, and fail-loud DB write errors.

## QA / Validation

- Pass - `npx jest src/lib/admin/__tests__/pilot-ingestion-ledger.test.ts --runInBand`
- Pass - `git diff --check`
- Pass - `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The writer is additive and only runs when a caller explicitly invokes it with a prepared audit-only plan and tenant/user identity.

## Rollback Plan

Revert the PR to remove the writer. Existing ledger rows, if any were written by a caller after rollout, remain audit evidence and do not need rollback.

## Audit Evidence

- PR URL: pending.
- Local focused Jest output.
- Release control check output.

## Known Gaps

This slice does not wire the writer into the live Azure landing-zone consumer, does not create new migrations, and does not implement approval/commit/rollback execution. It only provides the durable writer for upload-run, file-manifest, and quarantine-case ledger records.
