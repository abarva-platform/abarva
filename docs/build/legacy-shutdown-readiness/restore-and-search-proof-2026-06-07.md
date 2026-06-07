# Enterprise Context Restore + Azure Search Proof — 2026-06-07

## Scope

Emergency recovery of the missing `enterprise_context_*` layer in Azure
`abarva_control`. Recovery source was the existing final backup blob:

`stabarvaprivatedplab001/context-drops/supabase-final-backups/supabase-final-20260607-001/`

No Supabase runtime fallback was added. No Supabase pause, freeze, or delete was
performed.

## Target

Azure Postgres proof:

```text
current_database = abarva_control
inet_server_addr = 10.43.1.4
user = abarvaadmin
```

## Restored row counts

| Table | Rows after restore |
|---|---:|
| enterprise_context_sources | 13 |
| enterprise_context_source_files | 57 |
| enterprise_context_records | 3,503 |
| enterprise_context_facts | 38,640 |
| enterprise_context_relationships | 820 |
| enterprise_context_evidence | 3,503 |
| enterprise_context_quality_issues | 0 |
| enterprise_context_stewardship_tasks | 0 |
| enterprise_context_snapshots | 0 |
| enterprise_context_template_runs | 2 |
| enterprise_context_chunk_queue | 3,503 |
| enterprise_context_chunks | 15,847 |

## Schema repair

After the emergency row restore, the following schema support was restored:

- Primary-key indexes confirmed.
- Enterprise-context unique/read indexes restored.
- RLS policies restored for the governed enterprise-context tables.

Index count proof after repair:

```text
enterprise_context_chunk_queue: 3
enterprise_context_chunks: 5
enterprise_context_evidence: 4
enterprise_context_facts: 4
enterprise_context_quality_issues: 3
enterprise_context_records: 6
enterprise_context_relationships: 3
enterprise_context_snapshots: 3
enterprise_context_source_files: 3
enterprise_context_sources: 3
enterprise_context_stewardship_tasks: 3
enterprise_context_template_runs: 3
```

Policy count proof after repair:

```text
5 policies each:
enterprise_context_sources
enterprise_context_source_files
enterprise_context_records
enterprise_context_facts
enterprise_context_relationships
enterprise_context_evidence
enterprise_context_quality_issues
enterprise_context_stewardship_tasks
enterprise_context_snapshots
enterprise_context_template_runs
enterprise_context_chunk_queue
```

## Client visibility repair

Restored rows carried older `client_id` values from the backup. They were
canonicalized to live `clients.id` values by `tenant_key`. The restored
`lakeshore` tenant key was canonicalized to `lakeshore-holdings`.

Final orphaned `client_id` count across restored context tables: `0`.

Final coverage:

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

## Azure Search rebuild

Execution:

```text
job-a24-search-rebuild-eus-avx6q5m: Succeeded
job-a24-search-verify-eus-wnqa4j0: Succeeded
```

Log evidence:

```json
{"event":"azure_search_index_deleted","index":"tenant-context-v1","status":204}
{"event":"azure_search_index_applied","index":"tenant-context-v1"}
{"event":"azure_search_backfill_batch_uploaded","uploaded":15847}
{"event":"azure_search_backfill_verified","observed":{"apex-retail":6497,"first-capital":400,"lakeshore-holdings":1329,"meridian-health":3503,"northstar-clinical":878,"skyharbor-air":3240}}
```

## Runtime smoke

Production still resolves to Azure:

```text
https://app.abarva.ai/api/health:
ok=true
postgres=true
direct_postgres=true
azure_graph=postgres

https://app.abarva.ai/:
HTTP 200
no Vercel header observed
```

## Remaining caveats

- Supabase source credentials remain absent from the reconcile/drain/final jobs.
  A live Supabase reconcile cannot be rerun unless that source secret is restored.
- Recovery restored the final backup state. It did not create structured facts for
  tenants whose backup only contained chunks.
- Supabase account deletion was not performed. Deletion remains gated by Anand's
  explicit final approval and account-level action.

