# SkyHarbor Reset/Load Pass - 02 Backup Manifest

Created: 2026-06-06

## Backup Verdict

No live DB backup/export was performed because the Azure/Postgres host was unreachable:

```text
getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com
```

Because no live rows could be inventoried, no rows could be confidently scoped for backup or deletion. The destructive lane stopped before mutation, as required.

## Backup Folder

Created:

```text
reports/2026-06-05-skyharbor-reset-load/backups/
```

The folder intentionally contains no live DB exports from this run.

## Backup Scope To Run From A Private Runtime

When run from an Azure/private-network runtime that can reach the DB, export these tables before any delete:

| Table/object | SkyHarbor predicate | Required export |
|---|---|---|
| `clients` | `id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301' OR tenant_key = 'skyharbor-air'` | JSON rows |
| `enterprise_context_source_files` | `tenant_key = 'skyharbor-air' OR client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301'` | JSON rows |
| `enterprise_context_chunks` | `tenant_key = 'skyharbor-air' OR client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301'` | JSONL rows; preserve embeddings metadata |
| `applications` | `client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301'` | JSON rows |
| `ai_initiatives` | `client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301'` | JSON rows |
| `vendor_contracts` | `client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301'` | JSON rows |
| `source_events` | `client_key = 'skyharbor-air'` plus any proven FK to SkyHarbor client | JSON rows |
| `source_artifacts` | `tenant_key = 'skyharbor-air'` plus any event/artifact FK from SkyHarbor events | JSON rows |
| Moves/engagement tables | `client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301'` | JSON rows |
| Deliverables/artifacts/docs | FK from SkyHarbor Moves/Source records or path metadata containing `skyharbor-air` only after FK proof | JSON rows and object references |
| Object/blob storage | metadata/path positively scoped to SkyHarbor | manifest of object URL/path, checksum, size, metadata |

## Local Dataset Snapshot

The repo already contains the source dataset and loader artifacts. These were not copied into backups because they are committed repo assets and no local delete was performed.

| Asset | Count/status |
|---|---:|
| `datasets/skyharbor-air-synthetic-v1` files | 130 |
| Main context JSONL lines | 480 |
| Airline overlay chunk lines | 2,760 |
| Application CSV data rows | 92 |
| Active initiative CSV data rows | 38 |
| Vendor contract CSV data rows | 52 |
| Source upload exemplars | 16 |

## Restore Principle

If a future private-runtime reset proceeds, every deleted table/object should have a matching export file in `backups/` and the delete log should reference the backup filename before the delete statement is executed.
