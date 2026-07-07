# 2026-06-02-source-corpus-retrieval-wiring — Source Corpus Retrieval Wiring

## Release ID

`2026-06-02-source-corpus-retrieval-wiring`

## Status

`candidate`

## Plain-English Summary

This release wires the newly landed Source corpus into Sentinel Source answer generation for the Apex AMS event shape. Instead of keeping the 204-pattern pack only as loaded intelligence, the answer engine now ranks relevant corpus patterns for Apex AMS prompts and surfaces them through existing expert-lens, risk-trap, missing-data, and limits fields. Savings, benchmark, vendor, and numeric claims remain explicitly evidence-gated.

## Layer Impact

- `global-control-lane`: Adds deterministic corpus retrieval and answer enrichment in the shared Source answer engine.
- `client-data-lane`: Applies the retrieval uplift only when the event matches the Apex Retail AMS managed-services shape. It does not write tenant data or mutate production state.
- `experimental`: This is the first prompt-time retrieval wiring for the pilot Source corpus, not a full sourcing-genome cutover.

## Client Applicability

- All clients: no broad runtime injection yet.
- Specific clients: Apex Retail AMS event shape receives ranked Source corpus doctrine in Sentinel answer outputs.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Expanded `src/lib/source/source-corpus-uplift.ts` so it exposes the full Source corpus pilot by pattern prefix, ranks patterns for Apex AMS prompts, maps them to Source pattern-section context, and pins critical savings-proof controls.
- Updated `src/lib/source/source-answer-engine.ts` so ranked corpus sections enrich existing answer fields without changing the public response shape.
- Extended `src/lib/source/__tests__/source-corpus-uplift.test.ts` to prove Apex AMS receives value-proof, RFP/evaluation, artifact-quality, and corpus-governance pattern sections while unrelated events remain untouched.
- Extended `src/lib/source/__tests__/source-answer-engine.test.ts` to prove Apex AMS BAFO savings-proof prompts surface the `No Evidence, No Number` doctrine and global evidence caveat.

## QA / Validation

- `npx jest src/lib/source/__tests__/source-corpus-uplift.test.ts src/lib/source/__tests__/source-answer-engine.test.ts tests/intelligence/loader.test.ts --runInBand` passed: 3 suites, 51 tests.
- Jest printed pre-existing duplicate manual mock warnings for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`; they did not block the focused suite.

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production path. No database migration, Clerk operation, corpus persistence backfill, or production data write is included.

## Rollback Plan

Revert this release's commit and redeploy. Because the change is code-only and response-shape preserving, rollback does not require data repair.

## Audit Evidence

- Passing focused Jest output in local Codex run.
- Regression tests in `src/lib/source/__tests__/source-corpus-uplift.test.ts` and `src/lib/source/__tests__/source-answer-engine.test.ts`.
- Release record: `docs/releases/records/2026-06-02-source-corpus-retrieval-wiring.md`.

## Known Gaps

- This does not author new vendor facts or numeric benchmark/rate-card data.
- This does not persist the corpus to Azure/Postgres retrieval tables.
- This does not fix the still-open audit-log, Pricing/BAFO artifact-surface, Clerk-domain, or RSC 503 backlog items.
