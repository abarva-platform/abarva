# 2026-06-02-admin-metadata-vocabulary — Admin Metadata Vocabulary Alignment

## Release ID

`2026-06-02-admin-metadata-vocabulary`

## Status

`candidate`

## Plain-English Summary

Aligns Admin browser titles, page eyebrows, and visible Admin chrome so they say Admin rather than AbarVa Setup. This follows the approved Home/Admin split: Home is the shared operating room, while operational setup, users, connectors, context, and readiness live in the Admin workspace.

## Layer Impact

Global control lane Admin UI. This is visible copy and metadata only; it does not alter routes, authentication, data loading, private data-plane behavior, migrations, or role-access logic.

## Client Applicability

- All clients: Signed-in users with Admin access see Admin vocabulary in browser titles and Admin page chrome.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Admin route metadata under `src/app/(maestro)/admin/**`
- Admin page eyebrows under Admin route pages
- Visible Admin chrome in `AdminCanonShellV2`, `AdminTenantTab`, `IsolationLane`, `SetupDataLoadCenter`, and `StewardSetupControlCenter`
- `src/__tests__/integration/admin/admin-visible-vocabulary.test.ts`

## QA / Validation

Local validation:

- PASS — `npx jest --runTestsByPath src/__tests__/integration/admin/admin-visible-vocabulary.test.ts --runInBand`
- PASS — `git diff --name-only --diff-filter=ACM | rg '\\.(ts|tsx)$' | xargs npx eslint`
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel pipeline. No migration or feature flag is required.

## Rollback Plan

Revert the PR to restore previous Admin metadata/copy. No data rollback is required.

## Audit Evidence

Inspect the PR diff, local validation output, release-control gate, CI results, and Vercel preview.

## Known Gaps

Internal identifiers, historical comments, and token names such as `SETUP_*` are intentionally unchanged for compatibility and traceability.
