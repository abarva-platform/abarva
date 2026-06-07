# Supabase Retirement Readiness — STATUS: RECOVERED / DELETE-GATED (2026-06-07)

> Supabase was not paused, frozen, or deleted. The missing Azure
> `enterprise_context_*` layer has been restored from the final backup and
> re-indexed. Final Supabase deletion still requires Anand's explicit delete
> approval and a final account-shutdown action.

## Verdict

The immediate blocker is fixed. Azure `abarva_control` again contains the
enterprise context fact/chunk layer needed for Sentinel/Nexus current-state
answers, and Azure Search `tenant-context-v1` was rebuilt from that restored
layer.

Supabase source connectivity is still stripped from the operator jobs, so a
live Supabase-to-Azure reconcile cannot be rerun without re-adding the source
secret. However, the final backup captured earlier in
`stabarvaprivatedplab001/context-drops/supabase-final-backups/supabase-final-20260607-001/`
was readable and was used as the recovery source of truth.

## Gate status

| Gate | Status | Note |
|---|---|---|
| G1 — Runtime dependency | GREEN | Runtime is Azure-only; see `runtime-dependency-proof.md` |
| G2 — Reconcile / recovery source | RECOVERED | Live Supabase source secret is absent, but final backup was readable and complete for `enterprise_context_*` |
| G3 — Migrate missing data | GREEN | Restored `enterprise_context_*` rows into Azure Postgres from final backup |
| G4 — Search/index rebuild | GREEN | Rebuilt `tenant-context-v1`; verified 15,847 docs by tenant |
| G5 — App smoke | PARTIAL GREEN | Public `/api/health` is Azure-backed; signed-in browser QA still remains the best final human check before account deletion |
| G6 — Final backup/restore | GREEN | Backup blob was read and restored into Azure; schema/index repair applied |
| G7 — Shutdown decision | DELETE-GATED | No Supabase pause/freeze/delete performed; requires explicit delete action |

## What was fixed live

1. Restored missing Azure tables from final backup:
   - `enterprise_context_sources`: 13
   - `enterprise_context_source_files`: 57
   - `enterprise_context_records`: 3,503
   - `enterprise_context_facts`: 38,640
   - `enterprise_context_relationships`: 820
   - `enterprise_context_evidence`: 3,503
   - `enterprise_context_template_runs`: 2
   - `enterprise_context_chunk_queue`: 3,503
   - `enterprise_context_chunks`: 15,847

2. Restored schema support after emergency table creation:
   - Primary keys confirmed.
   - Enterprise context indexes restored.
   - RLS policies restored for the governed `enterprise_context_*` tables created by the enterprise-context migration.

3. Canonicalized restored visibility keys:
   - Updated stale restored `client_id` values to live `clients.id`.
   - Canonicalized restored `tenant_key='lakeshore'` chunks to `tenant_key='lakeshore-holdings'`.
   - Final orphaned `client_id` count across restored context tables: 0.

4. Rebuilt Azure Search:
   - `job-a24-search-rebuild-eus-avx6q5m`: Succeeded.
   - `job-a24-search-verify-eus-wnqa4j0`: Succeeded.
   - Search observed counts:
     - `apex-retail`: 6,497
     - `first-capital`: 400
     - `lakeshore-holdings`: 1,329
     - `meridian-health`: 3,503
     - `northstar-clinical`: 878
     - `skyharbor-air`: 3,240

## Final Azure coverage after recovery

| Client | Facts | Records | Chunks |
|---|---:|---:|---:|
| Apex Retail | 0 | 0 | 6,497 |
| Meridian Health System | 38,640 | 3,503 | 3,503 |
| SkyHarbor Air | 0 | 0 | 3,240 |
| Lakeshore Holdings | 0 | 0 | 1,329 |
| Northstar Clinical Technologies | 0 | 0 | 878 |
| First Capital | 0 | 0 | 400 |
| Lakefront Capital Boston | 0 | 0 | 0 |
| Morgan Street Holdings Chicago | 0 | 0 | 0 |
| Roosevelt Holdings Atlanta | 0 | 0 | 0 |

This is important: the system is recovered to the final-backup state, not made
richer than the backup. Meridian has the structured fact layer. Other clients
primarily have chunk substrate and still need fact-extraction/commit work if CXO
answers require fully structured org/system/KPI facts.

## Supabase source connectivity finding

`job-supa-recon-eus`, `job-supa-drain-apply-eus`, and `job-supa-final-eus` still
do not carry a Supabase source secret. They carry Azure target secrets only.
That was the cause of the earlier `ECONNREFUSED` and remains true after the
restore. The recovery did not reintroduce Supabase into runtime and did not add a
Supabase fallback.

## Production smoke after recovery

- `https://app.abarva.ai/api/health`: `ok=true`, `postgres=true`,
  `direct_postgres=true`, `azure_graph=postgres`.
- `https://app.abarva.ai/`: HTTP 200, no Vercel header observed.

## Remaining before account deletion

1. Optional but recommended: one signed-in browser smoke for Meridian and
   Lakeshore current-state questions after the restore.
2. Confirm no business/legal need to retain Supabase for the agreed retention
   period.
3. Anand gives the explicit final instruction: "delete Supabase now."
4. Delete/pause Supabase from the Supabase dashboard or with a valid Supabase
   access token. No deletion was performed in this recovery.
