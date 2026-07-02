# 2026-07-02-lakeshore-holdings-canonical-profile — Lakeshore Holdings Canonical Profile

## Release ID

`2026-07-02-lakeshore-holdings-canonical-profile`

## Status

`candidate`

## Plain-English Summary

This release makes Lakeshore Holdings a holding-company tenant instead of an old Lakeshore Industries / Industrial Demo alias. The V6 company profile no longer treats the holding company as a direct operating-revenue entity. Revenue is represented as a portfolio-company rollup, with named operating companies, an explicit allocation bucket that still needs opco split/naming, and separate corporate plus operating-company IT budgets.

## Layer Impact

- `client-data-lane`: Renames the Lakeshore V6 pack to `lakeshore-holdings-synthetic-v6`, updates V6 tenant keys, profile facts, holdco hierarchy, supplemental revenue metrics, and generator/validator scripts.
- `global-control-lane`: Tightens tenant alias resolution so retired Lakeshore aliases no longer silently resolve to the active tenant in runtime V6, Home, Intelligence, Tower, Azure Search backfill, and related QA paths.

## Client Applicability

- All clients: No direct data change, but shared tenant-resolution code changes apply globally.
- Specific clients: Lakeshore Holdings.
- Internal only: QA scripts and generator/validator updates.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Renamed V6 source pack from `datasets/lakeshore-industries-synthetic-v6` to `datasets/lakeshore-holdings-synthetic-v6`.
- Updated Lakeshore V6 enterprise profile to use direct holdco revenue `0`, portfolio-company rollup `$7.12B`, named opco revenue `$3.56B`, opco revenue allocation bucket `$3.56B`, employee rollup `11,800`, direct IT budget `$190.6M`, corporate IT budget `$36.5M`, portfolio-company local IT budget `$154.1M`, and Innovation IT/Data AI component `$11.8M`.
- Updated the holdco hierarchy to Northline, Brightmark, Forge & Field, Great Lakes Pantry, Corporate Shared Services, Corporate Innovation IT and Data AI, and an explicit opco revenue allocation bucket.
- Removed retired alias resolution for `lakeshore-industries`, Industrial Demo, manufacturing demo, Morgan Street, and Mona Street from active Lakeshore tenant resolution paths.
- Updated generator, validator, Home V6 browser tests, tenant alias tests, Azure Search canonicalization tests, CIO Tower tests, and Source/Moves synthesis route tests.

## QA / Validation

- `node scripts/lakeshore/validate-lakeshore-v6-holdco-pack.mjs` passed.
- `npx jest src/__tests__/unit/tenant-keys.test.ts src/lib/azure-search/__tests__/tenant-context-backfill.test.ts src/lib/home/__tests__/v6-context-browser.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts src/app/api/programs/synthesis/__tests__/route.test.ts src/app/api/source/synthesis/__tests__/route.test.ts --runInBand` passed: 7 suites, 64 tests.
- Jest emitted pre-existing duplicate manual mock warnings for `mdast-util-*` and a localstorage-file warning; these did not fail the run.

## Rollout Plan

Merge to `main`, then use the approved Azure Container Apps deployment lane to build and deploy the exact merged SHA. After deploy, verify signed-in Lakeshore Home/Intelligence/Tower behavior on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the ACA build workflow.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must run the merged SHA image with 100% traffic on the healthy revision before claiming live.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, especially Home profile/source browse and Intelligence/Tower answers for Lakeshore Holdings.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image. No schema migration is included. If stale search/index rows exist under retired aliases, leave them unmerged and clean/reindex separately rather than restoring silent alias normalization.

## Audit Evidence

- PR URL: to be filled when opened.
- Local validator output: `node scripts/lakeshore/validate-lakeshore-v6-holdco-pack.mjs` passed.
- Local focused test output: 7 suites / 64 tests passed.
- Deployment proof: pending merge and ACA deploy.
- Browser screenshots: pending deployed signed-in verification.

## Known Gaps

The `$3.56B` operating-company revenue allocation bucket is intentionally not assigned to Lakeshore Holdings direct revenue. It still needs final opco split/naming before board-grade opco reporting can show every dollar by company.
