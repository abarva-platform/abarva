# 2026-07-07-home-v6-cxo-routing-fallback — Home V6 CXO Fallback Routing Fix

## Release ID

`2026-07-07-home-v6-cxo-routing-fallback`

## Status

`candidate`

## Plain-English Summary

Home now applies the same CXO routing discipline when a tenant falls back to the V6 Home pack: company-profile questions stay grounded in the Enterprise Profile, while investment-sequencing questions hand off to Intelligence instead of letting Home make advisory recommendations.

## Layer Impact

- `global-control-lane`: deterministic Home KNOW fallback routing for the shared `/home` context browser. No data schema, ingestion, auth, or tenant-fence changes.

## Client Applicability

- All clients: yes, when Home falls back to the V6 dataset contract.
- Specific clients: validated against the Lakeshore live-audit patterns where V7 was unavailable and V6 handled the answer.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/home/know/v6-home-ask.ts`: profile-specific terms win before advisory handoff; leadership investment phrasing routes to Intelligence.
- `src/lib/home/know/__tests__/v6-home-know-response.test.ts`: regression tests for CFO profile orientation and leadership investment handoff in the V6 fallback path.

## QA / Validation

- Pass: `npx eslint src/lib/home/know/v6-home-ask.ts src/lib/home/know/__tests__/v6-home-know-response.test.ts`.
- Pass: `npx jest src/lib/home/know/__tests__/v6-home-know-response.test.ts --runInBand` — 14 tests passed; existing duplicate manual mock warnings are unrelated repo baseline noise.
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

- Triggering live audit: `/Users/anand/Projects/nexus/proof/home-cxo-quality-live-postfix-2026-07-07T13-53-56-908Z/quality-audit.json`.
- PR URL: https://github.com/abarva-platform/abarva/pull/4530
- Focused validation: `npx eslint src/lib/home/know/v6-home-ask.ts src/lib/home/know/__tests__/v6-home-know-response.test.ts`; `npx jest src/lib/home/know/__tests__/v6-home-know-response.test.ts --runInBand`; `git diff --check`; `npm run release:check`.

## Known Gaps

This does not load the Lakeshore V7 pack. It keeps Home accurate while V6 remains the live fallback for Lakeshore.
