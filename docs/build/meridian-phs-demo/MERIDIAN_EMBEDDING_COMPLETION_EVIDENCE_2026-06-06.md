# Meridian Embedding Completion Evidence — 2026-06-06

## Status

`complete`

## Plain-English Result

Meridian Health System now has its live tenant context chunks embedded and available for agent grounding through the Azure/Postgres context layer.

This closes the previous gap where files and chunks were visible in Admin, but the chunks were still pending embedding and therefore not fully agent-ready.

## Live Client Row

- Client id: `a20ecef5-f0ea-4890-b9d5-7375fab223ff`
- Tenant key: `meridian-health`
- Client name: `Meridian Health System`

## Verified Live Counts

| Measure | Count |
|---|---:|
| Source files | 15 |
| Context chunks | 3,503 |
| Embedded chunks | 3,503 |
| Pending chunks | 0 |
| Failed chunks | 0 |
| Vectors present | 3,503 |

Embedding window:

- First embedded: `2026-06-06 05:08:38.407+00`
- Last embedded: `2026-06-06 05:14:20.608+00`

## Source File Coverage

| Source document | Chunks | Embedded |
|---|---:|---:|
| `04-ci-relationships-dependencies.csv` | 820 | 820 |
| `07-spend-baseline.csv` | 360 | 360 |
| `02-facilities-business-units.csv` | 329 | 329 |
| `09-incidents.csv` | 320 | 320 |
| `03-cmdb-applications-services.csv` | 240 | 240 |
| `01-org-decision-rights.csv` | 224 | 224 |
| `11-changes.csv` | 220 | 220 |
| `15-risk-compliance-register.csv` | 210 | 210 |
| `10-problems.csv` | 150 | 150 |
| `12-slas.csv` | 150 | 150 |
| `05-vendors-contract-inventory.csv` | 110 | 110 |
| `14-data-domains-stewardship.csv` | 110 | 110 |
| `13-initiative-portfolio.csv` | 95 | 95 |
| `06-renewal-calendar.csv` | 90 | 90 |
| `08-policies-procedures.csv` | 75 | 75 |

## Commands Run

Controlled pass:

```bash
EMBEDDING_MAX_BATCHES=5 EMBEDDING_BATCH_SIZE=100 \
  npm run embed:pending-chunks -- --tenant meridian-health --postgres-only
```

Drain pass:

```bash
EMBEDDING_MAX_BATCHES=31 EMBEDDING_BATCH_SIZE=100 \
  npm run embed:pending-chunks -- --tenant meridian-health --postgres-only
```

Post-run dry-run confirmation:

```bash
npm run embed:pending-chunks -- --tenant meridian-health --dry-run --postgres-only
```

Result:

- `no more pending chunks`
- `embedded: 0`
- `failed: 0`
- `skipped: 0`

## Notes

- The runner was executed tenant-scoped with `--tenant meridian-health`.
- The runner used `--postgres-only`, so it did not upsert to an external vector index.
- The local environment logs a primary private-host DNS fallback for `pg-abarva-context-lab-001.postgres.database.azure.com`; the reachable data-plane fallback succeeded and wrote embeddings to the live context table.
- The egress notifier logged a tenant-key/client-id mismatch warning because the workflow resolves `meridian-health` to the live client UUID. The embedding writes completed under the intended Meridian tenant scope with zero failed chunks.

## Remaining QA

The next proof step is signed-in browser QA as the Meridian persona to confirm:

- Admin Context Layer shows `3,503 embedded`.
- Intelligence Enterprise Context no longer reports an unloaded context state.
- Sentinel/Nexus answers can cite Meridian tenant chunks for CDAO/clinical/pop-health/Databricks questions.
