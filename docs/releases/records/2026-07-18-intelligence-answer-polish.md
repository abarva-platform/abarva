# 2026-07-18-intelligence-answer-polish — Intelligence Answer Polish

## Release ID

`2026-07-18-intelligence-answer-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens the live Intelligence aVa answer experience after production proof showed two visible quality gaps: repeated evidence-boundary language in chat and a missing AbarVa module path for “what should we do with…” strategy questions. aVa still reasons with Claude, but the product now guarantees the concise AbarVa operating path when a user is asking what to do next with an AI/business bet.

## Layer Impact

- Release lane: `global-control-lane`.
- Intelligence answer policy: expands strategy-mode detection for “what should we do with/about/for…” and “what would AbarVa do next…” questions.
- CXO answer-mode registry: adds a deterministic one-sentence AbarVa surface plan when Claude omits the required product path.
- Shared chat/render layer: collapses duplicate Evidence boundary paragraphs before chat/export rendering.

## Client Applicability

- All clients: Yes, applies to shared Intelligence aVa chat rendering and strategy-mode answers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/ask/answer-mode-registry.ts`
- `src/components/agent/AgentDock.tsx`
- `src/lib/ava-answer/render-layer-shaper.ts`
- Focused regression tests for answer-mode classification, fallback surface path, and duplicate Evidence boundary cleanup.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/answer-mode-registry.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts src/lib/ava-answer/render-layer-shaper.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts src/components/agent/AgentDock.tsx`
- Pass: `npm run release:check`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 /Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/typescript/bin/tsc --noEmit`
- Not run: live signed-in production proof, pending merge and ACA deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the image to the shared lab/product web runtime. No data migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: assigned by ACA main deploy after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: no worker change expected
- Feature/env flag update path: none
- Live signed-in proof required: yes, Intelligence chat prompt for Healthcare Demo agent assist

## Rollback Plan

Revert this PR. The prior answer policy and render behavior will return on the next ACA main deployment. No schema or data rollback is required.

## Audit Evidence

- PR URL: pending
- Local proof baseline: `/Users/anand/Downloads/intelligence-agent-assist-context-proof-2026-07-18`
- Live proof after deployment: pending

## Known Gaps

- The Intelligence right-side canvas is still deterministic/static and does not yet regenerate from each chat turn.
- Live production acceptance is pending merge and ACA deployment.
