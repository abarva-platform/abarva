# 2026-06-02-outputs-deliverables-explorer — Admin Outputs / Deliverables Explorer

## Release ID

`2026-06-02-outputs-deliverables-explorer`

## Status

`candidate`

## Plain-English Summary

Adds an admin-only explorer at `/admin/outputs` so operators can see Move deliverables and Source event artifacts for the active tenant in one read-only place. It does not load files, create outputs, change consent behavior, or add tables.

## Layer Impact

- `internal-admin`: Adds a Maestro admin route for read-only operational visibility.
- `client-data-lane`: Reads tenant-scoped Move and Source output rows from existing data-plane/read-model paths only.

## Client Applicability

- All clients: Available to admin users for whichever active client is resolved by the admin shell.
- Specific clients: None.
- Internal only: Yes, `/admin/outputs` is behind the existing `/admin` admin layout.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- New route: `src/app/(maestro)/admin/outputs/page.tsx`
- New read-model helper: `src/lib/admin/outputs-deliverables-explorer.ts`
- Focused tests for the helper and page source.
- No migrations, loader upload component edits, schema-preflight edits, or consent-gate edits.

## QA / Validation

- Focused Jest/source tests: passed with `NODE_OPTIONS='--require ./src/scripts/_mock-server-only-preload.cjs' ./node_modules/.bin/jest "src/lib/admin/__tests__/outputs-deliverables-explorer.test.ts" "src/lib/admin/__tests__/outputs-page-source.test.ts" --runInBand`.
- Focused ESLint: passed with `./node_modules/.bin/eslint src/lib/admin/outputs-deliverables-explorer.ts src/lib/admin/__tests__/outputs-deliverables-explorer.test.ts src/lib/admin/__tests__/outputs-page-source.test.ts 'src/app/(maestro)/admin/outputs/page.tsx'`.
- `git diff --cached --check`: passed.
- `npm run release:check -- --base origin/main --head HEAD`: passed.

## Rollout Plan

Merge the PR to `main`; the route becomes available on the next normal Vercel deployment. No database rollout or feature flag activation is required.

## Rollback Plan

Revert the PR. Because the slice is read-only and adds no migrations, rollback only removes the admin route, helper, tests, and release record.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2821
- Local validation output from this branch.
- Diff evidence showing no migrations and no private-loader/schema-preflight/consent-gate file changes.

## Known Gaps

The explorer only shows rows returned by existing Move and Source read paths. If the local data plane is unconfigured or a tenant has no output rows, it renders an honest empty/warning state rather than synthetic data.
