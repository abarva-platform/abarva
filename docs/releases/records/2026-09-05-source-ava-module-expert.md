# 2026-09-05-source-ava-module-expert — Source aVa Module Expert Packet

## Release ID

`2026-09-05-source-ava-module-expert`

## Status

`candidate`

## Plain-English Summary

This release adds the Source implementation of the shared aVa module-expert contract. Source now has a deterministic chat packet that wraps the existing Source event answer-mode classifier, mode-specific grounding, stage-gate state, citations, and quality gate behind the same interface Moves uses.

It also adds a deterministic Source guidance answer for the core eval: "Where is this event blocked and what do I do next?" The answer is built from packet stage/gate state only, names the active event and stage, cites the stage and gate evidence labels, and falls back honestly when the stage gate view was not computed.

## Layer Impact

Layer 4, Products: Source aVa control-plane code. This adds a contract/packet wrapper around already-existing Source aVa classification, mode grounding, and quality checks. It does not change tenant data, canonical models, Source read-model queries, event mutation paths, or deployed chat routing.

## Client Applicability

- All clients: yes, as shared Source product code once merged.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. The Source module contract's `shouldBuildPacket` follows the existing `source_analytics` hardening posture supplied by the caller.

## Changes Included

- `src/lib/source/ava/module-expert.ts`: Source packet builder, prompt formatter, deterministic blocked/next-action answer, and shared module-expert contract adapter.
- `src/lib/source/ava/__tests__/module-expert.test.ts`: Source module contract and eval coverage for the blocked-event guidance path.
- `src/lib/agent/module-expert-contract.ts`: widens the shared contract to allow module-specific classifier input shapes, so Source can pass `{ question, viewedStage }` while Moves keeps its string classifier.

## QA / Validation

- Pre-change baseline: `git cat-file -e HEAD:src/lib/source/ava/module-expert.ts` on the Phase 1 parent returned exit `128`, proving the Source module expert surface did not exist before this slice.
- Mutation check: removing `[G1]` from the deterministic stage-gate answer made `src/lib/source/ava/__tests__/module-expert.test.ts` fail on the gate-citation assertion.
- `npx jest src/lib/source/ava/__tests__/module-expert.test.ts src/lib/source/ava/__tests__/answer-mode.test.ts src/lib/source/ava/__tests__/mode-grounding.test.ts src/lib/source/ava/__tests__/answer-quality-gate.test.ts --runInBand`: passed, 4 suites / 112 tests.
- `npx jest src/lib/programs/ava-chat/__tests__ --runInBand`: passed, 6 suites / 46 tests.
- `npx eslint src/lib/agent/module-expert-contract.ts src/lib/source/ava/module-expert.ts src/lib/source/ava/__tests__/module-expert.test.ts`: passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`: passed.
- Broad Source aVa folder baseline: `npx jest src/lib/source/ava/__tests__ --runInBand` has 11 failures on the Phase 1 parent branch and the same 11 failures on this branch; they are outside this Source module-expert slice.

## Rollout Plan

Merge by pull request after Phase 1. No Azure Container Apps rollout, database migration, data load, feature flag update, or live route cutover is included in this release candidate.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this release does not change deployed chat routing.

## Rollback Plan

Revert the PR. The existing Source chat route keeps its current direct classifier/grounding/quality-gate path, so rollback only removes the new contract wrapper and eval.

## Audit Evidence

- Pull request for this release candidate.
- Focused Source aVa module eval, mutation check, Moves aVa regression suite, ESLint, TypeScript validation, and release gate output.

## Known Gaps

The contract is not wired into the live Source chat route yet. This release also does not build Tower, make the cross-surface router executable, promote any manual/corpus, or change tenant feature-flag applicability.
