# 2026-06-02-pilot-ingestion-ledger-audit-only — Pilot Ingestion Ledger Audit-Only Wiring

## Release ID

`2026-06-02-pilot-ingestion-ledger-audit-only`

## Status

`candidate`

## Plain-English Summary

Wires the Azure landing-zone consumer to an optional pilot ingestion ledger writer. Accepted and quarantined files now produce an audit-only write plan for upload runs, file manifests, and quarantine cases before any future commit path can claim the file is usable. The slice keeps ingestion in governance/audit mode and does not commit parsed facts.

## Layer Impact

Release lane: `client-data-lane`.

This changes the ingestion and private data-plane governance contract. It does not add migrations, change UI, write client facts, index search documents, or alter production queue settlement unless a caller provides the new pilot ledger writer adapter.

## Client Applicability

- All clients: No default runtime behavior change without a caller-provided ledger writer.
- Specific clients: Applies to pilot data-plane ingestion for Apex, Meridian, and SkyHarbor once the PL wave wires the writer into the worker.
- Internal only: AbarVa operators and PL agents use the contract as the audit-only boundary for future ingestion work.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/admin/pilot-ingestion-ledger.ts`
- `src/lib/admin/__tests__/pilot-ingestion-ledger.test.ts`
- `src/lib/ingestion/azure-landing-zone-consumer.ts`
- `src/lib/ingestion/__tests__/azure-landing-zone-consumer.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/admin/__tests__/pilot-ingestion-ledger.test.ts src/lib/ingestion/__tests__/azure-landing-zone-consumer.test.ts --runInBand`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked locally: `npm run secrets:staged` cannot run because the `gitleaks` binary is not installed in this worktree environment; the PR secret-scanning workflow remains the release gate.

## Rollout Plan

Merge to `main`. This is an additive contract. A later PL worker can provide a real database-backed `writePilotLedger` adapter after the live/stub PL-0 verifier confirms the database/audit hop.

## Rollback Plan

Revert the PR. Existing consumers continue to work without this optional hook, and no data rollback is required because this slice does not write database rows by itself.

## Audit Evidence

- Pull request for this release candidate.
- Focused Jest coverage for accepted files, quarantined files, and ledger-writer failure.
- CI release-control and secret-scanning results.

## Known Gaps

This does not persist to Postgres yet. It creates the typed audit-only write plan and optional consumer hook that the next PL slice can back with a data-plane adapter.
