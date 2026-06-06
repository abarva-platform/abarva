# 2026-06-06 SkyHarbor Reset/Load Blocked Evidence Packet

## Release Metadata

| Field | Value |
|---|---|
| Release ID | `2026-06-06-skyharbor-reset-load-blocked` |
| Date | 2026-06-06 |
| Lane | `client-data-lane` / `internal-admin` |
| Scope | Reports only; no runtime code, schema, data mutation, or production deploy |
| Client applicability | SkyHarbor Air only |

## What Changed

Adds a reset/load evidence packet under `reports/2026-06-05-skyharbor-reset-load/`. The packet documents the current truth state for the SkyHarbor destructive cleanup lane: local dataset and loader dry-run are healthy, but live Azure/Postgres inventory/backup/delete/load are blocked because the configured private Azure Postgres hostname does not resolve from this runtime.

## Layer Impact

| Layer | Impact |
|---|---|
| Runtime app | none |
| Database/data plane | none; no connection succeeded and no mutation was attempted |
| Corpus/context layer | no live change; dry-run only |
| Admin/operator docs | adds evidence and blocker reports |
| Client-visible product | none |

## QA / Validation

Commands run:

```bash
env -u GH_TOKEN git fetch origin --prune
env -u GH_TOKEN git merge --ff-only origin/main
node <pg connectivity probe>
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --dry-run --skip-embeddings
```

Observed:

- DB probe failed with `getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`.
- Loader dry-run passed with 3,240 chunks, 92 applications, 38 initiatives, and 52 vendor contracts.
- No delete, load, proof record creation, or browser proof was attempted.

## Rollout

Merge reports to main as audit evidence only. No deployment is required.

## Rollback

Revert this docs/report-only PR to remove the evidence packet. No data rollback is required because no data changed.

## Audit Evidence

- `reports/2026-06-05-skyharbor-reset-load/01-current-state-inventory.md`
- `reports/2026-06-05-skyharbor-reset-load/02-backup-manifest.md`
- `reports/2026-06-05-skyharbor-reset-load/03-delete-log.md`
- `reports/2026-06-05-skyharbor-reset-load/04-clean-slate-verification.md`
- `reports/2026-06-05-skyharbor-reset-load/05-loader-dry-run.md`
- `reports/2026-06-05-skyharbor-reset-load/06-real-load-log.md`
- `reports/2026-06-05-skyharbor-reset-load/07-post-load-verification.md`
- `reports/2026-06-05-skyharbor-reset-load/08-moves-source-proof.md`
