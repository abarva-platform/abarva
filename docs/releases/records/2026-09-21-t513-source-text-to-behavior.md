# 2026-09-21-t513-source-text-to-behavior - Source-text scanners to behavior controls

## Release ID

`2026-09-21-t513-source-text-to-behavior`

## Status

`candidate`

## Plain-English Summary

Five root integration suites that previously read source files as text now render the relevant React behavior, or were retired where a source-shape assertion could not honestly prove runtime behavior. Pull-request CI owns the repaired exact files, and the generated coverage census has been refreshed.

## Layer Impact

- `global-control-lane`: test ownership, behavior coverage, coverage census, and release evidence only.
- Layer 4 Products: no product implementation changed; existing navigation, shell, Ask bar, Learn welcome, and sign-out behavior receive stronger regression coverage.
- No client intake, source adapter, canonical model, schema, migration, tenant data, external transport, runtime flag, or authorization behavior changes.

## Client Applicability

- All clients: indirect regression-protection benefit only.
- Specific clients: none.
- Internal only: pull-request CI and audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Replace five source-text integration scanners with `.tsx` jsdom behavior tests:
  - `app-rail-home-nav.test.tsx`
  - `app-topbar-prefetch-guard.test.tsx`
  - `ask-anything-bar-agent-answer.test.tsx`
  - `learn-welcome-cxo-toggle.test.tsx`
  - `shell-topbar-auth.test.tsx`
- Move those exact files from the known-dark root-file list into exact pull-request workflow ownership.
- Refresh `docs/architecture/test-ci-coverage-census.json`.

## QA / Validation

Focused suite after repair:

`npx jest src/__tests__/integration/app-rail-home-nav.test.tsx src/__tests__/integration/app-topbar-prefetch-guard.test.tsx src/__tests__/integration/ask-anything-bar-agent-answer.test.tsx src/__tests__/integration/learn-welcome-cxo-toggle.test.tsx src/__tests__/integration/shell-topbar-auth.test.tsx --runInBand --no-coverage`

Result: 5 suites / 11 tests passed.

CI ownership behavior:

`npx jest src/__tests__/behaviors/integration-directory-ci-coverage.test.ts --runInBand --no-coverage`

Result: 1 suite / 16 tests passed.

Source-text check:

`rg -n "readFileSync|fs\\.readFileSync|from ['\\\"]fs|from ['\\\"]node:fs" <five repaired files>`

Result: no matches.

Mutation checks, all reverted:

- AppShell default rail opt-in mutation failed `app-rail-home-nav.test.tsx`.
- Source New href mutation failed `app-topbar-prefetch-guard.test.tsx`.
- Governed-answer transcript suppression mutation failed `ask-anything-bar-agent-answer.test.tsx`.
- Learn default active-tab mutation failed `learn-welcome-cxo-toggle.test.tsx`.
- Clerk full-name scrubbing mutation failed `shell-topbar-auth.test.tsx`.

Public-safety review replaced personal and tenant-specific fixture literals with neutral test
identities. The Learn control asserts the rendered tab interaction and narrative change without
publishing fixture-tenant labels.

Coverage census refresh:

`npm run audit:test-ci-coverage:write`

Result: committed census updated and matched the run: 2,353 Jest test files under `src/`, 1,801 workflow-covered, 1,798 pull-request-covered, 552 uncovered.

## Rollout Plan

Merge through the protected pull-request path. The integration workflow begins enforcing the five exact repaired suites on subsequent pull requests. No application, data-plane, external-transport, or runtime rollout is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; this candidate does not request a deployment.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged and not inspected.
- Worker image invariant: unchanged and not inspected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; no product behavior changed, and none is claimed.

## Rollback Plan

Revert the five repaired integration suites, exact workflow ownership entries, coverage behavior list update, census refresh, and this release record. No schema, migration, data, transport, or runtime rollback is required.

## Audit Evidence

- The five repaired suites render behavior instead of reading source text.
- Focused Jest, ownership behavior, census write, and mutation outputs provide candidate evidence.
- PR and CI evidence are added by the repository pull-request flow.

## Known Gaps

- The old topbar prefetch scanner was layout/source-shape only and read a compatibility shim. It was not preserved as a prefetch implementation assertion; the retained control proves the rendered product destinations are document links with the expected active Source workflow.
- No deployment, data-plane mutation, external send, browser crawl, or signed-in acceptance was attempted or claimed.
