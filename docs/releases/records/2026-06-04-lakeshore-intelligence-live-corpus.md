# 2026-06-04-lakeshore-intelligence-live-corpus — Lakeshore Intelligence Live Corpus

## Release ID

`2026-06-04-lakeshore-intelligence-live-corpus`

## Status

`candidate`

## Plain-English Summary

Lakeshore now has a real Intelligence Brief/Map loader. The `/intelligence` surface reads live Lakeshore decision-pattern rows and loaded Lakeshore initiatives instead of showing the older "corpus not yet seeded" message.

## Layer Impact

- `client-data-lane`: Adds a Lakeshore-only read path over existing `corpus_patterns` and `ai_initiatives`.
- Application plane: Changes the `/intelligence` Brief/Map runtime behavior for Lakeshore.
- Vector plane: No index, embedding, or Azure AI Search write behavior changed.

## Client Applicability

- All clients: No.
- Specific clients: Lakeshore Holdings.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/lib/intelligence-v3/lakeshore-live.ts`.
- Registered Lakeshore in `src/lib/intelligence-v3/tenant-corpus-loader.ts`.
- Extended the knowledge corpus industry type with `holdings`.
- Added focused loader coverage in `src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts`.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts`.
- PASS: `npm test -- --runTestsByPath src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts src/lib/lakeshore/__tests__/corpus-activation.test.ts src/lib/corpus/azure-search.test.ts src/lib/corpus/retrieval.test.ts`.
- PASS: `npm run test:nav`.
- PASS: `npm run test:behaviors`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: Browser smoke of `/intelligence` as authenticated Lakeshore showed live-bound Brief content with Kyriba, 24 current-view pattern rows, 8 loaded initiatives, and no "corpus not yet seeded" message.
- BLOCKED / pre-existing: `npx tsc --noEmit --pretty false` is not a clean repo-wide gate in this worktree because generated `.next` type output and missing optional packages (`@azure-rest/ai-document-intelligence`, `@axe-core/playwright`) fail outside this slice.

## Rollout Plan

Merge to main and deploy through the normal Vercel app pipeline. The behavior activates automatically for authenticated Lakeshore sessions because the tenant corpus loader resolves `lakeshore` / `lakeshore-holdings`.

## Rollback Plan

Revert this release slice. Lakeshore returns to the prior honest empty-state message on `/intelligence`; no database rollback is required because the change is read-only.

## Audit Evidence

- Live data contains 350 `pat-lsh-*` published `corpus_patterns` rows with Azure AI Search document ids.
- Live data contains 40 Lakeshore `ai_initiatives`.
- Focused unit test validates Lakeshore loader registration.
- Azure AI Search REST proof: `lakeshore-patterns-v1` count is 350; `Kyriba treasury cash position` returns only `tenant_scope=lakeshore` PAT-LSH hits.

## Known Gaps

- The adapter builds a compact Intelligence Brief/Map from the current 350-pattern live slice; it does not claim that all 10,000 planned Lakeshore corpus patterns are complete.
