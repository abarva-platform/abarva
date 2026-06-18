# 2026-06-18-intelligence-sentinel-live-insights-context — Sentinel Live Insights Context

## Release ID

`2026-06-18-intelligence-sentinel-live-insights-context`

## Status

`released`

## Plain-English Summary

Makes Sentinel's Intelligence ask flow aware of the same materialized `context_insights` rows shown on the Enterprise Context canvas. This means the agent can answer questions about what the context is telling the user from live insight facts, actions, and evidence IDs instead of only showing those insights as static cards.

## Layer Impact

- `global-control-lane`: Extends the Intelligence surface context and ask retriever to carry live insight facts into Sentinel answers.
- `client-data-lane`: Uses tenant-scoped, already-materialized `context_insights` summaries and source IDs as read-only evidence.

## Client Applicability

- All clients: Any active tenant with materialized `context_insights` rows can have those insight facts included in Sentinel surface context.
- Specific clients: Meridian Health and Lakeshore already have proven materialized rows from the V2 refresh lane.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `insightFacts` to the Intelligence ask surface context contract.
- Preserves `insightFacts` through `/api/intelligence/ask` payload normalization.
- Promotes `insightFacts` as high-confidence tenant evidence in the surface-context retriever.
- Threads `contextInsights` into the Sentinel Intelligence context builder.
- Adds tests proving materialized insights reach Sentinel context and retrieval.

## QA / Validation

- PASS: `./node_modules/.bin/jest src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/components/intelligence-v3/__tests__/EnterpriseContextCanvas.test.tsx --runInBand`
- PASS: `./node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `./node_modules/.bin/eslint src/lib/intelligence-v3/sentinel-intel-context.ts src/lib/intelligence-v3/__tests__/sentinel-intel-context.test.ts src/lib/intelligence/ask/types.ts src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/retrievers/surface-context.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/components/intelligence-v3/IntelligenceV3Page.tsx`
- PASS: `git diff --check`
- PASS: PR #3667 CI on GitHub: ESLint, Routes and disclaimers, Typecheck + reasoning-layer tests.
- PASS: ACR build `cadr` pushed `acrabarvalab001.azurecr.io/abarva/web:intelligence-sentinel-insights-210d8470@sha256:76f22bf1011cbfe187ceed5ee7cbbe036033aadc608b17e0e1eb647635b2d075`.
- PASS: ACA web revision `ca-abarva-web-lab-eastus--0000106` is active at 100% traffic with image `acrabarvalab001.azurecr.io/abarva/web:intelligence-sentinel-insights-210d8470`.
- PASS: Public health smoke returned HTTP 200 with `postgres: true`, `direct_postgres: true`, and `azure_graph: "postgres"`.
- PASS: Anonymous `/api/intelligence/ask` POST smoke returned Clerk sign-in redirect, proving the Sentinel ask route remains protected.
- NOT RUN: Signed-in Sentinel browser smoke was not run because no reusable Clerk-authenticated browser/session cookie was available to the deploy job.

## Rollout Plan

Merged to `codex/ai-control-tower-substrate` in PR #3667, built and deployed the ACA web image, shifted web traffic to revision `ca-abarva-web-lab-eastus--0000106` after `/api/health` was green, and confirmed the Sentinel ask route remains Clerk-protected. A signed-in Meridian or Lakeshore Sentinel browser smoke is still required before claiming user-visible answer proof.

## Rollback Plan

Git revert the context-binding PR and redeploy the previous healthy ACA web image. No schema or data rollback is required because this only changes read-only prompt/retrieval context.

## Audit Evidence

- Prior data-plane proof: materializer verify execution `job-abarva-private-operator-eus-en2ye2q` proved 24 cited insights for `meridian-health` and 24 cited insights for `lakeshore`.
- Prior UI proof: PR #3665 deployed the Enterprise Context live insight cards to ACA revision `ca-abarva-web-lab-eastus--0000105`.
- PR URL: https://github.com/abarva-platform/abarva/pull/3667
- Merge commit: `210d8470547e67a0cf09bc8a47e525f818821505`
- ACR build: `cadr`
- Deployed image: `acrabarvalab001.azurecr.io/abarva/web:intelligence-sentinel-insights-210d8470@sha256:76f22bf1011cbfe187ceed5ee7cbbe036033aadc608b17e0e1eb647635b2d075`
- ACA serving revision: `ca-abarva-web-lab-eastus--0000106`, 100% traffic as of 2026-06-18 10:43 UTC.
- Health smoke: `https://app.abarva.ai/api/health` returned HTTP 200 with Postgres checks green.
- Auth smoke: unsigned POST to `https://app.abarva.ai/api/intelligence/ask` returned HTTP 307 to Clerk sign-in.

## Known Gaps

- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not run Blob/document parser/review queues.
- Does not complete signed-in browser QA without a Clerk-authenticated session.
