# Intelligence Context Summary S2 — Live Read Model Wiring

## Release ID

`2026-06-16-intelligence-context-summary-s2`

## Status

`candidate`

## Plain-English Summary

Connects the feature-flagged Context & Corpus Explorer to read-only tenant context data. The Explore and Coverage & Trust tabs can now show live application inventory, dimension coverage, source health, insight counts, fact counts, and evidence coverage when those Postgres views/tables exist for the signed-in tenant. If the data-plane is unavailable or incomplete, the explorer keeps the S1 illustrative content instead of breaking the page.

## Layer Impact

- **Lane:** `client-data-lane`
- **API layer:** Adds `/api/intelligence/context-summary`, a signed-in tenant-scoped read endpoint. It rejects tenant mismatches and does not write data.
- **Library layer:** Adds `src/lib/intelligence/context-read-model.ts`, a read-only summary builder over the context views and tables introduced by the prerequisite context-classification releases.
- **UI layer:** Updates the feature-flagged `src/components/intelligence-v4/` explorer to prefer live summary data where present, with S1 fallback content still available.
- **Merge integration:** Preserves the canonical uppercase domain classification values required by the schema while retaining the CSV connector inference behavior from the prerequisite branches.

## Client Applicability

- **All clients:** No default behavior change while `context_corpus_explorer_enabled` remains OFF.
- **Specific clients:** Any enrolled tenant with context tables populated can see live summary data in the explorer.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** `context_corpus_explorer_enabled`.

## Changes Included

- `src/app/api/intelligence/context-summary/route.ts` — new tenant-scoped read endpoint.
- `src/lib/intelligence/context-read-model.ts` — new read-only summary model for context inventory, coverage, source health, facts, evidence, and insights.
- `src/components/intelligence-v4/IntelligenceExplorerPage.tsx` — fetches the tenant summary and passes it into tabs.
- `src/components/intelligence-v4/ContextExploreTab.tsx` — renders live IT-system groups when available.
- `src/components/intelligence-v4/ContextCoverageTrustTab.tsx` — renders live coverage/source/truth-state summaries when available.
- `src/lib/context-ingestion/validation-engine.ts` — merge reconciliation for uppercase domain segment values shared by schema and CSV connector prerequisites.

## QA / Validation

- `npx tsc --noEmit --pretty false` — passed clean.
- `npx eslint src/lib/intelligence/context-read-model.ts src/app/api/intelligence/context-summary/route.ts src/components/intelligence-v4/IntelligenceExplorerPage.tsx src/components/intelligence-v4/ContextExploreTab.tsx src/components/intelligence-v4/ContextCoverageTrustTab.tsx src/lib/context-ingestion/validation-engine.ts` — passed clean.
- Next.js route-handler guide checked locally before adding the API route: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.

## Rollout Plan

Merge after prerequisite context branches land: classification schema, validation engine, template registry, CSV connector, setup triage queue, and S1 explorer shell. The endpoint activates only for signed-in tenants that can reach `/intelligence` and have the `context_corpus_explorer_enabled` flag enabled.

## Rollback Plan

Turn off `context_corpus_explorer_enabled` for affected tenants to return them to the existing Intelligence V3 page. Code rollback is a normal revert of this branch; no migration rollback is required because this release adds no schema and performs no writes.

## Audit Evidence

- Branch: `codex/context-explorer-s2`.
- Local typecheck and focused ESLint commands listed above.
- Prerequisite schema replay fix in `feat/ctx-028-classification-schema` restored a clean GitHub check state before S2 integration continued.

## Known Gaps

- This does not implement the S5 Sentinel question-answer endpoint.
- This does not perform a real client data load, parser extraction, embedding refresh, or signed-in retrieval proof.
- Evidence coverage is a coarse summary over usable evidence rows, not a page/row/cell-level receipt.
- Tabs outside Explore and Coverage & Trust still use S1 illustrative content.
