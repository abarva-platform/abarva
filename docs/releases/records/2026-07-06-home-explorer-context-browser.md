# 2026-07-06-home-explorer-context-browser — Home Explorer Context Browser

## Release ID

`2026-07-06-home-explorer-context-browser`

## Status

`candidate`

## Plain-English Summary

Home is redesigned as a context browser instead of a broad advisory chat surface. The page now opens with a left-side Context Explorer, a center detail workspace with Summary, Data, Gaps, Sources, and Relationships tabs, and a right-side context-quality rail with a scoped aVa helper.

The main browser renders deterministic V7/V6 context data directly from the loaded tenant packet. aVa remains available for contextual explanation where appropriate, but Home does not use Claude as the fact source for the primary data tables, gaps, sources, or relationship views.

## Layer Impact

- `global-control-lane`: Updates the shared Home page experience and component tests. All tenants using the Home surface receive the same Explorer-first shell when this is deployed.
- `client-data-lane`: No schema, migration, ingestion, or tenant data changes. The change reads existing Home context browser payloads only.
- `internal-admin`: No change.
- `public-demo`: No public route change.

## Client Applicability

- All clients: Yes, after the Home UI release is merged and deployed.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Replaced the previous Home chat-first shell with an Explorer-first context browser in `src/components/home/HomeSurface.tsx`.
- Added deterministic tabs for Summary, Data, Gaps, Sources, and Relationships for the selected context area.
- Added a right-side visual rail for context quality, row/source/gap indicators, and scoped aVa context explanation.
- Updated Home surface tests in `src/components/home/__tests__/HomeSurface.test.tsx` to verify the Explorer shell, default Summary behavior, clean data rendering, source/relationship views, and search filtering.

## QA / Validation

- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/__tests__/HomeSurface.test.tsx`
- Pass: `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `npx jest src/lib/home/know/__tests__/v7-home-ask.test.ts --runInBand`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 npm run build`
- Blocked locally: `http://localhost:3017/home` redirected to Clerk sign-in when probed with the available Lakeshore storage state; the dev server reported a Clerk key/session mismatch. Signed-in proof remains required after ACA deployment or with a fresh local Clerk session.
- Pending: Signed-in browser proof on `https://app.abarva.ai` after ACA deployment.

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

Rollback by moving ACA traffic back to the prior healthy revision or reverting the Home UI commit and redeploying through the approved ACA lane. No database rollback is required.

## Audit Evidence

- PR URL: Pending.
- Test output: Local focused lint and Jest results listed above.
- Browser screenshots: Pending signed-in proof after deployment.
- ACA revision and image digest: Pending deployment.

## Known Gaps

- Local browser proof was blocked by Clerk sign-in/session mismatch using the available storage state.
- Production deployment and signed-in verification are not complete in this candidate.
