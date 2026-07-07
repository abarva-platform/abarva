# 2026-06-04-lakeshore-governed-load-rehearsal — Lakeshore Governed Load Rehearsal

## Release ID

`2026-06-04-lakeshore-governed-load-rehearsal`

## Status

`candidate`

## Plain-English Summary

Adds an operator-run rehearsal for the Lakeshore Holdings data-load package. The runner reads the exact offline review bundle, parses every generated CSV through the real context-upload connector, parses every generated PDF/DOCX/PPTX document through the ingestion document parser, proves the sensitive-data quarantine gate with a deliberate bad row, and writes a load ledger. It defaults to dry-run so operators can verify the full package without mutating a tenant data plane; commit mode is available only when the Lakeshore client ID and database routing are present.

## Layer Impact

- `client-data-lane`: Creates a governed rehearsal path for Lakeshore context data before live tenant data-plane commit.
- `internal-admin`: Adds an operator CLI and ledger output used by AbarVa during the new-client standup rehearsal.

## Client Applicability

- All clients: No direct runtime change.
- Specific clients: Lakeshore Holdings rehearsal package only.
- Internal only: AbarVa operators running the Lakeshore new-client standup.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/lakeshore/load-rehearsal.ts` — load-plan library for manifest loading, CSV connector rehearsal, document parsing, and quarantine probe.
- `src/scripts/lakeshore/rehearse-governed-load.ts` — CLI runner with dry-run and commit modes.
- `src/lib/lakeshore/__tests__/load-rehearsal.test.ts` — focused tests for the real Lakeshore manifest and quarantine probe.
- `docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-dry-run-latest.json` — audit ledger from the current dry-run.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/lakeshore/__tests__/load-rehearsal.test.ts` — passed; 18 CSV files, 1,329 rows/chunks, and quarantine probe validated.
- `npx tsx src/scripts/lakeshore/rehearse-governed-load.ts --mode=dry-run --client-id=lakeshore-client-dry-run --out=docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-dry-run-latest.json` — passed; parsed 18 CSV files, 1,329 rows/chunks, 21 documents, 11,098 extracted document characters, and quarantine decision `quarantine`.

## Rollout Plan

Merge to `main`. No automatic runtime activation occurs. Operators run the CLI in dry-run mode for package proof, then in commit mode only after Lakeshore Clerk org, client ID, Azure/Postgres routing, and operator authority are verified.

## Rollback Plan

Revert the PR to remove the CLI/library and ledger artifact. No database migration or tenant data-plane mutation is introduced by the default dry-run.

## Audit Evidence

- Dry-run ledger: `docs/build/lakeshore/loaded/load-runs/lakeshore-governed-load-dry-run-latest.json`.
- Test output from `load-rehearsal.test.ts`.
- Release record in this file.

## Known Gaps

- Commit mode still requires the real Lakeshore `clients.id`, private data-plane routing, and operator credentials.
- The CLI prepares/commits CSV chunks through the existing connector; document chunks are parsed and ledgered here, while live document evidence persistence depends on the landing-zone pipeline and commit-mode environment.
