# Corpus Load Verification — 2026-05-30

## Executive status

All authored corpus seed files currently present in `src/scripts/seed/` for Airline and Healthcare have been parsed, normalized to the current Azure/Postgres `genome_patterns` schema, and persisted.

This does **not** mean the full target corpus has been authored. It means every corpus pattern that currently exists in authored seed files is now loaded and DB-verified.

## What was loaded

Durable loader:

```bash
find src/scripts/seed -maxdepth 1 -type f \( -name 'seed-airline-dom*.ts' -o -name 'seed-healthcare-dom*.ts' \) \
  | sort \
  | xargs npx tsx scripts/corpus/load-authored-genome-seeds.ts
```

Persistence target:

- `genome_patterns`
- `intelligence_graph_edges`

The loader uses the Azure/Postgres compatibility data-plane client through `createSeedClient()`. No direct Supabase client is used by the loader.

## Persisted counts after load

| Vertical | `genome_patterns` rows | `belongs_to` edges | `applies_to` edges | Demo-relevant rows |
|---|---:|---:|---:|---:|
| Airline | 1,229 | 1,229 | 1,229 | 169 |
| Healthcare Provider | 725 | 725 | 725 | 179 |
| Retail | 40 | 40 | 40 | n/a |

Sample persisted codes verified:

- Airline: `A300`, `A600`, `A900`, `A1200`, `A3000`, `A4500`, `A4800`
- Healthcare: `H600`, `H1500`, `H2400`, `H3600`, `H3900`, `H5100`, `H9000`

## Issues found and fixed

1. Several historical seed files contained pattern arrays but no executable seed runner. They appeared authored but did not persist data when run directly.
2. `seed-healthcare-dom30-patient-finance.ts` attempted to write stale columns such as `demo_tenant`, which do not exist in the current `genome_patterns` schema.
3. The handoff doc still referenced Supabase service-role env vars for corpus loading. It now references Azure/Postgres data-plane credentials and the durable loader.
4. `AGENTS.md` still described the stack as Supabase/Pinecone/Neo4j-based. It now describes Azure/Postgres as the data plane and treats those names as legacy compatibility/deprecation residue.

## Remaining gap

The full target corpus is not yet authored:

- Airline target: ~8,400 patterns; persisted authored rows today: 1,229.
- Healthcare target: ~7,200 patterns; persisted authored rows today: 725.
- Medtech target: ~2,550 patterns; no seed files found yet.
- Banking target: ~6,000 patterns; no seed files found yet.
- Cross-industry target: ~150 patterns; no seed files found yet.

`corpus_patterns` remains empty in the DB queried during this run. Current persisted industry pattern depth is in `genome_patterns`, not the richer `corpus_patterns` store.

## Environment caveat

The local shell could not resolve the primary Azure host `pg-abarva-context-lab-001.postgres.database.azure.com` and the data-plane adapter fell back to `DATABASE_URL`. Writes succeeded through that fallback. This needs environment cleanup so local verification and production-grade loading use one unambiguous Azure/Postgres endpoint.

## Validation artifacts

- `verification/corpus-load/2026-05-30-generic-authored-seeds-load.log`
- `verification/corpus-load/2026-05-30-post-load-db-verification.json`
