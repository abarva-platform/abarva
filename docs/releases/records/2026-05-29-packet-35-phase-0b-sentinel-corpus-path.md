# 2026-05-29-packet-35-phase-0b-sentinel-corpus-path — Sentinel Corpus Pattern Fallback

## Release ID

`2026-05-29-packet-35-phase-0b-sentinel-corpus-path`

## Status

`candidate`

## Plain-English Summary

This release starts the schema reconciliation work from ADR-0001. It adds a migration script that copies existing `canonical_industry_ai_patterns` into `corpus_patterns` with provenance, adds a read-only export for founder classification of the 28 legacy `pattern_packs`, and changes Sentinel Ask so its pattern fallback reads from `corpus_patterns` instead of the old canonical table.

## Layer Impact

Data/corpus layer: prepares the existing 312 canonical patterns to become published `corpus_patterns` rows while preserving source lineage in `corpus_pattern_content.synthesis_jsonb.provenance`.

Agent retrieval layer: passes tenant/surface context into Sentinel Ask routing so pattern fallback can scope by tenant industry plus `cross_industry`.

Control/audit lane: records that legacy `pattern_packs` require founder classification before migration; this release does not auto-classify or delete those rows.

## Client Applicability

- All clients: Sentinel's corpus fallback behavior applies platform-wide once deployed.
- Specific clients: tenant-industry scoping currently maps Apex Retail, Meridian/Northstar/Helix healthcare, First Capital/Brindlemark financial services, Keystone energy, and SkyHarbor airline keys.
- Internal only: migration scripts and founder-classification export.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- PR #2410.
- `scripts/migrations/0001-canonical-pattern-storage/001_migrate_canonical_industry_ai_patterns_to_corpus.sql`
- `scripts/migrations/0001-canonical-pattern-storage/002_export_pattern_packs_for_founder_classification.sql`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/router.ts`
- `src/lib/intelligence/ask/retrievers/pattern.ts`
- `src/lib/intelligence/ask/retrievers/pattern.test.ts`

## QA / Validation

- PASS: `git diff --check`.
- PASS: `npx jest src/lib/intelligence/ask/retrievers/pattern.test.ts --runInBand`.
- BLOCKED: `npx tsc --noEmit --pretty false` could not complete because this checkout is missing optional packages already referenced by the repo: `@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, and `@resvg/resvg-js`.

## Rollout Plan

Merge after #2409 and CI review. Apply the migration script only after confirming the target database has the expected corpus schema and after the founder classifies `pattern_packs` rows. Runtime change becomes active on the next Vercel deployment after merge.

## Rollback Plan

Revert PR #2410 to restore the previous Sentinel Ask fallback. The SQL backfill is idempotent and non-destructive; rollback does not require deleting migrated `corpus_patterns` rows unless a separate operator decides to clean them up after verification.

## Audit Evidence

- PR #2410.
- Focused Jest output for `src/lib/intelligence/ask/retrievers/pattern.test.ts`.
- Typecheck failure log showing missing optional packages unrelated to this change.
- SQL migration scripts with provenance mapping and read-only pattern-pack export.

## Known Gaps

The context broker still has canonical-index types and needs a follow-up slice to replace its `searchCanonicalPatternIndex(...)` dependency with `searchCorpus(...)`. The 28 legacy `pattern_packs` are exported for classification but not migrated in this release.
