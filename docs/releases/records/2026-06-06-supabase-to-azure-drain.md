# 2026-06-06-supabase-to-azure-drain

## Release ID

`2026-06-06-supabase-to-azure-drain`

## Status

`live-data-migrated`

## Plain-English Summary

Adds the controlled Supabase-to-Azure drain tooling needed before Supabase can be paused or deleted. The new script defaults to read-only dry-run mode, preserves primary keys, and only writes when an operator explicitly passes `--apply`.

On 2026-06-06, operators also completed the live Azure-hosted drain using an inline Container Apps job while waiting for a fresh ACR image containing the committed script. The tracked Supabase corpus, pattern, graph, and enterprise context tables now reconcile to Azure parity or Azure-ahead status.

## Layer Impact

- `client-data-lane`: Covers corpus, pattern, knowledge, graph, and enterprise context tables that may still be ahead in Supabase.
- `internal-admin`: Adds an operator-only Azure Container Apps job parameter file for dry-run execution from the private plane.

## Client Applicability

- All clients: Yes, because the legacy Supabase store may contain cross-client corpus and context rows.
- Specific clients: None hard-coded.
- Internal only: Yes.
- Public/demo only: No.

## Changes Included

- Adds `scripts/data-plane/drain-supabase-to-azure.ts`.
- Adds `infra/azure/parameters/supabase-drain-dry-run.lab.bicepparam`.
- Adds `docs/runbooks/supabase-to-azure-decommission.md`.
- The script covers canonical corpus tables, knowledge sources/chunks, genome/graph patterns, pattern-pack tables, and enterprise context tables when present.
- Updates the decommission runbook with live apply and reconciliation evidence.

## QA / Validation

- Pass: focused TypeScript validation for `scripts/data-plane/drain-supabase-to-azure.ts`.
- Pass: `az bicep build-params --file infra/azure/parameters/supabase-drain-dry-run.lab.bicepparam --outfile /tmp/supabase-drain-dry-run.lab.json`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass with expected non-zero blocker status: Azure-hosted read-only summary execution `job-supa-drain-sum-eus-axp1kij` connected to Supabase source and Azure private target, then reported Azure-behind and target-missing blockers.
- Pass: targeted Azure schema unblock execution `job-ec-schema-eus-8vwh99b` applied exactly `20260514100000_enterprise_context_layer.sql`.
- Pass: Azure target-only schema check execution `job-ec-schema-check-eus-iz7faco` verified all `enterprise_context_*` target tables exist in `abarva_control` at private address `10.43.1.4/32`.
- Pass: Azure-hosted apply execution `job-supa-natural-eus-h7s7qc0` succeeded against Azure target `abarva_control` at private address `10.43.1.4/32`.
- Pass: Azure-hosted reconciliation execution `job-supa-recon-eus-cy73h9i` succeeded with `ok: true` and `blockers: []`.
- Pass: reconciliation showed Azure parity for key migrated tables including `genome_patterns` `43,436 / 43,436`, `intelligence_graph_edges` `93,743 / 93,743`, `knowledge_sources` `136 / 136`, `enterprise_context_records` `3,503 / 3,503`, `enterprise_context_facts` `38,640 / 38,640`, and `enterprise_context_evidence` `3,503 / 3,503`.
- Pass: reconciliation showed Azure-ahead status for corpus tables where Azure already contained local/demo rows: `corpus_patterns` `8,987 / 9,026`, `corpus_pattern_versions` `8,987 / 9,026`, `corpus_pattern_content` `8,987 / 9,026`, `corpus_pattern_relationships` `27,052 / 27,169`, `corpus_telemetry` `9,027 / 9,066`, and `enterprise_context_chunks` `15,847 / 21,967`.

## Rollout Plan

Merge the tooling, build/deploy an image containing the script, and run the dry-run job from Azure Container Apps. Only after the dry-run shows no target schema blockers should an operator run the script with `--apply`.

The live data drain has now completed. Remaining rollout work before Supabase shutdown is: freeze Supabase writes, rebuild Azure-backed search/vector indexes, remove Supabase env vars and fallback paths, run Azure-only signed-in retrieval/app soak, export a final backup, pause Supabase, then delete only after the retention window.

## Rollback Plan

Revert this PR to remove the committed tooling/docs. The live migration itself is data-plane state and is not rolled back by reverting code. If a data rollback is required, restore from the final pre-shutdown Supabase/export backup and re-run reconciliation before changing runtime envs.

## Audit Evidence

- PR containing this release record.
- Bicep parameter compilation output.
- Release Control Gate output.
- Azure Container Apps read-only summary execution `job-supa-drain-sum-eus-axp1kij`.
- Azure Container Apps broader read-only inventory execution `job-supa-drain-ro-eus-ka1a0yr`.
- Azure Container Apps targeted schema execution `job-ec-schema-eus-8vwh99b`.
- Azure Container Apps schema verification execution `job-ec-schema-check-eus-iz7faco`.
- Azure Container Apps live apply execution `job-supa-natural-eus-h7s7qc0`.
- Azure Container Apps read-only reconciliation execution `job-supa-recon-eus-cy73h9i`.

## Known Gaps

- This release does not delete, pause, or modify Supabase.
- The live drain copied tracked rows to Azure, but app/runtime removal of Supabase fallbacks and Azure-only retrieval proof are still pending.
- Search/vector indexes still need to be rebuilt from Azure.
- A final off-platform backup and pause-before-delete retention step are still required before closing the Supabase account.
- `infra/azure/parameters/supabase-drain-dry-run.lab.bicepparam` requires a container image that contains this release's script before it can run directly; the 2026-06-06 evidence used an inline read-only command on the existing image.
