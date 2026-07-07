# 2026-06-04-home-admin-alias-fix — Redirect stale Home Admin bookmark

## Release ID

`2026-06-04-home-admin-alias-fix`

## Status

`candidate`

## Plain-English Summary

Users with old bookmarks or browser history for `/home/admin` should land on the canonical Admin overview instead of the AbarVa 404 page. Child paths such as `/home/admin/setup` now preserve the intended Admin destination as `/admin/setup`.

## Layer Impact

`global-control-lane` — Updates the shared routing/proxy layer for all signed-in clients. No data model, tenant substrate, or ingestion behavior changes.

## Client Applicability

- All clients: Yes, all tenants receive the stale-route redirect.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/proxy.ts` maps `/home/admin` to `/admin`.
- `src/proxy.ts` maps `/home/admin/<path>` to `/admin/<path>`.
- `src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts` pins the alias contract.

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-admin-boundary-contract.test.ts' --runInBand`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pending: production smoke for `/home/admin` and `/home/admin/setup` after merge and deploy.

## Rollout Plan

Merge to `main`; Vercel production deploy makes the proxy redirect active immediately.

## Rollback Plan

Revert the proxy mapping and test changes, then redeploy. No data rollback is required.

## Audit Evidence

- Pull request and CI results for this release.
- Production smoke output showing `/home/admin` redirects to `/admin`.
- Production smoke output showing `/home/admin/setup` redirects to `/admin/setup`.

## Known Gaps

This release only fixes stale Admin bookmarks under `/home/admin`. It does not change the Admin information architecture, the Data Loads workflow, or the file-template catalog visibility. Those remain separate product-design and ingestion-surface improvements.
