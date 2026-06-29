# 2026-06-29-home-answer-demo-safe-response — Home KNOW API Demo-Safe Answer Payload

## Release ID

`2026-06-29-home-answer-demo-safe-response`

## Status

`candidate`

## Plain-English Summary

Home aVa answers now apply the same demo-safe tenant-name policy at the API response boundary that the navigation shell already uses. This prevents public Home answer payloads from exposing old legal or synthetic client names such as SkyHarbor Air Group or Lakeshore Industries during soft-launch demos.

## Layer Impact

- `global-control-lane`: Updates the shared Home KNOW API response path for every tenant using the Home advisor.
- `public-demo`: Reduces demo/legal naming risk for user-visible Home answers and response tables.

## Client Applicability

- All clients: Yes, for Home KNOW API responses.
- Specific clients: Not client-specific.
- Internal only: No.
- Public/demo only: The naming policy is demo-safety oriented but runs on the shared Home API path.
- Feature flag: None.

## Changes Included

- `src/app/api/home/know/ask/route.ts` now sanitizes the Home KNOW response payload before visible contract validation and JSON response.
- `src/lib/home/know/home-demo-safe-response.ts` adds recursive response sanitization for user-visible string values while preserving technical identifiers.
- `src/lib/home/know/__tests__/home-demo-safe-response.test.ts` covers prose, facts, table cells, citations, trace strings, and preserved IDs.

## QA / Validation

- Pass: `npx eslint src/app/api/home/know/ask/route.ts src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts`
- Pass: `npx eslint scripts/qa/home-v6-backend-correctness-projection.mjs`
- Pass: `npx jest src/lib/home/know/__tests__/home-demo-safe-response.test.ts --runInBand`
- Pass: `node --check scripts/qa/home-v6-backend-correctness-projection.mjs`
- Pass: `node scripts/qa/home-v6-backend-correctness-projection.mjs --repoRoot /Users/anand/Projects/nexus --datasetRoot /Users/anand/Projects/nexus/datasets --outDir /Users/anand/Projects/nexus/reports/home-v6-backend-correctness-projection-2026-06-29 --questions 1000`

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merged image, wait for the new ACA revision to become healthy, assign 100% traffic, then rerun the live Home 50-question exact-answer audit and strict old-name leak check.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps main deploy workflow only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Verify active revision, digest-pinned image, health, and 100% traffic.
- Worker image invariant: No worker behavior changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home answer API/browser audit for Lakeshore/Industrial Demo and SkyHarbor/Airline Demo.

## Rollback Plan

Revert the merge commit and redeploy through the same ACA main deploy workflow. The change is code-only and has no migration or data rollback.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4160
- CI run: To be added.
- ACA deployment: To be added after merge/deploy.
- Live QA: To be added after rerunning the 50-question Home exact-answer audit.

## Known Gaps

This release removes old-name leaks in Home answer payloads. It does not by itself prove answer correctness or close thin V6 coverage areas; those are handled by the separate Home backend correctness projection and live QA reports.
