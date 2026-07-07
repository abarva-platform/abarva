# 2026-07-01-agent-dock-markdown-answer-rendering — Agent Dock Markdown Answer Rendering

## Release ID

`2026-07-01-agent-dock-markdown-answer-rendering`

## Status

`candidate`

## Plain-English Summary

Agent answers in the shared aVa dock now render normal Markdown emphasis and structure instead of exposing literal `**bold**` markers in the chat pane. This keeps the left advisor answer CXO-readable while preserving the display-only contract: the renderer formats Claude/aVa output, it does not rewrite the words.

## Layer Impact

- `global-control-lane`: Shared agent/aVa answer rendering behavior for surfaces using `AgentDock` or `AvaChatShell`.

## Client Applicability

- All clients: Yes, wherever shared agent docks render Markdown-like agent prose.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: renders plain agent answer text through `AgentMarkdown` after existing Intelligence visibility cleanup.
- `src/components/ava-chat/AvaChatShell.tsx`: renders agent messages through `AgentMarkdown` for the smaller shell path.

## QA / Validation

- Focused AgentDock / Intelligence rendering tests: `./node_modules/.bin/jest src/components/agent/__tests__/AgentDock.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed, 50/50 tests.
- Scoped ESLint: `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/ava-chat/AvaChatShell.tsx` passed.
- `git diff --check` passed.
- `npm run release:check` passed.
- Production build passed: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/next build`.

## Rollout Plan

Merge to `main`, then deploy through the approved Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: To be captured after ACA deploy.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Standard ACA deploy workflow check.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, by rerunning Intelligence browser proof after deploy.

## Rollback Plan

Revert this rendering commit and redeploy through the approved ACA lane.

## Audit Evidence

- PR URL, CI checks, and merge SHA.
- ACA workflow URL, active revision, image digest, and traffic state after deployment.
- Signed-in browser screenshots showing Markdown emphasis rendered without literal `**` markers.

## Known Gaps

This slice only formats Markdown already returned by Claude/aVa. It does not change answer prompting, content selection, or bespoke chart rendering.
