# 2026-05-30-corpus-authored-seed-loader — Corpus Authored Seed Loader

## Release ID

`2026-05-30-corpus-authored-seed-loader`

## Status

`candidate`

## Plain-English Summary

The authored airline and healthcare corpus seed files are now actually persisted in the Azure/Postgres data plane. A durable loader parses seed files that only contain pattern arrays or use stale seed schemas, writes the normalized `genome_patterns` rows, and writes matching `intelligence_graph_edges`. The agent and handoff instructions now describe Azure/Postgres as the data plane instead of telling future agents to use Supabase-era env vars.

## Layer Impact

Client data lane: corpus/data-plane loading and verification artifacts for authored industry patterns.

Global-control-lane: agent instructions now clarify that new runtime code must use Azure/Postgres data-plane adapters and must not introduce direct Supabase, Neo4j, or Pinecone dependencies.

## Client Applicability

- All clients: receive clearer agent/developer operating instructions.
- Specific clients: SkyHarbor/Airline and Meridian/Healthcare receive persisted authored corpus rows.
- Internal only: verification artifacts and the durable loader are operator/developer tools.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added `scripts/corpus/load-authored-genome-seeds.ts`.
- Updated `AGENTS.md`.
- Updated `docs/build/CORPUS_GENOME_PATTERNS_HANDOFF.md`.
- Added corpus load verification artifacts under `verification/corpus-load/`.

## QA / Validation

Pass: `npx eslint scripts/corpus/load-authored-genome-seeds.ts`.

Pass: `git diff --cached --check`.

Pass: `npm run release:check` before the branch merge; the CI-format release record is added in this follow-up commit.

Pass: loaded 23 authored seed files through `scripts/corpus/load-authored-genome-seeds.ts`.

Pass: DB verification after load:
- Airline `genome_patterns`: 1,229 rows.
- Healthcare Provider `genome_patterns`: 725 rows.
- Retail `genome_patterns`: 40 rows.
- Airline graph edges: 1,229 `belongs_to`, 1,229 `applies_to`.
- Healthcare graph edges: 725 `belongs_to`, 725 `applies_to`.

Blocked: `npx tsc --noEmit --pretty false` remains blocked by existing optional dependency resolution for `@azure/*`, `pptxgenjs`, and `@resvg/resvg-js`; no errors from this loader slice were surfaced before those dependency failures.

## Rollout Plan

The corpus rows are already loaded in the configured Postgres data plane. After merge to main, the loader and instruction cleanup become the canonical repo path for repeating this persistence step. No feature flag or user-facing route rollout is required.

## Rollback Plan

Revert the PR to remove the loader and instruction updates. If data rollback is required, delete rows by affected code ranges and delete graph edges by `evidence.seeded_by` matching the authored seed filenames.

## Audit Evidence

- PR: `https://github.com/anandsundaram-hash/abarva/pull/2586`
- `verification/corpus-load/2026-05-30-corpus-load-report.md`
- `verification/corpus-load/2026-05-30-post-load-db-verification.json`
- `verification/corpus-load/2026-05-30-generic-authored-seeds-load.log`

## Known Gaps

The full target corpus is not yet authored. Current persisted authored rows are 1,229 Airline, 725 Healthcare Provider, and 40 Retail. Medtech, Banking, and Cross-industry seed files were not present in this repo slice. `corpus_patterns` remains empty in the DB queried during verification; current persisted industry depth is in `genome_patterns`.
