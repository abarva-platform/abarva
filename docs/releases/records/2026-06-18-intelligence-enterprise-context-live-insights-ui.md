# 2026-06-18-intelligence-enterprise-context-live-insights-ui — Enterprise Context Live Insights UI

## Release ID

`2026-06-18-intelligence-enterprise-context-live-insights-ui`

## Status

`candidate`

## Plain-English Summary

Makes the Intelligence Enterprise Context canvas show the materialized live context insights that were generated from the client context/corpus layer. Users can now see what the loaded context means, not just counts of records, facts, evidence, and domains.

## Layer Impact

- `global-control-lane`: Updates the shared `/intelligence` UI so the Enterprise Context stage can render live insight cards for the active tenant.
- `client-data-lane`: Reads tenant-scoped `context_insights` rows through the existing server-side read model and displays record/fact citation IDs.

## Client Applicability

- All clients: Any active tenant with `context_insights` rows will see them in the Enterprise Context stage.
- Specific clients: Meridian Health and Lakeshore already have proven materialized rows from the V2 refresh lane.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/intelligence` now server-loads `listContextInsights({ tenantKey, limit: 12 })`.
- `IntelligenceV3Page` passes live insights into the Enterprise Context canvas.
- `EnterpriseContextCanvas` renders a live cross-domain insights section with materiality, rule, confidence, freshness, action, and source IDs.
- Adds a focused component test for the live insight rendering and explicit no-insights state.

## QA / Validation

- PASS: `./node_modules/.bin/jest src/components/intelligence-v3/__tests__/EnterpriseContextCanvas.test.tsx src/lib/intelligence/__tests__/context-insights.test.ts src/app/api/intelligence/insights/__tests__/route.test.ts --runInBand`
- PASS: `./node_modules/.bin/eslint src/app/intelligence/page.tsx src/components/intelligence-v3/EnterpriseContextCanvas.tsx src/components/intelligence-v3/IntelligenceV3Page.tsx src/components/intelligence-v3/__tests__/EnterpriseContextCanvas.test.tsx`
- PASS: `./node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `git diff --check`
- NOT RUN: PR CI is not run until the PR is opened.
- NOT RUN: ACA deploy and signed-in browser smoke are not run until after merge.

## Rollout Plan

Merge to `codex/ai-control-tower-substrate`, build and deploy the ACA web image, shift web traffic after `/api/health` is green, then signed-in smoke `/intelligence#enterprise-context` for Meridian or Lakeshore.

## Rollback Plan

Git revert the UI binding PR and redeploy the previous healthy ACA web image. No schema or data rollback is required because this is read-only UI binding.

## Audit Evidence

- Prior data-plane proof: materializer verify execution `job-abarva-private-operator-eus-en2ye2q` proved 24 cited insights for `meridian-health` and 24 cited insights for `lakeshore`.
- Prior API proof: PR #3663 added `/api/intelligence/insights`; PR #3664 recorded deployment to ACA revision `ca-abarva-web-lab-eastus--0000104`.
- Pending PR URL, CI, deploy revision, and signed-in smoke output.

## Known Gaps

- Does not redesign the Intelligence UI/UX.
- Does not wire the Brief or Map stages to the same insight set.
- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not run Blob/document parser/review queues.
