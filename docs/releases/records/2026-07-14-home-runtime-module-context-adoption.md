# 2026-07-14-home-runtime-module-context-adoption — Home Runtime Module Context Adoption

## Release ID

`2026-07-14-home-runtime-module-context-adoption`

## Status

`candidate`

## Plain-English Summary

Home now attempts to build its runtime summary snapshot from the enterprise
data-layer module context serving contract when Active Tenant Access is
available. If a tenant does not yet have Active Tenant Access, Home keeps the
existing browser-backed active Home snapshot instead of reading inactive
candidate data or blanking the page.

## Layer Impact

- `global-control-lane`: Updates the Home route and Home summary API to use a
  shared runtime summary builder.
- `client-data-lane`: Reads active module context for promoted tenants only.
  Candidate data is not read by default.

## Client Applicability

- All clients: The fallback-safe runtime builder is used by Home.
- Specific clients: SkyHarbor can use active module context now because it has
  an Active Tenant Access record. Other tenants continue to use the existing
  Home snapshot path until promotion.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/home/home-summary-runtime.ts`: Adds the runtime-safe Home summary
  builder.
- `src/app/(maestro)/home/page.tsx`: Uses the runtime builder for the Home page.
- `src/app/api/home/summary-snapshot/route.ts`: Uses the runtime builder for the
  summary API.
- `src/lib/home/__tests__/home-summary-runtime.test.ts`: Proves SkyHarbor
  supplier-context adoption, Meridian fallback safety, and explicit candidate
  preview separation.

## QA / Validation

- Pass: `npx jest src/lib/home/__tests__/home-summary-runtime.test.ts --runInBand`
- Pass: `npm run test:home-summary-snapshot`
- Pass: `npm run audit:module-context-serving`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:candidate-version`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --skipLibCheck --pretty false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to main, then deploy through the repo-owned Azure Container Apps main
workflow because this changes the authenticated Home page and summary API
runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None from this PR directly.
- Approved image digest: To be produced by the ACA main workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Home for SkyHarbor and Meridian.

## Rollback Plan

Revert the PR or roll back the ACA revision to the previous digest-pinned image.
No data rollback is required because the PR does not mutate tenant data.

## Audit Evidence

- PR URL: pending.
- Tests: Home runtime and Home summary snapshot suites.
- Runtime proof after deploy: pending.

## Known Gaps

The final polished Home Executive Briefing visual redesign is still separate.
This PR changes the runtime data source selection for the existing Home surface.
