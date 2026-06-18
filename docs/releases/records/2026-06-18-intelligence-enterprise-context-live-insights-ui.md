# 2026-06-18-intelligence-enterprise-context-live-insights-ui — Enterprise Context Live Insights UI

## Release ID

`2026-06-18-intelligence-enterprise-context-live-insights-ui`

## Status

`released`

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
- PASS: PR #3665 CI on GitHub: ESLint, Routes and disclaimers, Typecheck + reasoning-layer tests.
- PASS: ACR build `cadq` pushed `acrabarvalab001.azurecr.io/abarva/web:intelligence-live-insights-ui-2f118ce5@sha256:f5f75d8ee06b2a53dd59abeac343c55e34784ea172715cace0f250928d46c470`.
- PASS: ACA web revision `ca-abarva-web-lab-eastus--0000105` is active at 100% traffic with image `acrabarvalab001.azurecr.io/abarva/web:intelligence-live-insights-ui-2f118ce5`.
- PASS: Public health smoke returned HTTP 200 with `postgres: true`, `direct_postgres: true`, and `azure_graph: "postgres"`.
- PASS: Anonymous `/api/intelligence/insights?limit=2` smoke returned Clerk sign-in redirect, proving the supporting live insights API remains protected.
- NOT RUN: Signed-in `/intelligence#enterprise-context` browser smoke was not run because no reusable Clerk-authenticated browser/session cookie was available to the deploy job.

## Rollout Plan

Merged to `codex/ai-control-tower-substrate` in PR #3665, built and deployed the ACA web image, shifted web traffic to revision `ca-abarva-web-lab-eastus--0000105` after `/api/health` was green, and confirmed the supporting live insights API remains Clerk-protected. A signed-in Meridian or Lakeshore browser smoke is still required before claiming user-visible proof.

## Rollback Plan

Git revert the UI binding PR and redeploy the previous healthy ACA web image. No schema or data rollback is required because this is read-only UI binding.

## Audit Evidence

- Prior data-plane proof: materializer verify execution `job-abarva-private-operator-eus-en2ye2q` proved 24 cited insights for `meridian-health` and 24 cited insights for `lakeshore`.
- Prior API proof: PR #3663 added `/api/intelligence/insights`; PR #3664 recorded deployment to ACA revision `ca-abarva-web-lab-eastus--0000104`.
- PR URL: https://github.com/abarva-platform/abarva/pull/3665
- Merge commit: `2f118ce5301c1398acf58b95f3268a5dd6889398`
- ACR build: `cadq`
- Deployed image: `acrabarvalab001.azurecr.io/abarva/web:intelligence-live-insights-ui-2f118ce5@sha256:f5f75d8ee06b2a53dd59abeac343c55e34784ea172715cace0f250928d46c470`
- ACA serving revision: `ca-abarva-web-lab-eastus--0000105`, 100% traffic as of 2026-06-18 10:18 UTC.
- Health smoke: `https://app.abarva.ai/api/health` returned HTTP 200 with Postgres checks green.
- Auth smoke: `https://app.abarva.ai/api/intelligence/insights?limit=2` returned HTTP 307 to Clerk sign-in when unsigned.

## Known Gaps

- Does not redesign the Intelligence UI/UX.
- Does not wire the Brief or Map stages to the same insight set.
- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not run Blob/document parser/review queues.
