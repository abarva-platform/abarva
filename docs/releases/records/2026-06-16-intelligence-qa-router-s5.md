# Intelligence QA Router S5 — Answer Audit

## Release ID

`2026-06-16-intelligence-qa-router-s5`

## Status

`candidate`

## Plain-English Summary

Replaces the Sentinel rail's canned answers with a tenant-scoped deterministic Q&A route. The route classifies questions into insight, fact, freshness, retrieval, corpus, or hybrid paths; answers only from the context read model, insights, and refresh events wired in S2-S4; streams the answer back to the rail; and writes an answer audit row.

## Layer Impact

- **Lane:** `global-control-lane`
- **Schema layer:** Adds `context_explorer_answer_audit` with client id, tenant-key RLS, and tenant/client indexes.
- **Library layer:** Adds `src/lib/intelligence/qa-router/` with deterministic routing, grounded answer assembly, and audit persistence.
- **API layer:** Adds `POST /api/intelligence/qa` as an NDJSON streaming route, fail-closed behind `context_corpus_explorer_enabled`.
- **UI layer:** Updates `SentinelExplorerRail` to call the route and render the grounded chip from live route metadata; removes copy that implied every route has citations before retrieval/corpus adapters are wired.

## Client Applicability

- **All clients:** No default behavior change while `context_corpus_explorer_enabled` remains OFF.
- **Specific clients:** Any enrolled tenant with S2-S4 data available.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** `context_corpus_explorer_enabled`.

## Changes Included

- `supabase/migrations/20260616240000_context_explorer_answer_audit.sql` — answer audit table, indexes, and RLS.
- `src/lib/intelligence/qa-router/types.ts` — intent, citation, view directive, and answer types.
- `src/lib/intelligence/qa-router/index.ts` — deterministic router and audit writer.
- `src/app/api/intelligence/qa/route.ts` — signed-in NDJSON answer route.
- `src/components/intelligence-v4/SentinelExplorerRail.tsx` — live streaming answer rail.
- `src/components/intelligence-v4/IntelligenceExplorerPage.tsx` — passes tenant key to the rail.
- `src/components/intelligence-v4/*` — copy hardening for evidence/retrieval claims before tenant enablement.

## QA / Validation

- `npx tsc --noEmit --pretty false` — passed clean.
- `npx eslint src/lib/intelligence/qa-router src/app/api/intelligence/qa/route.ts src/components/intelligence-v4/SentinelExplorerRail.tsx src/components/intelligence-v4/IntelligenceExplorerPage.tsx` — passed clean.
- `npx eslint src/lib/intelligence/qa-router src/app/api/intelligence/qa/route.ts src/components/intelligence-v4/SentinelExplorerRail.tsx src/components/intelligence-v4/IntelligenceExplorerPage.tsx src/components/intelligence-v4/ContextInsightsFeed.tsx src/components/intelligence-v4/ContextCorpusTab.tsx src/components/intelligence-v4/ContextCoverageTrustTab.tsx` — passed clean after review hardening.
- `npm run release:check -- --base origin/main --head HEAD` — passed.
- `npm run audit:architecture-rules -- --mode=changed --base origin/main --head HEAD` — passed: 0 violations across 36 scanned changed files.
- `npm run test:behaviors -- --runInBand` — passed: 15 suites, 195 tests.
- Disposable Postgres replay: `DATABASE_URL='postgres://postgres:postgres@localhost:55435/abarva_l5?sslmode=disable' npm run db:azure:bootstrap` — passed.
- Disposable Postgres replay: `DATABASE_URL='postgres://postgres:postgres@localhost:55435/abarva_l5?sslmode=disable' npm run db:migrate -- --ci --allow-destructive` — passed: 233 migrations applied.
- Disposable Postgres verification: `DATABASE_URL='postgres://postgres:postgres@localhost:55435/abarva_l5?sslmode=disable' npm run db:azure:verify` — passed: 233 migrations, 347 public tables.
- Context ingestion evidence: not run in this release. This release adds the answer route and audit write path; it does not perform a live signed-in retrieval proof against a production tenant.

## Rollout Plan

Merge after S4 and prerequisites land. Apply the migration before enabling the explorer for a tenant. The route requires a signed-in tenant and uses the active tenant from `requireTenancy()`.

## Rollback Plan

Turn off `context_corpus_explorer_enabled` for affected tenants to hide the rail. Code rollback is a normal revert of this branch. The answer audit table can remain safely; it is append-only audit context.

## Audit Evidence

- Branch: `codex/context-explorer-s5`.
- Local typecheck, focused ESLint, release gate, architecture audit, behavior tests, disposable migration replay, and disposable schema verification are recorded in this release record.

## Known Gaps

- Retrieval and corpus intents are identified but not fully connected to `retrieveEnterpriseContextChunks()` or `searchCorpus()` in this slice.
- The route uses deterministic grounded prose instead of Claude synthesis; it does not invent missing numbers.
- The three SkyHarbor acceptance queries were not run against a signed-in live tenant in this local pass.
