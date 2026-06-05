# 2026-06-05-lakeshore-holding-group-tenancy-substrate — Lakeshore Holding-Group Tenancy Substrate

## Release ID

`2026-06-05-lakeshore-holding-group-tenancy-substrate`

## Status

`candidate`

## Plain-English Summary

Adds the first Lakeshore federated tenant substrate. Lakeshore becomes an L0 sponsor client over three fictionalized L1 HoldCos, with policy helpers that allow L0 aggregate rollups while keeping sibling HoldCo transaction-grain data isolated.

## Layer Impact

- `client-data-lane`: Adds holding-group metadata to `clients`, seeds the Lakeshore L0/L1 demo hierarchy, and adds RLS helper predicates for aggregate reads versus transaction-grain reads.
- `global-control-lane`: Adds a shared TypeScript policy module and extends Source access-policy prompt context so agents know L0 aggregate visibility does not equal raw sibling data access.

## Client Applicability

State exactly who receives the change.

- All clients: New `clients` columns are present but default to `standalone` / own-client visibility.
- Specific clients: Lakeshore Holdings plus Morgan Street Holdings Chicago, Roosevelt Holdings Atlanta, and Lakefront Capital Boston receive the demo holding-group metadata.
- Internal only: None.
- Public/demo only: The three L1 HoldCo rows are fictionalized demo rows for the Lakeshore federated demo.
- Feature flag: None.

## Changes Included

- Migration `supabase/migrations/20260605130000_lakeshore_holding_group_clients.sql`.
- New policy module `src/lib/auth/holding-group-policy.ts`.
- Source policy context extension in `src/lib/auth/source-access-policy.ts`.
- Tests in `src/lib/auth/__tests__/holding-group-policy.test.ts` and `src/lib/auth/__tests__/source-access-policy.test.ts`.

## QA / Validation

- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `npx jest src/lib/auth/__tests__/holding-group-policy.test.ts src/lib/auth/__tests__/source-access-policy.test.ts --runInBand` passed 2 suites / 15 tests.
- Pass: `npx eslint src/lib/auth/holding-group-policy.ts src/lib/auth/source-access-policy.ts src/lib/auth/__tests__/holding-group-policy.test.ts src/lib/auth/__tests__/source-access-policy.test.ts`.
- Pass: `git diff --check`.
- Blocked: local `npx tsc --noEmit --pretty false` cannot complete in this desktop worktree because unrelated optional packages are absent locally: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.
- Pass: migration text review confirmed this slice uses the live `clients` table, not a legacy `tenants` table.

## Rollout Plan

Merge to main after checks pass. The migration applies through the normal database migration path. Vercel deploy updates the Source policy prompt behavior automatically.

## Rollback Plan

Revert the PR to remove the TypeScript policy changes. Database rollback, if needed, should remove the three fictionalized L1 client rows and can leave the nullable holding-group columns in place, or drop the helper functions and columns in a controlled follow-up migration if no downstream specs have shipped.

## Audit Evidence

- PR URL once opened.
- CI checks for release control, typecheck, lint, and behavior coverage.
- Migration file demonstrating aggregate and transaction-grain helpers are separate.
- Policy tests showing L0 can read aggregate posture but cannot read sibling transaction-grain data.

## Known Gaps

This slice does not build the Tower Federated tab, CXO Intel Loader UI, or Move 0 Kyriba page. Those are Specs L04, L02, and L03 respectively.
