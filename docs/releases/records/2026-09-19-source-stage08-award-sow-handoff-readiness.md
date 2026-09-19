# 2026-09-19-source-stage08-award-sow-handoff-readiness — Source Stage 08 Award & SOW Handoff Readiness

## Release ID

`2026-09-19-source-stage08-award-sow-handoff-readiness`

## Status

`candidate`

## Plain-English Summary

Source now has a read-only Stage 08 Award & SOW handoff-readiness surface in the active Transition workspace. It separates candidate selection, approval readiness, executed agreement/SOW readiness, and Contract 360 handoff readiness without creating awards, approvals, contracts, SOWs, schema, migrations, or tenant data.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: adds deterministic Source presentation and view-model logic over existing event stages, gates, and artifact status. No Layer 1 intake, Layer 2 adapter, or Layer 3 canonical state is changed.

## Client Applicability

- All clients: Source users viewing events at the Transition / contract mobilization stage receive the read-only readiness panel.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `src/lib/source/award-sow-handoff-readiness.ts` and typed readiness output.
- Adds `src/components/source/SourceAwardSowHandoffReadinessPanel.tsx`.
- Wires the panel into the routed Source analytics canvas only for the Transition stage; the tenant-scoped event route builds its deterministic input from the event record.
- Adds focused integration coverage for model behavior and panel rendering.

## QA / Validation

- `npx jest --runTestsByPath src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts --runInBand` — passed, 7 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — passed. The default heap run exhausted memory before diagnostics.
- `npx eslint src/` — passed with 0 errors and the existing warning baseline.
- `node scripts/audit/route-reachability-check.mjs` — passed with no new unreachable components.
- `npm run release:check` — passed.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. No manual Azure mutation, data-plane job, migration, feature flag, or traffic command is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify after deployment that template image and 100% traffic revision image match the approved digest.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not claimed by this release record.

## Rollback Plan

Revert the PR or deploy the previous known-good main image through the repo-owned workflow. Since this is Layer 4 presentation/model code only, there is no migration or data rollback.

## Audit Evidence

PR URL, CI results, merge commit, repo-owned ACA deploy workflow run, and post-deploy runtime digest invariant output.

## Known Gaps

No signed-in product proof is claimed here. Contract 360 write-through, award creation, approval creation, and canonical contract/SOW creation remain out of scope.
