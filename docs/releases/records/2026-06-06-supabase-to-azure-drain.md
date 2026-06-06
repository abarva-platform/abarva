# 2026-06-06-supabase-to-azure-drain

## Release ID

`2026-06-06-supabase-to-azure-drain`

## Status

`candidate`

## Plain-English Summary

Adds the controlled Supabase-to-Azure drain tooling needed before Supabase can be paused or deleted. The new script defaults to read-only dry-run mode, preserves primary keys, and only writes when an operator explicitly passes `--apply`.

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

## QA / Validation

- Pass: focused TypeScript validation for `scripts/data-plane/drain-supabase-to-azure.ts`.
- Pass: `az bicep build-params --file infra/azure/parameters/supabase-drain-dry-run.lab.bicepparam --outfile /tmp/supabase-drain-dry-run.lab.json`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass with expected non-zero blocker status: Azure-hosted read-only summary execution `job-supa-drain-sum-eus-axp1kij` connected to Supabase source and Azure private target, then reported Azure-behind and target-missing blockers.
- Pass: targeted Azure schema unblock execution `job-ec-schema-eus-8vwh99b` applied exactly `20260514100000_enterprise_context_layer.sql`.
- Pass: Azure target-only schema check execution `job-ec-schema-check-eus-iz7faco` verified all `enterprise_context_*` target tables exist in `abarva_control` at private address `10.43.1.4/32`.

## Rollout Plan

Merge the tooling, build/deploy an image containing the script, and run the dry-run job from Azure Container Apps. Only after the dry-run shows no target schema blockers should an operator run the script with `--apply`.

## Rollback Plan

Revert this PR. No data is modified by default, and the committed Azure job parameter file runs the script without `--apply`.

## Audit Evidence

- PR containing this release record.
- Bicep parameter compilation output.
- Release Control Gate output.
- Azure Container Apps read-only summary execution `job-supa-drain-sum-eus-axp1kij`.
- Azure Container Apps broader read-only inventory execution `job-supa-drain-ro-eus-ka1a0yr`.
- Azure Container Apps targeted schema execution `job-ec-schema-eus-8vwh99b`.
- Azure Container Apps schema verification execution `job-ec-schema-check-eus-iz7faco`.

## Known Gaps

- This release does not delete, pause, or modify Supabase.
- This release does not run the apply copy.
- The `enterprise_context_*` target schema blocker was cleared on 2026-06-06, but the data rows are still pending copy.
- `infra/azure/parameters/supabase-drain-dry-run.lab.bicepparam` requires a container image that contains this release's script before it can run directly; the 2026-06-06 evidence used an inline read-only command on the existing image.
