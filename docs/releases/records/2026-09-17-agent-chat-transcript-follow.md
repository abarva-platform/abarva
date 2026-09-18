# 2026-09-17-agent-chat-transcript-follow - Streaming transcript scroll

## Release ID

`2026-09-17-agent-chat-transcript-follow`

## Status

`candidate`

## Plain-English Summary

aVa now follows a streaming answer while the reader is near the bottom of the conversation. Scrolling up to review an earlier message keeps that position, and a new question returns the view to the latest turn.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 chat presentation only. No changes to answers, retrieval, data, approval, or actions.

## Client Applicability

- All clients: Shared aVa dock surfaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: near-bottom scroll tracking and streaming follow behavior inside the transcript.
- `src/components/agent/__tests__/AgentDock.test.tsx`: behavior regressions for streaming, reading earlier turns, and sending a new message.

## QA / Validation

- Focused scroll behavior tests: pass (2 tests).
- Scoped ESLint, TypeScript no-emit, and release gate: pass.
- Full AgentDock suite: 56 pass, three pre-existing failures remain on the updated base commit; no additional failures after this change.
- Signed-in browser proof: pending deployment.

## Rollout Plan

Merge by PR, then use the repo-owned ACA main deploy workflow after the preceding full-window release completes. No migration or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Check template, 100% traffic revision, and required worker images after deploy.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Stream a long answer, scroll up during output, and send a new question.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main workflow. No data rollback is involved.

## Audit Evidence

PR and CI URLs, exact deploy SHA/digest, and signed-in scroll checks to be attached after rollout.

## Known Gaps

The existing component-suite failures remain outside this scroll change.
