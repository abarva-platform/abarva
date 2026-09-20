# 2026-09-20-source-workspace-performance-proof — Signed-in Source performance contract

## Release ID

`2026-09-20-source-workspace-performance-proof`

## Status

`candidate`

## Plain-English Summary

Adds one repeatable browser proof for Source workspace performance. The proof measures cold and warm loads for the five canonical `/source` workspace states, waits for the governed evidence layer, verifies charts and navigation are usable, records payload and Source API request counts, and names the slowest browser dependency. It refuses to run without a non-expired signed-in Clerk session.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: adds a read-only Source quality contract and browser proof harness. It does not change product data, calculations, UI behavior, or tenancy.
- Release controls: adds behavior tests for the performance budgets, authentication requirement, chart readiness, interaction readiness, and evidence boundary.

## Client Applicability

- All clients: the proof contract can evaluate any authorized Source session.
- Specific clients: none.
- Internal only: the command is an operator QA tool.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/qa/workspace-performance-contract.ts`
- `scripts/qa/source-workspace-performance-proof.ts`
- `src/__tests__/behaviors/source-workspace-performance-contract.test.ts`
- `npm run qa:source-workspace-performance`

## QA / Validation

- Behavior contract: 5 tests pass.
- Missing storage state: command exits non-zero and states that unauthenticated timing is not proof.
- Help contract: command documents the signed-in input and all measured routes.
- TypeScript: clean.
- Scoped ESLint: clean.
- Full behavior suite: pending final pre-PR readback.
- Signed-in browser run: intentionally not performed in this release candidate; it remains required before any deployment is called performance-proven.

## Rollout Plan

Squash-merge through the protected repository. The repo-owned ACA workflow may deploy the code with the next main image, but the new command is inert until an operator invokes it with a signed-in storage state.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the repo-owned deploy workflow.
- ACA runtime invariant: required after deployment before recording `deployed`.
- Worker image invariant: required after deployment because the shared image is used by workers.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, to close the Source performance acceptance item; merge and deployment alone do not satisfy it.

## Rollback Plan

Revert the squash merge. No schema, data, environment, traffic, or feature-flag rollback is required.

## Audit Evidence

- Behavior test output for the evaluator.
- TypeScript, ESLint, release-control, and behavior-suite output attached to the PR.
- A future operator proof bundle containing `summary.json`, `report.md`, and cold/warm screenshots for each route.

## Known Gaps

- The browser can count Source API requests, but it cannot claim a database query count unless the server exposes query metrics through `Server-Timing`. The report labels this boundary explicitly.
- Signed-in measurements against a named deployment and dataset version remain outstanding.
