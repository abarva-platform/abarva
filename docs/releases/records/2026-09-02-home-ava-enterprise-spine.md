# 2026-09-02-home-ava-enterprise-spine - Home aVa Enterprise Context Spine

## Release ID

`2026-09-02-home-ava-enterprise-spine`

## Status

`candidate`

## Plain-English Summary

Home aVa now receives the enterprise as a connected record when answering from
the Home preview bundle. The current chapter is still passed as the user's focus,
but it no longer filters away other chapter claims or supporting record
summaries. A technology, data, vendor, risk, value, strategy, operating-model or
leadership question can therefore draw on material cross-domain context when the
answer needs it.

This fixes the Home aVa context-scope defect. It does not prove full enterprise
source intelligence coverage.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical model, schema, loader
  or data-plane state changes.
- **Layer 4 / products:** Home preview aVa context assembly and prompt discipline.
  The response packet and deterministic visual dataset contract are unchanged.

## Client Applicability

- All clients using the Home preview aVa answer path.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/home/preview/ava-answer.ts` now builds an enterprise context spine,
  adds question-domain planning metadata, sends all chapters on every question,
  and marks the active chapter as focus rather than scope. The prompt states
  that spine record summaries are orientation/routing context unless they point
  to cited claim tags; tagged chapter claims remain the factual answer material,
  and deterministic datasets remain quantitative exhibit material.
- `src/lib/home/preview/__tests__/ava-answer.test.ts` covers cross-chapter
  citation availability and the enterprise-spine prompt payload.

## QA / Validation

- `NODE_PATH=/Users/anand/Projects/nexus/node_modules /Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/home/preview/__tests__/ava-answer.test.ts --runInBand` - passed, 9 of 9.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules /Users/anand/Projects/nexus/node_modules/.bin/eslint src/lib/home/preview/ava-answer.ts src/lib/home/preview/__tests__/ava-answer.test.ts` - passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` - passed.
- `git diff --check` - passed.

## Rollout Plan

Open a PR, merge to `main` after checks pass, and let the repo-owned Azure
Container Apps main deploy workflow build and promote the image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment if the deploy workflow updates
  workers.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Home aVa behavior.

## Rollback Plan

Revert the context assembly and prompt change, then deploy through the same
repo-owned main workflow. No data rollback is required.

## Audit Evidence

- PR URL after creation.
- Focused Home aVa test output.
- GitHub checks after PR creation.
- Signed-in Home aVa question proof after deployment.

## Known Gaps

This does not add external retrieval, write a persistent source-intelligence
spine, expose every underlying source-intelligence file, add graph artifacts to
Home aVa, or repair serving-projection availability. It makes the existing Home
preview aVa path use the full preview bundle more holistically while preserving
the deterministic citation and visual fences.
