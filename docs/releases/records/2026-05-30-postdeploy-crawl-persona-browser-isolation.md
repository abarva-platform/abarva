# 2026-05-30 · Post-deploy crawl persona browser isolation

## Release ID
`2026-05-30-postdeploy-crawl-persona-browser-isolation`

## Status
candidate

## Plain-English Summary
The post-deploy crawl no longer shares one Chrome process across every tenant persona. The latest main crawl proved the metrics fallback worked, then exposed the next harness weakness: Chrome closed after the Meridian persona completed, and the next persona could not create a new context. This release launches and closes a fresh browser per persona, so one browser crash cannot poison the rest of the tenant matrix.

## Layer Impact
- `qa-validation-lane`: hardens `scripts/crawl/post-deploy-harness.ts` by isolating browser lifecycle per persona.
- `runtime-app-lane`: none.
- `data-plane-lane`: none.

## Client Applicability
- All clients: yes. The authenticated post-deploy crawl gates all canonical tenant personas.
- Specific clients: Meridian exposed the browser-close failure; First Capital and later personas were blocked by the shared browser.
- Internal only: yes for the code change itself; product UI is unchanged.
- Public/demo only: no.

## Changes Included
- Moved Playwright browser launch/close into the persona loop.
- Preserved isolated browser contexts per persona.
- Ensured browser cleanup runs even if sign-in/context creation fails.

## QA / Validation
- PASS: `npm run smoke:p21-post-deploy-crawl`
- PASS: `npx eslint scripts/crawl/post-deploy-harness.ts`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED: `npx tsc --noEmit --pretty false` is blocked by pre-existing missing optional dependencies: `@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, and `@resvg/resvg-js`.

## Rollout Plan
- Merge to main after green CI.
- Vercel production deploys main.
- Re-run the authenticated post-deploy crawl against `https://app.abarva.ai`.

## Rollback Plan
- Revert this release record and `scripts/crawl/post-deploy-harness.ts` to restore single-browser crawl execution.

## Audit Evidence
- Main crawl run `26689717333` logged `crawl_metrics_extraction_failed:meridian-cdio__admin-releases`, proving the previous fallback worked.
- The same run then failed at the next persona bootstrap with `browser.newContext: Target page, context or browser has been closed`, showing the browser process itself had died.

## Known Gaps
- This remains harness-only. It does not change product runtime behavior or suppress product P0s.
- A full authenticated production crawl must pass after merge before the post-deploy gate can be considered closed.
