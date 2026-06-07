# 2026-06-07-no-supabase-env-dependency — Remove Supabase Runtime Env Requirement

## Release ID

`2026-06-07-no-supabase-env-dependency`

## Status

`candidate`

## Plain-English Summary

The container and deployment environment contract no longer requires Supabase
URL, anon-key, or service-role environment variables. Runtime data access is
documented as using direct Postgres connection strings through the
Azure/Postgres data-plane adapters.

## Layer Impact

- `global-control-lane`: Updates the shared runtime/deployment contract for all
  application containers and deployment operators.
- Data plane configuration: Clarifies that `ABARVA_AZURE_DATABASE_URL` and
  `DATABASE_URL` are the supported runtime database inputs; legacy Supabase env
  names are not required for the app runtime.
- QA/release controls: Adds regression coverage on the Dockerfile runtime env
  header and updates a stale live-adapter test to clear Postgres env vars rather
  than Supabase env vars.

## Client Applicability

- All clients: Yes, for shared app runtime packaging and deployment docs.
- Specific clients: None.
- Internal only: Operator/release documentation and test coverage.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `Dockerfile` required-runtime-env header now lists direct Postgres envs and
  explicitly states Supabase env names are not required.
- `docs/deployment/DOCKER_RUNTIME_PACKAGING.md` removes Supabase env vars from
  required runtime configuration.
- `docs/deployment/migrations.md` removes Supabase env vars from the Vercel
  required-env table.
- `docs/build/slices/CLOUD3_DOCKER_RUNTIME_PACKAGING.md` updates the historical
  slice note to match the current runtime contract.
- `src/__tests__/integration/deployment/docker-runtime-packaging.test.ts` adds a
  static guard against reintroducing Supabase env vars as Docker runtime
  requirements.
- `src/__tests__/integration/admin/data11-live-adapters.test.ts` updates the
  missing-DB regression to clear `ABARVA_AZURE_DATABASE_URL` / `DATABASE_URL`.

## QA / Validation

- Pass — `npx jest src/__tests__/integration/deployment/docker-runtime-packaging.test.ts src/__tests__/integration/admin/data11-live-adapters.test.ts`
  - Result: 2 suites passed, 37 tests passed.
  - Note: Jest emitted existing duplicate manual mock warnings for
    `mdast-util-from-markdown`, `mdast-util-gfm`, and
    `micromark-extension-gfm`; the targeted suites still passed.
- Pass — `npm run release:check -- --base origin/main --head HEAD`
  - Result recorded after this release record was updated with explicit QA
    status.

## Rollout Plan

Merge to `main` and deploy through the existing release process. No migration,
feature flag, or data backfill is required; this is a documentation and test
contract correction for the runtime environment.

## Rollback Plan

Revert the commit to restore the prior deployment documentation and test
expectations. No database rollback is required.

## Audit Evidence

- PR diff showing Supabase env vars removed from required runtime contracts.
- Targeted Jest output for Docker runtime packaging and DATA11 live-adapter
  tests.
- `npm run release:check -- --base origin/main --head HEAD` output.

## Known Gaps

Some archived docs and legacy/manual operational scripts still refer to
Supabase-era names for historical compatibility. This release only removes the
runtime/deployment requirement and locks that contract with tests.
