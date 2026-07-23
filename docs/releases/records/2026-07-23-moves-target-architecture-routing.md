# 2026-07-23-moves-target-architecture-routing — Moves Target Architecture Routing

## Release ID

`2026-07-23-moves-target-architecture-routing`

## Status

`released`

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
- ESLint:
  `npx eslint src/lib/programs/orchestrated-deliverable-map.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts`
  - Passed locally and in GitHub PR checks.
- TypeScript:
  `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  - Passed locally and in GitHub PR checks.
- Release gate:
  `npm run release:check`
  - Passed locally and in GitHub PR checks.
- Diff hygiene:
  `git diff --check`
  - Passed locally.
- GitHub PR checks:
  - Passed on PR #5518, including release control, typecheck, ESLint, browser
    matrix, Lighthouse, production readiness, and hygiene.

## Rollout Plan

Merged through PR #5518 to `main`. The repo-owned ACA main deploy workflow built
and deployed the new image. Runtime invariant was verified after deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest:
  `sha256:e98af6581c10c62644c3d8f54c8a9e66ca398b7f5dcc302b3a6d29f976e4d714`
- ACA runtime invariant: passed; template image and 100%-traffic revision match
  the approved digest.
- Worker image invariant: passed for `job-abarva-deliv-worker` and
  `job-abarva-deliv-worker-event`; both use the approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no irreversible user action is required for
  this routing correction; runtime invariant plus tests are sufficient unless a
  later sandbox P3 regeneration is run.

## Rollback Plan

Revert the PR to restore the prior legacy alias mapping. No data rollback is
required because the change affects future generation routing only.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5518
- Merge SHA: `8083a5177082b2916736ed38c0ee15c205d514c5`
- ACA deploy workflow:
  https://github.com/abarva-platform/abarva/actions/runs/30046554478
- ACA revision: `ca-abarva-web-lab-eastus--m8083a517`
- Production health endpoint: `https://app.abarva.ai/api/health` returned
  `{ "ok": true }` with Postgres and Azure graph checks healthy.
- Focused Jest result: passed locally in
  `/private/tmp/nexus-moves-profile-sweep`.

## Known Gaps

- This release corrects Target State Architecture routing; it does not regenerate
  previously created architecture documents.
