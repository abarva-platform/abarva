# 2026-07-06-home-explorer-quality-explanations — Home Explorer Quality Explanations

## Release ID

`2026-07-06-home-explorer-quality-explanations`

## Status

`candidate`

## Plain-English Summary

Home Explorer now explains selected-context quality, gaps, sources, and relationships in clearer business language. The Enterprise Profile card no longer reads as low-quality just because it is a one-row company profile; it is treated as a profile anchor with fields to complete. Data values are formatted for executive reading, and relationship views avoid fabricating links from profile metadata.

## Layer Impact

- `global-control-lane`: Updates the shared Home Explorer UI and behavior tests for all tenants using the Home surface.
- `client-data-lane`: No schema, migration, ingestion, or tenant data changes. The release changes how existing loaded context is scored and explained.
- `internal-admin`: No change.
- `public-demo`: No public route change.

## Client Applicability

- All clients: Yes, after the Home UI release is merged and deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Added plain-English explanation panels to the selected-context Data, Gaps, Sources, and Relationships tabs.
- Adjusted selected-context quality scoring so Enterprise Profile is treated as a profile anchor rather than a volume-heavy operational table.
- Changed gap display language from raw gap counts to client-to-complete fields where appropriate.
- Prevented relationship rendering from inventing links for non-relationship profile records.
- Added regression coverage for Enterprise Profile quality, money/count formatting, gap wording, and relationship empty-state behavior.

## QA / Validation

- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`
- Pass: `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `npx jest src/lib/home/know/__tests__/v7-home-ask.test.ts --runInBand`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 npm run build`
- Pending: production signed-in browser proof after ACA deployment.

## Rollout Plan

Merge the release branch through the normal PR process, build the exact git SHA into an Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, move ingress traffic to the healthy new revision, and verify Home in a signed-in tenant session.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab rollout.
- Shared runtime mutators: None expected beyond the normal ACA image update.
- Approved image digest: Pending deployment.
- ACA runtime invariant: `app.abarva.ai` must run through Azure Container Apps, not Vercel.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by moving ACA traffic back to the prior healthy revision or reverting this Home UI commit and redeploying through the approved ACA lane. No database rollback is required.

## Audit Evidence

- PR URL: Pending.
- Test output: Focused lint, Jest, release gate, diff hygiene, and production build results listed above.
- Browser screenshots: Pending signed-in proof after deployment.
- ACA revision and image digest: Pending deployment.

## Known Gaps

- Production deployment and signed-in verification are not complete in this candidate.
