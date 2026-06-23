# 2026-06-23-moves-deliverable-type-self-heal — Moves Deliverable Type Registry Self-Heal

## Release ID

`2026-06-23-moves-deliverable-type-self-heal`

## Status

`candidate`

## Plain-English Summary

The live Meridian target architecture generation reached persistence but failed because the data plane was missing a `deliverable_types` registry row for the generated artifact key. This release makes the shared Moves draft writer idempotently upsert the deliverable type before writing `deliverables_v2`, so canonical generated artifacts do not depend on a manually pre-seeded registry row.

## Layer Impact

`global-control-lane`: shared Moves/programs write adapter behavior for generated deliverables.

`client-data-lane`: writes an idempotent `deliverable_types` registry row in the client data plane when a generated deliverable is drafted.

## Client Applicability

- All clients: applies to generated Moves deliverables persisted through `draftModuleDeliverable`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/data-plane/write-adapters/programsWriteAdapter.ts`
- `src/lib/data-plane/write-adapters/__tests__/slice-3f-shared-helper-write-adapters.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/data-plane/write-adapters/__tests__/slice-3f-shared-helper-write-adapters.test.ts src/lib/deliverables/__tests__/generate-artifact.test.ts src/lib/deliverables/__tests__/golden-bar.test.ts --runInBand`
- PENDING: touched-file ESLint
- PENDING: TypeScript `tsc --noEmit`
- PENDING: `npm run audit:control-plane-purity:check`
- PENDING: `npm run release:check -- --base origin/main --head HEAD`
- PENDING: ACA deploy and live Meridian P3 architecture retry

## Rollout Plan

Merge to `main`, deploy through the repo-owned `aca-main-deploy` workflow, then live-verify target architecture generation on the Meridian move.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps deployment and idempotent client data-plane registry writes
- Approved image digest: PENDING deploy
- ACA runtime invariant: `app.abarva.ai` must serve the new ACA revision at 100% traffic
- Worker image invariant: no worker-specific code path changed beyond the shared image
- Feature/env flag update path: none
- Live signed-in proof required: agent-meridian target architecture generation persists successfully and passes golden bar

## Rollback Plan

Revert this release commit and redeploy the previous ACA digest through the same ACA workflow. Registry rows written by this change are harmless canonical metadata and do not require rollback.

## Audit Evidence

PR, CI, deploy run, active ACA revision/digest, and live Meridian artifact IDs will be added after release.

## Known Gaps

This release does not backfill every historical `deliverable_types` row in advance. It self-heals at write time for generated Moves drafts. Existing unrelated data-plane registry drift can still exist until the affected artifact is drafted or an explicit backfill is run.
