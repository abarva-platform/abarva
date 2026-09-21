# 2026-09-21-source-events-tenant-guard-suite - Source Event Tenant Guard Suite

## Release ID

`2026-09-21-source-events-tenant-guard-suite`

## Status

`candidate`

## Plain-English Summary

Adds an executable guard proving the Source event detail read path returns not found when an active canonical tenant is given another canonical tenant's Source event identifier, even if the lower read adapter behaves like an unscoped `source_events` lookup.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source product read-path coverage is strengthened around tenant isolation. No product behavior is intentionally changed.

Layer 3 Canonical Enterprise Model: No canonical model, schema, migration, or tenant data changes.

## Client Applicability

All clients: the test guards shared Source read-path behavior.

Specific clients: none.

Internal only: CI ownership and release-control evidence.

Public/demo only: none.

Feature flag: none.

## Changes Included

- Adds canonical-tenant behavioral coverage to `src/lib/source/__tests__/queries-tenant-scope.test.ts`.
- Wires the exact test file into `.github/workflows/unit-suites.yml`.
- No migrations, data-plane writes, Azure queries, Azure mutations, auth weakening, or runtime configuration changes.

## QA / Validation

- Pass: red-first mutation check against the tenant guard failed the exact suite when the persisted-row tenant check was deliberately disabled, then passed after restoration.
- Pass: `npx jest --runTestsByPath src/lib/source/__tests__/queries-tenant-scope.test.ts --runInBand`.
- Pass: `npx jest --runTestsByPath src/lib/source/__tests__/queries-tenant-scope.test.ts --no-coverage --ci`.
- Pass: `npm run typecheck`.
- Pass: `npm run lint` exited 0 with existing repository warnings and no errors.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to main. The change is test and CI workflow ownership only; no runtime rollout, migration, feature flag, or manual data-plane operation is required.

## Deployment Authority

- Repo-owned deploy workflow: not required for runtime behavior; merge may still trigger normal repository workflows.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not claimed.
- Worker image invariant: not claimed.
- Feature/env flag update path: none.
- Live signed-in proof required: no. This does not change a user-visible route or product runtime path.

## Rollback Plan

Revert the PR to remove the added test, CI step, and release record.

## Audit Evidence

- PR URL once opened.
- Local focused test output.
- CI run for the exact Source event tenant guard suite.

## Known Gaps

No signed-in proof, Azure readback, or production runtime proof is claimed or required for this test-only control.
