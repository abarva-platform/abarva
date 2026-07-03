# 2026-07-03-home-v7-azure-cutover — Home Reads V7 Azure Context First

## Release ID

`2026-07-03-home-v7-azure-cutover`

## Status

`candidate`

## Plain-English Summary

Home now prefers the governed V7 Azure context schema for the Context Explorer and the Home aVa KNOW answer path. The right canvas can show actual loaded rows by dimension, client-friendly field labels, source files, and explicit evidence gaps instead of only top-level loaded-record metrics or generic confidence percentages. V6 remains as a fallback if V7 is unavailable in a local/dev environment or for a pre-cutover tenant.

## Layer Impact

- `global-control-lane`: changes shared Home runtime behavior for every tenant using `/home` and `/api/home/know/ask`.
- `client-data-lane`: consumes the already-loaded `intelligence_v7` tenant data plane. This release does not reload or mutate tenant data.
- `internal-admin`: publishes V7 schema, volumetrics, and insight evidence for operators and auditors.

## Client Applicability

- All clients: Yes, the Home V7-first read path is shared.
- Specific clients: Apex Retail Group, First Capital Financial, Lakeshore Holdings, Meridian Health, and SkyHarbor Air Group have V7 packs loaded.
- Internal only: The published build evidence file is internal/operator-facing.
- Public/demo only: No public route change.
- Feature flag: None. V7-first is automatic with V6 fallback.

## Changes Included

- `src/app/(maestro)/home/page.tsx`: tries `getHomeV7ContextBrowser` before V6.
- `src/lib/home/v7-context-browser.ts`: reads V7 tenant pack runs, dimension registry, column registry, and business records for Home canvas previews.
- `src/app/api/home/know/ask/route.ts`: tries V7 deterministic Home KNOW before V6 fallback.
- `src/lib/home/know/v7-home-ask.ts`: deterministic V7 answer engine over `intelligence_v7`.
- `src/lib/home/know/v7-home-know-response.ts`: maps V7 answers into the shared Home KNOW response contract.
- `src/components/home/HomeSurface.tsx`: labels the active source as V7 or V6, uses V7 dimensions when available, suppresses stale V6 findings on V7 pages, and exposes explicit right-canvas tabs for Summary, Data, Gaps, and Questions.
- `docs/build/V7_SCHEMA_VOLUMETRICS_INSIGHTS_20260703.md`: published schema, volumetrics, and product insight evidence.
- `/Users/anand/Downloads/abarva-v7-schema-volumetrics-insights-20260703.html`: browser-openable copy of the V7 evidence report.

## QA / Validation

- Pass: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`.
- Pass: `./node_modules/.bin/eslint 'src/app/(maestro)/home/page.tsx' src/app/api/home/know/ask/route.ts src/components/home/HomeSurface.tsx src/lib/home/v6-context-browser.ts src/lib/home/v7-context-browser.ts src/lib/home/know/home-know-contract.ts src/lib/home/know/v7-home-ask.ts src/lib/home/know/v7-home-know-response.ts src/lib/home/know/__tests__/v7-home-ask.test.ts src/lib/home/__tests__/v7-context-browser.test.ts`.
- Pass: `./node_modules/.bin/jest src/lib/home/know/__tests__/v7-home-ask.test.ts src/lib/home/__tests__/v7-context-browser.test.ts src/lib/home/know/__tests__/v6-home-know-response.test.ts src/lib/home/__tests__/v6-context-browser.test.ts --runInBand`.
- Pass: `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand`.
- Pass: V7 Azure load readback summary reports 120 source files, 21,385 business records, 628,080 field facts, 12,721 graph nodes, 5,700 edges, and 3,900 chunks.
- Pass: deployed ACA browser/API proof on revision `ca-abarva-web-lab-eastus--0000242` showed 5/5 tenants and 40/40 Home Ask questions on `home_v7_dataset_contract`, with no V7 fallback and no internal-ID or synthetic filename leakage.
- Pending: deployed ACA browser proof for the right-canvas Summary/Data/Gaps/Questions tabs after this follow-up image is built and routed.

## Rollout Plan

Build the exact commit SHA into ACR, deploy that image to `ca-abarva-web-lab-eastus`, wait for the new revision to become healthy, route 100 percent traffic to it, and verify `https://app.abarva.ai/home` plus `/api/home/know/ask` with signed-in tenant sessions.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps deployment lane from `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: `az acr build`, `az containerapp update`, and ACA ingress traffic routing.
- Approved image digest: Pending ACR build.
- ACA runtime invariant: `app.abarva.ai` must serve from `ca-abarva-web-lab-eastus` with 100 percent traffic on the new healthy revision.
- Worker image invariant: No worker image change in this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home canvas V7 preview and Home aVa V7 answer proof.

## Rollback Plan

Rollback by moving ACA ingress traffic back to the prior healthy web revision. No schema rollback is required because this release only reads the already-loaded `intelligence_v7` schema and keeps V6 fallback behavior in code.

## Audit Evidence

- `docs/build/V7_SCHEMA_VOLUMETRICS_INSIGHTS_20260703.md`.
- `/Users/anand/Downloads/abarva-v7-schema-volumetrics-insights-20260703.html`.
- `/Users/anand/Downloads/abarva-v7-azure-load-20260703/v7-azure-validation-summary.html`.
- `/Users/anand/Downloads/abarva-v7-azure-load-20260703/v7-azure-validation-summary.json`.
- Focused TypeScript, ESLint, and Jest outputs from the release worktree.
- `/Users/anand/Downloads/abarva-v7-home-proof-20260703/report.html`.
- `/Users/anand/Downloads/abarva-v7-home-quality-lakeshore-20260703/report.html`.
- Post-deploy ACA revision/image/traffic proof for the tabbed-canvas follow-up to be added after deployment.

## Known Gaps

- Azure AI Search / embedding backfill was not run in this release.
- Full 10-25-question-per-dimension pressure testing is not complete yet; this release enables the deployed Home V7 proof path and the first live QA pass.
- V6 fallback remains intentionally until every product adapter and signed-in browser gate proves V7 parity or better.
