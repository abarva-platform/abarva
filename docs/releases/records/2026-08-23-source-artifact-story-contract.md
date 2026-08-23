# 2026-08-23-source-artifact-story-contract — Source Artifact Story Contract

## Release ID

`2026-08-23-source-artifact-story-contract`

## Status

`candidate`

## Plain-English Summary

This release adds a typed story contract for Source New Event artifacts. The contract groups the
33 canonical artifacts into six executive decision packages and marks which artifacts carry the
package narrative versus which artifacts support it as companion evidence. It is a design and prompt
governance change only; it does not regenerate artifacts, load tenant data, or change live routes.

## Layer Impact

- Release lane: `global-control-lane` because this is shared Source product prompt metadata that
  applies to all clients when consumed by a future runtime slice.
- Layer 4 Products: Source artifact generation metadata gains a governed package and role contract
  for future UI and prompt orchestration.
- Layer 3 Canonical Enterprise Model: no change.
- Layer 2 Source Adapters: no change.
- Layer 1 Client Intake: no change.

## Client Applicability

- All clients: the contract is shared Source product metadata.
- Specific clients: none.
- Internal only: release and backlog tracking.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`
- `src/lib/source/agent-generation/index.ts`
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`
- `docs/backlog/tracks/04-source-commercial/BACKLOG.md`
- `docs/releases/records/2026-08-23-source-artifact-story-contract.md`

## QA / Validation

- PASS — `npm test -- --runInBand src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`
  passed 47 tests. Existing duplicate manual mock warnings were emitted by Jest but did not fail the
  suite.
- PASS — `npx eslint src/lib/source/agent-generation/prompt-registry.ts
  src/lib/source/agent-generation/index.ts
  src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- PASS — `npm run release:check`.

## Rollout Plan

Merge to `main` through the protected PR path. The change is available to code immediately after
merge, but no live product behavior changes until a later slice consumes the contract in runtime UI
or artifact-generation orchestration.

## Deployment Authority

- Repo-owned deploy workflow: not required for behavior activation in this slice.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this release has no route or runtime behavior change.

## Rollback Plan

Revert the PR. No migration, data-plane, route, feature-flag, or runtime rollback is required.

## Audit Evidence

- Pull request and commit for this release candidate.
- Unit-test output proving story-contract coverage and prompt reachability.
- Release-check output.

## Known Gaps

- The executive-editor pass is a typed contract only. A later implementation must explicitly wire
  it into generation orchestration before claiming runtime behavior.
- This release does not change generated artifact bodies already stored for existing events.
