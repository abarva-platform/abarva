# 2026-09-23-moves-gate-artifact-hydration — Moves Gate Artifact Hydration

## Release ID

`2026-09-23-moves-gate-artifact-hydration`

## Status

`candidate`

## Plain-English Summary

The Moves phase gate panel now reconciles with the same generated-artifact sources that feed the authenticated Files & Evidence vault. If current generated deliverables for the active phase exist in either durable move artifacts or governed generated artifacts, the gate proof chip uses the generated-artifact count instead of showing zero evidence items.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates the Moves UI read path for the phase gate surface. No Layer 1, Layer 2, Layer 3, tenant-data, schema, or data-plane writes are included.

## Client Applicability

- All clients: Moves users see the gate proof count reconcile with current generated phase artifacts returned by the artifact vault.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a read-only artifact-vault hydration pass to the Moves phase workspace.
- Seeds the phase gate from both durable `move_artifacts` and governed `generated_artifacts`, matching the Files & Evidence vault source set.
- Merges server-preloaded generated artifacts with current client-loaded generated artifacts for the active phase.
- Keeps generated deliverables separate from source evidence; the label says generated artifacts unless linked evidence exists.
- Adds regression coverage for the live failure mode where server preload is empty but the artifact vault contains current Phase 5 generated deliverables.

## QA / Validation

- `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 78 tests.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — passed.
- `npm run typecheck` — passed.
- `npm run release:check` — passed.
- `git diff --check` — passed.
- Live proof will be recorded after merge and deploy. A first deployed pass proved the client-only hydration was insufficient when the page seed omitted generated artifacts from the older generated-artifacts registry; this follow-up reconciles that server seed with the File Cabinet source set.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned ACA main deploy workflow may rebuild and redeploy the application image after merge.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned main deploy workflow.
- Approved image digest: Captured by the repo-owned workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required if the workflow updates worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, completed Moves gate-panel smoke proof after deploy.

## Rollback Plan

Revert the pull request. The gate panel returns to server-preloaded artifact counts only.

## Audit Evidence

Pull request, CI results, deploy run, runtime invariant, and signed-in Moves gate-panel smoke proof will be linked when available.

## Known Gaps

This release does not change evidence-readiness, artifact generation, artifact storage, or Tower handoff semantics. It only reconciles the visible gate proof chip with current generated artifacts already returned by the artifact vault.
