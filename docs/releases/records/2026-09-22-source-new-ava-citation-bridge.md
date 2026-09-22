# 2026-09-22-source-new-ava-citation-bridge — Source New aVa Citation Bridge

## Release ID

`2026-09-22-source-new-ava-citation-bridge`

## Status

`candidate`

## Plain-English Summary

Source New now preserves governed aVa answer citations when a settled Source ask turn is rendered through the shared AgentDock. The answer renderer can show the existing evidence basis and suppress the citation-gap warning only when the route already returned real AvaAnswerPacket citations.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: changes only the Source New client adapter from shared page-state conversation turns to AgentDock chat turns.
- Layer 3, Canonical Model: no canonical records, registry rows, or evidence states are changed.

## Client Applicability

- All clients: yes, for users opening Source New event workspaces with governed aVa answers.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Preserve `AvaAnswerPacket` on settled Source New aVa turns.
- Convert existing packet citations into AgentDock `AskSource` evidence entries using the established tenant/graph/pattern/worldview mapping.
- Add a regression proving governed packet citations reach AgentDock as both structured answer content and visible evidence basis.

## QA / Validation

- PASSED: red-first focused Jest test failed before the bridge because the settled turn had no `agentAnswer` or citations.
- PASSED: focused Jest test after the bridge.
- PASSED: full `SourceNewWorkspace.test.tsx` suite.
- PASSED: mutation check removing the citation handoff; the focused test failed because `turn.citations` was undefined.
- PASSED: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- PASSED: scoped ESLint for the Source New workspace component and test.
- PASSED: `git diff --check`.
- PASSED: `npm run release:check`.
- Pending: PR checks.

## Rollout Plan

Squash merge to `main`; the repo-owned Azure Container Apps workflow builds and deploys the exact merged revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on a Source New governed aVa answer that carries citations.

## Rollback Plan

Revert the squash commit and allow the repo-owned deployment workflow to restore the prior client adapter. No data rollback is required.

## Audit Evidence

- Focused and full Source New workspace test output.
- Mutation proof output.
- Pull request checks and squash commit.
- Repo-owned deployment runtime-invariant artifact after merge.
- Signed-in Source New readback after deployment.

## Known Gaps

This release does not create citations for uncited answers and does not change the Source ask route, artifact registry, parser, indexing, graph projection, or governance policy.
