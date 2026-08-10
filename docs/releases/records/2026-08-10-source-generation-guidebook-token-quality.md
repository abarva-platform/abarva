# 2026-08-10-source-generation-guidebook-token-quality — Source Generation Prompt Quality

## Release ID

`2026-08-10-source-generation-guidebook-token-quality`

## Status

`candidate`

## Plain-English Summary

Source generated artifacts now receive the event's current-stage guidebook and next-stage guidebook as governed prompt context. This lets a generated strategy or decision artifact explain the meeting to run next, which templates to fill, what evidence owners must collect, and what approval decision that evidence supports. The early board-grade strategy artifacts also get a larger output budget so the model is not forced into a thin summary when a complete executive artifact is needed.

## Layer Impact

- `global-control-lane`: Source artifact generation is shared product behavior for all tenants, so the prompt/context contract changes globally.
- Canonical model / Source event context: generation context now carries current-stage and next-stage guidebooks resolved through the existing Source guidebook repository.
- Product / Source: generated artifact prompts can produce richer, workflow-aware guidance without adding tenant-specific logic.
- AI egress / Claude generation: d02 and d03 output budgets are raised to board-grade levels; legacy prompt aliases are not advertised as supported generation targets.

## Client Applicability

- All clients: yes, through shared Source artifact generation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/context-binder.ts`
- `src/lib/source/agent-generation/prompt-registry.ts`
- `src/lib/source/agent-generation/types.ts`
- `src/lib/source/__tests__/agent-generation-prompt-registry.test.ts`
- `src/lib/source/agent-generation/__tests__/context-binder.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/source/__tests__/agent-generation-prompt-registry.test.ts src/lib/source/agent-generation/__tests__/context-binder.test.ts --runInBand` — 12/12 passed. Existing duplicate manual mock warnings were emitted by Jest.
- Pass: `npx eslint src/lib/source/agent-generation/context-binder.ts src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/types.ts src/lib/source/__tests__/agent-generation-prompt-registry.test.ts src/lib/source/agent-generation/__tests__/context-binder.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` after moving stale local `.next` generated types aside.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through PR. The repo-owned ACA main deploy workflow builds and deploys the exact merged SHA to the shared ACA runtime. No data migration or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: required for live runtime rollout.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: standard main deploy workflow check.
- Feature/env flag update path: none.
- Live signed-in proof required: prompt contract can be proven by unit tests; generated artifact quality still requires a separate live generation smoke when the Source event gate workflow blockers are cleared.

## Rollback Plan

Revert the PR. Existing persisted artifacts remain unchanged; future generations return to the prior prompt context and token budgets.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6122
- Local QA output: focused Jest 12/12 passed; focused ESLint passed; TypeScript compile passed; `npm run release:check` passed.
- Release record: this file.

## Known Gaps

This does not resolve the live Source workflow blockers found in the browser crawl: readiness versus approval-gate mismatch, some stage uploads storing artifacts without satisfying readiness, and stage Files uploads being scoped to the currently viewed stage without an explicit stage selector.
