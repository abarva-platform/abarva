# 2026-07-10-moves-workspace-date-sort-fix — Moves workspace date-sort crash fix

## Release ID

`2026-07-10-moves-workspace-date-sort-fix`

## Status

`candidate`

## Plain-English Summary

The all-tenant Moves workspace rollout exposed a real Lakeshore data-shape defect: the Workspace Explorer sorted Move artifacts by `audit.updatedAt` using `.localeCompare()`, assuming every timestamp was already a string. Lakeshore had at least one artifact row where the Azure/Postgres adapter returned a Date-like value, so the `/strategic-moves/{moveId}/workspace` route crashed with a 500.

This release normalizes audit timestamps at the Moves Workspace Explorer adapter boundary before sorting. It does not change stored data, migrate old Moves, or hide any artifact rows.

## Layer Impact

- `global-control-lane`: fixes the shared Moves workspace read/sort adapter used by all tenants.
- No `client-data-lane` impact: no schema, migration, data rewrite, or old-Move archival.

## Client Applicability

- All clients: yes.
- Specific clients: Lakeshore is the proven failing path; SkyHarbor already passed but receives the safer mapper too.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/workspace-explorer/moves-adapter-mapping.ts`: normalizes string, Date, and numeric timestamp values before storing workspace audit timestamps and before newest-first sorting.
- `src/lib/workspace-explorer/__tests__/moves-adapter-mapping.test.ts`: adds a regression test where Move artifact rows carry Date-valued `created_at` / `generated_at` fields.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/workspace-explorer/__tests__/moves-adapter-mapping.test.ts src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand` — 2 suites / 10 tests passed. Jest printed pre-existing duplicate manual mock warnings, but no failures.
- Pass: `npx eslint src/lib/workspace-explorer/moves-adapter-mapping.ts src/lib/workspace-explorer/__tests__/moves-adapter-mapping.test.ts`.
- Live signed-in proof: pending merge/deploy/retest. Required proof is Lakeshore `/workspace` returns 200 after the fix, while upload/download/deliverable checks remain green.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the image, verify the ACA runtime invariant, then rerun signed-in browser proof for Lakeshore and SkyHarbor Moves workspace paths.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be confirmed post-deploy.
- ACA runtime invariant: to be verified post-deploy.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release. There is no migration or persisted-data mutation. Rollback would restore the prior timestamp handling, which is known to crash on Lakeshore's Date-valued artifact rows.

## Audit Evidence

- Live log from revision `ca-abarva-web-lab-eastus--ma0e2c9a9` showed: `TypeError: (b.audit.updatedAt ?? b.audit.createdAt ?? \"\").localeCompare is not a function` in the Moves Workspace Explorer sort.
- Live browser proof showed SkyHarbor `/workspace` returned 200 while Lakeshore `/workspace` returned 500, proving the issue was a data-shape edge case rather than the platform-default flag itself.

## Known Gaps

- Live post-fix proof is pending deployment.
