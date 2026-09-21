# 2026-09-21-t463-user-provision-boundary — User Provisioning Boundary Test

## Release ID

`2026-09-21-t463-user-provision-boundary`

## Status

`candidate`

## Plain-English Summary

Repairs the admin user-provisioning route test so it replaces the boundaries the route actually
uses. The suite now keeps identity invitations mocked, replaces the route's read client and admin
write adapter directly, and asserts the exact write payloads that carry the active-client pin.

## Layer Impact

Release lane: `internal-admin`.

Layer 4 Products: Test coverage only for an admin route. No product behavior changes.

Layer 3 Canonical Enterprise Model: No canonical data, schema, or migration change.

## Client Applicability

- All clients: no runtime behavior change; this is CI/test coverage only.
- Specific clients: none.
- Internal only: admin-route test coverage and release evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/api/admin/users/provision/__tests__/route.test.ts`
- `.github/workflows/unit-suites.yml` pending after the live CI-ownership claim on that file releases.
- `docs/architecture/test-ci-coverage-census.json` pending after the live CI-ownership claim on that file releases.

## QA / Validation

- Safety proof before repair, with database and Clerk env removed:
  `getAzureReadFluentClient()` constructed a client, and the first read returned
  `{ data: null, error: "Missing ABARVA_AZURE_DATABASE_URL or DATABASE_URL" }` without opening a
  socket.
- Safety proof before repair, with database and Clerk env removed:
  `selectAdminWriteAdapter("azure-postgres").upsertPerson(...)` returned
  `{ ok: false, detail: "azure_write_adapter_no_connection: set ABARVA_AZURE_DATABASE_URL or DATABASE_URL" }`;
  no write reached a database.
- Baseline before repair:
  `npx jest --runTestsByPath src/app/api/admin/users/provision/__tests__/route.test.ts --no-coverage --ci`
  collected 4 tests, failed 3, passed 1. The only passing case was the 403 rights refusal that
  returns before constructing the data-plane clients.
- After repair:
  `npx jest --runTestsByPath src/app/api/admin/users/provision/__tests__/route.test.ts --no-coverage --ci`
  passed 4 of 4 tests.
- Mutation proof:
  changing the person upsert graph node from `person:<client>:<email>` to `person:<email>` made the
  focused suite fail 2 of 4 tests, proving the active-client pin assertion is load-bearing. The route
  source was restored before commit.

## Rollout Plan

Open a pull request and merge after the ordinary PR matrix is green. The repo-owned ACA deploy lane
may build and deploy the merge commit, but the committed change is test and release evidence only.

## Deployment Authority

- Repo-owned deploy workflow: required for any ACA deployment after merge.
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable before merge/deploy.
- ACA runtime invariant: not applicable before merge/deploy.
- Worker image invariant: not applicable before merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no. This change does not alter product runtime behavior.

## Rollback Plan

Revert the PR commit. No data rollback, migration rollback, tenant-data repair, Clerk action, or
runtime flag cleanup is required.

## Audit Evidence

- Focused route suite before/after command output.
- Safety proof commands run with database and Clerk environment removed.
- Mutation output for the person active-client pin.
- Pull request and CI run once opened.

## Known Gaps

CI wiring and census refresh are pending only because another live implementation claim currently
owns `.github/workflows/unit-suites.yml` and `docs/architecture/test-ci-coverage-census.json`.
