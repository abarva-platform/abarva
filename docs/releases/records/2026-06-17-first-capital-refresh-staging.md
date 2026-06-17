# 2026-06-17-first-capital-refresh-staging — First Capital Refresh Staging

## Release ID

`2026-06-17-first-capital-refresh-staging`

## Status

`candidate`

## Plain-English Summary

Stages First Capital Financial for a governed data refresh across Intelligence Explorer and AI Control Tower. The release improves the synthetic enterprise substrate, adds client-load staging folders and receipts, creates a reproducible First Capital staging builder, and produces AI Control Tower monthly refresh CSVs with initiative, usage, productivity, DORA, agent, benefit, spend, risk, evidence, and refresh-log rows.

This is not a completed live data load. The local packet is ready, preflighted, and dry-run validated. Live commit, embedding refresh, retrieval proof, and insight evaluation must run from the private data-plane network because the current shell cannot resolve the Azure Postgres private host.

## Layer Impact

- `client-data-lane`: First Capital candidate context substrate, staged refresh package, generated AI Control Tower monthly refresh rows, and local receipts.
- `internal-admin`: Adds reproducible audit/staging scripts and operator evidence for the load process.
- `global-control-lane`: Adds shared client-load staging templates and data-quality runbooks used by future client onboarding, without changing runtime product behavior.

## Client Applicability

- All clients: shared staging templates and operating model are reusable.
- Specific clients: First Capital Financial receives the staged refresh packet.
- Internal only: audit scripts, receipts, and operator runbooks.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- First Capital source/corpus quality improvements under `datasets/first-capital-financial-synthetic-v1/`.
- Client staging packet under `datasets/client-load-staging/first-capital/`.
- AI Control Tower monthly refresh CSVs under `datasets/client-load-staging/first-capital/13_ai_control_tower_monthly_refresh/`.
- Shared client onboarding/staging templates under `datasets/client-load-staging/` and `datasets/templates/`.
- Data-quality audit reports under `docs/build/data-quality/`.
- Staging builder: `scripts/staging/build-first-capital-load-staging.mjs`.
- Static data audit: `scripts/audit/enterprise-synthetic-data-depth-audit.mjs`.
- Live population probe: `scripts/audit/live-tenant-population-audit.mjs`.
- Guarded private-network load workflow: `.github/workflows/first-capital-refresh-load.yml`; this is a loader-backed ingestion path, not a seed side-load.

## QA / Validation

- `node scripts/staging/build-first-capital-load-staging.mjs`
  - Generated 90 source catalog rows, 42 initiatives, 18 tool usage rows, 22 productivity rows, 22 DORA rows, 42 benefit rows, 70 spend rows, 50 risk rows, and 80 evidence rows.
- `node scripts/audit/enterprise-synthetic-data-depth-audit.mjs`
  - First Capital result: `load_ready_after_live_proof`, 3,148 parseable rows, zero fixture-like files, zero static gaps.
- AI Control Tower CSV header contract check
  - All 12 staged refresh CSVs contain the required monthly refresh headers.
- `TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --dry-run`
  - Dry-run would update 1 client profile, insert 60 source files, upsert 400 chunks, insert 180 applications, upsert 42 initiatives, and upsert 70 vendor contracts with zero dry-run errors.
- `node scripts/audit/live-tenant-population-audit.mjs`
  - Blocked by private DNS from current shell: `ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`.
- `git diff --check -- datasets/client-load-staging/first-capital scripts/staging/build-first-capital-load-staging.mjs docs/build/data-quality`
  - Passed.

## Rollout Plan

1. Merge this candidate branch so the staged packet and operator scripts are available to the deployment environment.
2. Deploy `main` through the ACA main deploy workflow.
3. Run the guarded `First Capital refresh load` workflow from `main` with `tenant_key=first-capital`, `dry_run=false`, `require_live_embeddings=true`, `evaluate_insights=true`, and `run_population_audit=true`; this is the approved loader-backed private job path until the Admin Data Loader supports the full substrate refresh end to end.
4. Record the load in the ingestion ledger (`data_ingestion_runs` / `pilot_ingestion`) with the First Capital batch id before treating the data as committed.
5. Use the workflow evidence artifact to confirm source files, chunks, applications, initiatives, vendors, context insights, and live tenant population counts.
6. Commit the AI Control Tower monthly refresh rows into `ai_control_*` tables through the governed parser/API path once that parser is verified.
7. Verify `/api/intelligence/insights`, Tower Evidence lens, and signed-in Atlas retrieval.

## Rollback Plan

Before live load, rollback is removing the staged branch/files. After live load, rollback should export First Capital refresh receipts, mark affected `context_insights` rows as `superseded`, and remove or supersede rows created by the refresh batch rather than hard-deleting without provenance.

## Audit Evidence

- `datasets/client-load-staging/first-capital/99_load_receipts/local-preflight-receipt.md`
- `docs/build/data-quality/enterprise-synthetic-data-depth-audit.md`
- `docs/build/data-quality/live-tenant-population-audit.md`
- `docs/build/data-quality/first-capital-insights-layer-plan.md`

## Known Gaps

- Live Azure/Postgres load was not completed from this shell because private DNS is unavailable; no side-load is authorized or claimed.
- Azure Blob staging, parser commit receipts, embeddings/search refresh, retrieval proof, and insight evaluator proof are pending private-network execution.
- Public-company annual/quarterly/investor source evidence and deeper infrastructure topology remain marked as follow-up evidence gaps before board-grade external claims.
