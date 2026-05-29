# 2026-05-29-packet-35-phase-0b-sentinel-corpus-path — Sentinel Corpus Pattern Fallback

## Release ID

`2026-05-29-packet-35-phase-0b-sentinel-corpus-path`

## Status

`candidate`

## Plain-English Summary

This release starts the schema reconciliation work from ADR-0001. It adds a migration script that copies existing `canonical_industry_ai_patterns` into `corpus_patterns` with provenance, adds a read-only export for founder classification of the 28 legacy `pattern_packs`, and changes Sentinel pattern retrieval so tenant-facing corpus searches apply industry isolation universally instead of depending on the old canonical table.

## Layer Impact

Data/corpus layer: prepares the existing 312 canonical patterns to become published `corpus_patterns` rows while preserving source lineage in `corpus_pattern_content.synthesis_jsonb.provenance`.

Agent retrieval layer: passes tenant/surface context into Sentinel Ask routing so pattern fallback can scope by tenant industry plus `cross_industry`. Sentinel reasoning corpus calls now pass the same scope, and the corpus search API intersects requested overlays with the active tenant's allowed industry scope.

Control/audit lane: records that legacy `pattern_packs` require founder classification before migration; this release does not auto-classify or delete those rows. Packet 31 now proposes invariant I9 so industry isolation is an architectural rule, not an Apex-only patch.

## Client Applicability

- All clients: corpus pattern retrieval applies platform-wide once deployed.
- Specific clients: the regression matrix covers the five canonical tenants: Apex Retail, Meridian, Northstar, First Capital, and SkyHarbor.
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
- `src/lib/corpus/industry-scope.ts`
- `src/app/api/intelligence/ask/route.ts`
- `src/lib/agents/sentinel-reasoning/intent-classifier.ts`
- `src/lib/agents/sentinel-reasoning/state-machine.ts`
- `src/app/api/corpus/search/route.ts`
- `eslint.config.mjs`
- `docs/build/PACKET_31_ARCHITECTURAL_CONSTITUTION_AND_OPERATING_MODEL.md`
- `verification/phase-0/PATTERN_PACKS_CLASSIFICATION_28_ROWS.md`

## QA / Validation

- PASS: `git diff --check`.
- PASS: `npx jest src/lib/intelligence/ask/retrievers/pattern.test.ts --runInBand`.
- PASS: I9 regression covers 5 industry-scope query classes across 5 canonical tenants (25 retrieval checks) and asserts zero cross-industry leakage outside tenant industry plus `cross_industry`.
- PASS: `rg "searchCorpus\\(" src/lib src/app scripts -g "*.ts" -g "*.tsx"` reviewed all runtime callsites; Sentinel Ask, Sentinel reasoning, and the corpus API now apply tenant industry scoping before returning patterns.
- PASS: `verification/phase-0/PATTERN_PACKS_CLASSIFICATION_28_ROWS.md` exported all 28 `pattern_packs` rows with full content and recommended `corpus_patterns` vs `client_private_patterns` classification for founder review.
- BLOCKED: `npx tsc --noEmit --pretty false` could not complete because this checkout is missing optional packages already referenced by the repo: `@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, and `@resvg/resvg-js`.
- NOT RUN: post-deploy SkyHarbor, Apex, Meridian, and First Capital smokes. These remain required release gates before any production DB migration is applied.

## Rollout Plan

Merge after #2409 and CI review. Apply the migration script only after confirming the target database has the expected corpus schema and after the founder classifies `pattern_packs` rows. Runtime change becomes active on the next Vercel deployment after merge.

## Rollback Plan

Revert PR #2410 to restore the previous Sentinel Ask fallback. The SQL backfill is idempotent and non-destructive; rollback does not require deleting migrated `corpus_patterns` rows unless a separate operator decides to clean them up after verification.

## Audit Evidence

- PR #2410.
- Focused Jest output for `src/lib/intelligence/ask/retrievers/pattern.test.ts`.
- Runtime callsite grep for `searchCorpus(...)`.
- Pattern-pack founder classification export in `verification/phase-0/PATTERN_PACKS_CLASSIFICATION_28_ROWS.md`.
- Packet 31 I9 invariant amendment and ESLint guard blocking new Ask bypasses around tenant-scoped pattern retrieval.
- Typecheck failure log showing missing optional packages unrelated to this change.
- SQL migration scripts with provenance mapping and read-only pattern-pack export.

## Known Gaps

The context broker still has canonical-index types and needs a follow-up slice to replace its `searchCanonicalPatternIndex(...)` dependency with `searchCorpus(...)`. The 28 legacy `pattern_packs` are exported for classification but not migrated in this release.
