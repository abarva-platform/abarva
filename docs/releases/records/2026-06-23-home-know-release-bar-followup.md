# 2026-06-23-home-know-release-bar-followup — Home KNOW Reality Crawl Follow-up

## Release ID

`2026-06-23-home-know-release-bar-followup`

## Status

`candidate`

## Plain-English Summary

This release tightens Home KNOW after the deployed reality crawl improved to 236/290 but still showed three concentrated blockers: exact-value honesty answers were being scored as fabricated, cross-tenant Home fence prompts could still surface expert-path metadata, and concurrent Home packet reads could overload the live read path and return blank answers under crawl pressure.

## Layer Impact

- `global-control-lane`: Updates the shared Home KNOW answer path and the shared deployed reality crawl judge for all tenants.
- `client-data-lane`: No schema or tenant data changes. The change reduces read pressure against existing Home views.

## Client Applicability

- All clients: Apex Retail, First Capital, SkyHarbor, Meridian, and Lakeshore receive the Home KNOW route and crawl-gate fixes.
- Specific clients: SkyHarbor should benefit most from the lower-pressure packet fetch because the deployed crawl produced intermittent blank responses there.
- Internal only: The reality crawl judge change affects QA scoring only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`: Home requests now fence foreign-tenant mentions against the signed-in tenant identity before any expert/general answer path can run.
- `src/lib/home/know/home-know-engine.ts`: Home packet view reads now run sequentially instead of fan-out parallel, avoiding connection-pool spikes during concurrent signed-in crawls.
- `scripts/qa/reality-crawl.mjs`: The honesty scorer now recognizes the exact-gap wording emitted by Home KNOW, while still failing fabricated confident values.

## QA / Validation

- PASS: `npx eslint src/app/api/intelligence/ask/route.ts src/lib/home/know/home-know-engine.ts scripts/qa/reality-crawl.mjs`
- PASS: `npm test -- --runTestsByPath src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`
- Pending after merge/deploy: rerun the signed-in deployed ACA reality crawl against `https://app.abarva.ai` and compare to the 236/290 baseline from revision `m0d558394`.

## Rollout Plan

Merge to main through PR, allow the repo-owned Azure Container Apps main deploy to build and deploy a new digest, shift 100% traffic to the new healthy revision, then rerun the signed-in reality crawl and regenerate `out/reality-crawl/report.html`.

## Deployment Authority

- Repo-owned deploy workflow: Required, `ACA main deploy`.
- Shared runtime mutators: No manual `az containerapp update` expected outside the deploy workflow.
- Approved image digest: To be produced by the main deploy after merge.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match the deployed digest.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, reality crawl across all five tenants.

## Rollback Plan

Revert this PR and redeploy the prior healthy ACA digest. No data migration or schema rollback is required.

## Audit Evidence

- PR URL: pending.
- Baseline evidence: `/Users/anand/Downloads/reality-crawl-0d558394-report.html` and `/Users/anand/Downloads/reality-crawl-0d558394-summary.json` show 236/290 before this follow-up.
- Post-deploy evidence: pending signed-in reality crawl report.

## Known Gaps

This PR does not implement the longer-term single Home materialized packet query. It lowers read pressure now and documents that the packet query should replace multiple view reads in a later performance hardening pass.
