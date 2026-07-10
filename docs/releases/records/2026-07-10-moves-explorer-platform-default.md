# 2026-07-10-moves-explorer-platform-default — Moves explorer platform default

## Release ID

`2026-07-10-moves-explorer-platform-default`

## Status

`candidate`

## Plain-English Summary

Moves now treats the Source-like explorer/workspace experience as the default product experience, not a tenant-only preview. The persistent phase journey sidebar had already been merged for all clients; this release promotes the remaining Moves workspace surfacing and phase-workspace guidance flags from tenant opt-in to platform default so every tenant can open the same governed explorer/workspace path.

This does not archive, migrate, or rewrite old Moves. The Workspace Explorer is a read-only/governed surfacing layer over existing program attachments, generated artifacts, deliverables, and Move metadata.

## Layer Impact

- `global-control-lane`: changes shared feature-flag behavior for Moves UI surfaces. `moves_phase_workspace_v2` and `workspace_explorer_moves` now resolve true by default for every tenant.
- No `client-data-lane` impact: no schema, data migration, ingestion, read-model mutation, or Move archival.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_phase_workspace_v2` and `workspace_explorer_moves` are platform-default flags after this release. The heavier AI generation/orchestration flags remain separately tenant-gated.

## Changes Included

- `src/lib/features/registry.ts`: promotes `moves_phase_workspace_v2` and `workspace_explorer_moves` from tenant opt-in to platform default and updates the summaries to describe all-tenant scope and rollback.
- `src/lib/features/__tests__/is-feature-enabled.test.ts`: updates the feature-flag contract tests so unrelated tenants receive the Moves workspace/phase experience by default while Source explorer remains tenant-gated.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/features/__tests__/is-feature-enabled.test.ts src/lib/programs/__tests__/phase-explorer-tallies.test.ts src/lib/workspace-explorer/__tests__/moves-adapter-mapping.test.ts src/components/workspace-explorer/__tests__/WorkspaceExplorer.test.tsx --runInBand` — 4 suites / 29 tests passed. Jest printed pre-existing duplicate manual mock warnings, but no failures.
- Pass: `npx eslint src/lib/features/registry.ts src/lib/features/__tests__/is-feature-enabled.test.ts src/app/(maestro)/strategic-moves/[moveId]/page.tsx src/app/(maestro)/strategic-moves/[moveId]/workspace/page.tsx src/components/strategic-moves/MovePhaseExplorer.tsx src/lib/programs/phase-explorer-tallies.ts`.
- Live signed-in proof: pending merge/deploy. Required proof is a Moves detail page and `/workspace` route across Lakeshore plus at least one non-Lakeshore tenant.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the new image, verify the ACA runtime invariant, then run signed-in browser proof on `https://app.abarva.ai` for Moves detail, phase, workspace, upload, and deliverable download paths.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be confirmed post-deploy.
- ACA runtime invariant: to be verified post-deploy.
- Worker image invariant: unaffected.
- Feature/env flag update path: no env update required; this is a registry policy change.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release. Because there is no data migration, no data mutation, and no Move archival, rollback returns `moves_phase_workspace_v2` and `workspace_explorer_moves` to tenant opt-in behavior immediately after redeploy. If an emergency tenant-specific rollback is needed after the platform default, add that tenant to `excludeTenants` on the affected flag and redeploy.

## Audit Evidence

- Pre-fix live signed-in proof showed `/strategic-moves/{moveId}/workspace` returned a tenant-scoped 404 for Lakeshore because `workspace_explorer_moves` was still tenant-default/off.
- Existing same-day release records `2026-07-10-moves-phase-explorer-sidebar` and `2026-07-10-moves-phase-explorer-hard-gate-scope` show the phase journey sidebar was already intended for all clients and only awaited deployment/live proof.

## Known Gaps

- Live proof is pending deployment.
- The standalone HTML prototype in Downloads remains a design reference, not a production component. This release uses the production Workspace Explorer and phase workspace surfaces already in the app.
