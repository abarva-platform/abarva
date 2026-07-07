# Intelligence Insight Engine S3 — Derived Significance

## Release ID

`2026-06-16-intelligence-insight-engine-s3`

## Status

`candidate`

## Plain-English Summary

Adds the first durable significance engine behind the feature-flagged Context & Corpus Explorer. Operators can trigger an evaluation for the active tenant, and the Insights tab can now read real `context_insights` rows instead of only showing illustrative examples. The first implemented rule detects vendor contracts that auto-renew within 120 days without a benchmark.

## Layer Impact

- **Lane:** `client-data-lane`
- **Schema layer:** Adds the uniqueness/index contract the evaluator needs to update one insight per tenant, rule, and entity, matching the runtime upsert target exactly.
- **Library layer:** Adds `src/lib/intelligence/insight-engine/` with the evaluator, typed insight mapping, one implemented rule, and no-op stubs for the remaining seeded rules.
- **API layer:** Adds signed-in `GET /api/intelligence/insights` and operator-only `POST /api/intelligence/insights/evaluate`; both fail closed when `context_corpus_explorer_enabled` is disabled.
- **UI layer:** Updates the feature-flagged Insights tab to prefer live insights and show an honest empty state when no derived significance exists.

## Client Applicability

- **All clients:** No default behavior change while `context_corpus_explorer_enabled` remains OFF.
- **Specific clients:** Any enrolled tenant with S2/S3 prerequisite tables and `v_context_vendor_renewals` populated.
- **Internal only:** The evaluation trigger is operator/admin gated.
- **Public/demo only:** No.
- **Feature flag:** `context_corpus_explorer_enabled`.

## Changes Included

- `supabase/migrations/20260616220000_significance_rule_runner.sql` — adds the upsert/index contract for `context_insights`.
- `src/lib/intelligence/insight-engine/` — evaluator, types, rule registry, first implemented rule.
- `src/app/api/intelligence/insights/route.ts` — tenant-scoped insight read endpoint.
- `src/app/api/intelligence/insights/evaluate/route.ts` — operator-only evaluation endpoint.
- `src/components/intelligence-v4/ContextInsightsFeed.tsx` — live insight binding and empty state.
- `src/components/intelligence-v4/IntelligenceExplorerPage.tsx` — passes tenant key into the Insights tab.

## QA / Validation

- `npx tsc --noEmit --pretty false` — passed clean.
- `npx eslint src/lib/intelligence/insight-engine src/app/api/intelligence/insights src/components/intelligence-v4/ContextInsightsFeed.tsx src/components/intelligence-v4/IntelligenceExplorerPage.tsx` — passed clean.
- `npx eslint src/app/api/intelligence/insights/route.ts src/app/api/intelligence/insights/evaluate/route.ts src/lib/intelligence/insight-engine/index.ts` — passed clean after review hardening.
- `npm run release:check -- --base origin/main --head HEAD` — passed.
- `npm run test:behaviors -- --runInBand` — passed: 15 suites, 195 tests.
- Disposable Postgres replay: `DATABASE_URL='postgres://postgres:postgres@localhost:55433/abarva_l5?sslmode=disable' npm run db:azure:bootstrap` — passed.
- Disposable Postgres replay: `DATABASE_URL='postgres://postgres:postgres@localhost:55433/abarva_l5?sslmode=disable' npm run db:migrate -- --ci --allow-destructive` — passed: 231 migrations applied.
- Disposable Postgres verification: `DATABASE_URL='postgres://postgres:postgres@localhost:55433/abarva_l5?sslmode=disable' npm run db:azure:verify` — passed: 231 migrations, 345 public tables.
- Context ingestion evidence: not run in this release. This release adds the evaluator and read paths; it does not perform a real client data load, parser extraction, embedding refresh, or signed-in retrieval proof.

## Rollout Plan

Merge after S2 and its prerequisites land. Apply the migration before invoking the evaluator so `context_insights` can be updated deterministically. The feature-flagged explorer reads live insights only for tenants enrolled in `context_corpus_explorer_enabled`.

## Rollback Plan

Turn off `context_corpus_explorer_enabled` for affected tenants to return them to Intelligence V3. Code rollback is a normal revert of this branch. The new index can remain safely; it does not delete data or alter row contents.

## Audit Evidence

- Branch: `codex/context-explorer-s3`.
- Local typecheck, focused ESLint, release gate, behavior tests, disposable migration replay, and disposable schema verification are recorded in this release record.

## Known Gaps

- Only `renewal-window-no-benchmark` has a real evaluator in this slice.
- The remaining five seeded rules are no-op evaluator stubs to avoid fabricated insights.
- No live SkyHarbor evaluation was run in this local pass.
- Facts-to-evidence expansion is coarse until the full rule-specific evidence joins are implemented.
