# 2026-07-01-v6-module-answer-contracts — V6 Module Answer Contracts

## Release ID

`2026-07-01-v6-module-answer-contracts`

## Status

`candidate`

## Plain-English Summary

Adds a shared V6 answer contract for Tower, Intelligence, Source, and Moves. The contract makes Claude responsible for every user-visible answer word and tab payload, while the app/API/renderer are restricted to placement and validation. This is intended to prevent older semantic layers, API fallbacks, or UI renderers from rewriting, replacing, or silently improving the model answer.

## Layer Impact

- `global-control-lane`: Adds shared prompt/trace/validation utilities for all module answer surfaces.
- Runtime answer path: Tower now records the V6 packet contract and visible-output audit with answer traces; Tower also explicitly enforces that Tower owns numbers, Claude owns narrative, and the renderer owns presentation. Source and Moves add V6 packet blocks to synthesis prompts and version their synthesis cache by contract version.
- Intelligence synthesis: Explicit visual asks now fail validation when Claude does not produce the required visible tab payload instead of allowing API-generated fallback tables.

## Client Applicability

- All clients: Applies to shared Tower, Intelligence, Source, and Moves answer/synthesis flows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new feature flag.

## Changes Included

- New shared contract module: `src/lib/agent/module-v6-answer-contract.ts`.
- New contract tests: `src/lib/agent/__tests__/module-v6-answer-contract.test.ts`.
- Tower contract wiring: `src/lib/cio-tower/answer.ts`, `src/app/api/tower/cio-chat/route.ts`.
- Intelligence advisory packet wiring: `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`.
- Source vendor/commercial packet wiring: `src/app/api/source/synthesis/route.ts`.
- Moves execution/sequence packet wiring: `src/app/api/programs/synthesis/route.ts`.
- Updated Intelligence and Tower focused tests.

## QA / Validation

- Passed: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/agent/__tests__/module-v6-answer-contract.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/app/api/programs/synthesis/__tests__/route.test.ts src/lib/reasoning/__tests__/e2e-smoke.test.ts --runInBand`
- Result: 6 test suites passed, 42 tests passed.
- Passed: `npm run release:check`
- TypeScript command run: `NODE_OPTIONS='--max-old-space-size=8192' /Users/anand/Projects/nexus/node_modules/.bin/tsc --noEmit --pretty false --incremental false`
- TypeScript result: no new V6 contract errors found; full typecheck is blocked by existing missing dependency typings/packages for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image from the merge SHA through the repo-owned ACA deploy workflow, deploy to `ca-abarva-web-lab-eastus`, move 100% traffic to the healthy revision, and run signed-in smoke checks for Tower, Intelligence, Source, and Moves.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow for `app.abarva.ai`.
- Shared runtime mutators: None in this slice.
- Approved image digest: To be recorded by deployment workflow.
- ACA runtime invariant: `app.abarva.ai` must run the image built from the merge SHA.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before claiming production-ready.

## Rollback Plan

Revert the merge commit and redeploy the previous healthy ACA image. No database migration or data rollback is required.

## Audit Evidence

- Focused Jest output from the command listed above.
- Future PR, CI, ACA revision, and signed-in smoke output should be attached before marking released.

## Known Gaps

- Not yet deployed.
- Signed-in browser/runtime proof has not been run for this candidate.
- Full TypeScript remains blocked by the existing missing dependency typing/package baseline listed above.
