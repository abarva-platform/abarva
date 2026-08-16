# 2026-08-16 — Source Cube Active Build Provenance

## Release ID

`2026-08-16-source-cube-active-build-provenance`

## Status

`candidate`

## Plain-English Summary

The governed Source L4/cube refresh now marks one active cube build per scoped tenant and rebuilds both the Source read-model views and Cube-facing consumption views from that active build only. This prevents stale rows from earlier loads from being counted as part of the current refresh proof or shown through product-facing Source projections.

## Layer Impact

Layer 4 / Products (`internal-admin` lane): tightens the Source read-model and cube boundary so Source L4 views and consumption views expose current-build rows with `load_run_id` provenance. It does not create new facts; it makes refresh proof, Source product reads, and Cube reads build-scoped.

## Client Applicability

- All clients: none directly.
- Specific clients: applies to the approved scoped demo refresh lane only.
- Internal only: Source L4/cube data-build runner, operator proof, and governed consumption views.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/data-build/refresh-source-l4-cube.ts` records active Source L4/cube load runs for the approved tenant scope.
- The runner rebuilds Source read-model views so Contract 360, vendor portfolio, and application scope expose the active build only.
- The runner rebuilds Source Cube consumption views so vendor, contract, scope, spend, performance, opportunity, event, and event-supplier slices expose the active build only.
- The opportunity consumption view exposes `timing_window` so the Cube opportunity pipeline model and the refreshed L4 view contract stay aligned.
- The opportunity consumption view exposes `quality_state` so the Cube opportunity pipeline can drill on the same quality field as the Source projection.
- The runner now fails readback when Source read-model counts or consumption-view counts do not match the current build's source-table counts.

## QA / Validation

- Pass: `npx eslint scripts/data-build/refresh-source-l4-cube.ts`.
- Pass: `npm run data-build:source-l4-cube-refresh -- --out-dir /tmp/nexus-source-l4-active-read-models-local-dry-run`.
- Pass: `npm run data-build:source-l4-cube-refresh -- --out-dir /tmp/nexus-source-l4-active-readmodel-rls-local-dry-run` confirms Source read-model readback uses tenant session context for tenant-filtered views.
- Pass: `npm run release:check`.
- Pending: ACA Source L4/cube write and readback rerun using the deployed digest-pinned image.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main workflow. Then rerun the approved Source L4/cube write job so the active-build ledger and view definitions are applied, followed by a readback job that proves Source read-model and consumption counts match the current build.

## Deployment Authority

- Repo-owned deploy workflow: approved session authority.
- Shared runtime mutators: repo-owned ACA main deploy only.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: operator jobs must use the deployed digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after the refreshed views are applied and readback passes.

## Rollback Plan

Revert the PR and redeploy. If the active-build view refresh was already applied, rerun the previous Source L4/cube refresh image or restore the prior view definitions through the governed operator job path.

## Audit Evidence

- PR, merge commit, and deploy evidence to be added after merge.
- Targeted ESLint output.
- Local dry-run output.
- Release control gate output.
- Follow-up ACA Source L4/cube write and readback proof bundle.
- Follow-up signed-in Source/Home proof after cube readback passes.

## Known Gaps

This does not add new performance or sourcing-event facts. It makes those cubes explicitly current-build scoped; if the active Source L4 projector produces zero rows for those slices, zero is the expected current-build result.
