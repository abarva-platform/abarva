# 2026-06-01-post-deploy-crawl-concurrency

## Release ID

`2026-06-01-post-deploy-crawl-concurrency`

## Status

`candidate`

## Plain-English Summary

This hotfix prevents overlapping production post-deploy crawls from running at the same time. Rapid main merges triggered multiple authenticated crawl jobs in parallel, which exhausted the production Postgres connection ceiling and caused `/strategic-moves` to return 500 during the crawl window. The workflow now uses a single production crawl concurrency group and cancels older in-progress crawls when a newer main deployment starts.

## Layer Impact

Release lane: `internal-admin`. Internal release and deployment validation only. No product UI, application route, data schema, tenant data, or runtime business logic changes.

## Client Applicability

- All clients: indirect protection from validation-induced production load.
- Specific clients: none.
- Internal only: AbarVa release pipeline.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added GitHub Actions concurrency to `.github/workflows/post-deploy-crawl.yml`.
- Older in-progress post-deploy crawls are canceled when a newer post-deploy crawl starts.

## QA / Validation

- Verified Vercel logs for failed crawl runs showed `EMAXCONN max client connections reached, limit: 200` during overlapping post-deploy crawl windows.
- Confirmed the hotfix is workflow-only and does not affect application runtime.
- `git diff --check` clean.

## Rollout Plan

Merge to `main`. The next post-deploy crawl run will enforce the single-crawl concurrency group automatically.

## Rollback Plan

Revert this release to remove the workflow concurrency guard. No data rollback required.

## Audit Evidence

- Post-deploy crawl run `26765041990` reported 4 P0s caused by `/strategic-moves` 500s.
- Vercel production logs for deployment `nexus-43msgy2ii-anandsundaram-hashs-projects.vercel.app` showed repeated `EMAXCONN` failures on `/strategic-moves`.

## Known Gaps

This prevents CI-induced crawl stampedes. It does not replace a separate capacity review for real customer traffic or the older pool-cap PR.
