# Release Record: Apex Retail AI Corpus 10K Load

## Release ID

`2026-05-30-retail-ai-corpus-10k-load`

## Status

`candidate`

## Plain-English Summary

Apex Retail now has a first-class retail AI genome corpus comparable in scale
to the airline and healthcare waves. The release adds 11,400 retail patterns
across 76 domains, each written to support Intelligence, Moves, Source, and
Tower reasoning.

This changes Apex from a tenant with a strong private context layer and a thin
retail genome into a retail AI decision-intelligence tenant with broad industry
coverage: merchandising, pricing, OMS, store operations, loyalty/CDP, retail
media, SAP/ERP, SI/AMS, sourcing, AI governance, agentic workflows, vendor
risk, finance value realization, and CXO decision intelligence.

## Layer Impact

- Data plane: Azure/Postgres `genome_patterns`
- Graph layer: Azure/Postgres `intelligence_graph_edges`
- Corpus authoring lane: `scripts/corpus/*`
- Tenant grounding: Apex Retail / retail vertical
- Runtime UI: no direct UI changes
- Runtime ask route: no direct route changes

## Client Applicability

- Apex Retail: yes, primary beneficiary.
- Retail prospects: yes, reusable industry corpus asset for large-brand retail conversations and future retail pilots.
- Other clients: indirect only through cross-industry reasoning where retrieval is explicitly scoped.
- Internal only: generator/report utilities are internal engineering artifacts.
- Feature flag: none.

## Changes Included

- Added `scripts/corpus/generate-retail-ai-corpus.mjs`.
- Added `scripts/corpus/report-retail-ai-corpus.mjs`.
- Extended `scripts/corpus/load-authored-genome-seeds.ts` to support
  `seed-retail-*` files and persist `tower_applicability`.
- Generated 228 content-only seed files:
  `src/scripts/seed/seed-retail-dom101-*` through
  `src/scripts/seed/seed-retail-dom176-*`.
- Added generation, parse-only, load, and DB verification artifacts.

## QA / Validation

PASS — generation:

```bash
node scripts/corpus/generate-retail-ai-corpus.mjs
```

PASS — parse-only:

```bash
find src/scripts/seed -maxdepth 1 -type f -name 'seed-retail-dom1[0-9][0-9]-*-part*.ts' -print0 \
  | sort -z \
  | xargs -0 npx tsx scripts/corpus/load-authored-genome-seeds.ts --parse-only \
  > verification/corpus-quality/2026-05-30-retail-ai-corpus-parse-only.json
```

Result:

- Files parsed: 228
- Patterns parsed: 11,400

PASS — Azure/Postgres load:

```bash
find src/scripts/seed -maxdepth 1 -type f -name 'seed-retail-dom1[0-9][0-9]-*-part*.ts' -print0 \
  | sort -z \
  | xargs -0 npx tsx scripts/corpus/load-authored-genome-seeds.ts \
  2>&1 | tee verification/corpus-load/2026-05-30-retail-ai-corpus-load.log
```

Result:

- Files loaded: 228
- Patterns upserted: 11,400
- Graph edges upserted: 22,800

PASS — DB report:

```bash
node scripts/corpus/report-retail-ai-corpus.mjs
```

Result:

- Patterns: 11,400
- Domains: 76
- Demo relevant: 9,120
- Graph edges: 22,800
- Duplicate codes: 0
- Cross-vertical R-code leakage: 0
- Suspicious non-retail term hits: 0

PASS — local static checks:

```bash
git diff --check
npx eslint scripts/corpus/generate-retail-ai-corpus.mjs scripts/corpus/report-retail-ai-corpus.mjs scripts/corpus/load-authored-genome-seeds.ts
npx eslint $(find src/scripts/seed -maxdepth 1 -type f -name 'seed-retail-dom1[0-9][0-9]-*-part*.ts' | sort)
```

## Rollout Plan

1. Merge the authored corpus and loader support to `main`.
2. Keep the Azure/Postgres load evidence attached to this release record.
3. Allow production deployment to carry the generator, report, and seed files.
4. Use the DB report as the source of truth for persisted corpus counts.

## Rollback Plan

The load is idempotent by pattern code and graph edge identity. To remove this
wave from Azure/Postgres:

```sql
DELETE FROM intelligence_graph_edges
WHERE vertical = 'retail'
  AND source_key = 'apex-retail'
  AND from_node_id ~ '^R[0-9]+$'
  AND substring(from_node_id from 2)::int BETWEEN 20000 AND 31399;

DELETE FROM genome_patterns
WHERE vertical = 'retail'
  AND code ~ '^R[0-9]+$'
  AND substring(code from 2)::int BETWEEN 20000 AND 31399;
```

If a production deployment needs to be rolled back, revert the PR containing
the generator, seed files, report script, and loader retail-prefix support.

## Known Gaps

- This release adds the persisted retail genome corpus. It does not change the
  Sentinel/Nexus ranking policy yet.
- `corpus_patterns` remains a separate canonical table and is not populated by
  this genome wave.
- The Azure private hostname in local `.env.local` is still not resolvable from
  this shell; the loader used the existing working `DATABASE_URL` fallback.

## Audit Evidence

- `verification/corpus-quality/2026-05-30-retail-ai-corpus-generation-report.json`
- `verification/corpus-quality/2026-05-30-retail-ai-corpus-parse-only.json`
- `verification/corpus-load/2026-05-30-retail-ai-corpus-load.log`
- `verification/corpus-load/2026-05-30-retail-ai-corpus-db-report.json`
- `verification/corpus-load/2026-05-30-retail-ai-corpus-db-report.md`
