# 2026-06-23-home-know-chat-quality — Home KNOW Chat Experience and Answer Quality

## Release ID

`2026-06-23-home-know-chat-quality`

## Status

`candidate`

## Plain-English Summary

Home KNOW now behaves more like a real chat surface instead of a report dump. User questions render as compact chat bubbles, Ava answers render as assistant bubbles, older turns stay readable, and supporting evidence/tables are expandable unless the user explicitly asks for a table, chart, graph, or gap. Home also stops using Intelligence strategy prompts as its preset questions and replaces them with Context Explorer lookup prompts.

## Layer Impact

- `global-control-lane`: Changes shared Home KNOW UI behavior and deterministic Home KNOW prose for all tenants.
- `client-data-lane`: No data schema or tenant data changes. Existing Home read models remain the source of truth.

## Client Applicability

- All clients: Yes, all tenants using Home KNOW receive the chat experience and preset prompt changes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `src/components/home/know/HomeKnowAsk.tsx`
- `src/components/home/know/HomeKnowAnswerRenderer.tsx`
- `src/lib/home/know/home-know-engine.ts`
- Focused Home KNOW tests under `src/components/home/know/__tests__/` and `src/lib/home/know/__tests__/`.

## QA / Validation

- `npx eslint src/components/home/HomeSurface.tsx src/components/home/know/HomeKnowAsk.tsx src/components/home/know/HomeKnowAnswerRenderer.tsx src/lib/home/know/home-know-engine.ts` passed.
- `npx jest src/components/home/know/__tests__/HomeKnowAsk.test.tsx src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx src/components/home/__tests__/HomeSurface.test.tsx src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand` passed: 31 tests.
- Browser screenshot proof to be attached before merge/deploy.

## Rollout Plan

Merge to `main`, build through the repo-owned Azure Container Apps deployment workflow, wait for health, assign 100% traffic to the approved main revision, then run signed-in Home KNOW proof on the deployed app.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the approved main workflow.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home KNOW multi-turn screenshot proof after deploy.

## Rollback Plan

Revert the merge commit and redeploy the previous approved main image through the repo-owned ACA deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3920
- CI run: To be added.
- Browser screenshots: To be added.
- ACA runtime invariant: To be added after deploy.

## Known Gaps

This release improves Home KNOW chat presentation and deterministic prose. It does not make Home a strategy advisor; decision prompts still hand off to Intelligence, Moves, or Tower by design.
