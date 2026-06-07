# Legacy Shutdown Readiness - Supabase Retirement

Date: 2026-06-07

Status: BLOCKED. Supabase is not safe to freeze, pause, or delete.

This evidence pack answers the current readiness question for AbarVa/Nexus:
whether legacy Supabase can be retired after Azure Container Apps, Azure
Postgres, and Azure Search cutover.

No destructive Supabase action was taken in this run. Supabase was not frozen,
paused, deleted, or pointed back into the runtime.

## Executive verdict

Supabase retirement is not safe yet.

Runtime dependency proof is green: the current Azure Container Apps runtime is
Azure/Postgres-backed and has no Supabase env or secret names projected. The
data-retirement proof is not green: fresh Supabase-vs-Azure row-level
reconciliation could not run from this environment, several required
client-evidence families remain unreconciled, Azure Search golden retrieval was
not recaptured in this run, signed-in QA did not include the full requested
Lakeshore/Meridian proof set, and final backup/restore proof is incomplete.

## Runtime dependency truth

Gate 1 is green for the current runtime.

Fresh checks from this run:

- Azure Container App: `ca-abarva-web-lab-eastus`
- Active revision: `ca-abarva-web-lab-eastus--0000052`
- Traffic: 100 percent to `0000052`
- Image: `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-70c4f98bf`
- `ABARVA_DATA_PLANE`: `azure-postgres`
- `DATABASE_URL`: secret ref `azure-postgres-control-database-url`
- Supabase env names projected: 0
- Supabase secret names present: 0
- `/api/health` on both Azure FQDN and `app.abarva.ai`: HTTP 200 with
  `postgres=true`, `direct_postgres=true`, and `azure_graph=postgres`

Detailed proof: `runtime-dependency-proof.md`.

## Data parity truth

Gate 2 is blocked.

Historical operator evidence shows count parity or Azure-ahead status for the
enterprise context and corpus/genome/context tables that were included in the
June 6/7 drain evidence. Examples:

| Table | Supabase rows | Azure rows | Status |
| --- | ---: | ---: | --- |
| `enterprise_context_records` | 3,503 | 3,503 | PARITY by count |
| `enterprise_context_facts` | 38,640 | 38,640 | PARITY by count |
| `enterprise_context_evidence` | 3,503 | 3,503 | PARITY by count |
| `enterprise_context_chunk_queue` | 3,503 | 3,503 | PARITY by count |
| `enterprise_context_chunks` | 15,847 | 21,967 | AZURE_AHEAD by count |
| `corpus_patterns` | 8,987 | 9,026 | AZURE_AHEAD by count |
| `genome_patterns` | 43,436 | 43,436 | PARITY by count |
| `intelligence_graph_edges` | 93,743 | 93,743 | PARITY by count |

This is not enough for shutdown. Fresh source-vs-target checksums, primary-key
overlap counts, and sample missing ID reports were not produced in this run.

Fresh reconciliation attempt:

- Method: Node `pg` client, Key Vault secret references, no secret values
  printed.
- Source secret: `source-postgres-database-url`
- Target secret: `azure-postgres-control-database-url`
- Result: blocked at Key Vault get for the source secret with HTTP 403.
- Current `job-supa-drain-ro-eus` and `job-supa-drain-sum-eus` definitions do
  not project `SOURCE_DATABASE_URL`, so they cannot be used as fresh
  source-backed reconciliation jobs.

Detailed matrix:

- `supabase-azure-reconcile.csv`
- `supabase-azure-reconcile.json`

## Missing tables/rows

The following required areas remain blockers because this run could not prove
that Azure has all required Supabase data, or that the data is superseded:

- `applications`
- `persons`
- `person_client_memberships`
- `engagements`
- `source_events`
- `source_event_*`
- `source_artifacts`
- `generated_artifacts`
- `move_artifact_*`
- `move_*`
- row-level checksums and PK overlap for non-zero `enterprise_context_*`,
  `corpus_*`, `genome_*`, and `intelligence_graph_edges`
- Supabase storage/object inventory and export

Detailed blocker register: `missing-data-register.csv`.

## Migration actions taken

No migration was performed in this run.

Reason: Azure-behind data was not proven because fresh source reconciliation was
blocked before database access. Running a migration without a complete
source-vs-Azure missing-ID report would risk copying the wrong scope or missing
foreign-key order requirements.

Required next migration path if missing data is found:

1. Run source-backed reconciliation from the private Azure/operator environment.
2. Produce counts, PK overlap, row checksums, and sample missing IDs for every
   required table family.
