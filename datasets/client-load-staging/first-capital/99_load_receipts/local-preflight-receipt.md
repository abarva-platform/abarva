# First Capital Local Refresh Receipt

Batch: `fcf-refresh-2026-06-candidate-v1`
Generated: `2026-06-17T00:00:00.000Z`
Client: `first-capital` / `a75687bf-71b9-4524-ab4e-68ae3f28d200`

## State Ledger

| State | Result | Evidence |
| --- | --- | --- |
| Local artifact generated | passed | 90 source files cataloged in `00_manifest/source-catalog.csv`; AI Control Tower refresh CSVs generated. |
| Local parse/preflight passed | passed | Static audit says First Capital is `load_ready_after_live_proof`, 3,148 parseable rows, 0 fixture-like files, 0 gaps. |
| AI Control Tower contract check | passed | 12 refresh CSVs checked; all required headers present. |
| Loader dry-run | passed | Would update 1 client profile, insert 60 source files, upsert 400 chunks, insert 180 apps, upsert 42 initiatives, upsert 70 vendor contracts; errors 0. |
| Live loader attempt | blocked before mutation | Actual load attempt failed at DNS resolution for `pg-abarva-context-lab-001.postgres.database.azure.com`; no database connection was opened. |
| Product loader/API accepted upload | not run | Requires signed-in product/API path or private loader job. |
| Azure Blob staged originals | not run | Needs private/backend staging path. |
| Parser extracted cited facts/chunks | local candidate only | Structured refresh rows and source-catalog citation grain staged; live parser receipt pending. |
| Context rows committed | not run | Current shell cannot resolve private Azure Postgres host. |
| Embeddings/search refreshed | not run | Must follow live commit. |
| AI Control Tower `ai_control_*` rows committed | not run | Workbook/API committer still needs live binding/proof. |
| Retrieval/QA proven | not run | Must run after commit/index. |
| Insight evaluator run | not run | Must run after facts/chunks are committed. |

## Live Blocker

`node scripts/audit/live-tenant-population-audit.mjs` wrote a connection-error receipt: `ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`. No live read-only counts were run from this shell.

## Next Execution From Private Network

1. Stage originals to Azure Blob for First Capital.
2. Run `TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts` from the private/VNet-capable job context.
3. Commit AI Control Tower monthly refresh rows into `ai_control_*` tables.
4. Refresh embeddings/search.
5. Run live population audit, retrieval proof questions, then insight evaluator.
