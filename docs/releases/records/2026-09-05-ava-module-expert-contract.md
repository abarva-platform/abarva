# 2026-09-05-ava-module-expert-contract — aVa Module Expert Contract

## Release ID

`2026-09-05-ava-module-expert-contract`

## Status

`candidate`

## Plain-English Summary

This release extracts the reusable shape behind Moves aVa chat into a shared module-expert contract. The contract names the common path every module expert must eventually expose: classify the user question, decide whether a deterministic packet should be built, build that packet from already-loaded module state, format the module prompt grounding, and run the post-hoc quality gate.

Moves is adapted onto the shared contract with no intended behavior change. Existing Moves exports and route calls remain in place; the new contract delegates to the existing Moves functions rather than replacing runtime wiring.

## Layer Impact

Layer 4, Products: shared aVa control-plane code for module-scoped assistants. This changes TypeScript contracts and the Moves module adapter only; it does not change tenant data, canonical models, Source/Tower read models, retrieval, or live answer generation.

## Client Applicability

- All clients: yes, as shared product code once merged.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. Existing Moves chat hardening applicability remains controlled by `moves_ava_chat_hardening`.

## Changes Included

- `src/lib/agent/module-expert-contract.ts`: shared module-expert interfaces and small deterministic helper utilities.
- `src/lib/programs/ava-chat/module-expert.ts`: Moves adapter implementing the shared contract by delegating to existing Moves functions.
- `src/lib/programs/ava-chat/types.ts`: Moves packet now extends the shared module packet base and declares `surface: "moves"`.
- `src/lib/programs/ava-chat/packet.ts`, `answer-modes.ts`, and `quality-gate.ts`: Moves internals reuse shared helper/type surfaces without changing exported behavior.
- `src/lib/programs/ava-chat/__tests__/module-expert.test.ts`: verifies the Moves contract path delegates to the same classifier, packet builder, prompt formatter, and quality gate as the direct function path.

## QA / Validation

- `npx jest src/lib/programs/ava-chat/__tests__ --runInBand`: passed, 6 suites / 46 tests.
- `npx eslint src/lib/agent/module-expert-contract.ts src/lib/programs/ava-chat`: passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`: passed.

## Rollout Plan

Merge by pull request. No Azure Container Apps rollout, database migration, data load, feature flag update, or corpus promotion is part of this release candidate.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this release does not change runtime routing or prompt behavior.

## Rollback Plan

Revert the PR. The runtime route still imports the same Moves functions directly, so rollback only removes the shared contract and adapter surface.

## Audit Evidence

- Pull request for this release candidate.
- Focused Moves aVa suite, ESLint, and TypeScript validation listed above.

## Known Gaps

This does not build Source or Tower module experts, make `SURFACE_SCOPE_REGISTRY` executable, wire a router/handoff layer, promote a manual/corpus, or change which tenants receive Moves chat hardening.
