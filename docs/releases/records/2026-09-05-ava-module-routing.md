# 2026-09-05-ava-module-routing — aVa Module Routing Contract

## Release ID

`2026-09-05-ava-module-routing`

## Status

`candidate`

## Plain-English Summary

This release makes aVa's module handoff map executable and adds the generated Nexus manual/aVa training guide that reads the same execution contracts. The Source NDJSON ask route can now emit a structured Source-to-Moves P0 handoff payload when both governing flags are enabled, and Tower figure checks use normalized deterministic fingerprints. Moves aVa hardening remains tenant-scoped until signed-in tenant proof supports platform promotion.

## Layer Impact

Release lane: `global-control-lane`.

Products: Source, Moves, Tower, Home, Intelligence, and Setup surface-scope policy gains typed handoff targets. The initial runtime integration is Source to Moves P0 for candidate opportunities in the Source NDJSON ask response. The generated manual covers routes, flags, capabilities, answer modes, surface scopes, Source stages, and Moves phase packs.

Canonical Model: No change. The router consumes deterministic packet fields already built by the module experts and does not create or mutate canonical data.

## Client Applicability

- All clients: The manual generator, consistency gate, and route code apply after merge/deploy. Source handoff emission is limited to the opt-in NDJSON branch and still requires Source analytics plus Moves hardening.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_ava_chat_hardening` remains tenant-default with the existing enrolled tenants. `source_analytics` remains a platform prerequisite for Source runtime handoff emission.

## Changes Included

- `src/lib/agent/product-truth/surface-scope.ts` adds executable `handoffTargets`.
- `src/lib/agent/module-routing.ts` adds module contract lookup, route-surface resolution, and the Source-to-Moves P0 handoff payload builder.
- `scripts/docs/build-nexus-manual.ts` generates `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` from executable registries and fails on freshness or cross-source vocabulary inconsistency.
- `scripts/release-control/check-nexus-manual-spine.mjs` wires the generated manual check into `npm run release:check`.
- `src/lib/source/ava/module-handoff-runtime.ts` builds a Source-to-Moves runtime handoff from loaded event state behind `source_analytics` and `moves_ava_chat_hardening`.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` emits `type: "module-handoff"` only in the NDJSON response path.
- `src/lib/tower/ava-chat/*` normalizes deterministic display figures into fingerprints so Tower can accept equivalent restatements while rejecting unpublished nearby values.
- `src/lib/features/registry.ts` keeps `moves_ava_chat_hardening` tenant-scoped and records that platform promotion still requires signed-in tenant proof.
- `src/lib/agent/__tests__/module-routing.test.ts` proves the Source-to-Moves handoff payload.
- `src/lib/source/ava/module-expert.ts` tightens the Source packet prompt citation rule for stage/gate answers.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/agent/__tests__/module-routing.test.ts src/lib/source/ava/__tests__/module-expert.test.ts src/lib/source/ava/__tests__/module-handoff-runtime.test.ts src/lib/tower/ava-chat/__tests__/tower-module-expert.test.ts src/lib/programs/ava-chat/__tests__/module-expert.test.ts src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/features/__tests__/is-feature-enabled.test.ts src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts src/lib/intelligence/ask/__tests__/moves-phase-name-sync.test.ts src/lib/source/__tests__/source-stage-namespace-collision.test.ts`
- PASS: `npm run docs:nexus-manual:check`
- PASS: `npx tsc --noEmit`
- PASS: `npx eslint scripts/docs/build-nexus-manual.ts src/lib/source/ava/module-handoff-runtime.ts src/lib/source/ava/__tests__/module-handoff-runtime.test.ts src/lib/features/registry.ts src/lib/features/__tests__/is-feature-enabled.test.ts src/app/api/v1/source/[eventId]/nexus/ask/route.ts src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts src/app/api/chat/agent/route.ts src/lib/tower/ava-chat/types.ts src/lib/tower/ava-chat/packet.ts src/lib/tower/ava-chat/quality-gate.ts src/lib/tower/ava-chat/__tests__/tower-module-expert.test.ts`
- PASS: mutation check by temporarily routing the Source-to-Moves handoff to the wrong target route and confirming the Phase 4 exit-criterion test failed.
- PASS: mutation check by changing an answer-contract phase label to the old wording and confirming `npm run docs:nexus-manual:check` failed with the mismatched phase.
- PASS: mutation check by weakening the Source runtime handoff flag gate and confirming the runtime handoff test failed.
- PASS: mutation check by removing Tower normalized figure fingerprints and confirming the Tower packet/quality tests failed.
- PASS: `npm run release:check`

## Rollout Plan

Merge through PR review and deploy through the repo-owned ACA workflow. Runtime handoff emission is additive and only appears for callers explicitly requesting `application/x-ndjson`; the default JSON Source ask response remains unchanged.

## Deployment Authority

- Repo-owned deploy workflow: Required for any later runtime activation.
- Shared runtime mutators: None in this release.
- Approved image digest: Not applicable before merge/deploy.
- ACA runtime invariant: Not applicable before merge/deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: `moves_ava_chat_hardening` remains tenant-scoped through the existing include-list and environment override path.
- Live signed-in proof required: Required after merge/deploy before claiming the Source-to-Moves handoff is live-proven in the product UI.

## Rollback Plan

Revert the PR for full rollback. For a narrower rollback, remove tenants from `moves_ava_chat_hardening` or disable the NDJSON caller path; there are no migrations or data writes.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7366
- Local focused tests, TypeScript, lint, generated-manual check, release check, and mutation checks listed above.

## Known Gaps

The generated manual is not promoted to an agent-usable corpus yet. It still requires a governance dataset manifest, policy validation, indexing, retrieval proof, and cite-render proof before aVa can use it as retrieved training context. The Source-to-Moves payload is emitted by the route but no client UI currently consumes it for navigation or prefill. Moves aVa hardening still needs signed-in proof on its enrolled tenants before a platform-default promotion.
