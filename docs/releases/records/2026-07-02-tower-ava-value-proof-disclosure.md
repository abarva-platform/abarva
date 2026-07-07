# 2026-07-02-tower-ava-value-proof-disclosure — Tower value-proof total disclosure

## Release ID

`2026-07-02-tower-ava-value-proof-disclosure`

## Status

`candidate`

## Plain-English Summary

This release fixes the remaining live Tower aVa value-proof failures where the governed answer had row-level initiative evidence but did not visibly disclose the portfolio-level promised and measured value totals required by the Tower answer contract. The API should return a valid answer instead of a server error for value-proof questions.

## Layer Impact

- `global-control-lane`: Updates shared Tower aVa answer composition and validation behavior for all tenants using the CIO Tower path.
- `client-data-lane`: No data, schema, ingestion, or tenant facts changed.

## Client Applicability

- All clients: Yes, for Tower aVa questions about board-ready value evidence, measured value evidence, and missing AI value proof.
- Specific clients: Live audit target is Lakeshore and SkyHarbor.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: value-proof governance answers now include visible portfolio promised/measured totals when those governed metric packets are part of the answer contract.
- `src/lib/cio-tower/__tests__/answer.test.ts`: adds a regression where portfolio totals differ from row-level initiative values and asserts the visible answer satisfies the metric-packet contract.

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand` — 32/32 passed.
- Pending: focused ESLint, TypeScript, `npm run release:check`.
- Pending after deploy: rerun `BASE_URL=https://app.abarva.ai node tmp/run-tower-ava-live-50x2.mjs` and confirm the six value-proof `500`s are gone.

## Rollout Plan

Merge to `main`; use the repo-owned Azure Container Apps main deploy workflow; verify ACA revision, image digest, 100% traffic, and health; rerun the signed-in Tower 50x2 audit.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy` on `main`.
- Shared runtime mutators: No local/manual ACA traffic mutation in this release.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Managed by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR or redeploy the previous approved `main` image through the repo-owned ACA deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- Live audit before fix: `/Users/anand/Downloads/tower-ava-50x2-live-post4331-2026-07-02T14-05-21-449Z` showed 94/100 with six value-proof `500` failures.
- Live audit after fix: pending.

## Known Gaps

This release does not change the Tower right-side canvas design. The Source-style right canvas remains the design reference for the next Tower polish slice after the answer path is clean.
