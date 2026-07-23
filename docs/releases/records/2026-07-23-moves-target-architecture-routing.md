# 2026-07-23-moves-target-architecture-routing — Moves Target Architecture Routing

## Release ID

`2026-07-23-moves-target-architecture-routing`

## Status

`candidate`

## Plain-English Summary

Moves P3 Target State Architecture generation now routes through the exact
canonical architecture artifact key. The phase registry, brief library, quality
bar, and evidence policies all use `target_state_architecture`; the orchestrated
phase router was still translating that artifact to the legacy alias
`target_architecture`. That alias could bypass the structure-backed architecture
brief and artifact-specific quality band, causing P3 architecture outputs to be
less controlled than intended.

## Layer Impact

- `global-control-lane`: shared Moves deliverable-routing behavior changes for
  all tenants using the governed phase deliverable orchestrator.
- No schema, migration, tenant-data, candidate-promotion, or ingestion behavior
  changes.

## Client Applicability

- All clients: yes, for Moves P3 Target State Architecture generation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this is a canonical routing correction.

## Changes Included

- `src/lib/programs/orchestrated-deliverable-map.ts`
  - Routes `target_state_architecture` to the same canonical
    `target_state_architecture` orchestrator key.
  - Updates the local structure-key comment to avoid reintroducing the legacy
    alias.
- `src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts`
  - Adds a regression test proving P3 Target State Architecture uses the exact
    canonical key.
  - Adds a broader tripwire proving every active P1-P5 canonical Moves
    deliverable avoids the generic quality fallback.

## QA / Validation

- Focused Jest:
  `npx jest src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts --runInBand`
  - Passed locally: 3 suites, 40 tests.
  - Known pre-existing warning: duplicate Jest manual mock names.
- Full validation pending before release:
  - ESLint on changed files.
  - TypeScript with increased heap.
  - `npm run release:check`.
  - `git diff --check`.

## Rollout Plan

Open a PR against `main`, merge through GitHub, and deploy through the
repo-owned Azure Container Apps main workflow. Verify the ACA runtime invariant
after deployment before calling the change live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: pending.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no irreversible user action is required for
  this routing correction; runtime invariant plus tests are sufficient unless a
  later sandbox P3 regeneration is run.

## Rollback Plan

Revert the PR to restore the prior legacy alias mapping. No data rollback is
required because the change affects future generation routing only.

## Audit Evidence

- PR URL: pending.
- Merge SHA: pending.
- ACA deploy workflow: pending.
- Focused Jest result: passed locally in
  `/private/tmp/nexus-moves-profile-sweep`.

## Known Gaps

- This release corrects Target State Architecture routing; it does not regenerate
  previously created architecture documents.
