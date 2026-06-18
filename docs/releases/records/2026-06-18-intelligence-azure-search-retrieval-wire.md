# 2026-06-18-intelligence-azure-search-retrieval-wire — Intelligence Azure Search Retrieval Wire

## Release ID

`2026-06-18-intelligence-azure-search-retrieval-wire`

## Status

`released`

## Plain-English Summary

Lets Sentinel's Intelligence ask path use the tenant-scoped Azure AI Search context index when the `retrieval_azure_search` feature flag is enabled for a client. The existing Postgres structured facts and persisted context chunk path stays in place, so a Search outage or disabled flag does not make the agent lose the already-loaded client context.

## Layer Impact

- `global-control-lane`: Adds a flagged retrieval source to the shared Intelligence ask evidence path.
- `client-data-lane`: Reads tenant-scoped chunks from the existing `tenant-context-v1` Azure Search index; no data is written or deleted.

## Client Applicability

- All clients: Code path is available to every tenant.
- Specific clients: Meridian Health and Lakeshore can be enabled once the `retrieval_azure_search` tenant flag is set and live answer QA passes.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `retrieval_azure_search`.

## Changes Included

- `src/lib/knowledge/tenant-enterprise-context.ts` now adds an Azure Search indexed context source when the tenant flag is enabled.
- `src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts` covers flag-off behavior, flag-on indexed evidence, and Search failure fallback.

## QA / Validation

- PASS: `./node_modules/.bin/jest src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts --runInBand`
- PASS: `./node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `./node_modules/.bin/eslint src/lib/knowledge/tenant-enterprise-context.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- PASS: PR #3669 CI on GitHub: ESLint, Routes and disclaimers, Typecheck + reasoning-layer tests.
- PASS: ACR build `cads` pushed `acrabarvalab001.azurecr.io/abarva/web:intelligence-search-retrieval-89be5a1f@sha256:f7985af43d9d0363850a9503502f433fc7c7250c30f1edb144620d47f5fb82e5`.
- PASS: ACA revision `ca-abarva-web-lab-eastus--0000107` returned green revision-specific `/api/health`.
- PASS: Public traffic shifted to `ca-abarva-web-lab-eastus--0000107` at 100%.
- PASS: Public `https://app.abarva.ai/api/health` returned HTTP 200 with `postgres: true`, `direct_postgres: true`, and `azure_graph: "postgres"`.
- PASS: Anonymous POST to `https://app.abarva.ai/api/intelligence/ask` returned HTTP 307 to Clerk sign-in, proving the route remains protected.
- PASS: `ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS` now includes `lakeshore` alongside the previous `lakeshore-holdings` label so the feature evaluator can actually enable Lakeshore.
- NOT RUN: Signed-in Sentinel browser answer smoke was not run because no reusable Clerk-authenticated browser/session cookie was available.

## Rollout Plan

Merged to `codex/ai-control-tower-substrate` in PR #3669, built and deployed the ACA web image, shifted web traffic to revision `ca-abarva-web-lab-eastus--0000107` after health was green, and corrected the retrieval feature allowlist so Meridian and Lakeshore are both recognized by the feature evaluator. A signed-in Meridian/Lakeshore Sentinel browser smoke is still required before claiming user-visible answer proof.

## Rollback Plan

Disable the `retrieval_azure_search` tenant allowlist to return Sentinel to the existing Postgres structured fact and persisted chunk sources. If needed, revert this code PR and redeploy the previous healthy web image. No schema or data rollback is required.

## Audit Evidence

- Focused unit test output for `src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts`.
- Prior Azure Search refresh evidence showed tenant-scoped indexed context counts for Meridian and Lakeshore.
- PR URL: https://github.com/abarva-platform/abarva/pull/3669
- Merge commit: `89be5a1f10e3c7f386be1157407ef15c34a5837c`
- ACR build: `cads`
- Deployed image: `acrabarvalab001.azurecr.io/abarva/web:intelligence-search-retrieval-89be5a1f@sha256:f7985af43d9d0363850a9503502f433fc7c7250c30f1edb144620d47f5fb82e5`
- ACA serving revision: `ca-abarva-web-lab-eastus--0000107`, 100% traffic as of 2026-06-18 11:13 UTC.
- Health smoke: `https://app.abarva.ai/api/health` returned HTTP 200 with Postgres checks green.
- Auth smoke: unsigned POST to `https://app.abarva.ai/api/intelligence/ask` returned HTTP 307 to Clerk sign-in.
- Feature allowlist: `apex-retail,meridian-health,first-capital,lakeshore-holdings,lakeshore,skyharbor-air,northstar-clinical`.

## Known Gaps

- Does not generate new embeddings.
- Does not prove signed-in Sentinel browser answers; that remains a required post-deploy QA gate before claiming user-visible answer proof.
