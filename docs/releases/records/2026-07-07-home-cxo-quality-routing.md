# 2026-07-07-home-cxo-quality-routing — Home V7 CXO Routing Fix

## Release ID

`2026-07-07-home-cxo-quality-routing`

## Status

`candidate`

## Plain-English Summary

Home V7 now handles two CXO question patterns more accurately: CFO company-profile questions stay grounded in the Enterprise Profile, while leadership investment-sequencing questions hand off to Intelligence instead of letting Home make advisory recommendations.

## Layer Impact

- `global-control-lane`: deterministic Home KNOW routing for the shared `/home` context browser. No data schema, ingestion, auth, or tenant-fence changes.

## Client Applicability

- All clients: yes, for Home V7 answer routing.
- Specific clients: validated against the Lakeshore question patterns that failed live audit.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/know/v7-home-ask.ts`: profile-specific terms win before advisory handoff; leadership investment phrasing routes to Intelligence.
- `src/lib/home/know/__tests__/v7-home-ask.test.ts`: regression tests for CFO profile orientation and leadership investment handoff.

## QA / Validation

- Pass: `npx eslint src/lib/home/know/v7-home-ask.ts src/lib/home/know/__tests__/v7-home-ask.test.ts`.
- Pass: `npx jest src/lib/home/know/__tests__/v7-home-ask.test.ts --runInBand` — 9 tests passed; existing duplicate manual mock warnings are unrelated repo baseline noise.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow will build and deploy the updated shared web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the main deploy workflow after merge.
- ACA runtime invariant: required after merge/deploy before claiming live.
- Worker image invariant: managed by the main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, rerun the Lakeshore Home CXO quality audit after deploy.

## Rollback Plan

Revert the PR or redeploy the previous good `main` SHA through the approved ACA main deploy workflow.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4529
- Live pre-fix audit: `/Users/anand/Projects/nexus/proof/home-cxo-quality-live-2026-07-07T13-35-37-297Z/quality-audit.json`.
- Focused validation: to be added before merge.

## Known Gaps

This does not add the future Impact/Recharts Home tab. It only corrects deterministic answer routing for CXO profile and investment-boundary questions.
