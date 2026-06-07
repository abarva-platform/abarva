# 2026-06-07-supabase-retirement-readiness — Supabase retirement readiness recovery

## Release ID

`2026-06-07-supabase-retirement-readiness`

## Status

`candidate` (client-data recovery proof; no Supabase deletion)

## Plain-English Summary

Supabase retirement was blocked because Azure `abarva_control` had lost the
`enterprise_context_*` fact/context layer. The live Supabase source secret had
also been stripped from the reconcile/drain/final jobs, so a fresh live
Supabase-to-Azure reconcile could not be rerun.

The blocker was recovered using the existing final backup in Azure Blob Storage.
The missing `enterprise_context_*` tables were restored into Azure Postgres,
client IDs and tenant keys were canonicalized to the live `clients` table, schema
indexes/policies were repaired, and Azure Search `tenant-context-v1` was rebuilt
and verified.

No Supabase runtime fallback was added. Supabase was not paused, frozen, or
deleted.

## Layer Impact

- `client-data-lane`: restored client enterprise context data into Azure
  Postgres from a final backup and rebuilt Azure Search.
- No runtime source code changes in this record.
- No DNS, Vercel, Supabase account, drain/freeze/delete, or app-runtime fallback
  changes.

## Client Applicability

The restored context substrate is available to all clients represented in the
final backup:

- Apex Retail
- Meridian Health System
- SkyHarbor Air
- Lakeshore Holdings
- Northstar Clinical Technologies
- First Capital

Meridian is the only restored tenant with structured `enterprise_context_records`
and `enterprise_context_facts`; the other restored tenants have chunk substrate
and still need structured fact extraction if CXO answers require complete
fact-layer coverage.

## Changes Included

- `docs/build/legacy-shutdown-readiness/README.md`
- `docs/build/legacy-shutdown-readiness/runtime-dependency-proof.md`
- `docs/build/legacy-shutdown-readiness/missing-data-register.csv`
- `docs/build/legacy-shutdown-readiness/restore-and-search-proof-2026-06-07.md`

## QA / Validation

- **PASS** — Gate 1 runtime dependency proof: production runtime is Azure-backed.
- **RECOVERED** — Gate 2/G3 data layer: final backup restored to Azure.
- **PASS** — restored row counts:
  - `enterprise_context_sources`: 13
  - `enterprise_context_source_files`: 57
  - `enterprise_context_records`: 3,503
  - `enterprise_context_facts`: 38,640
  - `enterprise_context_relationships`: 820
  - `enterprise_context_evidence`: 3,503
  - `enterprise_context_template_runs`: 2
  - `enterprise_context_chunk_queue`: 3,503
  - `enterprise_context_chunks`: 15,847
- **PASS** — client visibility repair:
  - Orphaned restored `client_id` count: 0.
  - `lakeshore` tenant key canonicalized to `lakeshore-holdings`.
- **PASS** — Azure Search rebuild:
  - `job-a24-search-rebuild-eus-avx6q5m`: Succeeded.
  - `job-a24-search-verify-eus-wnqa4j0`: Succeeded.
  - Verified Search counts: Apex 6,497; First Capital 400; Lakeshore 1,329;
    Meridian 3,503; Northstar 878; SkyHarbor 3,240.
- **PASS** — production public smoke:
  - `https://app.abarva.ai/api/health`: `ok=true`,
    `direct_postgres=true`, `azure_graph=postgres`.
  - `https://app.abarva.ai/`: HTTP 200; no Vercel header observed.

## Rollout Plan

No application rollout is required for this record. The live Azure data plane has
already been recovered from the final backup and reindexed.

Before deleting Supabase:

1. Run one final signed-in browser smoke for Meridian and Lakeshore if desired.
2. Confirm retention/business approval.
3. Anand gives explicit final deletion approval.
4. Delete/pause Supabase through the Supabase account workflow or CLI using a
   valid token.

## Rollback Plan

If the restore needs to be undone, restore Azure Postgres from a point-in-time
backup taken before the emergency row restore. No Supabase account action was
taken, so Supabase remains available unless separately deleted.

## Audit Evidence

- `docs/build/legacy-shutdown-readiness/restore-and-search-proof-2026-06-07.md`
- Azure final backup prefix:
  `stabarvaprivatedplab001/context-drops/supabase-final-backups/supabase-final-20260607-001/`
- Azure Search executions:
  - `job-a24-search-rebuild-eus-avx6q5m`
  - `job-a24-search-verify-eus-wnqa4j0`

## Known Gaps

- Supabase source connectivity remains stripped from the operator jobs. A live
  Supabase source reconcile cannot be rerun unless that source secret is restored.
- Recovery restored the final backup state. It did not create structured facts for
  clients that only had chunk substrate in that backup.
- Supabase deletion remains an explicit account-level decision and was not
  performed in this recovery.
