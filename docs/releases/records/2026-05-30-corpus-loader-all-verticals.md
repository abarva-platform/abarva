# 2026-05-30-corpus-loader-all-verticals — Corpus loader contract for all verticals

## Release ID

`2026-05-30-corpus-loader-all-verticals`

## Status

`candidate`

## Plain-English Summary

This slice fixes the corpus authoring contract before the next generation wave. The durable Azure/Postgres loader now accepts all intended authored seed families: airline, healthcare, medtech, banking, and cross-industry. The handoff document now tells agents to write content-only `*PATTERNS` arrays instead of copying old runner boilerplate.

The purpose is to keep future corpus files out of data-plane code entirely. Authors generate patterns; the loader owns parsing, persistence, graph-edge writes, and tenant/vertical mapping.

## Layer Impact

- `data-layer-lane`: Extends `scripts/corpus/load-authored-genome-seeds.ts` to map medtech, banking, and cross-industry seed filenames into the canonical Azure/Postgres persistence path. No schema changes.
- `global-control-lane`: Updates `docs/build/CORPUS_GENOME_PATTERNS_HANDOFF.md` so future agents use the minimal data-only format and the durable loader path.
- `runtime-app-lane`: No runtime app behavior changes.
- `qa-validation-lane`: Adds parse-only validation support so generated files can be checked without database writes.

## Client Applicability

- All clients receive the loader contract change because it governs global corpus authoring and persistence.
- SkyHarbor Air receives continued airline mapping to `skyharbor-air`.
- Meridian Health receives continued healthcare-provider mapping to `meridian-health`.
- Northstar Clinical receives new medtech mapping to `northstar-clinical`.
- First Capital receives new banking mapping to `first-capital`.
- Cross-industry content receives new shared mapping to `cross-industry`.

## Changes Included

- `scripts/corpus/load-authored-genome-seeds.ts`
  - Adds filename support for `seed-medtech-*`, `seed-banking-*`, and `seed-cross-industry-*`.
  - Preserves existing airline and healthcare behavior.
  - Carries optional `verticals` metadata through to the persisted row payload when authored.
  - Adds `--parse-only` mode for AST parsing validation with no DB writes.
- `docs/build/CORPUS_GENOME_PATTERNS_HANDOFF.md`
  - Replaces stale instructions that pointed agents at old seed-runner boilerplate.
  - Documents the minimal data artifact format: one top-level `*PATTERNS` array, no imports, no data-plane code.
  - Documents the five filename-to-vertical/client mappings.
  - Makes the durable Azure/Postgres loader the primary persistence path.

## QA / Validation

- PASS — `git diff --check`
- PASS — `npx eslint scripts/corpus/load-authored-genome-seeds.ts`
- PASS — Parse-only validation with temporary one-pattern files for:
  - medtech
  - banking
  - cross-industry
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after CI is green. No runtime deployment behavior changes are expected because this is a loader/documentation contract slice. Future corpus authoring waves should use `--parse-only` first, then batch-load reviewed files through the durable Azure/Postgres loader.

## Rollback Plan

Revert the merge commit. Existing airline and healthcare corpus rows remain persisted in Azure/Postgres; this slice does not delete or migrate data. Reverting only removes support for the new seed filename families and the updated authoring guidance.

## Audit Evidence

- This slice supersedes the dirty/unmergeable PR #2588 by isolating only the corpus loader and handoff changes.
- No runtime route, auth, tenant-selection, or product-module code is changed.
- No database migration is added.
- The validation path proves future medtech, banking, and cross-industry files can be parsed by the loader before any persistence run.

## Known Gaps

- This slice does not author the missing medtech, banking, cross-industry, airline, or healthcare backfill patterns.
- This slice does not populate `corpus_patterns`; it extends the `genome_patterns` seed loader contract.
- Full corpus target counts remain the separate generation/backfill workstream.
