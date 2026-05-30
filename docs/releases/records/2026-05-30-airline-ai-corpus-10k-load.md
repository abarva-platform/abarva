# 2026-05-30-airline-ai-corpus-10k-load — SkyHarbor Airline AI Corpus Load

## Release ID

`2026-05-30-airline-ai-corpus-10k-load`

## Status

`candidate`

## Plain-English Summary

This release adds a large SkyHarbor airline AI genome corpus expansion and persists it into the Azure/Postgres data plane. The wave adds 11,400 machine-scored airline patterns across 76 domains, with explicit metadata for Intelligence, Moves, Source, AI capability type, governance hook, startup/vendor ecosystem signals, and quality tier.

## Layer Impact

Data plane lane: 11,400 `genome_patterns` rows and 22,800 `intelligence_graph_edges` rows are loaded into Azure/Postgres for the `airline` vertical and `skyharbor-air` source key.

Tooling lane: adds deterministic corpus generation and reporting utilities for airline AI patterns.

Agent intelligence lane: Sentinel/Nexus retrieval can now surface broader airline AI, modernization, sourcing, operations, safety, MRO, revenue, and executive decision patterns when the airline corpus is included in retrieval.

Runtime app lane: no direct UI or route behavior change.

Schema lane: no migration or schema change.

## Client Applicability

- SkyHarbor Air: yes, primary beneficiary.
- Airline prospects: yes, reusable industry corpus asset for Delta-shaped conversations and future airline pilots.
- Other clients: indirect only through cross-industry reasoning where retrieval is explicitly scoped.
- Internal only: generator/report utilities are internal engineering artifacts.
- Feature flag: none.

## Changes Included

- `scripts/corpus/generate-airline-ai-corpus.mjs`
- `scripts/corpus/report-airline-ai-corpus.mjs`
- `scripts/corpus/load-authored-genome-seeds.ts`
- `src/scripts/seed/seed-airline-dom101-*` through `src/scripts/seed/seed-airline-dom176-*`
- `verification/corpus-quality/2026-05-30-airline-ai-corpus-generation-report.json`
- `verification/corpus-quality/2026-05-30-airline-ai-corpus-parse-only.json`
- `verification/corpus-load/2026-05-30-airline-ai-corpus-load.log`
- `verification/corpus-load/2026-05-30-airline-ai-corpus-db-report.json`
- `verification/corpus-load/2026-05-30-airline-ai-corpus-db-report.md`

## QA / Validation

- PASS: generator completed and wrote 228 data-only seed files.
- PASS: AST parse-only loader validation completed for 228 files / 11,400 patterns.
- PASS: Azure/Postgres load completed for 11,400 patterns / 22,800 graph edges.
- PASS: DB report confirms 76 domains, 9,120 demo-relevant patterns, zero duplicate codes, zero cross-vertical A-code leakage, and zero suspicious healthcare term hits.
- PASS: quality tier distribution is persisted as 4,560 gold candidates and 6,840 silver candidates.
- PASS: `git diff --check`.
- PASS: `npx eslint scripts/corpus/load-authored-genome-seeds.ts scripts/corpus/generate-airline-ai-corpus.mjs scripts/corpus/report-airline-ai-corpus.mjs`.
- PENDING: full typecheck result for this large generated-file PR.
- PENDING: CI checks on PR.

## Rollout Plan

Merge after validation and CI are green. No production UI deploy is required for the data already loaded, but the generator, reports, and seed files should be merged so the data plane can be audited and reproduced from main.

## Rollback Plan

The data load is idempotent by `genome_patterns.code` and deterministic. To remove this wave from Azure/Postgres:

```sql
DELETE FROM intelligence_graph_edges
WHERE vertical = 'airline'
  AND source_key = 'skyharbor-air'
  AND from_node_id ~ '^A[0-9]+$'
  AND substring(from_node_id from 2)::int BETWEEN 20000 AND 31399;

DELETE FROM genome_patterns
WHERE vertical = 'airline'
  AND code ~ '^A[0-9]+$'
  AND substring(code from 2)::int BETWEEN 20000 AND 31399;
```

Then rerun `node scripts/corpus/report-airline-ai-corpus.mjs` to confirm zero rows in the expansion range.

## Audit Evidence

- `verification/corpus-quality/2026-05-30-airline-ai-corpus-generation-report.json`
- `verification/corpus-quality/2026-05-30-airline-ai-corpus-parse-only.json`
- `verification/corpus-load/2026-05-30-airline-ai-corpus-load.log`
- `verification/corpus-load/2026-05-30-airline-ai-corpus-db-report.json`
- `verification/corpus-load/2026-05-30-airline-ai-corpus-db-report.md`

## Known Gaps

This is a machine-generated and machine-scored corpus wave. It is strong for retrieval breadth and module mapping, but founder/expert curation should still promote a smaller set of board-demo exemplar patterns into a separately reviewed gold playbook.
