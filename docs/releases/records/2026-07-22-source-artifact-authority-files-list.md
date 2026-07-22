# 2026-07-22-source-artifact-authority-files-list — Collapse Source Files listing to authoritative artifacts

## Release ID

`2026-07-22-source-artifact-authority-files-list`

## Status

`candidate`

## Plain-English Summary

The Source Files listing could show multiple rows for the same event-stage artifact slot when a
generated draft and a later client-final or authoritative artifact both existed. This release wires
the listing route into the shared artifact-authority resolver so the default Files view shows one
authoritative row per slot. The existing `includeHistory=1` audit mode still returns raw version
history.

## Layer Impact

- `global-control-lane`: Source Files API response shaping now uses the shared artifact authority
  resolver already used by Source aVa context.
- No schema, migration, permission, data-loader, or production data mutation changes.

## Client Applicability

- All clients: yes, for Source events with multiple artifact rows in the same stage/artifact slot.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/events/[eventId]/artifacts/route.ts`
  - Resolves visible artifacts through `resolveAuthoritativeArtifactSlots()` when `includeHistory`
    is not requested.
  - Keeps `includeHistory=1` as raw history mode for audit and troubleshooting.
- `src/app/api/v1/source/events/[eventId]/artifacts/__tests__/route.test.ts`
  - Adds default-collapse and history-preservation regression coverage.

## QA / Validation

- `pass` — `npx jest --runTestsByPath 'src/app/api/v1/source/events/[eventId]/artifacts/__tests__/route.test.ts' --runInBand`
  — 1 suite / 7 tests passed. Jest printed the repo's pre-existing duplicate manual mock warnings.
- `pass` — `npx eslint 'src/app/api/v1/source/events/[eventId]/artifacts/route.ts' 'src/app/api/v1/source/events/[eventId]/artifacts/__tests__/route.test.ts'`.
- Pending before PR: focused resolver + route test rerun, typecheck, `npm run release:check`.

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main deploy workflow, verify the ACA runtime
invariant, then run signed-in Source Files proof on a real event with duplicate artifact rows.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after deploy.
- ACA runtime invariant: to be recorded after deploy.
- Worker image invariant: to be recorded by the deploy workflow if applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit. Rollback restores the prior Files listing behavior where current generated
and client-final rows in the same slot can both appear in the default response. No data rollback is
required.

## Audit Evidence

- PR: to be recorded after open.
- Deploy run: to be recorded after merge.
- ACA runtime invariant: to be recorded after deploy.
- Live signed-in proof: to be recorded after deploy.

## Known Gaps

- This release covers Files API/listing authority only. Direct artifact download authority,
  render/export format-mismatch honesty, Deal Pack authority, and old persisted draft repair remain
  separate backlog slices.
