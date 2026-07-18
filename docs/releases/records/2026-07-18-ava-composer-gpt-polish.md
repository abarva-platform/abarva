# 2026-07-18-ava-composer-gpt-polish — GPT-Like aVa Composer Polish

## Release ID

`2026-07-18-ava-composer-gpt-polish`

## Status

`candidate`

## Plain-English Summary

This release polishes the aVa composer so it feels closer to a modern GPT-style chat input: a unified rounded input bar, a plus attachment control, a visible "aVa can make mistakes" disclaimer, and a simpler `Ask aVa` placeholder. It also keeps suggested follow-up questions from being squeezed under the sticky composer after long answers.

## Layer Impact

- `global-control-lane`: Updates the shared `AgentDock` composer chrome used by aVa chat surfaces.
- `global-control-lane`: Updates the Intelligence page placeholder only; answer generation, prompt construction, tenant context, exports, and retrieval are unchanged.

## Client Applicability

- All clients: Shared aVa chat surfaces get the composer chrome/disclaimer/follow-up spacing improvements.
- Specific clients: Intelligence gets the simplified `Ask aVa` placeholder.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: Adds the disclaimer, changes the attachment affordance to a plus button that still triggers the hidden file input, raises/restyles the composer as one rounded input bar, and prevents follow-up cards from shrinking under the composer.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`: Uses `Ask aVa` as the Intelligence composer placeholder.
- `src/components/agent/__tests__/AgentDock.test.tsx`: Adds regression coverage for the disclaimer, plus attachment wiring, rounded composer styling, sticky offset, and follow-up bounds.

## QA / Validation

- Focused layout/composer regression: `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand --runTestsByPath -t "bounds long suggested|GPT-like composer|raised rounded input bar|composer sticky"` passed.
- Full validation and live signed-in proof are required before marking released.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main lane, assign 100% traffic to the healthy revision, then verify the live signed-in Intelligence composer shows the disclaimer, `Ask aVa` placeholder, plus attachment button, visible follow-up questions, and reachable input at a laptop viewport.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, on `https://app.abarva.ai/intelligence`.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA image through the normal main deploy lane. No migration or data rollback is required.

## Audit Evidence

- PR: Pending.
- Focused Jest output: passed locally in the clean worktree.
- Live proof bundle: Pending deploy.

## Known Gaps

The five-question aVa-vs-direct-Claude/GPT quality comparison is intentionally not included in this UI polish PR. It should be run as a separate audit after the composer polish is live, so UI evidence and answer-quality evidence do not get mixed.