3. If Azure is behind, run an idempotent migration that preserves IDs,
   tenant/client IDs, source provenance, timestamps, and foreign-key order.
4. Re-run reconciliation until required rows are PARITY, AZURE_AHEAD with
   provenance, SUPERSEDED, or NOT_REQUIRED.

## Search/index status

Gate 4 is partial.

Historical evidence records Azure Search document count parity for
`tenant-context-v1` across six tenants:

| Tenant | Search docs |
| --- | ---: |
| `apex-retail` | 6,497 |
| `first-capital` | 400 |
| `lakeshore-holdings` | 6,576 |
| `meridian-health` | 4,376 |
| `northstar-clinical` | 878 |
| `skyharbor-air` | 3,240 |

This run did not rebuild Azure Search indexes because no new data migration was
performed. It also did not recapture the required Lakeshore and Meridian
retrieval questions with answer excerpts, citations/chunk IDs, generic-answer
review, and log proof.

Search status is not a deletion-ready green gate.

## Signed-in QA status

Gate 5 is partial.

Historical production QA evidence says `app.abarva.ai` routes rendered signed
in after Azure cutover and that fresh post-fix logs had zero Supabase
references, missing-column errors, or HTTP 500 matches. This run did not
perform signed-in browser QA with the requested Clerk personas:

- Lakeshore: `cfo@lakeshore-holdings.example.com`
- Meridian: `cdao@meridian-health.example.com`

The following required proof remains missing for this run:

- HTTP 200/no 500 after auth for both requested tenants across `/home`,
  `/intelligence`, `/strategic-moves`, `/source/queue`, `/tower`, and `/admin`.
- Correct tenant proof for both personas.
- No cross-tenant leakage proof.
- No Supabase host/env refs in logs for the QA window.
- Sentinel/Nexus answers using Azure-backed evidence.
- Row-level `ai_egress_audit.provider=anthropic` when LLM is used.

Signed-in QA is not deletion-ready.

## Backup/restore status

Gate 6 is blocked.

Historical backup evidence:

- `supabase-final-backups/supabase-final-20260607-001/`
- Azure Blob account `stabarvaprivatedplab001`
- Container `context-drops`
- 337 table JSONL exports and manifest
- Per-table SHA-256 values in the manifest/upload logs

Still missing:

- native `pg_dump` or approved restore-tested equivalent
- restore-test into a temporary database
- schema and row-count inspect from the restored backup
- Supabase storage/object inventory and export, or explicit unused proof
- retention period
- rollback owner and restore procedure

Detailed proof: `supabase-final-backup-proof.md`.

## Shutdown recommendation

Do not freeze Supabase. Do not pause Supabase. Do not delete Supabase.

Supabase retirement remains blocked until all gates are green. The correct
manual/account actions after a future green report would be:

1. Freeze writes.
2. Monitor and prove no reads/writes.
3. Pause the project only after freeze/soak/QA approval.
4. Continue monitoring no reads/writes.
5. Delete the project/account only after retention is satisfied and Anand
   explicitly approves deletion after seeing the green report.

Those actions are listed for future planning only. They were not executed.

## Blockers

1. Source DB secret access is denied to this run, blocking fresh reconciliation.
2. Current Supabase drain summary jobs do not project `SOURCE_DATABASE_URL`.
3. Required client evidence and Move/Source/artifact families are unreconciled.
4. Row-level checksums and PK overlap are missing for non-zero historical parity
   tables.
5. Azure Search golden retrieval proof for Lakeshore and Meridian was not
   captured in this run.
6. Signed-in QA with the requested Lakeshore and Meridian personas was not run
   in this run.
7. Row-level `ai_egress_audit.provider=anthropic` proof is not attached.
8. Final backup restore-test and Supabase storage export/inventory are missing.
9. Anand has not given deletion approval after a green report; this report is
   not green.

## Exact next action

Run a private Azure/operator reconciliation job that can read both
`source-postgres-database-url` and `azure-postgres-control-database-url`, emits
the required table inventory/counts/PK overlap/checksums/sample missing IDs, and
does not print secrets. Use the missing-data register as the required scope.

After that:

1. Migrate any missing required rows idempotently.
2. Re-run reconciliation until green or explicitly superseded.
3. Rebuild/verify Azure Search if context/corpus data changes.
4. Run signed-in Lakeshore and Meridian QA.
5. Complete backup/restore-test and storage export proof.
6. Prepare a new report. If and only if all gates are green, ask Anand for
   explicit final deletion approval.
