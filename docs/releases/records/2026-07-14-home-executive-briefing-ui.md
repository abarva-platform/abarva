# 2026-07-14-home-executive-briefing-ui — Home Executive Briefing UI

## Release ID

`2026-07-14-home-executive-briefing-ui`

## Status

`candidate`

## Plain-English Summary

Home now renders as a lower-clutter executive briefing surface based on the existing active module-context/Home Summary Snapshot data. The default canvas emphasizes enterprise profile, executive snapshot, actions, and context exploration. Data quality diagnostics move behind an explicit left-rail option, and aVa is hidden until the user opens it.

## Layer Impact

- `global-control-lane`: Updates the shared Home UI component and its focused behavior tests for all tenants.
- `module-context consumer`: Home continues to consume the existing module-context/Home Summary Snapshot contracts; this release does not introduce a new data source.
- `agent UI`: aVa remains connected through the existing Home KNOW endpoint and shared answer renderer, but is no longer shown by default.

## Client Applicability

- All clients: Yes, all tenants using the shared Home surface receive the UI structure.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/components/home/__tests__/HomeSurface.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false --project tsconfig.json`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image. No database migration, data promotion, data rebuild, or feature-flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for live `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Home route proof after deploy.

## Rollback Plan

Revert the Home UI PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this release does not write or promote tenant data.

## Audit Evidence

- Focused Home Jest output.
- TypeScript compile output.
- PR URL and ACA deploy evidence to be attached after PR/merge/deploy.

## Known Gaps

- Live signed-in browser proof is pending until the PR is merged and deployed.
- Broader all-tenant visual crawl is pending post-deploy.
