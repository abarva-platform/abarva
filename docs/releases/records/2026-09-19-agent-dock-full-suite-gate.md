# 2026-09-19-agent-dock-full-suite-gate — Close The AgentDock Test Exemption

## Release ID

`2026-09-19-agent-dock-full-suite-gate`

## Status

`candidate`

## Plain-English Summary

The shared agent dock test suite had two current failures and a CI workaround that ran only two named assertions. This closes that standing exemption. The mode picker now exposes the already-declared `pin-top` mode, the stale structured-artifact assertion now matches the dock's current visible output, and the AI surface control catalog runs the full AgentDock suite instead of a name-filtered slice.

## Layer Impact

`global-control-lane`, Layer 4 product UI and CI coverage. The product behavior change is limited to restoring the existing `pin-top` dock mode control in the picker. No tenant data, canonical objects, schema, retrieval policy, model prompt, or data-plane adapter changed.

## Client Applicability

- All clients: yes, for surfaces using the shared agent dock.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: adds the visible `pin-top` picker button for the already-supported and persistable dock mode.
- `src/components/agent/__tests__/AgentDock.test.tsx`: updates the structured-artifact assertion to the current visible output contract.
- `docs/security/ai-surface-control-catalog.json`: removes the obsolete name-filter declaration from the AgentDock controls.
- `.github/workflows/ai-surface-control-catalog.yml`: runs the full AgentDock suite instead of the former two-test name filter.

## QA / Validation

- Baseline on clean `origin/main`: `npx jest --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx --runInBand` failed 2 tests and passed 59.
- After fix: same command passed 61 of 61 tests.
- Focused AgentDock/aVa render checks: `npx jest --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx src/components/agent/__tests__/AgentDock.structured-parts.test.tsx --runInBand` passed 63 of 63 tests.
- Source/aVa-adjacent render checks: `npx jest --runTestsByPath src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/source/canvas/__tests__/AvaBottomBar.test.tsx --runInBand` passed 17 of 17 tests.
- AI surface control catalog: `npm run audit:ai-surface-controls` passed and reports the AgentDock controls through the full suite with no name filter.
- TypeScript: after deleting `tsconfig.tsbuildinfo`, `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exited 0.
- ESLint: `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/agent/__tests__/AgentDock.structured-parts.test.tsx` exited 0 with one pre-existing hook-dependency warning in `AgentDock.tsx`.
- Release control: `node scripts/release-check.mjs --base origin/main --head HEAD` exited 0.
- Diff hygiene and public-additions scan passed.
- Mutation check: temporarily removing the restored `pin-top` picker button failed `mode picker › switches modes and persists each choice`.
- Mutation check: temporarily disabling dock artifact rendering failed `thread render › renders Intelligence structured artifacts in the dock once a governed packet arrives`.

## Rollout Plan

Squash-merge through the protected main branch. The workflow change affects pull-request CI immediately after merge; the product UI change rides the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Required before calling the product UI change deployed.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before calling the restored picker affordance live-proven.

## Rollback Plan

Revert this PR through the protected main branch. No data rollback is needed. The prior CI workaround can be restored by reverting the workflow hunk, but that would reopen the named T-015 exemption.

## Audit Evidence

Inspect the PR, this release record, the local before/after AgentDock suite output, both mutation outputs, and the AI surface control catalog workflow run after merge.

## Known Gaps

No signed-in browser proof is claimed. The release only closes the AgentDock full-suite exemption; broader test-scope widening remains governed by the separate CI coverage backlog.
