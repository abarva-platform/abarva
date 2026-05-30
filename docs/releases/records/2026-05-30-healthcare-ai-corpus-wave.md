# 2026-05-30-healthcare-ai-corpus-wave — Healthcare AI/startup ecosystem corpus

## Release ID

`2026-05-30-healthcare-ai-corpus-wave`

## Status

`candidate`

## Plain-English Summary

This release adds a substantial healthcare-provider industry corpus wave for Intelligence, Moves, and Source. It authors 10,000 new patterns across 50 healthcare domains with explicit emphasis on AI innovation, startup ecosystem diligence, agentic workflows, governance hooks, and value-realization failure modes.

The corpus is persisted in the Azure/Postgres data plane through the durable genome seed loader. This is industry corpus content, not tenant-confidential context data.

## Layer Impact

- `data-layer-lane`: 10,000 `genome_patterns` rows loaded for `vertical='healthcare_provider'`, code range `H10000-H19999`; 20,000 `intelligence_graph_edges` rows loaded for the same wave.
- `intelligence-lane`: Healthcare-provider pattern retrieval now has a much deeper AI/startup/agentic corpus for Meridian-style questions.
- `moves-lane`: Every new pattern includes a Moves artifact anchor such as value ledger, adoption plan, clinical governance checklist, pre-mortem, dependency map, approval gate, or benefit validation plan.
- `source-lane`: Every new pattern includes a Source/procurement artifact anchor such as RFI/RFP question, BAA clause, model audit right, deployment-site validation SLA, adoption telemetry clause, exit-rights clause, or BAFO counter.
- `runtime-app-lane`: No app UI or route changes.

## Client Applicability

- All clients in the healthcare-provider vertical receive access to the expanded healthcare industry corpus.
- Meridian Health receives the primary immediate benefit because `seed-healthcare-*` maps to healthcare-provider corpus and `source_key='meridian-health'`.
- Future healthcare-provider pilots can reuse the same industry corpus layer.
- Non-healthcare tenants are not re-scoped by this content wave.

## Changes Included

- `scripts/corpus/generate-healthcare-ai-corpus.mjs` — deterministic generator for the 50-domain wave.
- `eslint.config.mjs` — scopes the data-only corpus seed guard to authored genome/corpus files while preserving the separate runtime Azure/Postgres guard.
- `docs/build/HEALTHCARE_AI_CORPUS_WAVE_2026_05_30.md` — manifest and domain taxonomy.
- `src/scripts/seed/seed-healthcare-dom31-...-part1.ts` through `seed-healthcare-dom80-...-part4.ts` — 200 content-only seed files, 50 patterns per file.
- `verification/corpus-load/2026-05-30-healthcare-ai-corpus-load-report.md` — human-readable load report.
- `verification/corpus-load/2026-05-30-healthcare-ai-corpus-db-verify.json` — DB verification results.
- `verification/corpus-load/2026-05-30-healthcare-ai-corpus-parse-only.json` — parser verification results.
- `verification/corpus-load/2026-05-30-healthcare-ai-corpus-load.log` — loader output.
- `verification/corpus-load/2026-05-30-healthcare-ai-corpus-retrieval-smoke.json` — topic-hit retrieval smoke.

## QA / Validation

- PASS — Generator produced 200 files / 10,000 authored patterns.
- PASS — Durable loader `--parse-only` parsed 200 files / 10,000 patterns.
- PASS — Local quality census found 10,000 unique codes, 0 duplicates, 6,650 demo-relevant patterns, 10,000 Moves-anchored patterns, 10,000 Source-anchored patterns, 10,000 startup-anchored patterns, and 2,549 agentic/copilot-anchored patterns.
- PASS — Azure/Postgres load upserted 10,000 patterns and 20,000 graph edges.
- PASS — DB verification confirms numeric code range `H10000-H19999`, 50 domains with 200 patterns each, and total healthcare-provider corpus count of 10,785 after the separately merged Wave 1 corpus expansion.
- PASS — `git diff --check`.
- PASS — `npx eslint .` (0 errors; existing warnings remain).
- PASS — `npx eslint scripts/corpus/generate-healthcare-ai-corpus.mjs <200 generated seed files>`.
- PASS — `npx tsc --noEmit --pretty false`.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.
- PASS — DB retrieval smoke found healthcare AI corpus hits for ambient AI, prior auth AI, agentic workflow, BAA, Abridge, Cohere Health, model registry, and value realization.

## Rollout Plan

Merge to main after CI is green. No production route behavior changes are expected. The content is already loaded into the Azure/Postgres data plane; merge preserves the authored seed files, generator, manifest, and verification evidence for auditability and future regeneration.

## Rollback Plan

Code/artifact rollback: revert the merge commit to remove the authored seed files, generator, manifest, and evidence files from main.

Data rollback, if explicitly required: delete `genome_patterns` rows where `vertical='healthcare_provider'` and numeric code is between `10000` and `19999`, then delete matching `intelligence_graph_edges` rows for the same numeric `from_node_id` range and `source_key='meridian-health'`. Do not run this rollback unless the founder explicitly requests corpus removal.

## Audit Evidence

- Report: `verification/corpus-load/2026-05-30-healthcare-ai-corpus-load-report.md`
- DB verification: `verification/corpus-load/2026-05-30-healthcare-ai-corpus-db-verify.json`
- Parse-only verification: `verification/corpus-load/2026-05-30-healthcare-ai-corpus-parse-only.json`
- Loader log: `verification/corpus-load/2026-05-30-healthcare-ai-corpus-load.log`
- Retrieval smoke: `verification/corpus-load/2026-05-30-healthcare-ai-corpus-retrieval-smoke.json`

## Known Gaps

- This wave deepens healthcare-provider industry corpus only; medtech, banking, airline backfill, and cross-industry remain separate corpus waves.
- This release does not prove Sentinel answer quality live; a follow-up retrieval smoke should ask Meridian healthcare AI/startup questions and confirm the new H10000-H19999 patterns are surfaced.
