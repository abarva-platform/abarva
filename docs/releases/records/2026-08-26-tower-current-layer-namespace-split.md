# 2026-08-26-tower-current-layer-namespace-split — Tower Current Layer Namespace Split

## Release ID

`2026-08-26-tower-current-layer-namespace-split`

## Status

`candidate`

## Plain-English Summary

Moves Tower current-layer helper code and TypeScript contracts into the `src/lib/tower` namespace so active Tower and Atlas routes no longer import retired Tower namespace files for formatting, tenant aliases, answer payloads, or view-model types.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 product runtime. This change does not alter the Tower data source or mutate any data. It removes active runtime coupling to retired namespace modules while preserving the existing current-layer read path.

## Client Applicability

- All clients: Tower and Atlas runtime imports use the current Tower namespace.
- Specific clients: None.
- Internal only: Supports governed legacy-retirement readiness.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added Tower-native current-layer contracts and helper modules under `src/lib/tower`.
- Repointed Tower ask/chat, Tower command center, Tower chart, and Atlas Tower imports away from `@/lib/cio-tower` where the dependency was only formatting, tenant aliasing, answer shape, visual contract, or TypeScript view-model shape.
- No schema, migration, data-load, or provider-default change is included.

## QA / Validation

- PASS: `npx eslint` on the changed Tower, Atlas, route, and new helper files.
- PASS: `npm run test -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts src/lib/tower/command-center/__tests__/derive.test.ts src/lib/tower/command-center/__tests__/view-model.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`

## Rollout Plan

Merge through pull request. Runtime activation uses the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required for live runtime uptake.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live runtime state.
- Worker image invariant: Required after deploy by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Tower route smoke after deploy.

## Rollback Plan

Revert the pull request to restore the previous import paths. No data rollback is required.

## Audit Evidence

PR, local lint/typecheck/test output, ACA deploy workflow run, runtime invariant output, and Tower route smoke output.

## Known Gaps

This does not retire legacy Tower schemas by itself. It reduces active runtime references so the next governed retirement dry-run can classify what remains.
