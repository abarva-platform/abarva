# Supabase To Azure Decommission Runbook

Status: deleted, rollback-by-backup only
Owner: AbarVa operators  
Created: 2026-06-06
Last updated: 2026-06-07

## Rule

Supabase project `abarva` / `xtbymdryojmvoulaotce` was deleted through the
Supabase dashboard on 2026-06-07 after Azure parity, search, runtime smoke, and
native backup/restore evidence were completed externally.

Do not reintroduce Supabase runtime fallback or point `DATABASE_URL` back to a
Supabase host. Azure private Postgres is the production data plane.

## Current Evidence

Post-delete proof is recorded in
`docs/build/supabase-sunset-proof-2026-06-07/09-post-delete-cleanup.md`.

Native backup evidence reported by the operator:

- Dump:
  `/Users/anand/Downloads/abarva-supabase-native-pgdump-20260607-001/supabase-final.dump`
- SHA-256:
  `302ccb962614ac9a1ac6ab672838c06d1299aa181a1f0b13be943bf63f77ac8b`
- Restore test passed for AbarVa app/corpus data; only Supabase-managed Vault
  extension objects were excluded.

Historical migration evidence follows.

Read-only Azure Container Apps execution `job-supa-drain-sum-eus-axp1kij` ran on 2026-06-06.

It proved:

- Source Supabase host: `aws-1-us-east-2.pooler.supabase.com`
- Target Azure host: `pg-abarva-context-lab-001.postgres.database.azure.com`
- Azure private DNS resolved the target to `10.43.1.4`
- Target database: `abarva_control`

Targeted Azure schema unblock:

- Execution `job-ec-schema-eus-8vwh99b` applied exactly one migration to Azure Postgres:
  `20260514100000_enterprise_context_layer.sql`.
- Execution `job-ec-schema-check-eus-iz7faco` then verified `ok: true` for the
  enterprise context schema on Azure database `abarva_control` at private address
  `10.43.1.4/32`.
- All enterprise context target tables now exist.

Live drain apply:

- Execution `job-supa-natural-eus-h7s7qc0` ran from Azure Container Apps on
  2026-06-06 and succeeded.
- Target database was `abarva_control` as user `abarvaadmin`.
- Target private address was `10.43.1.4/32`.
- The job copied Supabase rows using natural keys where Azure already had
  canonical rows, including client remapping for existing Azure client IDs.
- No Supabase account pause, delete, or production env removal happened in this
  step.

Read-only reconciliation:

- Execution `job-supa-recon-eus-cy73h9i` ran from Azure Container Apps on
  2026-06-06 and succeeded.
- Reconciliation result: `ok: true`, `blockers: []`.
- Source was legacy Supabase Postgres; target was Azure Postgres
  `abarva_control` at private address `10.43.1.4/32`.

Post-migration table truth:

| Table                              | Supabase rows | Azure rows |    Gap | Status      |
| ---------------------------------- | ------------: | ---------: | -----: | ----------- |
| `clients`                          |             9 |          9 |      0 | Parity      |
| `canonical_industry_ai_patterns`   |           312 |        312 |      0 | Parity      |
| `foundational_pattern_packs`       |             1 |          1 |      0 | Parity      |
| `foundational_pattern_variants`    |             3 |          3 |      0 | Parity      |
| `genome_patterns`                  |        43,436 |     43,436 |      0 | Parity      |
| `knowledge_sources`                |           136 |        136 |      0 | Parity      |
| `knowledge_chunks`                 |             0 |          0 |      0 | Parity      |
| `intelligence_graph_edges`         |        93,743 |     93,743 |      0 | Parity      |
| `pattern_packs`                    |            21 |         21 |      0 | Parity      |
| `pattern_match_logs`               |             6 |          6 |      0 | Parity      |
| `corpus_patterns`                  |         8,987 |      9,026 |    +39 | Azure ahead |
| `corpus_pattern_versions`          |         8,987 |      9,026 |    +39 | Azure ahead |
| `corpus_pattern_content`           |         8,987 |      9,026 |    +39 | Azure ahead |
| `corpus_pattern_relationships`     |        27,052 |     27,169 |   +117 | Azure ahead |
| `corpus_telemetry`                 |         9,027 |      9,066 |    +39 | Azure ahead |
| `enterprise_context_sources`       |            13 |         13 |      0 | Parity      |
| `enterprise_context_source_files`  |            57 |         57 |      0 | Parity      |
| `enterprise_context_records`       |         3,503 |      3,503 |      0 | Parity      |
| `enterprise_context_facts`         |        38,640 |     38,640 |      0 | Parity      |
| `enterprise_context_relationships` |           820 |        820 |      0 | Parity      |
| `enterprise_context_evidence`      |         3,503 |      3,503 |      0 | Parity      |
| `enterprise_context_template_runs` |             2 |          2 |      0 | Parity      |
| `enterprise_context_chunk_queue`   |         3,503 |      3,503 |      0 | Parity      |
| `enterprise_context_chunks`        |        15,847 |     21,967 | +6,120 | Azure ahead |

Zero-row tables also reconciled with parity on both sides:
`emergent_patterns`, `outcome_pattern_feedback`, `corpus_review_state`,
`corpus_overlays`, `client_private_patterns`,
`enterprise_context_quality_issues`, `enterprise_context_stewardship_tasks`,
and `enterprise_context_snapshots`.

## Stages

1. Freeze/read-only before deletion. Completed externally; dashboard showed
   read-only mode before deletion.
2. Run the read-only drain dry-run from Azure Container Apps. Completed with `job-supa-drain-sum-eus-axp1kij`.
3. Apply missing Azure schema for target-missing enterprise context tables. Completed with `job-ec-schema-eus-8vwh99b`.
4. Run the drain apply from Azure-hosted compute only. Completed with `job-supa-natural-eus-h7s7qc0`.
5. Re-run reconciliation until Azure is at parity or intentionally ahead. Completed with `job-supa-recon-eus-cy73h9i`.
6. Rebuild/search verify from Azure. Completed in later cutover proof.
7. Remove Supabase env vars/secrets from Azure runtime/jobs. Completed for
   projected app/job runtime references; Key Vault historical source secrets
   still require private-network delete permission.
8. Run Azure-only app and retrieval smoke. Completed; 24-72 hour soak remains a
   separate operational gate for DNS/Vercel decisions.
9. Take final off-platform backup/export. Completed externally with native
   `pg_dump`; checksum above.
10. Restore-test backup. Completed externally; counts above.
11. Delete Supabase. Completed externally through Supabase dashboard.

## Commands

Do not run Supabase drain commands after deletion. Historical drain jobs should
not be restarted because their Supabase source no longer exists and their
`SOURCE_DATABASE_URL` runtime projection has been removed.

## Shutdown Gate

Supabase has been shut down/deleted. Current gates are post-delete controls:

- Keep the native backup and checksum for the agreed retention window.
- Keep Azure private Postgres as the only production data plane.
- Keep boot guard and runtime import guard enabled.
- Do not change DNS or remove Vercel production until separate approval after
  soak/QA.
