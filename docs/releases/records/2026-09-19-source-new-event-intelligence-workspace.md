# 2026-09-19-source-new-event-intelligence-workspace — Source New Event Intelligence Workspace

## Release ID

`2026-09-19-source-new-event-intelligence-workspace`

## Status

`candidate`

## Plain-English Summary

Source New now has an Intelligence workspace for each event. The view explains the resolved sourcing archetype, the evidence required for the current stage, which current artifacts survived the governed context bundle, explicit gaps/refusals, registered industry-intelligence requirements, and one next question/action for the operator.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source New adds a read-only event intelligence projection in the existing workspace.

Layer 3 Canonical Enterprise Model: No canonical data, schema, migration, or tenant records change. The view reads existing event/artifact metadata and governance contracts only.

## Client Applicability

- All clients: yes, for tenants already authorized to open Source New event pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added `src/lib/source/new-workspace/event-intelligence.ts`.
- Wired the Source New event page to build and pass the read-only intelligence packet.
- Updated `SourceNewWorkspace` to render the Intelligence workspace.
- Added focused behavior tests for the projection and UI rendering.

## QA / Validation

- PASS: `npx jest src/lib/source/new-workspace/event-intelligence.test.ts src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand` (31 tests)
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npx eslint src/` (0 errors; existing warnings remain)
- PASS: `npm run release:check`


## Rollout Plan

Merge through a PR to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the resulting image. No data-build job, migration, feature flag, tenant-data write, email action, or signed-in mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: must be read back after deploy.
- Worker image invariant: must be read back after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not claimed by this release record; browser acceptance remains separate.

## Rollback Plan

Revert the PR and let the repo-owned deploy workflow publish the prior behavior. No database rollback is required.

## Audit Evidence

Before release, inspect the PR diff, the focused Jest output, TypeScript output, ESLint output, release-check output, CI status, and post-merge ACA runtime invariant readback.

## Known Gaps

The workspace does not display benchmark values, make recommendations, contact vendors, send email, advance stages, write tenant data, or claim signed-in/live acceptance.
