# 2026-09-05-ava-module-routing — aVa Module Routing Contract

## Release ID

`2026-09-05-ava-module-routing`

## Status

`candidate`

## Plain-English Summary

This release makes aVa's module handoff map executable. The surface scope registry now names the surfaces each module may hand off to, and a shared router can turn Source opportunity context into a typed Moves P0 handoff payload instead of only producing guidance prose.

## Layer Impact

Release lane: `global-control-lane`.

Products: Source, Moves, Tower, Home, Intelligence, and Setup surface-scope policy gains typed handoff targets. The initial executable route is Source to Moves P0 for candidate opportunities.

Canonical Model: No change. The router consumes deterministic packet fields already built by the module experts and does not create or mutate canonical data.

## Client Applicability

- All clients: Applies once the module-router integration is called by product surfaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag in this release candidate.

## Changes Included

- `src/lib/agent/product-truth/surface-scope.ts` adds executable `handoffTargets`.
- `src/lib/agent/module-routing.ts` adds module contract lookup, route-surface resolution, and the Source-to-Moves P0 handoff payload builder.
- `src/lib/agent/__tests__/module-routing.test.ts` proves the Source-to-Moves handoff payload.
- `src/lib/source/ava/module-expert.ts` tightens the Source packet prompt citation rule for stage/gate answers.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/agent/__tests__/module-routing.test.ts src/lib/source/ava/__tests__/module-expert.test.ts src/lib/tower/ava-chat/__tests__/tower-module-expert.test.ts src/lib/programs/ava-chat/__tests__/module-expert.test.ts`
- PASS: `npx tsc --noEmit`
- PASS: `npx eslint src/lib/agent/module-routing.ts src/lib/agent/product-truth/surface-scope.ts src/lib/source/ava/module-expert.ts src/lib/agent/__tests__/module-routing.test.ts`
- PASS: mutation check by temporarily routing the Source-to-Moves handoff to the wrong target route and confirming the Phase 4 exit-criterion test failed.
- PASS: `npm run release:check`

## Rollout Plan

Merge through PR review. This is library behavior only; no route currently invokes the router, so runtime activation requires a later surface integration change.

## Deployment Authority

- Repo-owned deploy workflow: Required for any later runtime activation.
- Shared runtime mutators: None in this release.
- Approved image digest: Not applicable before merge/deploy.
- ACA runtime invariant: Not applicable before merge/deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a later route integration makes the router user-facing.

## Rollback Plan

Revert the PR. Because there are no migrations, data writes, feature flags, or runtime mutators, rollback is code-only.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7366
- Local focused tests, TypeScript, lint, and mutation check listed above.

## Known Gaps

The router is not yet wired into a live Source, Moves, Tower, or global aVa route. It builds typed handoff payloads, but no user-facing navigation or prefill consumes them yet.
