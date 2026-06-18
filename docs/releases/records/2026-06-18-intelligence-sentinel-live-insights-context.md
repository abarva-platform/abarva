# 2026-06-18-intelligence-sentinel-live-insights-context — Sentinel Live Insights Context

## Release ID

`2026-06-18-intelligence-sentinel-live-insights-context`

## Status

`candidate`

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
- NOT RUN: PR CI is not run until the PR is opened.
- NOT RUN: ACA deploy and signed-in Sentinel browser smoke are not run until after merge.

## Rollout Plan

Merge to `codex/ai-control-tower-substrate`, build and deploy the ACA web image, shift web traffic after `/api/health` is green, then signed-in smoke Sentinel from `/intelligence#enterprise-context` with a Meridian or Lakeshore tenant session.

## Rollback Plan

Git revert the context-binding PR and redeploy the previous healthy ACA web image. No schema or data rollback is required because this only changes read-only prompt/retrieval context.

## Audit Evidence

- Prior data-plane proof: materializer verify execution `job-abarva-private-operator-eus-en2ye2q` proved 24 cited insights for `meridian-health` and 24 cited insights for `lakeshore`.
- Prior UI proof: PR #3665 deployed the Enterprise Context live insight cards to ACA revision `ca-abarva-web-lab-eastus--0000105`.
- Pending PR URL, CI, deploy revision, and signed-in smoke output.

## Known Gaps

- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not run Blob/document parser/review queues.
- Does not complete signed-in browser QA without a Clerk-authenticated session.
