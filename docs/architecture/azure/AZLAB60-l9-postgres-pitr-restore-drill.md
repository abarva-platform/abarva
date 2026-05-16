# AZLAB60 - L9 Azure Postgres PITR Restore Drill

Status: wired; live restore run pending  
Layer: L9 - Resilience / DR; L5 - Data integrity

## Purpose

AZLAB59 proves the app exposes a safe protected-read-only degradation contract
when the Postgres path is impaired. AZLAB60 measures the managed database
recovery path itself: can Azure Database for PostgreSQL Flexible Server restore
the lab system of record to a private sandbox target, and how long does it take?

This is the RTO/RPO evidence enterprise reviewers ask for. It is also the
lowest-friction rehearsal before a customer VPC deployment.

## Source Server

| Item | Value |
| --- | --- |
| Source server | `pg-abarva-context-lab-001` |
| Resource group | `rg-abarva-database-lab-eastus2` |
| Region | `eastus2` |
| Version | PostgreSQL 16 |
| SKU | `Standard_B1ms` |
| Storage | 32 GB |
| Backup retention | 7 days |
| Earliest restore observed | `2026-05-15T01:54:36.807453+00:00` |
| Public network access | `Disabled` |

## What Changed

| Artifact | Purpose |
| --- | --- |
| `scripts/azure/postgres-pitr-restore-drill.mjs` | Operator script that plans or executes a point-in-time restore to a temporary private server. |
| `npm run azure:postgres:pitr-drill` | Package command for dry-run and live restore drills. |

## Operator Commands

Plan only:

```bash
npm run azure:postgres:pitr-drill -- --minutes-ago 20
```

Live restore with cleanup:

```bash
npm run azure:postgres:pitr-drill -- \
  --minutes-ago 20 \
  --execute \
  --delete-after
```

Useful overrides:

```bash
npm run azure:postgres:pitr-drill -- \
  --restore-time "2026-05-16T13:54:46Z" \
  --target-name pg-abarva-pitr-manual-001 \
  --timeout-minutes 60 \
  --execute \
  --delete-after
```

## Restore Model

The drill uses:

- source server resource ID from `az postgres flexible-server show`
- the source delegated subnet
- the source private DNS zone
- a temporary target server name
- current time minus `--minutes-ago` unless `--restore-time` is provided

The target server must remain private. The pass/fail report records:

- elapsed seconds to `Ready`
- restored server state
- restored public network access
- private subnet and private DNS zone
- cleanup status when `--delete-after` is used

## Cutover Gate

Pass criteria:

- Restore target reaches `Ready` before timeout.
- Restored server has `publicNetworkAccess=Disabled`.
- Elapsed time is recorded as actual RTO evidence.
- Temporary restored server is deleted when `--delete-after` is set.
- Report JSON is written to `/tmp/abarva-pitr-restore-<target>.json`.

## Current L9 State

| Failure mode | Evidence |
| --- | --- |
| Service Bus poison message | AZLAB40 dry-run drill. |
| Service Bus mixed good + poison batch | AZLAB51 live Azure pass. |
| Model provider overload | AZLAB58 live Azure pass on r26. |
| Postgres disruption | AZLAB59 live Azure pass on r28. |
| PITR restore timing | AZLAB60 wired; live restore run pending. |
